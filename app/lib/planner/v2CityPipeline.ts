import "server-only";

import { generateTravelPlan } from "./travelPlannerEngine";
import { resolveAccommodationLocation } from "./accommodationLocationProvider";
import { buildDateEligibility, findDatedPlanClosureViolations, hoursLookupForPlaces, repairDatedPlanClosureViolations } from "./barcelonaV2DateEligibility";
import { parseIsoDate, inclusiveDayCount, addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import { V2_PLANNER_INTERESTS } from "./v2PlannerTypes";
import { mapV2InterestsToLegacy, mapSingleV2InterestToLegacy, SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { PlannerPreferences } from "./plannerTypes";
import { resolveV2Plan, type V2Plan } from "./barcelonaV2Resolve";
import type { DestinationConfig } from "./destinationConfig";
import type { CityPlannerModule } from "./cityPlannerModule";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { applyNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyTripCompositionPass } from "./plannerTripCompositionPass";
import { preferAccommodationAnchoredStart } from "./plannerRouteOptimizer";
import { resolvePlannerPlace } from "../readyPlan";
import { resolvePlacesForTrip, tripDates } from "./tripHours";
import { applyTimingGuard } from "./plannerTimingGuard";

/**
 * Personalized Planner V2 -- the city-independent generation pipeline (multi-city foundation).
 *
 * This is the body that used to live in app/smart-planner/barcelona-v2/actions.ts, unchanged except that every
 * Barcelona-specific value (place data, destination config, accommodation rules, Teleferic gate, flagship goals,
 * personalization bonus, shopping coverage, cluster centroids, beach timing guard, capacity text) now comes from the
 * `city` module. Barcelona's module (barcelonaCityModule.ts) supplies exactly the old values, so Barcelona output is
 * byte-identical (see docs/PROJECT_PLAN.md for the snapshot proof).
 *
 * Callers: only generateBarcelonaPlanV2 (actions.ts), which picks the module from the destination id. It is not a
 * Server Action; generation is only reachable through lib/commerce/personalizedPlan.ts after its ownership checks.
 *
 * Two-layer interest strategy (see v2InterestAdapter.ts / barcelonaV2Supplementary.ts):
 * - Layer A: V2 interests -> legacy PlannerInterest[] (coarse signal for MAIN VISIT stop selection).
 * - Layer B: food/shopping/nightlife resolved separately from the city's real food/shopping/nightlife lists.
 */

export type GenerateCityPlanV2Input = {
  destinationId: string;
  dateMode: "flexible" | "specific";
  durationDays?: number;
  arrivalDate?: string;
  departureDate?: string;
  interests: string[];
  accommodation: { booked: boolean; text?: string };
  /** Surprise Me: when true, `interests` is ignored and SURPRISE_ME_LEGACY_INTERESTS is used. Omitted = false. */
  surpriseMe?: boolean;
};

export type GenerateCityPlanV2Result = { ok: true; data: V2Plan } | { ok: false; error: string };

function isV2PlannerInterest(value: unknown): value is V2PlannerInterest {
  return typeof value === "string" && (V2_PLANNER_INTERESTS as readonly string[]).includes(value);
}

export const MAX_SUPPORTED_DAYS = 10;
const MIN_SUPPORTED_DAYS = 1;

export async function generateCityPlanV2(baseCity: CityPlannerModule, input: GenerateCityPlanV2Input): Promise<GenerateCityPlanV2Result> {
  try {
    if (!input || typeof input !== "object") {
      return { ok: false, error: "طلب غير صالح." };
    }

    if (input.destinationId !== baseCity.id) {
      return { ok: false, error: "الوجهة غير مدعومة في هذا الإصدار التجريبي." };
    }

    // Seasonal hours / dated exceptions resolved for THIS trip's dates (cities that opt in; see tripHours.ts). Every other city
    // keeps its place data object unchanged.
    const datesOfTrip =
      input.dateMode === "specific" && typeof input.arrivalDate === "string" && typeof input.departureDate === "string" ? tripDates(input.arrivalDate, input.departureDate) : null;
    const city: CityPlannerModule = baseCity.resolveHoursPerTrip ? { ...baseCity, places: resolvePlacesForTrip(baseCity.places, datesOfTrip) } : baseCity;
    const getHours = hoursLookupForPlaces(city.places);

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
      eligibilityFn = buildDateEligibility(input.arrivalDate, getHours);
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
      if (!Array.isArray(input.interests) || input.interests.length === 0 || !input.interests.every(isV2PlannerInterest) || !input.interests.every((interest) => city.supportedInterests.includes(interest as V2PlannerInterest))) {
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
        const location = await resolveAccommodationLocation(trimmedText, city.accommodation);
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
    const teleferixEligibility = (placeId: string): boolean => !city.experiencesGatedPlaceIds.has(placeId) || experiencesSelected;

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
    const flagshipCoverageGoals = city.flagshipCoverageGoals({ surpriseMe, days });
    // P1 Personalization Fix (Shopping/Nightlife): built from the REAL, un-collapsed v2Interests
    // -- always a no-op (0 for every place) for Surprise Me, which sets v2Interests to `[]`. See
    // barcelonaV2PersonalizationScoring.ts for the full root-cause note and candidate rationale.
    const placeSelectionBonus = city.placeSelectionBonus(v2Interests);
    // Round 2 Fix (Shopping Personalization): a bounded, non-flagship trip-level coverage
    // target -- see barcelonaV2PersonalizationScoring.ts's own doc comment. Always [] for
    // Surprise Me (v2Interests is []) and for any request that didn't select "shopping", so
    // secondaryCoverageGoals is a true no-op (byte-identical to omitting it) in those cases.
    const secondaryCoverageGoals = city.secondaryCoverageGoals(v2Interests, days);
    const configForRequest: DestinationConfig = {
      ...city.destinationConfig,
      dayBuilderConfig: {
        ...city.destinationConfig.dayBuilderConfig,
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
    const compositionCity = city.compositionProtectedPlaceIds ? { guide: city.places, protectedPlaceIds: city.compositionProtectedPlaceIds } : undefined;
    const { plan: composedPlan, legsByDay: composedLegsByDay } = applyTripCompositionPass(
      result.data.plan,
      result.data.legsByDay,
      configForRequest.plannerMetadata,
      configForRequest.routeOptimizationConfig,
      isPlaceEligibleForDay,
      accommodationInfoForRepairPasses,
      surpriseMe,
      city.buildDayRouteLegs,
      compositionCity
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
      accommodationInfoForRepairPasses,
      city.buildDayRouteLegs
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
      accommodationInfoForRepairPasses,
      city.buildDayRouteLegs
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
        surpriseMe,
        city.buildDayRouteLegs,
        compositionCity
      );
      optimizedPlan = second.plan;
      optimizedLegsByDay = second.legsByDay;
    }

    // City geography repair (multi-city; Prague): the shared passes above accept a day when a new area is linked to ANY area
    // already in it, so a day can end up pairing two areas that are not neighbours. A city may fix that here (reorder / swap
    // stops between days, same places). Barcelona has no such hook, so its plans are unchanged.
    if (city.repairDayGeography) {
      const repaired = city.repairDayGeography({ plan: optimizedPlan, legsByDay: optimizedLegsByDay, config: configForRequest, isPlaceEligibleForDay });
      optimizedPlan = repaired.plan;
      optimizedLegsByDay = repaired.legsByDay;
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
          city.clusterCentroids
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
      const violationsBefore = findDatedPlanClosureViolations(optimizedPlan.days, arrivalDateForResolution, getHours);
      if (violationsBefore.length > 0) {
        const repair = repairDatedPlanClosureViolations(optimizedPlan.days, optimizedLegsByDay, arrivalDateForResolution, getHours);
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
    if (arrivalDateForResolution && city.postProcessDatedPlan) {
      const arrivalDateForGuard = arrivalDateForResolution;
      const weekdayForDayNumber = (dayNumber: number) => {
        const iso = addDaysToIsoDate(arrivalDateForGuard, dayNumber - 1);
        return iso ? (weekdayOfIsoDate(iso) ?? null) : null;
      };
      const resolveHoursForPlace = (placeId: string) => {
        const resolved = resolvePlannerPlace(placeId, city.places);
        return resolved && "hours" in resolved.place ? resolved.place.hours : undefined;
      };
      const guarded = city.postProcessDatedPlan({ plan: optimizedPlan, legsByDay: optimizedLegsByDay, config: configForRequest, arrivalDate: arrivalDateForGuard, resolveHoursForPlace, weekdayForDayNumber });
      optimizedPlan = guarded.plan;
      optimizedLegsByDay = guarded.legsByDay;
    }

    if (!configForRequest.presentationResolver) {
      return { ok: false, error: "تعذّر تجهيز عرض الخطة." };
    }

    // Sellability audit: only true when accommodation text actually resolved to a real cluster
    // AND was used as a daily anchor -- matches generateTravelPlan's own real condition for
    // calling orderDaysByAccommodation (travelPlannerEngine.ts), never guessed independently.
    const accommodationOrderedTrip = !!(accommodation?.useAsDailyAnchor && accommodation.cluster);

    const presentationResolver = configForRequest.presentationResolver;
    const build = (plan: typeof optimizedPlan, legsByDay: typeof optimizedLegsByDay, mealExclusionsByDay?: Readonly<Record<number, readonly string[]>>) =>
      resolveV2Plan(
        city,
        days,
        plan,
        legsByDay,
        presentationResolver(plan, preferences),
        arrivalDateForResolution,
        v2Interests,
        accommodationOrderedTrip,
        surpriseMe,
        accommodationResolutionFailed,
        mealExclusionsByDay
      );
    let data = build(optimizedPlan, optimizedLegsByDay);
    // Opening hours as a hard constraint on the final plan (cities that opt in; see plannerTimingGuard.ts).
    if (city.timingGuard) data = applyTimingGuard({ city, plan: optimizedPlan, legsByDay: optimizedLegsByDay, data, build });
    return { ok: true, data };
  } catch {
    return { ok: false, error: "صار في خطأ غير متوقع. حاول مرة أخرى." };
  }
}
