import "server-only";
import { resolvePlannerPlace } from "../../readyPlan";
import { haversineDistanceKm, type GeoPoint } from "../geoDistance";
import { buildEstimatedLeg, estimatedWalkingMinutes } from "../estimatedRouteLegs";
import { BUDAPEST_ROUTED_WALKS } from "./budapestRoutedWalks";
import { checkedTransit, checkedTransitNoteAr, UNCHECKED_TRANSIT_FACTOR } from "./budapestCheckedTransit";
import type { PlannerRouteLeg, TransportOption } from "../plannerTransportTypes";
import { repairCityDayGeography } from "../cityGeographyRepair";
import { balanceCityDays, type DayFit } from "../cityDayBalance";
import { buildBarcelonaDayTimeline, lunchPlacementFromTimeline, LUNCH_BREAK_ID, type TimelineMealInput, type TimelineStopInput } from "../barcelonaV2Timeline";
import { checkWindow, scheduleProblems } from "../plannerTimingGuard";
import { DAY_REFERENCE_START, DAYLIGHT_PLACES, finalDayQuality, SUNSET_ESTIMATE_BY_MONTH, type FinalDayQuality } from "./budapestDayQuality";
import type { V2Day, V2Plan } from "../barcelonaV2Resolve";
import type { DayGeographyRepairContext } from "../cityPlannerModule";
import { ENABLE_MUST_SEE_PRIORITY, FLAGSHIP_MUST_SEE_BOOST, FLAGSHIP_TIER_B_BOOST, FLAGSHIP_TIER_B_SURPRISE_ME_BOOST } from "../barcelonaMustSeePolicy";
import { V2_PLANNER_INTERESTS, type V2PlannerInterest } from "../v2PlannerTypes";
import { BUDAPEST_PLACES, BUDAPEST_PLACE_COORDINATES } from "./budapestPlaces";
import { BUDAPEST_PLANNER_METADATA, getBudapestPlannerMetadataById, budapestPlannerMetadataForInterests, budapestPlaceRelevance } from "./budapestMetadata";
import type { CityPlannerModule } from "../cityPlannerModule";
import type { ClusterCompatibilityMap, CoverageGoal, DayBuilderConfig, FlagshipCoverageGoal, GeneratedPlannerPlan, PlannerDay, SimilarityGroup } from "../plannerDayBuilder";
import type { RouteConfig } from "../plannerRouteOptimizer";
import type { DestinationConfig } from "../destinationConfig";
import type { PlannerOperationalWarning } from "../barcelonaPlannerOperationalWarnings";
import type { PlannerDayPresentation, PresentedPlannerPlan } from "../plannerPresentationTypes";
import type { FoodPlace } from "../../guideTypes";
import { planningHoursOf, type HoursInfo, type Weekday } from "../../hours";

/**
 * Budapest as a CityPlannerModule: LOCAL REVIEW PROTOTYPE (2026-11-13), built on the Prague module's rules unchanged (day balance on the
 * real clock, priority over travel, outside stops, timing guard, meal legs on the clock). Not public: plannerDestinations.ts keeps
 * Budapest `available: false`; only the local preview switch enables it. Place facts: budapestPlaces.ts; planning judgements:
 * budapestMetadata.ts; walking routes: budapestRoutedWalks.ts (every pair); checked transit: budapestCheckedTransit.ts.
 */

// ── Transfers ─────────────────────────────────────────────────────────────────────────────────────────
export const ROUTED_WALK_NOTE_AR = "المسافة من مسار مشي فعلي (OpenStreetMap)، والوقت تقدير على مشي 4.5 كم بالساعة.";
export const ROUTED_WALK_CLIMB_NOTE_AR = "المسافة من مسار مشي فعلي (OpenStreetMap) وفيه طلعة أو نزلة تلة، فالوقت تقدير على مشي 4.5 كم بالساعة مع 20% زيادة.";

const FOOD_PLACE_CLUSTER: Record<string, string> = {
  "hungarikum-bisztro": "lipotvaros",
  menza: "terezvaros",
  "frici-papa": "erzsebetvaros",
  "21-restaurant": "castle-hill",
  pierrot: "castle-hill",
  "new-york-cafe": "erzsebetvaros",
  gerbeaud: "belvaros",
  gundel: "city-park",
  "varosliget-cafe": "city-park",
};

/** On top of Castle Hill there is no useful public transport between two places: walking only. */
function bothOnCastleHill(a: string, b: string): boolean {
  const cluster = (id: string) => getBudapestPlannerMetadataById(id)?.cluster ?? FOOD_PLACE_CLUSTER[id] ?? "";
  return cluster(a) === "castle-hill" && cluster(b) === "castle-hill";
}

function withTransitCheck(leg: PlannerRouteLeg): PlannerRouteLeg {
  const index = leg.options.findIndex((option) => option.mode === "transit");
  if (index === -1) return leg;
  // Only the checked direction (no reverse-direction borrowing); the note names the one departure that was checked.
  const checked = checkedTransit(leg.fromPlaceId, leg.toPlaceId);
  const old = leg.options[index];
  const transit: TransportOption = checked !== null
    ? { ...old, durationMinutesMin: Math.round(checked.minutes * 0.95), durationMinutesMax: Math.round(checked.minutes * 1.15), note: checkedTransitNoteAr(checked) }
    : { ...old, durationMinutesMin: Math.round(old.durationMinutesMin * UNCHECKED_TRANSIT_FACTOR), durationMinutesMax: Math.round(old.durationMinutesMax * UNCHECKED_TRANSIT_FACTOR) };
  const options = leg.options.map((option, i) => (i === index ? transit : option));
  const walking = options.find((option) => option.mode === "walking");
  const mid = (option: TransportOption) => (option.durationMinutesMin + option.durationMinutesMax) / 2;
  const recommendedMode = leg.recommendedMode === "transit" && walking && mid(walking) <= mid(transit) + 3 ? "walking" : leg.recommendedMode;
  return { ...leg, options, recommendedMode };
}

export function budapestLeg(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  return withTransitCheck(budapestLegBase(fromPlaceId, toPlaceId));
}

function budapestLegBase(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  const leg = buildEstimatedLeg(fromPlaceId, toPlaceId, BUDAPEST_PLACE_COORDINATES);
  const routed = BUDAPEST_ROUTED_WALKS[`${fromPlaceId}>${toPlaceId}`];
  const from = BUDAPEST_PLACE_COORDINATES[fromPlaceId];
  const to = BUDAPEST_PLACE_COORDINATES[toPlaceId];
  if (!routed || !from || !to || leg.sourceStatus === "unresolved") return leg;
  const [km, climb] = routed;
  const minutes = (km / 4.5) * 60 * (climb ? 1.2 : 1);
  const walking: TransportOption = {
    mode: "walking",
    durationMinutesMin: Math.max(1, Math.round(minutes * 0.9)),
    durationMinutesMax: Math.max(1, Math.round(minutes * 1.15)),
    distanceKm: km,
    note: climb ? ROUTED_WALK_CLIMB_NOTE_AR : ROUTED_WALK_NOTE_AR,
  };
  const transitMinutes = ((haversineDistanceKm(from, to) * 1.3) / 18) * 60 + 10;
  const transit: TransportOption = leg.options.find((option) => option.mode === "transit") ?? {
    mode: "transit",
    durationMinutesMin: Math.round(transitMinutes * 0.85),
    durationMinutesMax: Math.round(transitMinutes * 1.25),
    note: leg.options[0]?.note,
  };
  const routeUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from.lat}%2C${from.lng}%3B${to.lat}%2C${to.lng}`;
  if (bothOnCastleHill(fromPlaceId, toPlaceId) && walking.durationMinutesMax <= 40) return { fromPlaceId, toPlaceId, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl };
  if (walking.durationMinutesMax <= 20) return { fromPlaceId, toPlaceId, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl };
  const options = walking.durationMinutesMax <= 60 ? [walking, transit] : [transit];
  return { fromPlaceId, toPlaceId, recommendedMode: "transit", options, sourceStatus: "estimated", routeUrl };
}

// ── Areas that may share a day (symmetric) ──────────────────────────────────────────────────────────
const LINKS: [string, string, "strong" | "medium" | "weak"][] = [
  ["lipotvaros", "belvaros", "strong"],
  ["lipotvaros", "terezvaros", "strong"],
  ["terezvaros", "erzsebetvaros", "strong"],
  ["erzsebetvaros", "belvaros", "strong"],
  ["erzsebetvaros", "palotanegyed", "strong"],
  ["palotanegyed", "belvaros", "medium"],
  ["belvaros", "gellert-hill", "medium"],
  // Across the Chain Bridge and up the hill (walk 1.8 km with the climb, or bus / funicular).
  ["lipotvaros", "castle-hill", "medium"],
  ["castle-hill", "gellert-hill", "weak"],
  ["lipotvaros", "margaret-island", "medium"],
  ["terezvaros", "city-park", "medium"],
  ["erzsebetvaros", "kerepes", "medium"],
  ["city-park", "kerepes", "weak"],
  ["belvaros", "castle-hill", "weak"],
];

function symmetric(links: typeof LINKS): ClusterCompatibilityMap {
  const map: ClusterCompatibilityMap = {};
  for (const [a, b, level] of links) {
    (map[a] ??= {})[b] = level;
    (map[b] ??= {})[a] = level;
  }
  return map;
}

export const BUDAPEST_CLUSTER_COMPATIBILITY = symmetric(LINKS);

/** The Chain Bridge joins Lipótváros and Castle Hill, so a hop to it from either side is a neighbour hop. */
export const BUDAPEST_CONNECTORS: Record<string, readonly string[]> = { "chain-bridge": ["lipotvaros", "castle-hill"] };

const TIER_A = ["parliament-exterior", "st-stephens-basilica", "fishermans-bastion", "chain-bridge"];
const TIER_B = ["heroes-square", "danube-legend-cruise", "citadella", "matthias-church-exterior", "great-market-hall"];

const SIMILARITY_GROUPS: SimilarityGroup[] = [
  { id: "big-museums", placeIds: ["hungarian-national-gallery", "hungarian-national-museum", "museum-of-fine-arts"], maxByDefault: 1, unlockedByInterest: "cultureLocal", maxWithInterest: 3 },
  { id: "shopping", placeIds: ["vaci-utca", "andrassy-avenue", "arena-mall", "gozsdu-udvar"], maxByDefault: 1, unlockedByInterest: "foodShoppingNightlife", maxWithInterest: 4 },
];

const COVERAGE_GOALS: CoverageGoal[] = [
  { interest: "popular", placeIds: TIER_A, minimumCoverage: 3, boost: 6 },
  { interest: "popular", placeIds: TIER_B, minimumCoverage: 0, boost: 3 },
  { interest: "viewsNature", placeIds: ["citadella", "fishermans-bastion", "margaret-island", "budapest-zoo"], minimumCoverage: 1, boost: 5 },
  { interest: "cultureLocal", placeIds: ["hungarian-national-gallery", "hungarian-national-museum", "museum-of-fine-arts", "opera-house-tour"], minimumCoverage: 1, boost: 5 },
  { interest: "footballExperiences", placeIds: ["danube-legend-cruise", "opera-house-tour", "house-of-music", "budapest-zoo"], minimumCoverage: 1, boost: 5 },
  { interest: "beachRelax", placeIds: ["margaret-island", "citadella", "vajdahunyad-castle"], minimumCoverage: 1, boost: 4 },
];

const FLAGSHIP_MUST_SEE = ["parliament-exterior"];
const FLAGSHIP_TIER_B_IDS = ["fishermans-bastion", "st-stephens-basilica"];

// Paid places whose outside stands on a public street, square or park: on a crowded day the plan may keep them as a 15-minute outside stop.
// Not the House of Music or the Opera tour: their visit is the slot / tour itself, never shortened to fit a day (owner, 2026-11-13).
const OUTSIDE_STOP_MINUTES: Record<string, number> = {
  "hungarian-national-gallery": 15,
  "hungarian-national-museum": 15,
  "museum-of-fine-arts": 15,
};
const BALANCE_PROTECTED = new Set([...TIER_A, ...TIER_B]);

// ── A day tried on the real clock (same rules as Prague) ─────────────────────────────────────────────
const LUNCH_DETOUR_ALLOWANCE_MINUTES = 15;

/** Timetabled departures (hours.startsAtOpening, the cruise): the first published departure at or after `minutes` that day, or null. */
function nextDeparture(hours: HoursInfo | undefined, weekday: Weekday | null, minutes: number): number | null {
  const planned = planningHoursOf(hours);
  if (!planned || planned.type !== "fixed" || !planned.startsAtOpening) return null;
  const starts = (planned.schedule[weekday ?? "monday"] ?? []).map((r) => Number(r.open.slice(0, 2)) * 60 + Number(r.open.slice(3, 5))).filter((m) => m >= minutes);
  return starts.length ? Math.min(...starts) : null;
}
const DINNER_FROM_MINUTES = 18 * 60;

export type DayOnClock = {
  failing: string[];
  programEnd: number;
  windows: { placeId: string; start: number; end: number }[];
  lunchAfterIndex: number | null;
  /** The day's timeline with a lunch break at the planned lunch slot (no detour allowance), for the order choice. */
  timeline: ReturnType<typeof buildBarcelonaDayTimeline>;
  legs: PlannerRouteLeg[];
};

/**
 * Day-quality switches (round 1, 2026-11-14). Each can be turned off on a test-only copy of the module (budapestModuleWith) so its
 * effect is measured alone. Defaults = what Budapest plans use.
 * - cafeLunch: a cafe may be lunch when no restaurant fits. OFF: no Budapest cafe has evidence of serving lunch (Gerbeaud: coffee and
 *   cakes), so lunch is a restaurant that fits, else the lunch break in the area.
 * - lunchAfterLastStop: lunch may come after the day's last visit (the restaurant, its walk, hours and full meal are still checked).
 * - clockOrder: each day's order is proposed on the clock and ACCEPTED on the final schedule (reviewDayOrders), same places and lengths.
 * - crossDay: a place that opens much later on its day than on another trip day may move there (reviewDayMoves), judged on the trip.
 *
 * Round 3 (TEST-ONLY, absent = the round-2 behaviour): travelRule ("A" = +15, "B" / "C" = more after lost time, see TRAVEL_RULES),
 * mealCheck ("tolerance" / "explicit"), datedAreas (areas by date, see reviewDatedAreas), report (every review decision, for the tools).
 */
export type BudapestQualityOptions = {
  cafeLunch: boolean;
  lunchAfterLastStop: boolean;
  clockOrder: boolean;
  crossDay: boolean;
  travelRule?: TravelRuleName;
  mealCheck?: "tolerance" | "explicit";
  datedAreas?: boolean;
  report?: (entry: ReviewReportEntry) => void;
};
/** Defaults (owner decision 2026-11-15): travel rule B1 with the explicit meal check. Rule A + tolerance = the 8e8a309 behaviour. */
export const BUDAPEST_QUALITY_DEFAULTS: BudapestQualityOptions = { cafeLunch: false, lunchAfterLastStop: true, clockOrder: true, crossDay: true, travelRule: "B1", mealCheck: "explicit" };

export function budapestDayOnClock(context: DayGeographyRepairContext, lunchAfterLastStop = BUDAPEST_QUALITY_DEFAULTS.lunchAfterLastStop): (ids: readonly string[], dayNumber: number, outside: ReadonlySet<string>) => DayOnClock {
  const legCache = new Map<string, PlannerRouteLeg>();
  const leg = (a: string, b: string): PlannerRouteLeg => {
    const key = `${a}>${b}`;
    let cached = legCache.get(key);
    if (!cached) { cached = budapestLeg(a, b); legCache.set(key, cached); }
    return cached;
  };
  const legBetween = (a: string, b: string) => (a === LUNCH_BREAK_ID || b === LUNCH_BREAK_ID ? undefined : leg(a, b));
  return (ids, dayNumber, outside) => {
    const weekday = context.weekdayForDayNumber?.(dayNumber) ?? null;
    const month = context.monthForDayNumber?.(dayNumber) ?? null;
    const stops: TimelineStopInput[] = ids.map((id) => {
      const meta = getBudapestPlannerMetadataById(id);
      const outsideMinutes = outside.has(id) ? OUTSIDE_STOP_MINUTES[id] : undefined;
      return {
        placeId: id,
        visitDurationMinutes: outsideMinutes ?? meta?.visitDurationMinutes ?? 60,
        hours: outsideMinutes ? undefined : (context.hoursForPlaceOnDay?.(id, dayNumber) ?? context.hoursForPlace?.(id)),
        preferredTime: meta?.preferredTime ?? "anytime",
        arrivalBufferMinutes: outsideMinutes ? undefined : meta?.arrivalBufferMinutes,
        showWindow: outsideMinutes ? undefined : meta?.showWindow,
      };
    });
    const legs = ids.slice(0, -1).map((id, i) => leg(id, ids[i + 1]));
    const lunch = ids.length > 1 ? lunchPlacementFromTimeline(stops, legs, weekday, month, false, null, legBetween, lunchAfterLastStop) : null;
    const meals: TimelineMealInput[] = lunch ? [{ placeId: LUNCH_BREAK_ID, mealType: "lunch", afterStopIndex: lunch.afterIndex, earliestStart: lunch.estimatedStart }] : [];
    const timeline = buildBarcelonaDayTimeline(stops, legs, meals, weekday, month, null, legBetween);
    const failing: string[] = [];
    const windows: DayOnClock["windows"] = [];
    let programEnd = 0;
    for (let i = 0; i < timeline.stops.length; i++) {
      const window = timeline.stops[i];
      const shift = lunch && i > lunch.afterIndex ? LUNCH_DETOUR_ALLOWANCE_MINUTES : 0;
      const stop = stops[i];
      let start = window.startMinutes + shift;
      let end = window.endMinutes + shift;
      // A timetabled departure is never shifted off the timetable: with the lunch detour the cruise takes the next published departure at
      // or after its estimated arrival + the detour. Arrival = end of the previous stop or its meal + the leg's longest time + the shared
      // 15-minute margin (never later than the window's own start); none left = it fails, as before.
      let departure: number | null = null;
      if (shift > 0 && i > 0) {
        const previousEnd = Math.max(timeline.stops[i - 1].endMinutes, ...timeline.meals.filter((m) => m.afterStopIndex === i - 1).map((m) => m.endMinutes));
        const legIn = legs[i - 1];
        const travel = legIn?.options.find((o) => o.mode === legIn.recommendedMode)?.durationMinutesMax ?? 0;
        departure = nextDeparture(stop.hours, weekday, Math.min(window.startMinutes, previousEnd + travel + 15) + shift);
      }
      if (departure !== null) { start = departure; end = departure + (window.endMinutes - window.startMinutes); }
      windows.push({ placeId: stop.placeId, start, end });
      if (checkWindow(stop.hours, weekday, start, end, stop.visitDurationMinutes)) failing.push(stop.placeId);
      if (stop.preferredTime !== "evening") programEnd = Math.max(programEnd, end);
    }
    return { failing, programEnd, windows, lunchAfterIndex: lunch ? lunch.afterIndex : null, timeline, legs };
  };
}

export function budapestTryInDay(context: DayGeographyRepairContext, lunchAfterLastStop = BUDAPEST_QUALITY_DEFAULTS.lunchAfterLastStop): (ids: readonly string[], dayNumber: number, outside: ReadonlySet<string>) => DayFit {
  const onClock = budapestDayOnClock(context, lunchAfterLastStop);
  const verdict = (clock: DayOnClock): boolean => clock.failing.length === 0 && clock.programEnd <= DINNER_FROM_MINUTES;
  const verdictCache = new Map<string, DayFit>();
  return (ids, dayNumber, outside) => {
    if (ids.length > 6) return tryOrders(ids, dayNumber, outside);
    const key = `${dayNumber}|${[...ids].sort().join(",")}|${ids.filter((id) => outside.has(id)).sort().join(",")}`;
    let cached = verdictCache.get(key);
    if (!cached) { cached = tryOrders(ids, dayNumber, outside); verdictCache.set(key, cached); }
    return cached;
  };
  function tryOrders(ids: readonly string[], dayNumber: number, outside: ReadonlySet<string>): DayFit {
    const first = onClock(ids, dayNumber, outside);
    if (verdict(first)) return { ok: true };
    if (ids.length > 6) return first.failing.length > 0 ? { ok: false, reason: "closing", placeId: first.failing[0] } : { ok: false, reason: "late" };
    const evening = ids.some((id) => getBudapestPlannerMetadataById(id)?.preferredTime === "evening");
    const visitMinutes = ids.reduce((sum, id) => sum + ((outside.has(id) ? OUTSIDE_STOP_MINUTES[id] : undefined) ?? getBudapestPlannerMetadataById(id)?.visitDurationMinutes ?? 60), 0);
    const cannotEndByDinner = !evening && ids.length > 1 && 9 * 60 + visitMinutes + 75 + 15 * (ids.length - 1) > DINNER_FROM_MINUTES;
    if (cannotEndByDinner && first.failing.length === 0) return { ok: false, reason: "late" };
    let alwaysFailing: Set<string> | null = new Set(first.failing);
    let hoursKeptSomewhere = first.failing.length === 0;
    const permute = (prefix: string[], rest: string[]): boolean => {
      if (rest.length === 0) {
        if (prefix.every((id, i) => id === ids[i])) return false;
        const clock = onClock(prefix, dayNumber, outside);
        if (verdict(clock)) return true;
        if (clock.failing.length === 0) {
          hoursKeptSomewhere = true;
          if (cannotEndByDinner) return true;
        }
        alwaysFailing = new Set([...alwaysFailing!].filter((id) => clock.failing.includes(id)));
        return false;
      }
      for (let i = 0; i < rest.length; i++) if (permute([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)])) return true;
      return false;
    };
    if (permute([], [...ids])) return cannotEndByDinner ? { ok: false, reason: "late" } : { ok: true };
    const culprit = hoursKeptSomewhere ? undefined : [...alwaysFailing!].sort()[0];
    return culprit ? { ok: false, reason: "closing", placeId: culprit } : { ok: false, reason: "late" };
  }
}

const NEARBY_SHOPPING_MAX_MINUTES = 20;

function flagshipGoals(context: { surpriseMe: boolean; days: number; interests?: readonly V2PlannerInterest[] }): FlagshipCoverageGoal[] {
  if (!ENABLE_MUST_SEE_PRIORITY) return [];
  if (context.days === 1 && !context.surpriseMe && context.interests?.length === 1 && context.interests[0] === "shopping") return [];
  const tierBBoost = context.surpriseMe && context.days >= 3 ? FLAGSHIP_TIER_B_SURPRISE_ME_BOOST : FLAGSHIP_TIER_B_BOOST;
  if (context.days >= 2) {
    return [
      { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
      { candidates: ["fishermans-bastion"], minCoverage: 1, boost: tierBBoost },
      { candidates: ["st-stephens-basilica"], minCoverage: 1, boost: tierBBoost },
    ];
  }
  return [
    { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
    { candidates: FLAGSHIP_TIER_B_IDS, minCoverage: 0, boost: tierBBoost },
  ];
}

const travelMinutes = (fromPlaceId: string, toPlaceId: string): number | null => {
  const leg = budapestLeg(fromPlaceId, toPlaceId);
  const option = leg.sourceStatus === "unresolved" ? undefined : leg.options.find((o) => o.mode === leg.recommendedMode);
  if (option) return Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2);
  const minutes = estimatedWalkingMinutes(BUDAPEST_PLACE_COORDINATES[fromPlaceId], BUDAPEST_PLACE_COORDINATES[toPlaceId]);
  return minutes === null ? null : Math.round(minutes);
};

const DAY_BUILDER_CONFIG: DayBuilderConfig = {
  clusterCompatibility: BUDAPEST_CLUSTER_COMPATIBILITY,
  similarityGroups: SIMILARITY_GROUPS,
  coverageGoals: COVERAGE_GOALS,
  iconicTiers: [TIER_A, TIER_B],
  tierCoverageGoals: [{ interest: "popular", tierPlaceIds: TIER_A, minCoverage: 3 }],
  flagshipCoverageGoals: flagshipGoals({ surpriseMe: false, days: 1 }),
  getVerifiedTravelMinutes: travelMinutes,
  priorityOverTravel: { minRelativeGap: 0.15, maxHopMinutes: 30, maxExtraMinutes: 15 },
};

const ROUTE_CONFIG: RouteConfig = {
  clusterAdjacency: BUDAPEST_CLUSTER_COMPATIBILITY,
  // Buda first (Castle Hill, Gellért Hill), across the river, then Pest from the river eastwards; the evening cruise ends a day.
  clusterDirectionalOrder: ["castle-hill", "gellert-hill", "margaret-island", "lipotvaros", "belvaros", "terezvaros", "erzsebetvaros", "palotanegyed", "kerepes", "city-park"],
  sameClusterOrderHints: {
    "castle-hill": ["fishermans-bastion", "matthias-church-exterior", "hungarian-national-gallery"],
    lipotvaros: ["st-stephens-basilica", "parliament-exterior", "shoes-on-the-danube", "chain-bridge"],
    "city-park": ["budapest-zoo", "heroes-square", "museum-of-fine-arts", "vajdahunyad-castle", "house-of-music"],
  },
  verifiedMinutesLookup: travelMinutes,
};

// ── Presenter ─────────────────────────────────────────────────────────────────────────────────────────
const CLUSTER_LABEL_AR: Record<string, string> = {
  lipotvaros: "البرلمان والكاتدرائية",
  belvaros: "وسط Pest",
  "castle-hill": "تلة القلعة",
  "gellert-hill": "تلة Gellért",
  terezvaros: "Andrássy والأوبرا",
  erzsebetvaros: "الحي اليهودي",
  palotanegyed: "حي المتحف",
  "city-park": "حديقة المدينة",
  "margaret-island": "جزيرة Margaret",
  kerepes: "Keleti",
};

/** Conditional activities (no planner metadata): shown as suggestions on a day that visits their area, with their condition. */
const CONDITIONAL_BY_CLUSTER: Record<string, { placeId: string; reason: string }[]> = {
  "city-park": [{ placeId: "szechenyi-bath", reason: "اختياري بشرط: ممنوع تحت 14 سنة، مختلط وبلباس سباحة؛ مش ضمن الجدول" }],
  "castle-hill": [{ placeId: "hospital-in-the-rock", reason: "اختياري بشرط: ممنوع تحت 6 سنين، والجولة بموعد ما تحققنا منه؛ مش ضمن الجدول" }],
};

function placeName(placeId: string): string {
  return resolvePlannerPlace(placeId, BUDAPEST_PLACES)?.place.name ?? placeId;
}

function dayClustersByWeight(day: PlannerDay): string[] {
  const minutes = new Map<string, number>();
  for (const stop of day.stops) {
    const meta = getBudapestPlannerMetadataById(stop.placeId);
    if (!meta) continue;
    minutes.set(meta.cluster, (minutes.get(meta.cluster) ?? 0) + meta.visitDurationMinutes);
  }
  return [...minutes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([cluster]) => cluster);
}

function presentBudapestPlan(plan: GeneratedPlannerPlan): PresentedPlannerPlan {
  const usedTitles = new Set<string>();
  const byDay: PlannerDayPresentation[] = plan.days.map((day) => {
    const clusterIds = dayClustersByWeight(day);
    const clusters = clusterIds.map((cluster) => CLUSTER_LABEL_AR[cluster] ?? cluster);
    const firstStop = day.stops[0] ? placeName(day.stops[0].placeId) : "";
    let title = clusters.length >= 2 ? `${clusters[0]} و${clusters[1]}` : clusters[0] ? `يوم ${clusters[0]}` : `اليوم ${day.dayNumber}`;
    if (usedTitles.has(title) && firstStop) title = `${title}: ${firstStop}`;
    usedTitles.add(title);
    const names = day.stops.map((stop) => placeName(stop.placeId));
    const summary = names.length === 0 ? "" : names.length === 1 ? `محطة اليوم: ${names[0]}.` : `محطات اليوم: ${names.slice(0, -1).join("، ")} و${names[names.length - 1]}.`;
    const optionalNearby = [
      ...(day.optionalPlaceIds ?? []).map((placeId) => ({
        placeId,
        type: "experience" as const,
        reason: day.optionalReasons?.[placeId] === "unpublished" ? CRUISE_UNPUBLISHED_REASON_AR : getBudapestPlannerMetadataById(placeId)?.preferredTime === "evening" && !day.optionalReasons?.[placeId] ? "اختياري: رحلة مسائية، مواعيدها حسب فترة سفرك؛ احجز موعد لما تعرف تاريخك" : day.optionalReasons?.[placeId] === "closing" ? "اختياري: بيسكّر قبل ما توصله بهاليوم" : "اختياري: اليوم مليان، زوره إذا ضل عندك وقت",
      })),
      ...(day.goalSuggestionPlaceIds ?? []).map((placeId) => ({ placeId, type: "experience" as const, reason: "تسوّق قريب من مسارك إذا حابب" })),
      ...(day.freeTimePlaceIds ?? []).map((placeId) => ({ placeId, type: "experience" as const, reason: "قريب من مسارك إذا حابب" })),
      ...clusterIds.flatMap((cluster) => CONDITIONAL_BY_CLUSTER[cluster] ?? []).map((c) => ({ placeId: c.placeId, type: "experience" as const, reason: c.reason })),
    ];
    return { title, summary, optionalNearby };
  });
  return { byDay };
}

const DESTINATION_CONFIG: DestinationConfig = {
  id: "budapest",
  name: "Budapest",
  country: "Hungary",
  timezone: "Europe/Budapest",
  plannerMetadata: BUDAPEST_PLANNER_METADATA,
  dayBuilderConfig: DAY_BUILDER_CONFIG,
  routeOptimizationConfig: ROUTE_CONFIG,
  buildPlanRouteLegs: (plan) => plan.days.map((day) => day.stops.slice(0, -1).map((stop, i) => budapestLeg(stop.placeId, day.stops[i + 1].placeId))),
  presentationResolver: (plan) => presentBudapestPlan(plan),
  resolvePlaceDisplayName: placeName,
};

// ── Accommodation ───────────────────────────────────────────────────────────────────────────────────
const CLUSTER_CENTROIDS: Record<string, GeoPoint> = (() => {
  const sums = new Map<string, { lat: number; lng: number; n: number }>();
  for (const meta of BUDAPEST_PLANNER_METADATA) {
    const point = BUDAPEST_PLACE_COORDINATES[meta.placeId];
    if (!point) continue;
    const sum = sums.get(meta.cluster) ?? { lat: 0, lng: 0, n: 0 };
    sums.set(meta.cluster, { lat: sum.lat + point.lat, lng: sum.lng + point.lng, n: sum.n + 1 });
  }
  return Object.fromEntries([...sums.entries()].map(([cluster, s]) => [cluster, { lat: s.lat / s.n, lng: s.lng / s.n }]));
})();

/** Generous box around the city of Budapest: rejects a same-named hotel in another city. */
const BOUNDS = { minLat: 47.34, maxLat: 47.62, minLng: 18.92, maxLng: 19.34 };

const KEYWORD_CLUSTERS: { cluster: string; patterns: RegExp[] }[] = [
  { cluster: "castle-hill", patterns: [/budav[aá]r/i, /castle (hill|district)/i, /v[aá]rnegyed/i, /قلعة بودا/] },
  { cluster: "lipotvaros", patterns: [/lip[oó]tv[aá]ros/i, /parliament/i, /kossuth/i, /البرلمان/] },
  { cluster: "belvaros", patterns: [/belv[aá]ros/i, /v[aá]ci utca/i, /v[oö]r[oö]smarty/i, /de[aá]k/i] },
  { cluster: "terezvaros", patterns: [/ter[eé]zv[aá]ros/i, /andr[aá]ssy/i, /oktogon/i] },
  { cluster: "erzsebetvaros", patterns: [/erzs[eé]betv[aá]ros/i, /jewish quarter/i, /blaha/i] },
  { cluster: "palotanegyed", patterns: [/palotanegyed/i, /j[oó]zsefv[aá]ros/i, /astoria/i] },
  { cluster: "city-park", patterns: [/v[aá]rosliget/i, /city park/i, /h[oő]s[oö]k tere/i, /heroes'? square/i] },
  { cluster: "gellert-hill", patterns: [/gell[eé]rt/i] },
];

function nearestCluster(point: GeoPoint): { cluster: string; distanceKm: number } {
  let best: { cluster: string; distanceKm: number } | null = null;
  for (const [cluster, centroid] of Object.entries(CLUSTER_CENTROIDS)) {
    const distanceKm = haversineDistanceKm(point, centroid);
    if (!best || distanceKm < best.distanceKm) best = { cluster, distanceKm };
  }
  return best!;
}

// ── Warnings shown on a stop ────────────────────────────────────────────────────────────────────────
const WARNINGS: Record<string, PlannerOperationalWarning[]> = {
  "opera-house-tour": [{ textAr: "⚠️ مشروطة بالحجز: الجولات بس 13:30 و15:00 و16:30، والتذاكر بتنزل قبل أسبوع. ما في جولات وقت العروض." }],
  "danube-legend-cruise": [{ textAr: "⚠️ مشروطة بالحجز: الموعد المنشور مش ضمان مكان. المشروب المشمول ممكن يكون مي أو مشروب غازي." }],
  "house-of-music": [{ textAr: "⚠️ الدخول بفترة محجوزة كل نص ساعة (:15 و:45)، وتذاكر الويكند بتخلص بسرعة. خزانة الملابس إلزامية." }],
  "budapest-zoo": [{ textAr: "المواعيد بتتغير حسب الشهر (بالشتا لحد 16:00 وآخر دخول 15:00)." }],
  "st-stephens-basilica": [{ textAr: "الأحد: الكنيسة بتفتح من 13:00 بس (التراس من 9:00).", onlyRelevantOnWeekday: "sunday" }],
  "hungarian-national-museum": [{ textAr: "في قاعات مسكّرة للترميم حسب موقع المتحف." }],
};

function warningsFor(placeId: string, weekday?: Weekday | null): PlannerOperationalWarning[] | undefined {
  const all = WARNINGS[placeId];
  if (!all) return undefined;
  if (!weekday) return all;
  const relevant = all.filter((warning) => !warning.onlyRelevantOnWeekday || warning.onlyRelevantOnWeekday === weekday);
  return relevant.length > 0 ? relevant : undefined;
}

// ── Entry ticket estimates (HUF; an amount in another currency counts as "price not available in HUF") ──
function budapestTicketEstimate(placeId: string): number | null | undefined {
  const experience = BUDAPEST_PLACES.experiences.some((p) => p.id === placeId);
  const place = [...BUDAPEST_PLACES.attractions, ...BUDAPEST_PLACES.experiences].find((p) => p.id === placeId) as { priceType?: string; priceText?: string } | undefined;
  if (!place) return undefined;
  if (place.priceType === "free") return 0;
  if (!place.priceType && !experience) return undefined;
  const match = (place.priceText ?? "").replace(/(\d)[ ,.](\d{3})/g, "$1$2").match(/(\d+)\s*HUF/);
  return match ? Number(match[1]) : null;
}

// ── Personalization ─────────────────────────────────────────────────────────────────────────────────
const SHOPPING_STRONG = new Set(["great-market-hall", "vaci-utca", "andrassy-avenue", "arena-mall"]);
const EXPERIENCE_BONUS = new Set(["danube-legend-cruise", "opera-house-tour", "house-of-music"]);

function placeSelectionBonus(interests: readonly V2PlannerInterest[]): (placeId: string) => number {
  const shopping = interests.includes("shopping");
  const solo = shopping && interests.length === 1;
  const experiences = interests.includes("footballExperiences") || interests.includes("nightlife");
  return (placeId) => {
    let bonus = 0;
    if (shopping && SHOPPING_STRONG.has(placeId)) bonus += solo ? 9 : 3;
    if (experiences && EXPERIENCE_BONUS.has(placeId)) bonus += 6;
    return bonus;
  };
}

/**
 * Budapest only: an evening place (the river cruise) ends its day. The shared route order treats the preferred time as a soft hint, and
 * the first sample put day-time stops after the cruise (past 18:00 and after dark). The rest of the day keeps its order.
 * Flexible dates: the cruise is moved to that day's suggestions (its departures depend on the travel dates).
 */
const CRUISE_ID = "danube-legend-cruise";
/** Owner-approved text (2026-11-14) for the cruise on dates whose timetable the operator has not published. */
const CRUISE_UNPUBLISHED_REASON_AR = "رحلة مسائية على الدانوب — خيار إضافي. تأكّد من المواعيد والتوفّر لتاريخ سفرك قبل الحجز.";
const RIVER_CLUSTERS = new Set(["belvaros", "lipotvaros"]);

/** The cruise's timetable is not published for this date: the "PLANNING EXCLUSION" entries of its data (budapestPlaces.ts). */
function cruiseTimetableUnpublished(isoDate: string): boolean {
  const hours = (resolvePlannerPlace(CRUISE_ID, BUDAPEST_PLACES)?.place as { hours?: HoursInfo } | undefined)?.hours;
  const exceptions = hours && hours.type === "variable" ? hours.dateExceptions : undefined;
  return !!exceptions?.some((e) => e.note?.startsWith("PLANNING EXCLUSION") && isoDate >= e.from && isoDate <= e.to);
}

/**
 * The cruise as a suggestion only, never on the clock: in a plan without dates (it is never scheduled there: datedOnlyPlaceIds), and on
 * dated trips whose dates have no published timetable (2027+, 20 Aug). Only when it matches this request (the same relevance rule as any
 * place) and the plan does not already have it. Day: the one with the most minutes by the river (Belváros / Lipótváros), else the last.
 * Dated: the reason "unpublished" (owner-approved text); without dates the existing evening-cruise text. The "add" button still rejects
 * it on those days (no departure to start at).
 */
function withCruiseSuggestion(result: { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] }, context: DayGeographyRepairContext): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const { plan } = result;
  if (plan.days.some((day) => day.stops.some((stop) => stop.placeId === CRUISE_ID) || day.optionalPlaceIds?.includes(CRUISE_ID))) return result;
  if (!context.config.dayBuilderConfig.isPlaceRelevant?.(CRUISE_ID)) return result;
  const flexible = context.weekdayForDayNumber?.(1) == null;
  const candidates = plan.days.filter((day) => {
    if (flexible) return true;
    const iso = context.isoDateForDayNumber?.(day.dayNumber);
    return !!iso && cruiseTimetableUnpublished(iso);
  });
  if (candidates.length === 0) return result;
  const riverMinutes = (day: PlannerDay) => day.stops.reduce((sum, stop) => { const meta = getBudapestPlannerMetadataById(stop.placeId); return sum + (meta && RIVER_CLUSTERS.has(meta.cluster) ? meta.visitDurationMinutes : 0); }, 0);
  const target = [...candidates].sort((a, b) => riverMinutes(b) - riverMinutes(a) || b.dayNumber - a.dayNumber)[0];
  const days = plan.days.map((day) =>
    day !== target
      ? day
      : { ...day, optionalPlaceIds: [...(day.optionalPlaceIds ?? []), CRUISE_ID], ...(flexible ? {} : { optionalReasons: { ...day.optionalReasons, [CRUISE_ID]: "unpublished" as const } }) }
  );
  return { plan: { ...plan, days }, legsByDay: result.legsByDay };
}

// ── Day quality: order on the clock, judged on the FINAL schedule (rounds 1-2) ──────────────────────────────
const ORDER_MAX_TRAVEL_INCREASE = 15;
const ORDER_MIN_GAIN = 30;
const ORDER_MAX_CANDIDATES = 120;
const ORDER_PROPOSALS_PER_DAY = 4;
const REVIEW_MAX_BUILDS = 6;
const MOVE_MAX_BUILDS = 12;
const MOVE_OPENING_LATER_BY = 120;
/** Stage 1: a day that was NOT reordered may move by this much (e.g. its restaurant taken by another day); stage 2: no day may get worse. */
const NO_WEAKER_TOLERANCE = 10;

export type DayClockQuality = { morningGap: number; waits: number; travel: number; lateLunch: number; afterDark: number; cost: number };

/** The clock estimate of a day (lunch break placeholder, no restaurant): only used to PROPOSE orders; acceptance reads the final day. */
export function dayClockQuality(clock: DayOnClock, month: number | null): DayClockQuality {
  const t = clock.timeline;
  const mid = (leg: PlannerRouteLeg | undefined) => {
    const o = leg?.options.find((x) => x.mode === leg.recommendedMode);
    return o ? Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2) : 0;
  };
  type Item = { stop: number; after: number; start: number; end: number };
  const items: Item[] = [
    ...t.stops.map((w, i) => ({ stop: i, after: i, start: w.startMinutes, end: w.endMinutes })),
    ...t.meals.filter((m) => m.mealType === "lunch").map((m) => ({ stop: -1, after: m.afterStopIndex, start: m.startMinutes, end: m.endMinutes })),
  ].sort((a, b) => a.start - b.start);
  let waits = 0;
  let travel = 0;
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1];
    const b = items[j];
    const legMinutes = b.stop >= 0 && b.stop === a.after + 1 ? mid(clock.legs[a.after]) : 0;
    travel += legMinutes;
    waits += Math.max(0, b.start - a.end - legMinutes - 15);
  }
  const morningGap = Math.max(0, (t.stops[0]?.startMinutes ?? DAY_REFERENCE_START) - DAY_REFERENCE_START);
  const lunch = t.meals.find((m) => m.mealType === "lunch");
  const lateLunch = lunch ? Math.max(0, lunch.startMinutes - (13 * 60 + 30)) : 0;
  const sunset = month ? SUNSET_ESTIMATE_BY_MONTH[month] : null;
  const afterDark = sunset === null ? 0 : t.stops.reduce((sum, w) => sum + (DAYLIGHT_PLACES.has(w.placeId) ? Math.max(0, w.endMinutes - sunset) : 0), 0);
  return { morningGap, waits, travel, lateLunch, afterDark, cost: morningGap + waits + 2 * lateLunch + afterDark + 0.5 * travel };
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]));
}

const isEveningPlace = (placeId: string) => getBudapestPlannerMetadataById(placeId)?.preferredTime === "evening";
function legMidMinutes(a: string, b: string): number {
  const leg = budapestLeg(a, b);
  const o = leg.options.find((x) => x.mode === leg.recommendedMode);
  return o ? (o.durationMinutesMin + o.durationMinutesMax) / 2 : 30;
}
const routeTravel = (ids: readonly string[]) => ids.slice(1).reduce((sum, id, i) => sum + legMidMinutes(ids[i], id), 0);

/**
 * Orders proposed for a day by the clock estimate: same places, evening places last, at most +15 min (or the given limit) of stop-to-stop travel, the 120
 * cheapest orders by travel tried, the best ones first. `minClockGain` filters orders whose estimate is not clearly better.
 */
function clockOrderProposals(day: PlannerDay, context: DayGeographyRepairContext, onClock: ReturnType<typeof budapestDayOnClock>, ids: readonly string[], minClockGain: number, limit: number, maxTravelIncrease = ORDER_MAX_TRAVEL_INCREASE): string[][] {
  const rest = ids.filter((id) => !isEveningPlace(id));
  const evening = ids.filter((id) => isEveningPlace(id));
  if (rest.length < 1 || rest.length > 6) return [];
  const outside = new Set(day.stops.filter((stop) => stop.visitMode === "outside").map((stop) => stop.placeId));
  const month = context.monthForDayNumber?.(day.dayNumber) ?? null;
  const current = day.stops.map((s) => s.placeId);
  const sameSet = current.length === ids.length && current.every((id) => ids.includes(id));
  const base = sameSet ? dayClockQuality(onClock(current, day.dayNumber, outside), month) : null;
  const baseTravel = sameSet ? routeTravel(current) : Infinity;
  const scored: { order: string[]; cost: number }[] = [];
  const tried = permutations(rest)
    .map((order) => [...order, ...evening])
    .filter((order) => !sameSet || order.some((id, i) => id !== current[i]))
    .map((order) => ({ order, travel: routeTravel(order) }))
    .filter((c) => c.travel <= baseTravel + maxTravelIncrease)
    .sort((a, b) => a.travel - b.travel)
    .slice(0, ORDER_MAX_CANDIDATES);
  for (const c of tried) {
    const clock = onClock(c.order, day.dayNumber, outside);
    if (clock.failing.length > 0) continue;
    const q = dayClockQuality(clock, month);
    if (base && base.cost - q.cost < minClockGain) continue;
    scored.push({ order: c.order, cost: q.cost });
  }
  return scored.sort((a, b) => a.cost - b.cost).slice(0, limit).map((s) => s.order);
}

function stopMinutes(stop: { placeId: string; visitMode?: "outside" }): number {
  return (stop.visitMode === "outside" ? OUTSIDE_STOP_MINUTES[stop.placeId] : undefined) ?? getBudapestPlannerMetadataById(stop.placeId)?.visitDurationMinutes ?? 60;
}
/** The plan with new stop lists for some days (same stop objects), each day's totals and clusters recomputed, and its legs rebuilt. */
function withDayStops(plan: GeneratedPlannerPlan, changes: ReadonlyMap<number, PlannerDay["stops"]>): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const days = plan.days.map((day) => {
    const stops = changes.get(day.dayNumber);
    if (!stops) return day;
    const clusters = [...new Set(stops.map((s) => getBudapestPlannerMetadataById(s.placeId)?.cluster).filter((c): c is string => !!c))];
    return { ...day, stops, totalVisitMinutes: stops.reduce((sum, s) => sum + stopMinutes(s), 0), clusters };
  });
  return { plan: { ...plan, days }, legsByDay: days.map((day) => day.stops.slice(0, -1).map((stop, i) => budapestLeg(stop.placeId, day.stops[i + 1].placeId))) };
}
const reorder = (day: PlannerDay, ids: readonly string[]) => {
  const byId = new Map(day.stops.map((s) => [s.placeId, s]));
  return ids.map((id) => byId.get(id)!);
};

type Reviewed = { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][]; data: V2Plan };
type Judged = { q: FinalDayQuality; problems: number; day: V2Day };
function judgeAll(data: V2Plan): Map<number, Judged> {
  return new Map(data.days.map((d) => [d.dayNumber, { q: finalDayQuality(d), problems: scheduleProblems(d).size, day: d }]));
}

/**
 * Review rules (round 3, TEST-ONLY switches; the defaults are the round-2 behaviour of 8e8a309).
 * - travel "A": a day's travel may grow by 15 min at most. "B" / "C": the A review first, then a second pass that allows MORE only on days with lost time (first visit
 *   60+ min after 09:00, or one wait of 60+ min): at most the recovered minutes (morning + waits) / k (B: 4, C: 3), 45 at most, the
 *   day's total travel 90 at most; and then the trip's travel share (travel / (visits + travel)) may not grow by more than 2 points.
 *   Restaurant transfers always count in full; a lunch break has no point, so its food access is unknown (never counted as 0 proof).
 * - meals "tolerance": a day NOT reordered may get worse by 10 cost points (round 2). "explicit": instead, each changed meal is checked:
 *   same meal categories, not served on another day of the trip, its walk at most 10 min longer, and no new wait of 30+ min that day.
 *   No dietary claim either way (the request has no dietary preference; tags are data, not proof of suitability). The day itself may
 *   not get more than 10 min of extra idle (round 4: found when the timing guard rebuilt such a day in a worse order). A restaurant lunch that becomes a lunch break is a loss in every mode.
 * - areas (datedAreas): see reviewDatedAreas.
 * Policies that are NOT changed here: one restaurant per trip (variety), evening places last, the accommodation day.
 */
export type TravelRuleName = "A" | "B" | "C" | "B1" | "A1";
/**
 * B1 (round 4 candidate): B's allowance (recovered / 4, at most 45, day total at most 90) with NO trip-share rejection (the share is
 * reported only), and the allowance counted CUMULATIVELY against the fixed baseline (the day as it came into the review), so a day
 * cannot collect +15 per stage silently: once a day is more than 15 above its baseline, the whole increase must fit the allowance.
 */
const TRAVEL_RULES: Record<TravelRuleName, { k: number; maxIncrease: number; dayCeiling: number; tripSharePoints: number; cumulative?: boolean }> = {
  A: { k: Infinity, maxIncrease: ORDER_MAX_TRAVEL_INCREASE, dayCeiling: Infinity, tripSharePoints: Infinity },
  B: { k: 4, maxIncrease: 45, dayCeiling: 90, tripSharePoints: 2 },
  C: { k: 3, maxIncrease: 45, dayCeiling: 90, tripSharePoints: 2 },
  B1: { k: 4, maxIncrease: 45, dayCeiling: 90, tripSharePoints: Infinity, cumulative: true },
  /** Pass 1 under B1: rule A (+15) counted against the same fixed baseline, so two stages cannot add +15 each. */
  A1: { k: Infinity, maxIncrease: ORDER_MAX_TRAVEL_INCREASE, dayCeiling: Infinity, tripSharePoints: Infinity, cumulative: true },
};
const LOST_TIME_MINUTES = 60;
const MEAL_WALK_MORE_AT_MOST = 10;
const NEW_WAIT_AT_MOST = 30;
const UNCHANGED_DAY_IDLE_MORE_AT_MOST = 10;
export type ReviewReportEntry = { stage: "order" | "move" | "areas"; decision: "accepted" | "rejected" | "kept" | "skipped"; day?: number; reasons: string[]; detail?: Record<string, unknown> };
type ReviewRules = { travel: TravelRuleName; meals: "tolerance" | "explicit"; report?: (entry: ReviewReportEntry) => void; baseline?: ReadonlyMap<number, Judged> };
const DEFAULT_RULES: ReviewRules = { travel: "A", meals: "tolerance" };

const hadLostTime = (q: FinalDayQuality) => q.morningGap >= LOST_TIME_MINUTES || q.longestWait >= LOST_TIME_MINUTES;
/** Why a day's travel increase is not allowed (null = allowed). */
function travelRefusal(rules: ReviewRules, stageBase: FinalDayQuality, trial: FinalDayQuality, dayNumber?: number): string | null {
  const r = TRAVEL_RULES[rules.travel];
  // Cumulative rules: the allowance is judged against the day's fixed baseline, never only against the last stage.
  const origin = r.cumulative && dayNumber !== undefined ? rules.baseline?.get(dayNumber)?.q : undefined;
  const base = origin ?? stageBase;
  const increase = trial.travel - base.travel;
  if (increase <= ORDER_MAX_TRAVEL_INCREASE) return null;
  if (rules.travel === "A") return `travel +${increase} (more than 15)`;
  if (rules.travel === "A1") return `travel +${increase} since the baseline (more than 15)`;
  if (!hadLostTime(base)) return `travel +${increase} (more than 15, no lost morning or long wait)`;
  const recovered = base.morningGap + base.waits - (trial.morningGap + trial.waits);
  const allowed = Math.min(recovered / r.k, r.maxIncrease);
  if (increase > allowed) return `travel +${increase}${origin ? " since the baseline" : ""} (allowed ${Math.floor(allowed)}: recovered ${recovered} / ${r.k}, at most ${r.maxIncrease})`;
  if (trial.travel > r.dayCeiling) return `day travel ${trial.travel} (above ${r.dayCeiling})`;
  return null;
}
const proposalTravelLimit = (rules: ReviewRules, base: FinalDayQuality | undefined) =>
  rules.travel !== "A" && base && hadLostTime(base) ? TRAVEL_RULES[rules.travel].maxIncrease : ORDER_MAX_TRAVEL_INCREASE;
const tripShare = (judged: ReadonlyMap<number, Judged>) => {
  let travel = 0;
  let visits = 0;
  for (const j of judged.values()) { travel += j.q.travel; visits += j.q.visits; }
  return travel + visits > 0 ? (100 * travel) / (travel + visits) : 0;
};
/** The trip's travel share, checked only when some day uses the larger allowance (more than +15): B / C extend A, never restrict it. */
function tripShareRefusal(rules: ReviewRules, base: ReadonlyMap<number, Judged>, trial: ReadonlyMap<number, Judged>): string | null {
  const points = TRAVEL_RULES[rules.travel].tripSharePoints;
  if (!Number.isFinite(points)) return null;
  if (![...trial].some(([n, j]) => j.q.travel - (base.get(n)?.q.travel ?? j.q.travel) > ORDER_MAX_TRAVEL_INCREASE)) return null;
  const before = tripShare(base);
  const after = tripShare(trial);
  return after - before > points ? `trip travel share ${before.toFixed(1)}% -> ${after.toFixed(1)}% (more than +${points} points)` : null;
}

/** A restaurant lunch that becomes a lunch break is a loss for the customer, whatever the clock says. */
const losesRestaurant = (base: Judged, trial: Judged) => base.q.lunch !== "break" && base.q.lunch !== "none" && (trial.q.lunch === "break" || trial.q.lunch === "none");
/** Why one day's change is not a clear gain on the FINAL schedule (empty = accepted). */
function gainRefusals(rules: ReviewRules, base: Judged, trial: Judged): string[] {
  const reasons: string[] = [];
  if (trial.problems > base.problems) reasons.push("new schedule problem");
  if (losesRestaurant(base, trial)) reasons.push(`restaurant lunch lost (${base.q.lunch})`);
  const travel = travelRefusal(rules, base.q, trial.q, trial.day.dayNumber);
  if (travel) reasons.push(travel);
  const gain = base.q.cost - trial.q.cost;
  if (gain < ORDER_MIN_GAIN) reasons.push(`gain ${gain} (less than ${ORDER_MIN_GAIN})`);
  else if (trial.q.travel - base.q.travel > gain / 2) reasons.push(`added travel ${trial.q.travel - base.q.travel} more than half the gain ${gain}`);
  return reasons;
}
const clearGain = (rules: ReviewRules, base: Judged, trial: Judged) => gainRefusals(rules, base, trial).length === 0;

const FOOD_BY_ID = new Map<string, FoodPlace>(BUDAPEST_PLACES.foodPlaces.map((p) => [p.id, p]));
const midLegMinutes = (leg: PlannerRouteLeg | undefined) => {
  const o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x) => x.mode === leg.recommendedMode) : undefined;
  return o ? Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2) : 0;
};
/** Minutes of the walks to and from one meal of a day (its meal legs). */
function mealWalk(day: V2Day, mealId: string): number {
  let sum = 0;
  for (const [key, leg] of Object.entries(day.mealLegs ?? {})) if (key.startsWith(`${mealId}::`) || key.endsWith(`::${mealId}`)) sum += midLegMinutes(leg);
  return sum;
}
/** Why the meals of a day whose places did not change are worse (explicit meal criteria; empty = fine). */
function mealRefusals(base: Judged, trial: Judged, servedElsewhere: (placeId: string, dayNumber: number) => boolean): string[] {
  const reasons: string[] = [];
  for (const type of ["lunch", "dinner"] as const) {
    const before = base.day.timeline?.meals.find((m) => m.mealType === type);
    const after = trial.day.timeline?.meals.find((m) => m.mealType === type);
    if (!before || before.placeId === after?.placeId) continue;
    if (!after) { reasons.push(`${type} lost (${before.placeId})`); continue; }
    if (after.placeId === "lunch-break" || before.placeId === "lunch-break") continue;
    const a = FOOD_BY_ID.get(before.placeId);
    const b = FOOD_BY_ID.get(after.placeId);
    if (!b) { reasons.push(`${type} ${after.placeId}: unknown place`); continue; }
    const allowed = type === "lunch" ? ["local", "restaurants"] : ["local", "restaurants"];
    if (!allowed.includes(b.categoryId)) reasons.push(`${type} ${b.id}: category ${b.categoryId}`);
    // No dietary judgement here: the planner request carries no dietary preference, the previous restaurant's tags are not the
    // customer's preference, and a missing warning tag proves nothing. Dietary information stays as the project's data shows it.
    void a;
    if (servedElsewhere(b.id, trial.day.dayNumber)) reasons.push(`${type} ${b.id}: served on another day too`);
    const walk = mealWalk(trial.day, after.placeId) - mealWalk(base.day, before.placeId);
    if (walk > MEAL_WALK_MORE_AT_MOST) reasons.push(`${type} ${before.placeId} -> ${b.id}: walk +${walk} min (more than ${MEAL_WALK_MORE_AT_MOST})`);
  }
  if (trial.q.longestWait >= NEW_WAIT_AT_MOST && trial.q.longestWait > base.q.longestWait) reasons.push(`new wait of ${trial.q.longestWait} min`);
  return reasons;
}
function servedElsewhereIn(judged: ReadonlyMap<number, Judged>) {
  return (placeId: string, dayNumber: number) => [...judged.values()].some((j) => j.day.dayNumber !== dayNumber && !!j.day.timeline?.meals.some((m) => m.placeId === placeId));
}
/** Why a day whose PLACES did not change got worse through a change elsewhere (e.g. its restaurant taken by another day). */
function unchangedDayRefusals(rules: ReviewRules, base: Judged, trial: Judged, judged: ReadonlyMap<number, Judged>, tolerance: number): string[] {
  const reasons: string[] = [];
  if (trial.problems > base.problems) reasons.push("new schedule problem");
  if (losesRestaurant(base, trial)) reasons.push(`restaurant lunch lost (${base.q.lunch})`);
  // Cumulative rules: against the day's fixed baseline (a day whose places did not change never uses the larger allowance).
  const ref = TRAVEL_RULES[rules.travel].cumulative ? (rules.baseline?.get(trial.day.dayNumber)?.q ?? base.q) : base.q;
  if (trial.q.travel > ref.travel + ORDER_MAX_TRAVEL_INCREASE) reasons.push(`travel +${trial.q.travel - ref.travel}${ref === base.q ? "" : " since the baseline"} (more than 15)`);
  if (rules.meals === "tolerance") {
    if (trial.q.cost > base.q.cost + tolerance) reasons.push(`cost +${trial.q.cost - base.q.cost} (tolerance ${tolerance})`);
  } else {
    // Explicit mode: the meals are judged one by one, and the day as a whole may not lose more than 10 min to idle (a day with the
    // same places can still be rebuilt in another order by the timing guard when restaurants move between days).
    if (trial.q.idle > base.q.idle + UNCHANGED_DAY_IDLE_MORE_AT_MOST) reasons.push(`idle +${trial.q.idle - base.q.idle} on a day whose places did not change`);
    reasons.push(...mealRefusals(base, trial, servedElsewhereIn(judged)));
  }
  return reasons;
}
/** Why a day whose places DID change (stage 2) is weaker: it may not get worse at all; its travel follows the travel rule. */
function changedDayRefusals(rules: ReviewRules, base: Judged, trial: Judged): string[] {
  const reasons: string[] = [];
  if (trial.problems > base.problems) reasons.push("new schedule problem");
  if (losesRestaurant(base, trial)) reasons.push(`restaurant lunch lost (${base.q.lunch})`);
  if (trial.q.cost > base.q.cost) reasons.push(`cost +${trial.q.cost - base.q.cost}`);
  const travel = travelRefusal(rules, base.q, trial.q, trial.day.dayNumber);
  if (travel) reasons.push(travel);
  return reasons;
}
const brief = (j: Judged) => ({ order: j.q.order, idle: j.q.idle, morning: j.q.morningGap, waits: j.q.waits, travel: j.q.travel, stopTravel: j.q.stopTravel, mealTravel: j.q.mealTravel, foodAccessUnknown: j.q.foodAccessUnknown, lunch: j.q.lunch, cost: j.q.cost });

/** Stage 1: each day's order, proposed by the clock and accepted on the final schedule. Bounded: at most REVIEW_MAX_BUILDS rebuilds. */
function reviewDayOrders(input: Reviewed, context: DayGeographyRepairContext, build: (plan: GeneratedPlannerPlan, legs: PlannerRouteLeg[][]) => V2Plan, lunchAfterLastStop: boolean, lockedDays: ReadonlySet<number>, rules: ReviewRules = DEFAULT_RULES, onlyLostTime = false): Reviewed {
  const onClock = budapestDayOnClock(context, lunchAfterLastStop);
  const base = judgeAll(input.data);
  const proposals = new Map<number, string[][]>();
  for (const day of input.plan.days) {
    if (lockedDays.has(day.dayNumber)) continue;
    if (onlyLostTime && !hadLostTime(base.get(day.dayNumber)!.q)) continue;
    const list = clockOrderProposals(day, context, onClock, day.stops.map((s) => s.placeId), ORDER_MIN_GAIN / 2, ORDER_PROPOSALS_PER_DAY, proposalTravelLimit(rules, base.get(day.dayNumber)?.q));
    if (list.length) proposals.set(day.dayNumber, list);
  }
  if (proposals.size === 0) return input;
  const accepted = new Map<number, string[]>();
  const nextTry = new Map<number, number>([...proposals.keys()].map((n) => [n, 0]));
  let builds = 0;
  let current = input;
  while (builds < REVIEW_MAX_BUILDS) {
    const trialOrders = new Map(accepted);
    for (const [n, i] of nextTry) trialOrders.set(n, proposals.get(n)![i]);
    if (trialOrders.size === 0) break;
    const changes = new Map([...trialOrders].map(([n, ids]) => [n, reorder(input.plan.days.find((d) => d.dayNumber === n)!, ids)]));
    const trial = withDayStops(input.plan, changes);
    const data = build(trial.plan, trial.legsByDay);
    builds++;
    const judged = judgeAll(data);
    let stable = true;
    for (const n of [...trialOrders.keys()]) {
      const refusals = gainRefusals(rules, base.get(n)!, judged.get(n)!);
      if (nextTry.has(n)) rules.report?.({ stage: "order", day: n, decision: refusals.length ? "rejected" : "accepted", reasons: refusals, detail: { base: brief(base.get(n)!), trial: brief(judged.get(n)!) } });
      if (refusals.length === 0) {
        if (nextTry.has(n)) { accepted.set(n, trialOrders.get(n)!); nextTry.delete(n); stable = false; }
      } else {
        stable = false;
        if (accepted.has(n)) accepted.delete(n);
        const i = nextTry.get(n);
        if (i !== undefined && i + 1 < proposals.get(n)!.length) nextTry.set(n, i + 1);
        else nextTry.delete(n);
      }
    }
    const otherRefusals = [...judged].flatMap(([n, j]) => (trialOrders.has(n) ? [] : unchangedDayRefusals(rules, base.get(n)!, j, judged, NO_WEAKER_TOLERANCE).map((r) => `day ${n}: ${r}`)));
    const share = tripShareRefusal(rules, base, judged);
    const othersOk = otherRefusals.length === 0 && !share;
    if (!othersOk && accepted.size > 0) {
      rules.report?.({ stage: "order", decision: "rejected", reasons: [...otherRefusals, ...(share ? [share] : [])], detail: { dropping: "the accepted change with the smallest gain" } });
      // Drop the accepted change with the smallest gain and try again.
      const weakest = [...accepted.keys()].sort((a, b) => base.get(a)!.q.cost - judged.get(a)!.q.cost - (base.get(b)!.q.cost - judged.get(b)!.q.cost))[0];
      accepted.delete(weakest);
      stable = false;
    }
    if (stable && nextTry.size === 0 && othersOk) { current = { ...trial, data }; return current; }
    if (nextTry.size === 0 && accepted.size === 0) return input;
  }
  if (accepted.size === 0) return input;
  // Out of tries: keep only what the last check accepted, and verify it once more.
  const changes = new Map([...accepted].map(([n, ids]) => [n, reorder(input.plan.days.find((d) => d.dayNumber === n)!, ids)]));
  const final = withDayStops(input.plan, changes);
  const data = build(final.plan, final.legsByDay);
  const judged = judgeAll(data);
  const ok = [...judged].every(([n, j]) => (accepted.has(n) ? clearGain(rules, base.get(n)!, j) : unchangedDayRefusals(rules, base.get(n)!, j, judged, NO_WEAKER_TOLERANCE).length === 0)) && !tripShareRefusal(rules, base, judged);
  return ok ? { ...final, data } : input;
}

/** The earliest opening of a place on a day (planning hours of that date), minutes; null when unknown or closed. */
function openingOnDay(context: DayGeographyRepairContext, placeId: string, dayNumber: number): number | null {
  const weekday = context.weekdayForDayNumber?.(dayNumber);
  if (!weekday) return null;
  const hours = planningHoursOf(context.hoursForPlaceOnDay?.(placeId, dayNumber) ?? context.hoursForPlace?.(placeId));
  if (!hours) return 9 * 60;
  if (hours.type !== "fixed") return 9 * 60;
  const ranges = hours.schedule[weekday] ?? [];
  if (ranges.length === 0) return null;
  return Math.min(...ranges.map((r) => Number(r.open.slice(0, 2)) * 60 + Number(r.open.slice(3, 5))));
}

/**
 * Stage 2: a place whose opening on its day is at least 2 hours later than on another day of the trip (e.g. St Stephen's on a Sunday,
 * 13:00) may move to that day, alone or swapped with one place of that day (not an evening place, open on the first day). Each move is
 * judged on the WHOLE trip's final schedule: total gain >= 30, no day worse (the two changed days: not at all, travel by the travel rule;
 * the other days: as in stage 1 with no tolerance), no new problem, at least 2 places left on each day. Same places and lengths in the
 * trip. Dated plans only. Bounded: MOVE_MAX_BUILDS rebuilds.
 */
function reviewDayMoves(input: Reviewed, context: DayGeographyRepairContext, build: (plan: GeneratedPlannerPlan, legs: PlannerRouteLeg[][]) => V2Plan, lunchAfterLastStop: boolean, lockedDays: ReadonlySet<number>, rules: ReviewRules = DEFAULT_RULES): Reviewed {
  if (context.weekdayForDayNumber?.(1) == null) return input;
  const onClock = budapestDayOnClock(context, lunchAfterLastStop);
  let current = input;
  let builds = 0;
  const candidates: { placeId: string; from: number; to: number; delta: number }[] = [];
  for (const day of input.plan.days) {
    if (lockedDays.has(day.dayNumber)) continue;
    for (const stop of day.stops) {
      if (isEveningPlace(stop.placeId)) continue;
      const here = openingOnDay(context, stop.placeId, day.dayNumber);
      if (here === null) continue;
      for (const other of input.plan.days) {
        if (other.dayNumber === day.dayNumber || lockedDays.has(other.dayNumber)) continue;
        if (context.isPlaceEligibleForDay && !context.isPlaceEligibleForDay(stop.placeId, other.dayNumber)) continue;
        const there = openingOnDay(context, stop.placeId, other.dayNumber);
        if (there !== null && here - there >= MOVE_OPENING_LATER_BY) candidates.push({ placeId: stop.placeId, from: day.dayNumber, to: other.dayNumber, delta: here - there });
      }
    }
  }
  candidates.sort((a, b) => b.delta - a.delta || a.from - b.from || a.to - b.to);
  for (const cand of candidates.slice(0, 4)) {
    const plan = current.plan;
    const from = plan.days.find((d) => d.dayNumber === cand.from)!;
    const to = plan.days.find((d) => d.dayNumber === cand.to)!;
    const moving = from.stops.find((s) => s.placeId === cand.placeId);
    if (!moving) continue;
    const base = judgeAll(current.data);
    const baseTotal = [...base.values()].reduce((s, j) => s + j.q.cost, 0);
    // Swap partners: places of the target day that can go to the first day (open there, not evening), nearest to the first day first.
    const fromRest = from.stops.filter((s) => s.placeId !== cand.placeId);
    const partners = to.stops
      .filter((s) => !isEveningPlace(s.placeId) && (!context.isPlaceEligibleForDay || context.isPlaceEligibleForDay(s.placeId, cand.from)))
      .map((s) => ({ s, near: fromRest.length ? Math.min(...fromRest.map((f) => legMidMinutes(f.placeId, s.placeId))) : 0 }))
      .sort((a, b) => a.near - b.near)
      .slice(0, 3)
      .map((p) => p.s);
    let best: { reviewed: Reviewed; total: number } | null = null;
    for (const partner of [null, ...partners]) {
      if (builds >= MOVE_MAX_BUILDS) break;
      const newFrom = [...fromRest, ...(partner ? [partner] : [])];
      const newTo = [...to.stops.filter((s) => s !== partner), moving];
      if (newFrom.length < 2 || newTo.length < 2) continue;
      const fromDay = { ...from, stops: newFrom };
      const toDay = { ...to, stops: newTo };
      const orderFrom = clockOrderProposals(fromDay, context, onClock, newFrom.map((s) => s.placeId), -Infinity, 1)[0];
      const orderTo = clockOrderProposals(toDay, context, onClock, newTo.map((s) => s.placeId), -Infinity, 1)[0];
      if (!orderFrom || !orderTo) continue;
      const changes = new Map([[cand.from, reorder(fromDay, orderFrom)], [cand.to, reorder(toDay, orderTo)]]);
      const trial = withDayStops(plan, changes);
      const data = build(trial.plan, trial.legsByDay);
      builds++;
      const judged = judgeAll(data);
      const total = [...judged.values()].reduce((s, j) => s + j.q.cost, 0);
      const refusals = [...judged].flatMap(([n, j]) =>
        (n === cand.from || n === cand.to ? changedDayRefusals(rules, base.get(n)!, j) : unchangedDayRefusals(rules, base.get(n)!, j, judged, 0)).map((r) => `day ${n}: ${r}`)
      );
      const share = tripShareRefusal(rules, base, judged);
      if (share) refusals.push(share);
      if (baseTotal - total < ORDER_MIN_GAIN) refusals.push(`trip gain ${baseTotal - total} (less than ${ORDER_MIN_GAIN})`);
      rules.report?.({ stage: "move", decision: refusals.length ? "rejected" : "accepted", reasons: refusals, detail: { place: cand.placeId, from: cand.from, to: cand.to, partner: partner?.placeId ?? null, days: Object.fromEntries([...judged].map(([n, j]) => [n, { before: brief(base.get(n)!), after: brief(j) }])) } });
      if (refusals.length === 0 && (!best || total < best.total)) best = { reviewed: { ...trial, data }, total };
    }
    if (best) current = best.reviewed;
    if (builds >= MOVE_MAX_BUILDS) break;
  }
  return current;
}

// ── Areas by date (round 3, TEST-ONLY switch `datedAreas`) ───────────────────────────────────────────────────
const AREA_MAX_DAYS = 4;
const AREA_MAX_ASSIGNMENTS = 6;
const AREA_MAX_BUILT = 3;
/** Round 5: single swaps of one place between two days, tried on the clock for the best AREA_SWAP_ASSIGNMENTS assignments only. */
const AREA_SWAP_ASSIGNMENTS = 2;
const AREA_MAX_SWAPS = 150;
const AREA_STRONG_RELEVANCE = 7;
const AREA_DAY_TRAVEL_CEILING = 90;
const AREA_DAY_VISITS_CEILING = 380;
const AREA_TRIP_SHARE_POINTS = 2;
const AREA_TRIP_IDLE_MORE_AT_MOST = 30;

/**
 * Places dropped only because of the date their area landed on: the same request without dates (one extra generation, made by the
 * pipeline, never recursive) is a SOURCE of candidates, not a replacement. The current dated plan stays a candidate. Each assignment of
 * the undated plan's day groups to the trip's dates (at most AREA_MAX_ASSIGNMENTS, best AREA_MAX_BUILT on the clock built) keeps every
 * place of the current plan (a timetabled or dated place stays, on a day where it is open) and adds back the strong places (relevance
 * >= 7) that the current plan lacks, each on a date where it is open. Each built candidate gets stage 1 (orders). It replaces the current
 * plan only when, against the current plan's final schedule: no schedule problem; every current place kept; on every date no restaurant
 * lunch lost, travel within 90 min or not above that date's current travel, no new wait of 60+ min, visits within 380 min; trip travel
 * share at most +2 points; trip idle at most +30 min. Otherwise the current plan stays and the reasons are reported.
 * Round 5: the best AREA_SWAP_ASSIGNMENTS assignments also get every single swap of one place between two days (both open on their
 * new date, no evening place, at most AREA_MAX_SWAPS), all ranked on the CLOCK (each day's best order, memoized; no build); only the
 * AREA_MAX_BUILT best are built. Among accepted candidates the one with the least idle + known travel wins. Still a test-only switch.
 */
function reviewDatedAreas(currentFinal: Reviewed, input: ReviewInput, rules: ReviewRules, lunchAfterLastStop: boolean): Reviewed {
  const { context, build, undatedPlan, relevance } = input;
  const report = (decision: ReviewReportEntry["decision"], reasons: string[], detail?: Record<string, unknown>) => rules.report?.({ stage: "areas", decision, reasons, detail });
  if (!undatedPlan || !relevance || context.weekdayForDayNumber?.(1) == null) return currentFinal;
  if (input.accommodationAnchored) { report("skipped", ["day 1 follows the accommodation"]); return currentFinal; }
  const dayNumbers = currentFinal.plan.days.map((d) => d.dayNumber);
  if (dayNumbers.length > AREA_MAX_DAYS || undatedPlan.days.length !== dayNumbers.length) { report("skipped", [`${dayNumbers.length} days (areas by date: ${AREA_MAX_DAYS} at most)`]); return currentFinal; }
  const currentStops = new Map(currentFinal.plan.days.flatMap((d) => d.stops.map((s) => [s.placeId, s] as const)));
  const undatedStops = new Map(undatedPlan.days.flatMap((d) => d.stops.map((s) => [s.placeId, s] as const)));
  const restored = [...undatedStops.keys()].filter((id) => !currentStops.has(id) && relevance(id) >= AREA_STRONG_RELEVANCE);
  if (restored.length === 0) { report("skipped", ["no strong place missing from the dated plan"]); return currentFinal; }
  const open = (placeId: string, dayNumber: number) => (!context.isPlaceEligibleForDay || context.isPlaceEligibleForDay(placeId, dayNumber)) && openingOnDay(context, placeId, dayNumber) !== null;
  const nearest = (placeId: string, days: Map<number, string[]>, allowed: (n: number) => boolean) =>
    [...days.entries()].filter(([n]) => allowed(n) && open(placeId, n)).map(([n, ids]) => ({ n, near: ids.length ? Math.min(...ids.map((id) => legMidMinutes(id, placeId))) : 60 })).sort((a, b) => a.near - b.near || a.n - b.n)[0]?.n;
  const onClock = budapestDayOnClock(context, lunchAfterLastStop);
  const wanted = new Set([...currentStops.keys(), ...restored]);
  type Candidate = { days: Map<number, string[]>; moved: string[]; dropped: string[]; clock: number; label: string };
  const candidates: Candidate[] = [];
  // Each day's best order on the clock (every order, evening places last), memoized per date and set of places.
  const dayMemo = new Map<string, { order: string[]; cost: number } | string>();
  const bestDayOnClock = (n: number, ids: string[]): { order: string[]; cost: number } | string => {
    const key = `${n}|${[...ids].sort().join(",")}`;
    const hit = dayMemo.get(key);
    if (hit !== undefined) return hit;
    let result: { order: string[]; cost: number } | string;
    const day = currentFinal.plan.days.find((d) => d.dayNumber === n)!;
    const stops = ids.map((id) => currentStops.get(id) ?? undatedStops.get(id)!);
    const evening = ids.filter((id) => isEveningPlace(id));
    if (ids.length < 2 || ids.length - evening.length > 6) result = `day ${n}: ${ids.length} places`;
    else {
      const outside = new Set(stops.filter((st) => st.visitMode === "outside").map((st) => st.placeId));
      const month = context.monthForDayNumber?.(n) ?? null;
      const asListed = [...ids.filter((id) => !isEveningPlace(id)), ...evening];
      const options = [asListed, ...clockOrderProposals({ ...day, stops }, context, onClock, asListed, -Infinity, 1, Infinity)]
        .map((order) => ({ order, clock: onClock(order, n, outside) }))
        .filter((o) => o.clock.failing.length === 0)
        .map((o) => ({ order: o.order, cost: dayClockQuality(o.clock, month).cost }))
        .sort((x, y) => x.cost - y.cost);
      result = options.length ? options[0] : `day ${n}: no order fits the hours on the clock`;
    }
    dayMemo.set(key, result);
    return result;
  };
  const scoreOnClock = (days: Map<number, string[]>): { days: Map<number, string[]>; clock: number } | string => {
    const ordered = new Map<number, string[]>();
    let clock = 0;
    for (const [n, ids] of days) {
      const r = bestDayOnClock(n, ids);
      if (typeof r === "string") return r;
      ordered.set(n, r.order);
      clock += r.cost;
    }
    return { days: ordered, clock };
  };
  // LIMIT (documented, round 4): permutations come in lexicographic order, so for a 4-day trip the first 6 all keep the undated plan's
  // FIRST day group on day 1 (only days 2-4 are permuted). The search is bounded, not exhaustive: a rejection proves nothing about
  // better distributions.
  for (const assignment of permutations(undatedPlan.days.map((_, i) => i)).slice(0, AREA_MAX_ASSIGNMENTS)) {
    const days = new Map<number, string[]>(dayNumbers.map((n, i) => [n, undatedPlan.days[assignment[i]].stops.map((s) => s.placeId).filter((id) => wanted.has(id))]));
    const moved: string[] = [];
    const dropped: string[] = [];
    let invalid: string | null = null;
    // A place closed on its date: to the nearest open date of the trip; a current place that cannot move makes the assignment invalid.
    for (const [n, ids] of [...days.entries()]) for (const id of [...ids]) {
      if (open(id, n)) continue;
      days.set(n, days.get(n)!.filter((x) => x !== id));
      const to = nearest(id, days, (m) => m !== n);
      if (to !== undefined) { days.get(to)!.push(id); moved.push(`${id} -> day ${to}`); }
      else if (currentStops.has(id)) invalid = `${id} open on no date of the trip`;
      else dropped.push(id);
    }
    // Current places the undated plan does not have (a timetabled or dated place, e.g. the cruise): on the nearest date where open.
    for (const id of currentStops.keys()) {
      if ([...days.values()].some((ids) => ids.includes(id))) continue;
      const to = nearest(id, days, () => true);
      if (to === undefined) { invalid = `${id} open on no date of the trip`; break; }
      days.get(to)!.push(id);
    }
    const label = dayNumbers.map((n) => `day ${n}: ${days.get(n)!.join(", ")}`).join(" | ");
    if (invalid) { report("rejected", [invalid], { assignment: label }); continue; }
    const scored = scoreOnClock(days);
    if (typeof scored === "string") { report("rejected", [scored], { assignment: label }); continue; }
    candidates.push({ days: scored.days, moved, dropped, clock: scored.clock, label });
  }
  // Round 5: one general swap between two days (one place each way, both open on their new date, no evening place), on the clock only,
  // for the best AREA_SWAP_ASSIGNMENTS assignments; at most AREA_MAX_SWAPS swaps. Only the AREA_MAX_BUILT best of everything are built.
  let swapsTried = 0;
  let swapLimitHit = false;
  for (const base of [...candidates].sort((x, y) => x.clock - y.clock).slice(0, AREA_SWAP_ASSIGNMENTS)) {
    const nums = [...base.days.keys()];
    for (let i = 0; i < nums.length && !swapLimitHit; i++) for (let j = i + 1; j < nums.length && !swapLimitHit; j++) {
      for (const x of base.days.get(nums[i])!) for (const y of base.days.get(nums[j])!) {
        if (isEveningPlace(x) || isEveningPlace(y) || !open(x, nums[j]) || !open(y, nums[i])) continue;
        if (swapsTried >= AREA_MAX_SWAPS) { swapLimitHit = true; break; }
        swapsTried++;
        const days = new Map(base.days);
        days.set(nums[i], base.days.get(nums[i])!.map((id) => (id === x ? y : id)));
        days.set(nums[j], base.days.get(nums[j])!.map((id) => (id === y ? x : id)));
        const scored = scoreOnClock(days);
        if (typeof scored === "string") continue;
        candidates.push({ days: scored.days, moved: [...base.moved, `swap ${x} <-> ${y}`], dropped: base.dropped, clock: scored.clock, label: nums.map((n) => `day ${n}: ${scored.days.get(n)!.join(", ")}`).join(" | ") });
      }
      if (swapLimitHit) break;
    }
  }
  report("skipped", [`search: ${candidates.length} candidates on the clock (${swapsTried} swaps${swapLimitHit ? ", swap limit reached" : ""}), ${Math.min(AREA_MAX_BUILT, candidates.length)} built`]);
  candidates.sort((a, b) => a.clock - b.clock);
  if (candidates.length > AREA_MAX_BUILT) report("skipped", [`not built: ${candidates.length - AREA_MAX_BUILT} candidates (the ${AREA_MAX_BUILT} best on the clock were built)`], { nextOnTheClock: candidates.slice(AREA_MAX_BUILT, AREA_MAX_BUILT + 3).map((c) => ({ assignment: c.label, clock: c.clock })) });
  const baseJudged = judgeAll(currentFinal.data);
  const baseIdle = [...baseJudged.values()].reduce((s, j) => s + j.q.idle, 0);
  let best: { reviewed: Reviewed; cost: number } | null = null;
  for (const cand of candidates.slice(0, AREA_MAX_BUILT)) {
    const changes = new Map([...cand.days].map(([n, ids]) => [n, ids.map((id) => currentStops.get(id) ?? undatedStops.get(id)!)]));
    const trial = withDayStops(currentFinal.plan, changes);
    const built: Reviewed = { ...trial, data: build(trial.plan, trial.legsByDay) };
    const reviewed = reviewDayOrders(built, context, build, lunchAfterLastStop, new Set<number>(), rules);
    const judged = judgeAll(reviewed.data);
    const reasons: string[] = [];
    const ids = new Set(reviewed.plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
    for (const id of currentStops.keys()) if (!ids.has(id)) reasons.push(`current place lost: ${id}`);
    const back = restored.filter((id) => ids.has(id));
    if (back.length === 0) reasons.push("no place restored");
    for (const [n, j] of judged) {
      const b = baseJudged.get(n)!;
      if (j.problems > 0) reasons.push(`day ${n}: schedule problem`);
      if (losesRestaurant(b, j)) reasons.push(`day ${n}: restaurant lunch lost (${b.q.lunch} -> lunch break)`);
      if (j.q.travel > AREA_DAY_TRAVEL_CEILING && j.q.travel > b.q.travel) reasons.push(`day ${n}: travel ${j.q.travel} (above ${AREA_DAY_TRAVEL_CEILING} and above ${b.q.travel} now)`);
      if (j.q.longestWait >= LOST_TIME_MINUTES && j.q.longestWait > b.q.longestWait) reasons.push(`day ${n}: new wait of ${j.q.longestWait} min`);
      if (j.q.visits > AREA_DAY_VISITS_CEILING && j.q.visits > b.q.visits) reasons.push(`day ${n}: ${j.q.visits} min of visits (above ${AREA_DAY_VISITS_CEILING})`);
    }
    const shareBefore = tripShare(baseJudged);
    const shareAfter = tripShare(judged);
    if (shareAfter - shareBefore > AREA_TRIP_SHARE_POINTS) reasons.push(`trip travel share ${shareBefore.toFixed(1)}% -> ${shareAfter.toFixed(1)}%`);
    const idle = [...judged.values()].reduce((s, j) => s + j.q.idle, 0);
    if (idle > baseIdle + AREA_TRIP_IDLE_MORE_AT_MOST) reasons.push(`trip idle ${baseIdle} -> ${idle}`);
    // Among accepted candidates: the least time NOT spent visiting (idle + known travel), equal weight for waiting and moving.
    const cost = [...judged.values()].reduce((s, j) => s + j.q.idle + j.q.travel, 0);
    report(reasons.length ? "rejected" : "accepted", reasons, {
      assignment: cand.label, moved: cand.moved, dropped: cand.dropped, restored: back,
      days: Object.fromEntries([...judged].map(([n, j]) => [n, { before: { ...brief(baseJudged.get(n)!), visits: baseJudged.get(n)!.q.visits }, after: { ...brief(j), visits: j.q.visits } }])),
      trip: { shareBefore: +shareBefore.toFixed(1), shareAfter: +shareAfter.toFixed(1), idleBefore: baseIdle, idleAfter: idle, travelBefore: [...baseJudged.values()].reduce((s, j) => s + j.q.travel, 0), travelAfter: [...judged.values()].reduce((s, j) => s + j.q.travel, 0), idlePlusTravel: cost },
    });
    if (reasons.length === 0 && (!best || cost < best.cost)) best = { reviewed, cost };
  }
  if (!best) report("kept", ["the current dated plan stays"]);
  return best ? best.reviewed : currentFinal;
}

type ReviewInput = Parameters<NonNullable<CityPlannerModule["reviewResolvedPlan"]>>[0];
/** Budapest's review on the final schedule (CityPlannerModule.reviewResolvedPlan): stage 1 orders, then stage 2 moves between days. */
export function budapestReviewResolvedPlan(input: ReviewInput, options: BudapestQualityOptions = BUDAPEST_QUALITY_DEFAULTS): Reviewed {
  const travel = options.travelRule ?? "A";
  const meals = options.mealCheck ?? "tolerance";
  // Pass 1 is always rule A (+15). B / C only EXTEND it: a second pass on the days that still have lost time, with the larger allowance
  // (and the trip travel share), so they can never accept less than A. Bounded: pass 1 at most 6 + 12 rebuilds, pass 2 the same again.
  // Under a cumulative rule (B1), pass 1 is A counted against the same fixed baseline (A1).
  const baseline = judgeAll(input.data);
  const rulesA: ReviewRules = TRAVEL_RULES[travel].cumulative ? { travel: "A1", meals, report: options.report, baseline } : { travel: "A", meals, report: options.report };
  const rulesX: ReviewRules = { travel, meals, report: options.report && ((e) => options.report!({ ...e, reasons: e.reasons, detail: { ...e.detail, pass: `extension ${travel}` } })), baseline };
  const locked = new Set<number>(input.accommodationAnchored ? [1] : []);
  let reviewed: Reviewed = { plan: input.plan, legsByDay: input.legsByDay, data: input.data };
  if (options.clockOrder) reviewed = reviewDayOrders(reviewed, input.context, input.build, options.lunchAfterLastStop, locked, rulesA);
  if (options.crossDay) {
    reviewed = reviewDayMoves(reviewed, input.context, input.build, options.lunchAfterLastStop, locked, rulesA);
  }
  if (travel !== "A") {
    if (options.clockOrder) reviewed = reviewDayOrders(reviewed, input.context, input.build, options.lunchAfterLastStop, locked, rulesX, true);
    if (options.crossDay) reviewed = reviewDayMoves(reviewed, input.context, input.build, options.lunchAfterLastStop, locked, rulesX);
  }
  const rules = rulesX;
  if (options.datedAreas) reviewed = reviewDatedAreas(reviewed, input, rules, options.lunchAfterLastStop);
  return reviewed;
}

/** Budapest's geography repair, day balance, evening order and cruise suggestion (day order and moves: budapestReviewResolvedPlan). */
export function budapestRepairDayGeography(context: DayGeographyRepairContext, options: BudapestQualityOptions = BUDAPEST_QUALITY_DEFAULTS): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const repaired = repairCityDayGeography(context, { compatibility: BUDAPEST_CLUSTER_COMPATIBILITY, connectors: BUDAPEST_CONNECTORS, metadataById: getBudapestPlannerMetadataById, travelMinutes });
  const balanced = balanceCityDays(
    { ...context, plan: repaired.plan, legsByDay: repaired.legsByDay },
    {
      compatibility: BUDAPEST_CLUSTER_COMPATIBILITY,
      connectors: BUDAPEST_CONNECTORS,
      metadataById: getBudapestPlannerMetadataById,
      travelMinutes,
      protectedPlaceIds: BALANCE_PROTECTED,
      gatedPlaceIds: new Set<string>(),
      outsideMinutes: (placeId) => OUTSIDE_STOP_MINUTES[placeId],
      heavyMinutes: 380,
      tryInDay: budapestTryInDay(context, options.lunchAfterLastStop),
      unmetGoalSuggestions: { maxMinutes: NEARBY_SHOPPING_MAX_MINUTES },
      lightMinutes: 170,
      minPriorityToAdd: 5,
      keepInsideRelevance: 9,
      regroup: { splitPenalty: 45, lightWeight: 6, emptyPenalty: 300, comfortStops: 5, crowdPenalty: 25, maxStops: 6, hopPenalty: 60, restoreBonus: 20 },
      walkByStop: { isFreeShort: (placeId) => budapestTicketEstimate(placeId) === 0 && (getBudapestPlannerMetadataById(placeId)?.visitDurationMinutes ?? 999) <= 45, minRelevance: 3 },
      freeTimeIdeas: { minRelevance: 3, nearFree: { minRelevance: 2, maxMinutes: 15 } },
    }
  );
  // Flexible dates: the cruise departure depends on the period (2026 timetable), so it is a suggestion there, never a guessed time.
  return withCruiseSuggestion(eveningLast(balanced, context.weekdayForDayNumber?.(1) == null), context);
}

function budapestMealRules(options: BudapestQualityOptions): CityPlannerModule["mealStops"] {
  return {
    clusterForFoodPlace: (place: FoodPlace) => FOOD_PLACE_CLUSTER[place.id] ?? null,
    // No breakfast place with verified hours yet: no breakfast suggestion.
    breakfastCategories: [],
    lunchCategories: ["local", "restaurants"],
    lunchByClock: true,
    ...(options.cafeLunch ? { lunchFallbackCategories: ["cafes"] } : {}),
    ...(options.lunchAfterLastStop ? { lunchAfterLastStop: true } : {}),
    coffeeBreakCategories: ["cafes"],
    flexibleMeals: { dinnerEarliest: 18 * 60 },
    eveningSpecialCategory: null,
    dinnerCategories: ["local", "restaurants"],
  };
}

function eveningLast(result: { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] }, flexibleDates: boolean): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const isEvening = (placeId: string) => getBudapestPlannerMetadataById(placeId)?.preferredTime === "evening";
  let changed = false;
  const days = result.plan.days.map((day) => {
    const evening = day.stops.filter((stop) => isEvening(stop.placeId));
    if (evening.length > 0 && flexibleDates && day.stops.length > evening.length) {
      changed = true;
      return { ...day, stops: day.stops.filter((stop) => !isEvening(stop.placeId)), optionalPlaceIds: [...(day.optionalPlaceIds ?? []), ...evening.map((stop) => stop.placeId)] };
    }
    if (evening.length === 0 || day.stops.slice(-evening.length).every((stop) => isEvening(stop.placeId))) return day;
    changed = true;
    return { ...day, stops: [...day.stops.filter((stop) => !isEvening(stop.placeId)), ...evening] };
  });
  if (!changed) return result;
  return { plan: { ...result.plan, days }, legsByDay: days.map((day) => day.stops.slice(0, -1).map((stop, i) => budapestLeg(stop.placeId, day.stops[i + 1].placeId))) };
}

const SHOPPING_COVERAGE_CANDIDATES = ["great-market-hall", "vaci-utca", "andrassy-avenue", "gozsdu-udvar", "arena-mall"];

function shoppingCoverage(interests: readonly V2PlannerInterest[], days: number) {
  if (!interests.includes("shopping")) return [];
  return [{ candidates: SHOPPING_COVERAGE_CANDIDATES, minCoverage: days <= 2 ? 1 : days <= 4 ? 2 : 3, onlyInLinkedDay: true }];
}

export const BUDAPEST_CITY_MODULE: CityPlannerModule = {
  id: "budapest",
  nameAr: "بودابست",
  nameEn: "Budapest",
  places: BUDAPEST_PLACES,
  destinationConfig: DESTINATION_CONFIG,
  metadataById: getBudapestPlannerMetadataById,
  clusterCentroids: CLUSTER_CENTROIDS,
  accommodation: {
    center: { lat: 47.5007189, lng: 19.0533363 }, // St. Stephen's Basilica entrance (OSM)
    genericWords: new Set(["hotel", "hotels", "apartment", "apartments", "budapest", "hungary", "the", "spa", "residence", "szálloda", "panzió"]),
    isWithinBounds: (point) => point.lat >= BOUNDS.minLat && point.lat <= BOUNDS.maxLat && point.lng >= BOUNDS.minLng && point.lng <= BOUNDS.maxLng,
    nearestCluster,
    keywordCluster: (text) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      return KEYWORD_CLUSTERS.find(({ patterns }) => patterns.some((pattern) => pattern.test(trimmed)))?.cluster ?? null;
    },
  },
  supportedInterests: V2_PLANNER_INTERESTS,
  experiencesGatedPlaceIds: new Set<string>(),
  flagshipCoverageGoals: flagshipGoals,
  placeSelectionBonus,
  secondaryCoverageGoals: shoppingCoverage,
  routeLeg: budapestLeg,
  resolveHoursPerTrip: true,
  resolveHoursPerDay: true,
  tripHoursForAddedPlaces: true,
  datedOnlyPlaceIds: [CRUISE_ID],
  timingGuard: true,
  buildDayRouteLegs: (day) => day.stops.slice(0, -1).map((stop, i) => budapestLeg(stop.placeId, day.stops[i + 1].placeId)),
  operationalWarnings: warningsFor,
  mealStops: budapestMealRules(BUDAPEST_QUALITY_DEFAULTS),
  compositionProtectedPlaceIds: [...FLAGSHIP_MUST_SEE, ...FLAGSHIP_TIER_B_IDS],
  repairDayGeography: (context) => budapestRepairDayGeography(context),
  reviewResolvedPlan: (input) => budapestReviewResolvedPlan(input),

  mealLegsInTimeline: true,
  ticketEstimate: { currency: "HUF", forPlace: budapestTicketEstimate },
  metadataForInterests: budapestPlannerMetadataForInterests,
  placeRelevance: budapestPlaceRelevance,
  relevanceThreshold: 5,
  relevanceThresholdFor: ({ days, relevance }) => {
    const minutesAt = (level: number) => BUDAPEST_PLANNER_METADATA.filter((m) => m.placeId !== "danube-legend-cruise" && relevance(m.placeId) >= level).reduce((sum, m) => sum + m.visitDurationMinutes, 0);
    for (const level of [5, 4]) if (minutesAt(level) >= days * 210) return level;
    return 3;
  },
  outsideVisit: (placeId) => (OUTSIDE_STOP_MINUTES[placeId] ? { visitDurationMinutes: OUTSIDE_STOP_MINUTES[placeId] } : undefined),
  capacityWarning: (daysGenerated) => `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لبودابست.`,
};

/** TEST-ONLY: the Budapest module with some round-1 switches off, to measure each change alone (review tools; never registered). */
export function budapestModuleWith(options: BudapestQualityOptions): CityPlannerModule {
  return {
    ...BUDAPEST_CITY_MODULE,
    mealStops: budapestMealRules(options),
    repairDayGeography: (context) => budapestRepairDayGeography(context, options),
    reviewResolvedPlan: (input) => budapestReviewResolvedPlan(input, options),
    ...(options.datedAreas ? { undatedCandidates: true } : {}),
  };
}
