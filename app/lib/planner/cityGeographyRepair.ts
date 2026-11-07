import { classifyDayDensity } from "./barcelonaV2Density";
import { optimizeDayRoute } from "./plannerRouteOptimizer";
import type { ClusterCompatibilityMap, GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { DayGeographyRepairContext } from "./cityPlannerModule";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerPlaceMetadata } from "./plannerTypes";

/**
 * Day-geography repair for cities that opt in through `CityPlannerModule.repairDayGeography` (Prague, and new cities built on
 * the same structure). Barcelona does not use it.
 *
 * Why: the shared day passes accept a new area in a day when it is linked to ANY area already there, so after later moves a
 * day can pair two areas that are not neighbours (Prague audit: Kampa -> Vyšehrad, Petřín Tower -> Old Town Square). This
 * pass, run once after those passes:
 *  1. swaps one stop between two days (or moves one stop) when that makes the broken day fully linked without breaking the
 *     other day -- same set of places for the trip, so interest coverage, must-sees and whole-trip caps are untouched;
 *     every change respects the engine's own day limits (420 min, 6 stops, 3 areas), never makes a day thinner, and on a
 *     dated plan never puts a place on a day it is closed;
 *  2. inside a run of stops of the same area entered from another area, reverses the order when the run is entered from its
 *     far end (e.g. arriving from the castle side, Charles Bridge before Old Town Square), using the city's own travel-time
 *     estimate -- never moving a morning place later or an afternoon / evening / sunset place earlier.
 * A "connector" place (Charles Bridge) counts as part of every area it physically joins.
 */

export type GeographyRepairOptions = {
  compatibility: ClusterCompatibilityMap;
  /** Place id -> the areas it physically joins (a bridge between two districts). */
  connectors?: Record<string, readonly string[]>;
  metadataById: (placeId: string) => PlannerPlaceMetadata | undefined;
  /** Estimated travel minutes between two places (null = unknown). */
  travelMinutes: (fromPlaceId: string, toPlaceId: string) => number | null;
};

const MAX_DAY_MINUTES = 420;
const MAX_DAY_STOPS = 6;
const MAX_DAY_CLUSTERS = 3;
/** A within-area reversal must save at least this many estimated minutes (avoids churn on near-ties). */
const MIN_REVERSAL_SAVING = 3;
const MAX_ROUNDS = 8;
/** Time-of-day preferences: a reversal may move an EARLY place earlier and a LATE place later, never the other way round. */
const EARLY_TIMES = new Set(["morning", "morning/daytime", "morning/afternoon"]);
const LATE_TIMES = new Set(["afternoon", "evening", "sunset", "daytime/evening", "daytime/sunset"]);

const DENSITY_RANK = { veryThin: 0, thin: 1, healthy: 2 } as const;

export function repairCityDayGeography(context: DayGeographyRepairContext, options: GeographyRepairOptions): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const { plan, legsByDay, config, isPlaceEligibleForDay } = context;
  const metadataList = config.plannerMetadata;
  const routeConfig = config.routeOptimizationConfig;
  if (!routeConfig || !config.buildPlanRouteLegs) return { plan, legsByDay };

  const clusterOf = (placeId: string) => options.metadataById(placeId)?.cluster ?? "";
  const areasOf = (placeId: string): readonly string[] => options.connectors?.[placeId] ?? [clusterOf(placeId)];
  const linked = (a: string, b: string) => {
    const areasA = areasOf(a);
    const areasB = areasOf(b);
    return areasA.some((x) => areasB.some((y) => x === y || !!options.compatibility[x]?.[y]));
  };
  const badHops = (ids: readonly string[]) => {
    let bad = 0;
    for (let i = 0; i < ids.length - 1; i++) if (!linked(ids[i], ids[i + 1])) bad++;
    return bad;
  };
  const minutesOf = (ids: readonly string[]) => ids.reduce((sum, id) => sum + (options.metadataById(id)?.visitDurationMinutes ?? 0), 0);
  const clustersOf = (ids: readonly string[]) => [...new Set(ids.map(clusterOf))];
  const travelOf = (ids: readonly string[]) => {
    let total = 0;
    for (let i = 0; i < ids.length - 1; i++) total += options.travelMinutes(ids[i], ids[i + 1]) ?? 30;
    return total;
  };

  const scoreById = new Map<string, number>();
  plan.days.forEach((day) => day.stops.forEach((stop) => scoreById.set(stop.placeId, stop.score)));

  const build = (dayNumber: number, ids: string[]): PlannerDay =>
    optimizeDayRoute({ dayNumber, stops: ids.map((placeId) => ({ placeId, score: scoreById.get(placeId) ?? 0 })), totalVisitMinutes: minutesOf(ids), clusters: clustersOf(ids) }, metadataList, routeConfig);
  const idsOf = (day: PlannerDay) => day.stops.map((stop) => stop.placeId);
  const densityRank = (ids: readonly string[]) => DENSITY_RANK[classifyDayDensity(ids.length, minutesOf(ids))];
  const fits = (dayNumber: number, ids: readonly string[]) =>
    ids.length > 0 &&
    ids.length <= MAX_DAY_STOPS &&
    minutesOf(ids) <= MAX_DAY_MINUTES &&
    clustersOf(ids).length <= MAX_DAY_CLUSTERS &&
    (!isPlaceEligibleForDay || ids.every((id) => isPlaceEligibleForDay(id, dayNumber)));

  let days = [...plan.days];
  let changed = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const brokenIndex = days.findIndex((day) => badHops(idsOf(day)) > 0);
    if (brokenIndex === -1) break;
    const broken = days[brokenIndex];
    const brokenIds = idsOf(broken);

    let best: { i: number; j: number; dayI: PlannerDay; dayJ: PlannerDay; cost: number } | null = null;
    const consider = (j: number, newI: string[], newJ: string[]) => {
      const other = days[j];
      if (!fits(broken.dayNumber, newI) || !fits(other.dayNumber, newJ)) return;
      if (densityRank(newI) < densityRank(brokenIds) || densityRank(newJ) < densityRank(idsOf(other))) return;
      const dayI = build(broken.dayNumber, newI);
      const dayJ = build(other.dayNumber, newJ);
      if (badHops(idsOf(dayI)) > 0 || badHops(idsOf(dayJ)) > badHops(idsOf(other))) return;
      const cost = travelOf(idsOf(dayI)) + travelOf(idsOf(dayJ)) + Math.abs(minutesOf(newI) - minutesOf(brokenIds)) / 10;
      if (!best || cost < best.cost) best = { i: brokenIndex, j, dayI, dayJ, cost };
    };

    for (let j = 0; j < days.length; j++) {
      if (j === brokenIndex) continue;
      const otherIds = idsOf(days[j]);
      for (const s of brokenIds) {
        // move s to the other day
        consider(j, brokenIds.filter((id) => id !== s), [...otherIds, s]);
        // swap s with t
        for (const t of otherIds) consider(j, [...brokenIds.filter((id) => id !== s), t], [...otherIds.filter((id) => id !== t), s]);
      }
    }
    if (!best) break;
    const chosen: { i: number; j: number; dayI: PlannerDay; dayJ: PlannerDay } = best;
    days = days.map((day, index) => (index === chosen.i ? chosen.dayI : index === chosen.j ? chosen.dayJ : day));
    changed = true;
  }

  // Within-area direction: reverse a same-area run when entering it from the other end is clearly shorter.
  days = days.map((day) => {
    const ids = idsOf(day);
    let current = ids;
    let start = 0;
    while (start < current.length) {
      let end = start;
      while (end + 1 < current.length && clusterOf(current[end + 1]) === clusterOf(current[start])) end++;
      // Only a run entered from another area.
      if (start > 0 && end > start) {
        const reversed = [...current.slice(0, start), ...current.slice(start, end + 1).reverse(), ...current.slice(end + 1)];
        const respectsTimes = current.slice(start, end + 1).every((id) => {
          const time = options.metadataById(id)?.preferredTime ?? "";
          const before = current.indexOf(id);
          const after = reversed.indexOf(id);
          return EARLY_TIMES.has(time) ? after <= before : LATE_TIMES.has(time) ? after >= before : true;
        });
        if (respectsTimes && travelOf(reversed) + MIN_REVERSAL_SAVING <= travelOf(current) && badHops(reversed) <= badHops(current)) current = reversed;
      }
      start = end + 1;
    }
    if (current === ids) return day;
    changed = true;
    const byId = new Map(day.stops.map((stop) => [stop.placeId, stop]));
    return { ...day, stops: current.map((id) => byId.get(id)!) };
  });

  if (!changed) return { plan, legsByDay };
  const repaired: GeneratedPlannerPlan = { ...plan, days };
  return { plan: repaired, legsByDay: config.buildPlanRouteLegs(repaired) };
}
