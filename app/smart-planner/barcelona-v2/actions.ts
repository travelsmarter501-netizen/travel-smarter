"use server";

import { generateTravelPlan } from "../../lib/planner/travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "../../lib/planner/barcelonaV2DestinationConfig";
import { resolveAccommodationLocation } from "../../lib/planner/accommodationLocationProvider";
import { BARCELONA_CLUSTER_CENTROIDS } from "../../lib/planner/barcelonaClusterCentroids";
import { buildBarcelonaDateEligibility, findDatedPlanClosureViolations, repairDatedPlanClosureViolations } from "../../lib/planner/barcelonaV2DateEligibility";
import { parseIsoDate, inclusiveDayCount, addDaysToIsoDate, weekdayOfIsoDate } from "../../lib/planner/dateOnly";
import { V2_PLANNER_INTERESTS } from "../../lib/planner/v2PlannerTypes";
import { mapV2InterestsToLegacy, mapSingleV2InterestToLegacy, SURPRISE_ME_LEGACY_INTERESTS } from "../../lib/planner/v2InterestAdapter";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";
import type { PlannerPreferences } from "../../lib/planner/plannerTypes";
import { resolveBarcelonaV2Plan, type V2Plan } from "../../lib/planner/barcelonaV2Resolve";
import type { DestinationConfig } from "../../lib/planner/destinationConfig";
import { applyCrossDayOptimization } from "../../lib/planner/plannerCrossDayOptimizer";
import { applyNaturalClusterReclaim } from "../../lib/planner/plannerNaturalClusterReclaim";
import { applyTripCompositionPass } from "../../lib/planner/plannerTripCompositionPass";
import { preferAccommodationAnchoredStart } from "../../lib/planner/plannerRouteOptimizer";
import { getBarcelonaFlagshipCoverageGoals } from "../../lib/planner/barcelonaMustSeePolicy";
import { buildBarcelonaV2PlaceSelectionBonus, buildBarcelonaV2ShoppingCoverageGoals } from "../../lib/planner/barcelonaV2PersonalizationScoring";
import { applyBeachTimingGuard } from "../../lib/planner/plannerBeachTimingGuard";
import { resolvePlannerPlace } from "../../lib/readyPlan";
import { barcelonaGuide } from "../../lib/barcelona-guide";

/** Places gated behind the customer explicitly signaling interest in experiences/entertainment
 * (the "🎟️ تجارب وترفيه" UI group, which maps to the footballExperiences + nightlife V2 keys --
 * see v2PlannerTypes.ts). Not eligible merely from popular/natureViews/cultureHistory/
 * beachRelax relevance, proximity, or cluster score, and -- per the Planner Intelligence
 * Upgrade task's explicit "safer default" -- also excluded from Surprise Me (which never sets
 * either of those two V2 keys) until a real, evidence-based Surprise Me rule proves it adds
 * value. Nightlife itself is never the stated reason (it only happens to share the UI group);
 * the actual gate is "did the customer ask for experiences/entertainment at all". */
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

/**
 * Smart Planner V2 -- the ONLY server-side entry point for V2 plan generation.
 * "use server": everything below runs on the server only and is never bundled into client JS.
 *
 * Phase 4: now uses BARCELONA_V2_DESTINATION_CONFIG (the 35-entry expanded pool -- legacy 30 +
 * 5 new V2-only candidates, see barcelonaV2Metadata.ts) instead of the shared
 * BARCELONA_DESTINATION_CONFIG. V1 (generateBarcelonaSmartPlan.ts) still uses
 * BARCELONA_DESTINATION_CONFIG directly and never sees the expanded pool.
 *
 * Interest model: the client sends ONLY the 8-key V2PlannerInterest[] -- never a legacy
 * PlannerInterest key, and never a primaryInterest (V2's UI doesn't ask that question at all;
 * when exactly one V2 interest is selected, its mapped legacy interest is used internally as
 * primaryInterest for the Day Builder's long-experience-reservation preference; with 2+
 * selected, no primaryInterest is set).
 *
 * Two-layer interest strategy (see v2InterestAdapter.ts / barcelonaV2Supplementary.ts):
 * - Layer A: V2 interests -> legacy PlannerInterest[] (coarse signal for MAIN VISIT stop
 *   selection via the completely unmodified legacy Day Builder/scoring engine).
 * - Layer B: food/shopping/nightlife are resolved SEPARATELY, directly from real Guide
 *   categories (foodPlaces/shoppingAreas/nightlifeVenues), never mixed into the main
 *   visit-stop pool.
 */

export type GenerateBarcelonaPlanV2Input = {
  destinationId: string;
  dateMode: "flexible" | "specific";
  durationDays?: number;
  arrivalDate?: string;
  departureDate?: string;
  interests: string[];
  accommodation: { booked: boolean; text?: string };
  /** Planner Intelligence Upgrade: Surprise Me is now a real, independent mode -- when true,
   * `interests` is ignored entirely (the client sends it empty) and generation uses
   * SURPRISE_ME_LEGACY_INTERESTS directly, never the specific 3-interest preset the UI used to
   * silently forward. Optional/omitted = false, so any older client build behaves exactly as
   * before (a real manual interest selection). */
  surpriseMe?: boolean;
};

export type GenerateBarcelonaPlanV2Result = { ok: true; data: V2Plan } | { ok: false; error: string };

function isV2PlannerInterest(value: unknown): value is V2PlannerInterest {
  return typeof value === "string" && (V2_PLANNER_INTERESTS as readonly string[]).includes(value);
}

const MAX_SUPPORTED_DAYS = 10;
const MIN_SUPPORTED_DAYS = 1;

export async function generateBarcelonaPlanV2Action(input: GenerateBarcelonaPlanV2Input): Promise<GenerateBarcelonaPlanV2Result> {
  try {
    if (!input || typeof input !== "object") {
      return { ok: false, error: "طلب غير صالح." };
    }

    if (input.destinationId !== "barcelona") {
      return { ok: false, error: "الوجهة غير مدعومة في هذا الإصدار التجريبي." };
    }

    if (input.dateMode !== "flexible" && input.dateMode !== "specific") {
      return { ok: false, error: "طريقة تحديد الموعد غير صالحة." };
    }

    // ── Derive an authoritative day count + (for specific mode) an eligibility callback ──
    let days: number;
    let arrivalDateForResolution: string | null = null;
    let eligibilityFn: ((placeId: string, dayNumber: number) => boolean) | null = null;

    if (input.dateMode === "flexible") {
      if (
        typeof input.durationDays !== "number" ||
        !Number.isInteger(input.durationDays) ||
        input.durationDays < MIN_SUPPORTED_DAYS ||
        input.durationDays > MAX_SUPPORTED_DAYS
      ) {
        return { ok: false, error: "عدد الأيام لازم يكون رقم صحيح بين 1 و10." };
      }
      days = input.durationDays;
    } else {
      if (typeof input.arrivalDate !== "string" || typeof input.departureDate !== "string") {
        return { ok: false, error: "تاريخ الوصول والمغادرة مطلوبان." };
      }
      const arrivalParts = parseIsoDate(input.arrivalDate);
      const departureParts = parseIsoDate(input.departureDate);
      if (!arrivalParts || !departureParts) {
        return { ok: false, error: "صيغة التاريخ غير صحيحة." };
      }

      const count = inclusiveDayCount(input.arrivalDate, input.departureDate);
      if (count === null) {
        return { ok: false, error: "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول." };
      }
      if (count > MAX_SUPPORTED_DAYS) {
        return { ok: false, error: "أقصى مدة مدعومة حاليًا 10 أيام. اختار تواريخ أقرب." };
      }

      days = count;
      arrivalDateForResolution = input.arrivalDate;
      eligibilityFn = buildBarcelonaDateEligibility(input.arrivalDate);
    }

    const surpriseMe = input.surpriseMe === true;

    let v2Interests: V2PlannerInterest[];
    let primaryInterest: PlannerPreferences["primaryInterest"];
    let legacyInterests: PlannerPreferences["interests"];

    if (surpriseMe) {
      // Planner Intelligence Upgrade: a real independent mode now, not a hidden 3-interest
      // selection -- `interests` is ignored entirely (whatever the client sent, even if
      // non-empty from a stale build). Widened to 5 legacy interests for genuine diversity
      // (see SURPRISE_ME_LEGACY_INTERESTS's own doc comment for why footballExperiences is
      // deliberately excluded); no primaryInterest, since no single interest was chosen.
      v2Interests = [];
      primaryInterest = undefined;
      legacyInterests = SURPRISE_ME_LEGACY_INTERESTS;
    } else {
      if (!Array.isArray(input.interests) || input.interests.length === 0 || !input.interests.every(isV2PlannerInterest)) {
        return { ok: false, error: "اختر اهتمامًا واحدًا صحيحًا على الأقل." };
      }
      v2Interests = input.interests as V2PlannerInterest[];
      if (new Set(v2Interests).size !== v2Interests.length) {
        return { ok: false, error: "لا يمكن تكرار نفس الاهتمام أكثر من مرة." };
      }

      // No user-facing primaryInterest question in V2 -- derived internally, only when exactly
      // one interest is selected.
      primaryInterest = v2Interests.length === 1 ? mapSingleV2InterestToLegacy(v2Interests[0]) : undefined;
      legacyInterests = mapV2InterestsToLegacy(v2Interests);
    }

    if (!input.accommodation || typeof input.accommodation !== "object" || typeof input.accommodation.booked !== "boolean") {
      return { ok: false, error: "بيانات السكن غير صالحة." };
    }
    let accommodation: PlannerPreferences["accommodation"];
    if (input.accommodation.booked) {
      const trimmedText = typeof input.accommodation.text === "string" ? input.accommodation.text.trim() : "";
      if (trimmedText) {
        // Accommodation Geo Intelligence (Geoapify Live Integration): tries the live Geoapify
        // provider first -- see accommodationLocationProvider.ts's own header -- falls back to
        // the offline keyword matcher, then to fully unresolved. Never guessed.
        const location = await resolveAccommodationLocation(trimmedText);
        accommodation = {
          text: trimmedText,
          useAsDailyAnchor: true,
          cluster: location.status === "resolved" ? (location.plannerCluster ?? null) : null,
          coordinates: location.latitude !== undefined && location.longitude !== undefined ? { lat: location.latitude, lng: location.longitude } : null,
          formattedAddress: location.formattedAddress ?? null,
          resolutionSource: location.source === "geoapify" || location.source === "google_places" || location.source === "keyword" ? location.source : null,
        };
      }
    }
    // Accommodation Geo Intelligence: true only when the customer actually entered accommodation
    // text but resolution (geocoding + keyword fallback, in that order) still came up empty --
    // never true when no accommodation was entered at all.
    const accommodationResolutionFailed = !!(accommodation && !accommodation.cluster);

    const preferences: PlannerPreferences = { interests: legacyInterests, primaryInterest, accommodation };

    // Teleferic Conditional Eligibility: eligible as a MAIN stop only when the customer
    // explicitly selected "🎟️ تجارب وترفيه" (footballExperiences + nightlife) -- never from
    // popular/natureViews/cultureHistory/beachRelax relevance, proximity, or cluster score, and
    // -- since Surprise Me never sets either of those two V2 keys -- excluded from Surprise Me
    // under the same general rule, with no separate special-case needed.
    const experiencesSelected = v2Interests.includes("footballExperiences") || v2Interests.includes("nightlife");
    const teleferixEligibility = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || experiencesSelected;

    // ── Per-request destination config: the expanded V2 pool, plus the Teleferic gate (always)
    // and specific-date eligibility (when applicable), composed into one callback ──
    const isPlaceEligibleForDay = (placeId: string, dayNumber: number): boolean => {
      if (!teleferixEligibility(placeId)) return false;
      return eligibilityFn ? eligibilityFn(placeId, dayNumber) : true;
    };
    // Fix 3-Day Surprise Me Camp Nou Coverage: per-request flagship goals, identical to the
    // static default for every request except Surprise Me at 3+ days -- see
    // getBarcelonaFlagshipCoverageGoals's own doc comment in barcelonaMustSeePolicy.ts for the
    // full root-cause/evidence. V1 (generateBarcelonaSmartPlan.ts) never calls this and keeps
    // using the static BARCELONA_DAY_BUILDER_CONFIG.flagshipCoverageGoals unchanged.
    const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe, days });
    // P1 Personalization Fix (Shopping/Nightlife): built from the REAL, un-collapsed v2Interests
    // -- always a no-op (0 for every place) for Surprise Me, which sets v2Interests to `[]`. See
    // barcelonaV2PersonalizationScoring.ts for the full root-cause note and candidate rationale.
    const placeSelectionBonus = buildBarcelonaV2PlaceSelectionBonus(v2Interests);
    // Round 2 Fix (Shopping Personalization): a bounded, non-flagship trip-level coverage
    // target -- see barcelonaV2PersonalizationScoring.ts's own doc comment. Always [] for
    // Surprise Me (v2Interests is []) and for any request that didn't select "shopping", so
    // secondaryCoverageGoals is a true no-op (byte-identical to omitting it) in those cases.
    const secondaryCoverageGoals = buildBarcelonaV2ShoppingCoverageGoals(v2Interests, days);
    const configForRequest: DestinationConfig = {
      ...BARCELONA_V2_DESTINATION_CONFIG,
      dayBuilderConfig: {
        ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig,
        isPlaceEligibleForDay,
        flagshipCoverageGoals,
        placeSelectionBonus,
        secondaryCoverageGoals,
      },
    };

    const result = generateTravelPlan(configForRequest, preferences, days);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const accommodationInfoForRepairPasses =
      accommodation?.useAsDailyAnchor && accommodation.cluster
        ? { cluster: accommodation.cluster, clusterCompatibility: configForRequest.dayBuilderConfig.clusterCompatibility }
        : null;

    // Trip Composition Pass (Surprise Me Quality V2, Part A -- see plannerTripCompositionPass.ts's
    // own doc comment for the full evidence/design). A no-op when the flag is off, when this is
    // not a Surprise Me request, or when no adjacent-day category repetition clears the
    // similarity threshold. Runs strictly AFTER generateTravelPlan and BEFORE Natural Cluster
    // Reclaim, per that task's own explicit ordering -- so Reclaim still gets the final say on
    // thin/veryThin density using whatever this pass produces.
    const { plan: composedPlan, legsByDay: composedLegsByDay } = applyTripCompositionPass(
      result.data.plan,
      result.data.legsByDay,
      configForRequest.plannerMetadata,
      configForRequest.routeOptimizationConfig,
      isPlaceEligibleForDay,
      accommodationInfoForRepairPasses,
      surpriseMe
    );
    const compositionChangeAlreadyApplied = composedPlan !== result.data.plan;

    // Natural Cluster Reclaim (Phase 6, feature-flagged -- see plannerNaturalClusterReclaim.ts's
    // own doc comment for the audit evidence). A no-op when the flag is off. Runs strictly AFTER
    // generateTravelPlan (Day Builder + within-day Route Optimizer + density repair already
    // done) and BEFORE Cross-Day Route Optimization below: it repairs a late-day greedy-build
    // starvation that the cross-day pass's own travel-time-only trigger cannot reach, and the
    // cross-day pass's existing "never degrade density" gate means it can never undo a reclaim
    // that fixed a thin/veryThin day -- see that audit's own report for why this ordering cannot
    // "fight" the cross-day pass.
    const { plan: reclaimedPlan, legsByDay: reclaimedLegsByDay } = applyNaturalClusterReclaim(
      composedPlan,
      composedLegsByDay,
      configForRequest.plannerMetadata,
      configForRequest.routeOptimizationConfig,
      configForRequest.dayBuilderConfig.clusterCompatibility,
      isPlaceEligibleForDay,
      accommodationInfoForRepairPasses
    );

    // Cross-Day Route Optimization (Phase 5, feature-flagged, off by default -- see
    // plannerCrossDayOptimizer.ts's own doc comment for the audit evidence). A no-op when the
    // flag is off: returns the exact same plan/legsByDay objects untouched. Runs strictly AFTER
    // generateTravelPlan/reclaim and BEFORE presentation/supplementary resolution below, so day
    // titles and food/shopping/nightlife suggestions are always derived from the final geography.
let { plan: optimizedPlan, legsByDay: optimizedLegsByDay } = applyCrossDayOptimization(
      reclaimedPlan,
      reclaimedLegsByDay,
      configForRequest.plannerMetadata,
      configForRequest.routeOptimizationConfig,
      isPlaceEligibleForDay,
      accommodationInfoForRepairPasses
    );

    // Trip Composition Pass -- SECOND, defense-in-depth check (Surprise Me Quality V2, Part A).
    // Root cause this addresses: measured live via surpriseMeTripQualityAudit.debug.ts that the
    // FIRST call above (run where the task explicitly said to -- immediately after
    // generateTravelPlan, before Natural Cluster Reclaim) never actually reaches the audit's own
    // flagship example (Day 5->6 category repetition in 6+ day plans): that specific repetition
    // is only fully formed by Natural Cluster Reclaim's and/or Cross-Day Optimization's own
    // density/travel-time-driven stop moves, which run AFTER the first call already looked and
    // found nothing. Re-running the identical pass here, on the plan those two passes actually
    // produced, catches it. Shares ONE combined budget with the first call via
    // `compositionChangeAlreadyApplied` -- if the first call already made its one allowed change,
    // this call is skipped entirely, so "at most 1 composition adjustment per trip" still holds
    // for the whole request, not per call site.
    if (!compositionChangeAlreadyApplied) {
      const second = applyTripCompositionPass(
        optimizedPlan,
        optimizedLegsByDay,
        configForRequest.plannerMetadata,
        configForRequest.routeOptimizationConfig,
        isPlaceEligibleForDay,
        accommodationInfoForRepairPasses,
        surpriseMe
      );
      optimizedPlan = second.plan;
      optimizedLegsByDay = second.legsByDay;
    }

    // Accommodation Geo Intelligence (Section 10.C) -- Day 1's within-day stop order is applied
    // here, not inside generateTravelPlan, because Natural Reclaim/Cross-Day above can still
    // change WHICH physical day ends up labeled dayNumber 1 after generateTravelPlan's own
    // accommodation reorder already ran; this must operate on the plan's FINAL Day 1. Only ever
    // runs when a real geocoded coordinate exists (never for the keyword-only fallback, which
    // has no coordinates) and only ever picks between two stop orders `preferAccommodationAnchoredStart`
    // itself already proved are an exact cost tie under the existing, unmodified route-cost
    // model -- see that function's own doc comment for why this can never override interest
    // relevance, Must-See policy, hours, or date eligibility. Never changes which stops are on
    // Day 1, never changes any stop's dayNumber (so the date-safety net below still applies
    // correctly to whatever this produces) -- only ever reverses the direction of Day 1's already
    // -optimized route when doing so is free.
    if (accommodation?.coordinates) {
      const day1Index = optimizedPlan.days.findIndex((day) => day.dayNumber === 1);
      if (day1Index !== -1) {
        const anchoredDay1 = preferAccommodationAnchoredStart(
          optimizedPlan.days[day1Index],
          configForRequest.plannerMetadata,
          configForRequest.routeOptimizationConfig,
          accommodation.coordinates,
          BARCELONA_CLUSTER_CENTROIDS
        );
        if (anchoredDay1 !== optimizedPlan.days[day1Index]) {
          const days = [...optimizedPlan.days];
          days[day1Index] = anchoredDay1;
          optimizedPlan = { days };
          optimizedLegsByDay = configForRequest.buildPlanRouteLegs(optimizedPlan);
        }
      }
    }

    // P0 Exact-Date Safety Fix -- final integrity safety net, run after every day-changing pass
    // (Day Builder, accommodation reorder, Natural Reclaim, Cross-Day) and before Meal Stops/
    // Timeline. Re-derives each stop's real calendar date from the plan's FINAL dayNumber and
    // re-checks it against real Guide hours directly -- independent of whether any upstream pass
    // remembered to call `isPlaceEligibleForDay` correctly. Expected to find 0 violations given
    // the root-cause fix in `orderDaysByAccommodation` (travelPlannerEngine.ts); this is
    // defense-in-depth, not the primary mechanism. Flexible-mode plans have no
    // `arrivalDateForResolution` and are completely unaffected.
    if (arrivalDateForResolution) {
      const violationsBefore = findDatedPlanClosureViolations(optimizedPlan.days, arrivalDateForResolution);
      if (violationsBefore.length > 0) {
        const repair = repairDatedPlanClosureViolations(optimizedPlan.days, optimizedLegsByDay, arrivalDateForResolution);
        optimizedPlan = { days: repair.days };
        optimizedLegsByDay = repair.legsByDay;
        if (repair.unrepaired.length > 0) {
          console.error(
            "[dated-plan-closure-integrity] unrepairable known-closed-place violation(s) survived the safety net:",
            repair.unrepaired
          );
        }
      }
    }

    // Beach Timing Guard (Surprise Me Quality V2, Part C) -- runs after the date-safety net so
    // it only ever reorders within the plan's truly final day membership, and before
    // presentation/resolve so the resulting order is what everything downstream (route legs,
    // Timeline, day cards) actually renders. Exact-date mode only (needs a real weekday); a
    // flexible-mode plan is untouched. See plannerBeachTimingGuard.ts's own doc comment for the
    // measured root cause (a Sunday-limited-hours anchor pushing Barceloneta Beach to
    // 19:15-21:15) and the exact single safe reorder this applies.
    if (arrivalDateForResolution) {
      const arrivalDateForGuard = arrivalDateForResolution;
      const weekdayForDayNumber = (dayNumber: number) => {
        const iso = addDaysToIsoDate(arrivalDateForGuard, dayNumber - 1);
        return iso ? (weekdayOfIsoDate(iso) ?? null) : null;
      };
      const resolveHoursForPlace = (placeId: string) => {
        const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
        return resolved && "hours" in resolved.place ? resolved.place.hours : undefined;
      };
      const guarded = applyBeachTimingGuard(optimizedPlan, optimizedLegsByDay, configForRequest.plannerMetadata, weekdayForDayNumber, resolveHoursForPlace, configForRequest.buildPlanRouteLegs);
      optimizedPlan = guarded.plan;
      optimizedLegsByDay = guarded.legsByDay;
    }

    if (!configForRequest.presentationResolver) {
      return { ok: false, error: "تعذّر تجهيز عرض الخطة." };
    }
    const presentedPlan = configForRequest.presentationResolver(optimizedPlan, preferences);

    // Sellability audit: only true when accommodation text actually resolved to a real cluster
    // AND was used as a daily anchor -- matches generateTravelPlan's own real condition for
    // calling orderDaysByAccommodation (travelPlannerEngine.ts), never guessed independently.
    const accommodationOrderedTrip = !!(accommodation?.useAsDailyAnchor && accommodation.cluster);

    const data = resolveBarcelonaV2Plan(
      days,
      optimizedPlan,
      optimizedLegsByDay,
      presentedPlan,
      arrivalDateForResolution,
      v2Interests,
      accommodationOrderedTrip,
      surpriseMe,
      accommodationResolutionFailed
    );
    return { ok: true, data };
  } catch {
    return { ok: false, error: "صار في خطأ غير متوقع. حاول مرة أخرى." };
  }
}
