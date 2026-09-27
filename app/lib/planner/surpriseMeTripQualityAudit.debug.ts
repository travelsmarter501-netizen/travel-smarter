/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 *
 * PERMANENT quality audit for Surprise Me (Surprise Me Quality V2, Part F). Supersedes the
 * previous task's throwaway `surpriseMeLongTripBalanceAudit.debug.ts` (deleted -- this is its
 * permanent replacement, extended to also exercise the Trip Composition Pass and the two
 * time-of-day quality rules added in this task).
 *
 * Exercises the real production pipeline for every requested day count 5-10, exactly as
 * `app/smart-planner/barcelona-v2/actions.ts` calls it, up to the point where the pipeline first
 * needs a genuine Next.js server context: generateTravelPlan (Day Builder -> Route Optimizer ->
 * accommodation day-reorder) -> Trip Composition Pass -> Natural Cluster Reclaim -> Cross-Day
 * Route Optimization -> route legs. Every one of those is imported and called completely
 * unmodified.
 *
 * -- What this script CANNOT test, and why (both carry a real `import "server-only"`) -----------
 * - Surprise Me meal presence (barcelonaV2MealStops.ts) -- verify live via the running dev server
 *   (Smart Planner V2 UI, Surprise Me, any trip length: real scheduled breakfast/lunch/evening
 *   cards should now appear, where before this task's Part B they never did).
 * - Exact-date closure-safety end-to-end (barcelonaV2DateEligibility.ts) -- verify live the same
 *   way; this script's accommodation-cluster and composition checks below run in flexible mode
 *   only for that reason.
 * Both are the exact same, previously-established limitation as the prior long-trip audit script.
 *
 * Time-of-day experience sanity (Part C) IS fully testable here -- both
 * barcelonaV2Timeline.ts (sunset floor) and plannerBeachTimingGuard.ts are pure, no
 * `server-only` dependency, by design specifically so they stay testable this way.
 *
 * Run with:
 *   npx tsx app/lib/planner/surpriseMeTripQualityAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { getBarcelonaV2PlannerPlaces, getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { buildBarcelonaV2PlaceSelectionBonus } from "./barcelonaV2PersonalizationScoring";
import { applyTripCompositionPass } from "./plannerTripCompositionPass";
import { applyNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { applyBeachTimingGuard } from "./plannerBeachTimingGuard";
import { buildBarcelonaPlannerRouteLegs } from "./barcelona-planner-route-legs";
import { buildBarcelonaDayTimeline } from "./barcelonaV2Timeline";
import type { TimelineStopInput } from "./barcelonaV2Timeline";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { classifyDayDensity } from "./barcelonaV2Density";
import { dayCategorySignals, jaccardSimilarity } from "./plannerCategorySignal";
import { resolvePlannerPlace, summarizeResolvedPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import type { PlannerInterest, PlannerPreferences, PlannerPlaceMetadata } from "./plannerTypes";
import type { DestinationConfig } from "./destinationConfig";
import type { Weekday } from "../hours";

const POOL = getBarcelonaV2PlannerPlaces();
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);
const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId);
const SIMILARITY_JACCARD_THRESHOLD = 0.66;

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}${detail ? ` -- ${detail}` : ""}`);
  if (!ok) failures++;
}

function configForRequest(days: number): DestinationConfig {
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: true, days });
  const placeSelectionBonus = buildBarcelonaV2PlaceSelectionBonus([]);
  return {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, flagshipCoverageGoals, placeSelectionBonus },
  };
}

function resolveDisplay(placeId: string): { name: string; guideType: string } {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  if (!resolved) return { name: placeId, guideType: "unknown" };
  return { name: summarizeResolvedPlace(resolved).name, guideType: resolved.type };
}

function labelDay(stopIds: string[], metaById: Map<string, PlannerPlaceMetadata>): string {
  const categories = [...dayCategorySignals(stopIds, metaById)];
  return categories.join(",");
}

// ============================== 1) DAY-LENGTH MATRIX (5-10 days) ==============================
console.log(`Candidate pool size (V2): ${POOL.length}`);

type Scenario = { label: string; days: number; accommodationText: string | null };
const scenarios: Scenario[] = [5, 6, 7, 8, 9, 10].flatMap((days) => [
  { label: "no accommodation", days, accommodationText: null },
  { label: "accommodation: Les Corts (Pedralbes)", days, accommodationText: "Pedralbes, Barcelona" },
]);

for (const scenario of scenarios) {
  console.log(`\n\n================ ${scenario.days}d -- ${scenario.label} ================`);
  const config = configForRequest(scenario.days);
  const preferences: PlannerPreferences = { interests: SURPRISE_ME_LEGACY_INTERESTS as PlannerInterest[] };
  let cluster: string | null = null;
  if (scenario.accommodationText) {
    cluster = resolveBarcelonaAccommodationCluster(scenario.accommodationText);
    preferences.accommodation = { text: scenario.accommodationText, useAsDailyAnchor: true, cluster };
  }

  const result = generateTravelPlan(config, preferences, scenario.days);
  if (!result.ok) {
    check(`generation succeeds`, false, result.error);
    continue;
  }

  const accommodationInfo = cluster ? { cluster, clusterCompatibility: config.dayBuilderConfig.clusterCompatibility } : null;
  const metaById = new Map(config.plannerMetadata.map((p) => [p.placeId, p]));

  // -- BEFORE composition: category sets + adjacent-pair jaccards, right after generateTravelPlan --
  const beforeSets = result.data.plan.days.map((d) => dayCategorySignals(d.stops.map((s) => s.placeId), metaById));
  const beforeJaccards = beforeSets.slice(0, -1).map((set, i) => jaccardSimilarity(set, beforeSets[i + 1]));
  const day1AffinityBefore = accommodationInfo ? accommodationCoverage(result.data.plan.days[0]?.clusters ?? [], accommodationInfo.cluster, accommodationInfo.clusterCompatibility) : null;

  // Mirrors actions.ts's real two-call pipeline exactly: composition pass #1 (before Reclaim, per
  // this task's own explicit ordering), then Reclaim + Cross-Day, then composition pass #2 --
  // a defense-in-depth re-check on the plan those two passes actually produced, since they can
  // themselves finalize a category repetition the first call never saw yet (see
  // plannerTripCompositionPass.ts's own note in actions.ts for the measured evidence). The two
  // calls share ONE combined "at most 1 change" budget: pass #2 only runs if pass #1 made no change.
  const composed = applyTripCompositionPass(result.data.plan, result.data.legsByDay, config.plannerMetadata, config.routeOptimizationConfig, isPlaceEligibleForDay, accommodationInfo, true);
  const compositionFiredFirst = composed.plan !== result.data.plan;

  const { plan: reclaimedPlan, legsByDay: reclaimedLegs } = applyNaturalClusterReclaim(
    composed.plan,
    composed.legsByDay,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.clusterCompatibility,
    isPlaceEligibleForDay,
    accommodationInfo
  );
  const { plan: crossDayPlan, legsByDay: crossDayLegs } = applyCrossDayOptimization(
    reclaimedPlan,
    reclaimedLegs,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    isPlaceEligibleForDay,
    accommodationInfo
  );

  // The REAL "before" for judging composition pass #2's effectiveness is the plan Reclaim +
  // Cross-Day actually produced (crossDayPlan) -- NOT the pre-generateTravelPlan snapshot above,
  // which predates the very repetition Reclaim/Cross-Day can introduce. Comparing against that
  // earlier snapshot would be comparing two different problems.
  const preSecondPassSets = crossDayPlan.days.map((d) => dayCategorySignals(d.stops.map((s) => s.placeId), metaById));
  const preSecondPassJaccards = preSecondPassSets.slice(0, -1).map((set, i) => jaccardSimilarity(set, preSecondPassSets[i + 1]));

  let finalPlan = crossDayPlan;
  let finalLegs = crossDayLegs;
  let compositionFiredSecond = false;
  if (!compositionFiredFirst) {
    const second = applyTripCompositionPass(crossDayPlan, crossDayLegs, config.plannerMetadata, config.routeOptimizationConfig, isPlaceEligibleForDay, accommodationInfo, true);
    compositionFiredSecond = second.plan !== crossDayPlan;
    finalPlan = second.plan;
    finalLegs = second.legsByDay;
  }

  const afterSets = finalPlan.days.map((d) => dayCategorySignals(d.stops.map((s) => s.placeId), metaById));
  const afterJaccards = afterSets.slice(0, -1).map((set, i) => jaccardSimilarity(set, afterSets[i + 1]));
  const day1AffinityAfter = accommodationInfo ? accommodationCoverage(finalPlan.days[0]?.clusters ?? [], accommodationInfo.cluster, accommodationInfo.clusterCompatibility) : null;

  const flaggedBeforeReclaim = beforeJaccards.filter((j) => j >= SIMILARITY_JACCARD_THRESHOLD).length;
  const flaggedPreSecondPass = preSecondPassJaccards.filter((j) => j >= SIMILARITY_JACCARD_THRESHOLD).length;
  const flaggedFinal = afterJaccards.filter((j) => j >= SIMILARITY_JACCARD_THRESHOLD).length;
  console.log(`  composition pass fired: first=${compositionFiredFirst} second=${compositionFiredSecond}`);
  console.log(`  flagged pairs: right-after-generateTravelPlan=${flaggedBeforeReclaim} | after-Reclaim+CrossDay(pre-2nd-pass)=${flaggedPreSecondPass} | final=${flaggedFinal}`);
  console.log(`  jaccards after-Reclaim+CrossDay=[${preSecondPassJaccards.map((j) => j.toFixed(2)).join(",")}] final=[${afterJaccards.map((j) => j.toFixed(2)).join(",")}]`);
  check("composition pass #2 never leaves MORE flagged (>=0.66) pairs than Reclaim+Cross-Day produced", flaggedFinal <= flaggedPreSecondPass);

  // -- duplicates / max stop count / weak donor days ------------------------------------------
  const allStopIds = finalPlan.days.flatMap((d) => d.stops.map((s) => s.placeId));
  const uniqueStopIds = new Set(allStopIds);
  check("no duplicate main stops", allStopIds.length === uniqueStopIds.size, `total=${allStopIds.length} unique=${uniqueStopIds.size}`);
  check("no day exceeds 6 main stops", finalPlan.days.every((d) => d.stops.length <= 6));

  const densities = finalPlan.days.map((d) => classifyDayDensity(d.stops.length, d.totalVisitMinutes));
  const veryThin = densities.filter((d) => d === "veryThin").length;
  check("no veryThin day after composition + reclaim + cross-day", veryThin === 0, `densities=[${densities.join(",")}]`);

  // -- route degradation: unresolved legs must not increase trip-wide vs. the pre-composition plan --
  const unresolvedBefore = result.data.legsByDay.flat().filter((l) => l.sourceStatus === "unresolved").length;
  const unresolvedAfter = finalLegs.flat().filter((l) => l.sourceStatus === "unresolved").length;
  check("trip-wide unresolved-leg count does not increase", unresolvedAfter <= unresolvedBefore, `before=${unresolvedBefore} after=${unresolvedAfter}`);

  // -- accommodation Day-1 safety: composition pass must never reduce Day-1's own cluster affinity --
  if (accommodationInfo && day1AffinityBefore !== null && day1AffinityAfter !== null) {
    check("composition never reduces Day-1 accommodation affinity", day1AffinityAfter >= day1AffinityBefore, `before=${day1AffinityBefore} after=${day1AffinityAfter}`);
  }

  finalPlan.days.forEach((day) => {
    const names = day.stops.map((s) => resolveDisplay(s.placeId).name);
    console.log(`  Day ${day.dayNumber}: [${names.join(", ")}] categories=[${labelDay(day.stops.map((s) => s.placeId), metaById)}]`);
  });
}

function accommodationCoverage(dayClusters: string[], accommodationCluster: string, clusterCompatibility: DestinationConfig["dayBuilderConfig"]["clusterCompatibility"]): number {
  if (dayClusters.includes(accommodationCluster)) return 3;
  let best = 0;
  for (const cluster of dayClusters) {
    const level = clusterCompatibility[accommodationCluster]?.[cluster] ?? clusterCompatibility[cluster]?.[accommodationCluster];
    if (level === "strong") best = Math.max(best, 2);
    else if (level === "medium") best = Math.max(best, 1);
  }
  return best;
}

// ============================== 2) TIME-OF-DAY EXPERIENCE SANITY ==============================
console.log("\n\n================ TIME-OF-DAY EXPERIENCE SANITY ================");

function hoursFor(placeId: string) {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  return resolved && "hours" in resolved.place ? resolved.place.hours : undefined;
}
function timelineInput(placeId: string): TimelineStopInput {
  const meta = getBarcelonaV2PlannerMetadataById(placeId)!;
  return { placeId, visitDurationMinutes: meta.visitDurationMinutes, hours: hoursFor(placeId), preferredTime: meta.preferredTime };
}

// -- Sunset catamaran: same 3rd-stop-of-the-day shape measured live during the audit -----------
const sunsetDayStops = [timelineInput("museu-historia-catalunya"), timelineInput("bogatell"), timelineInput("sunset-catamaran-sail")];
const monthlyStarts: Record<string, number> = {};
for (const [month, label] of [[10, "October"], [6, "June"], [12, "December"]] as [number, string][]) {
  const timeline = buildBarcelonaDayTimeline(sunsetDayStops, [], [], "saturday", month);
  const catamaranWindow = timeline.stops[2];
  monthlyStarts[label] = catamaranWindow.startMinutes;
  console.log(`  ${label} (month=${month}): sunset-catamaran-sail starts at ${Math.floor(catamaranWindow.startMinutes / 60)}:${String(catamaranWindow.startMinutes % 60).padStart(2, "0")}`);
  // 16:00 is a safe universal floor across every month's seasonal estimate (December, the
  // earliest-sunset month, floors to 16:30) -- the real bug this fixes was 15:00, over an hour
  // earlier than even December's legitimate floor.
  check(`${label}: sunset-catamaran-sail not scheduled before 16:00`, catamaranWindow.startMinutes >= 16 * 60, `start=${catamaranWindow.startMinutes}min`);
}
check("seasonal floor genuinely varies by month (June meaningfully later than December)", monthlyStarts["June"] - monthlyStarts["December"] >= 120, `June=${monthlyStarts["June"]}min December=${monthlyStarts["December"]}min`);
// Flexible mode (month unknown) must still fall back to the existing generic evening floor, never 15:00.
{
  const timeline = buildBarcelonaDayTimeline(sunsetDayStops, [], [], null);
  const catamaranWindow = timeline.stops[2];
  check("flexible mode: sunset-catamaran-sail still floored to a generic evening time", catamaranWindow.startMinutes >= 16 * 60, `start=${catamaranWindow.startMinutes}min`);
}

// -- Beach timing guard: the exact measured case (Cathedral's Sunday hours pushing Barceloneta
// Beach to 19:15-21:15) -- real placeIds, real Guide hours, real weekday. -----------------------
{
  const places = config5DayPlaces();
  const day = { dayNumber: 1, stops: [{ placeId: "barcelona-cathedral", score: 0 }, { placeId: "portal-angel", score: 0 }, { placeId: "gothic-quarter", score: 0 }, { placeId: "barceloneta-beach", score: 0 }], totalVisitMinutes: 330, clusters: ["old-city", "seafront"] };
  const legs = buildBarcelonaPlannerRouteLegs(day);
  const beforeTimeline = buildBarcelonaDayTimeline(day.stops.map((s) => timelineInput(s.placeId)), legs, [], "sunday" as Weekday);
  const beachBefore = beforeTimeline.stops[3];
  console.log(`  before guard: Barceloneta Beach on a Sunday starts at ${Math.floor(beachBefore.startMinutes / 60)}:${String(beachBefore.startMinutes % 60).padStart(2, "0")}`);
  check("reproduces the measured late-beach problem before the guard", beachBefore.startMinutes >= 18 * 60, `start=${beachBefore.startMinutes}min`);

  const guarded = applyBeachTimingGuard(
    { days: [day] },
    [legs],
    places,
    () => "sunday" as Weekday,
    hoursFor,
    (plan) => plan.days.map((d) => buildBarcelonaPlannerRouteLegs(d))
  );
  const afterTimeline = buildBarcelonaDayTimeline(guarded.plan.days[0].stops.map((s) => timelineInput(s.placeId)), guarded.legsByDay[0], [], "sunday" as Weekday);
  const beachAfter = afterTimeline.stops[0];
  console.log(`  after guard: Barceloneta Beach on a Sunday starts at ${Math.floor(beachAfter.startMinutes / 60)}:${String(beachAfter.startMinutes % 60).padStart(2, "0")}`);
  check("guard moves Barceloneta Beach earlier", beachAfter.startMinutes < beachBefore.startMinutes);
  check("guard does not push beach past a sensible morning start", beachAfter.startMinutes <= 11 * 60, `start=${beachAfter.startMinutes}min`);

  const cathedralAfter = afterTimeline.stops.find((_, i) => guarded.plan.days[0].stops[i].placeId === "barcelona-cathedral");
  check("Cathedral (the real hours anchor) still gets a valid, non-worse window after the reorder", !!cathedralAfter && (!cathedralAfter.approximate || beforeTimeline.stops[0].approximate));
}

function config5DayPlaces(): PlannerPlaceMetadata[] {
  return getBarcelonaV2PlannerPlaces();
}

console.log(`\n\n================ SUMMARY: ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`} ================`);
process.exitCode = failures === 0 ? 0 : 1;
