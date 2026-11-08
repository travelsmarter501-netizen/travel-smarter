import type { DayGeographyRepairContext } from "./cityPlannerModule";
import type { ClusterCompatibilityMap, GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

/**
 * Day balance (cities that opt in; PROPOSAL, owner review): after the geography repair, judge every day by its total load =
 * visit minutes + travel minutes (a long visit weighs as much as several short stops), then
 *  1. a crowded day (load above `heavyMinutes`) gives its lowest-priority, non-flagship stop to the lightest day that lies in
 *     the same or a linked area, is open for it that day (dated plans) and stays under the limit after the move;
 *  2. a light day (load below `lightMinutes`) gets one unused place of its own or a linked area (highest planner priority,
 *     never one gated behind an interest), when one is open that day.
 * Stops are inserted where they add the least travel. Route legs are rebuilt. Nothing else changes.
 */
export type DayBalanceOptions = {
  compatibility: ClusterCompatibilityMap;
  connectors?: Record<string, readonly string[]>;
  metadataById: (placeId: string) => PlannerPlaceMetadata | undefined;
  travelMinutes: (fromPlaceId: string, toPlaceId: string) => number | null;
  protectedPlaceIds: ReadonlySet<string>;
  gatedPlaceIds: ReadonlySet<string>;
  heavyMinutes: number;
  lightMinutes: number;
  minPriorityToAdd: number;
};

export function balanceCityDays(context: DayGeographyRepairContext, options: DayBalanceOptions): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const { plan, legsByDay, config, isPlaceEligibleForDay } = context;
  if (!config.buildPlanRouteLegs || plan.days.length < 2) return { plan, legsByDay };
  const meta = options.metadataById;
  const clusterOf = (id: string) => meta(id)?.cluster ?? "";
  const areasOf = (id: string): readonly string[] => options.connectors?.[id] ?? [clusterOf(id)];
  const linked = (a: string, b: string) => areasOf(a).some((x) => areasOf(b).some((y) => x === y || options.compatibility[x]?.[y] === "strong" || options.compatibility[x]?.[y] === "medium"));
  const travel = (ids: readonly string[]) => ids.slice(0, -1).reduce((sum, id, i) => sum + (options.travelMinutes(id, ids[i + 1]) ?? 30), 0);
  const load = (ids: readonly string[]) => ids.reduce((sum, id) => sum + (meta(id)?.visitDurationMinutes ?? 0), 0) + travel(ids);
  const eligible = (id: string, dayNumber: number) => isPlaceEligibleForDay?.(id, dayNumber) ?? true;
  const insertCheapest = (ids: readonly string[], id: string): string[] => {
    let best: string[] = [...ids, id];
    let bestTravel = travel(best);
    for (let i = 0; i < ids.length; i++) {
      const trial = [...ids.slice(0, i), id, ...ids.slice(i)];
      const t = travel(trial);
      if (t < bestTravel) { best = trial; bestTravel = t; }
    }
    return best;
  };

  const days = plan.days.map((d) => ({ dayNumber: d.dayNumber, ids: d.stops.map((s) => s.placeId), scores: new Map(d.stops.map((s) => [s.placeId, s.score])) }));
  let changed = false;

  // 1. Crowded days give a stop away.
  for (let round = 0; round < plan.days.length * 2; round++) {
    const heavy = [...days].filter((d) => d.ids.length > 2 && load(d.ids) > options.heavyMinutes).sort((a, b) => load(b.ids) - load(a.ids))[0];
    if (!heavy) break;
    const movable = heavy.ids.filter((id) => !options.protectedPlaceIds.has(id)).sort((a, b) => (meta(a)?.priority ?? 0) - (meta(b)?.priority ?? 0) || (meta(b)?.visitDurationMinutes ?? 0) - (meta(a)?.visitDurationMinutes ?? 0));
    let moved = false;
    for (const id of movable) {
      const targets = days.filter((d) => d !== heavy && d.ids.length > 0 && eligible(id, d.dayNumber) && d.ids.some((x) => linked(x, id))).sort((a, b) => load(a.ids) - load(b.ids));
      for (const target of targets) {
        const next = insertCheapest(target.ids, id);
        if (load(next) > options.heavyMinutes || load(next) >= load(heavy.ids)) continue;
        target.ids = next;
        target.scores.set(id, heavy.scores.get(id) ?? 0);
        heavy.ids = heavy.ids.filter((x) => x !== id);
        moved = changed = true;
        break;
      }
      if (moved) break;
    }
    if (!moved) break;
  }

  // 2. Light days get one more nearby place.
  const used = new Set(days.flatMap((d) => d.ids));
  for (const day of days) {
    if (day.ids.length === 0 || load(day.ids) >= options.lightMinutes) continue;
    const candidates = config.plannerMetadata
      .filter((m) => !used.has(m.placeId) && !options.gatedPlaceIds.has(m.placeId) && m.priority >= options.minPriorityToAdd && eligible(m.placeId, day.dayNumber) && day.ids.some((x) => linked(x, m.placeId)))
      .sort((a, b) => b.priority - a.priority || a.placeId.localeCompare(b.placeId));
    for (const c of candidates) {
      const next = insertCheapest(day.ids, c.placeId);
      if (load(next) > options.heavyMinutes) continue;
      day.ids = next;
      day.scores.set(c.placeId, 0);
      used.add(c.placeId);
      changed = true;
      break;
    }
  }

  if (!changed) return { plan, legsByDay };
  const balanced: GeneratedPlannerPlan = {
    ...plan,
    days: plan.days.map((d, i): PlannerDay => {
      const ids = days[i].ids;
      return { ...d, stops: ids.map((id) => ({ placeId: id, score: days[i].scores.get(id) ?? 0 })), totalVisitMinutes: ids.reduce((s, id) => s + (meta(id)?.visitDurationMinutes ?? 0), 0), clusters: [...new Set(ids.map(clusterOf))] };
    }),
  };
  return { plan: balanced, legsByDay: config.buildPlanRouteLegs(balanced) };
}
