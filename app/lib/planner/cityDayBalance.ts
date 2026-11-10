import type { DayGeographyRepairContext } from "./cityPlannerModule";
import type { ClusterCompatibilityMap, GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

/**
 * Day balance (cities that opt in; PROPOSAL, owner review). Every day is judged by its load = visit minutes + travel minutes
 * (a long visit weighs as much as several short stops). Then:
 *  1. a crowded day (load above `heavyMinutes`) first turns its lowest-priority, non-flagship place that has a free outside
 *     (`outsideMinutes`) into an outside-only stop (short visit, outside access hours);
 *  2. a day that is still crowded gives its lowest-priority, non-flagship stop to the lightest day that lies in the same or a
 *     closely linked area, is open for it that day (dated plans) and stays under the limit after the move;
 *  3. when no day can take it, its lowest-priority, non-flagship stop becomes an optional suggestion of that day;
 *  4. a light day (load below `lightMinutes`) gets one unused place of its own or a closely linked area (highest planner
 *     priority, never one gated behind an interest), when one is open that day.
 * Stops are inserted where they add the least travel; route legs are rebuilt. Nothing else changes.
 */
export type DayBalanceOptions = {
  compatibility: ClusterCompatibilityMap;
  connectors?: Record<string, readonly string[]>;
  metadataById: (placeId: string) => PlannerPlaceMetadata | undefined;
  travelMinutes: (fromPlaceId: string, toPlaceId: string) => number | null;
  protectedPlaceIds: ReadonlySet<string>;
  gatedPlaceIds: ReadonlySet<string>;
  /** Minutes of the outside-only visit of a place, or undefined when the place has no useful free outside. */
  outsideMinutes?: (placeId: string) => number | undefined;
  heavyMinutes: number;
  lightMinutes: number;
  minPriorityToAdd: number;
  /** Optional: a place this strongly matching the request's interests (placeRelevance >= this) is never cut to an outside stop. */
  keepInsideRelevance?: number;
};

type WorkDay = { dayNumber: number; ids: string[]; scores: Map<string, number>; outside: Set<string>; optional: string[] };

export function balanceCityDays(context: DayGeographyRepairContext, options: DayBalanceOptions): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  const { plan, legsByDay, config, isPlaceEligibleForDay } = context;
  if (!config.buildPlanRouteLegs || plan.days.length === 0) return { plan, legsByDay };
  const meta = options.metadataById;
  const clusterOf = (id: string) => meta(id)?.cluster ?? "";
  const areasOf = (id: string): readonly string[] => options.connectors?.[id] ?? [clusterOf(id)];
  const close = (x: string, y: string) => x === y || options.compatibility[x]?.[y] === "strong" || options.compatibility[x]?.[y] === "medium";
  const linked = (a: string, b: string) => areasOf(a).some((x) => areasOf(b).some((y) => close(x, y)));
  const travel = (ids: readonly string[]) => ids.slice(0, -1).reduce((sum, id, i) => sum + (options.travelMinutes(id, ids[i + 1]) ?? 30), 0);
  const visit = (id: string, outside: ReadonlySet<string>) => (outside.has(id) ? options.outsideMinutes?.(id) : undefined) ?? meta(id)?.visitDurationMinutes ?? 0;
  const load = (ids: readonly string[], outside: ReadonlySet<string>) => ids.reduce((sum, id) => sum + visit(id, outside), 0) + travel(ids);
  const dayLoad = (d: WorkDay) => load(d.ids, d.outside);
  // A crowded day is judged with the scheduled lunch inside it (food plans); a light day by its sightseeing only.
  const mealMinutes = config.dayBuilderConfig.mealMinutesPerDay ?? 0;
  const heavyLoad = (ids: readonly string[], outside: ReadonlySet<string>) => load(ids, outside) + (ids.length > 1 ? mealMinutes : 0);
  const dayHeavyLoad = (d: WorkDay) => heavyLoad(d.ids, d.outside);
  const eligible = (id: string, dayNumber: number) => isPlaceEligibleForDay?.(id, dayNumber) ?? true;
  const priority = (id: string) => meta(id)?.priority ?? 0;
  const relevance = config.dayBuilderConfig.placeRelevance;
  const relevant = config.dayBuilderConfig.isPlaceRelevant;
  const wantedInside = (id: string) => !!relevance && options.keepInsideRelevance !== undefined && relevance(id) >= options.keepInsideRelevance;
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

  const days: WorkDay[] = plan.days.map((d) => ({
    dayNumber: d.dayNumber,
    ids: d.stops.map((s) => s.placeId),
    scores: new Map(d.stops.map((s) => [s.placeId, s.score])),
    outside: new Set(d.stops.filter((s) => s.visitMode === "outside").map((s) => s.placeId)),
    optional: [...(d.optionalPlaceIds ?? [])],
  }));
  let changed = false;

  for (let round = 0; round < plan.days.length * 3; round++) {
    const heavy = [...days].filter((d) => d.ids.length > 1 && dayHeavyLoad(d) > options.heavyMinutes).sort((a, b) => dayHeavyLoad(b) - dayHeavyLoad(a))[0];
    if (!heavy) break;
    // 1. An outside-only stop first: the place stays in the plan, only shorter.
    const toOutside = heavy.ids
      .filter((id) => !options.protectedPlaceIds.has(id) && !wantedInside(id) && !heavy.outside.has(id) && (options.outsideMinutes?.(id) ?? 0) > 0 && (options.outsideMinutes?.(id) ?? 0) < (meta(id)?.visitDurationMinutes ?? 0))
      .sort((a, b) => priority(a) - priority(b) || (meta(b)?.visitDurationMinutes ?? 0) - (meta(a)?.visitDurationMinutes ?? 0))[0];
    if (toOutside) {
      heavy.outside.add(toOutside);
      changed = true;
      continue;
    }
    // 2. Move a stop to a lighter, close day.
    const movable = heavy.ids.filter((id) => !options.protectedPlaceIds.has(id) && !heavy.outside.has(id)).sort((a, b) => priority(a) - priority(b) || (meta(b)?.visitDurationMinutes ?? 0) - (meta(a)?.visitDurationMinutes ?? 0));
    let moved = false;
    for (const id of movable) {
      const targets = days.filter((d) => d !== heavy && d.ids.length > 0 && eligible(id, d.dayNumber) && d.ids.some((x) => linked(x, id))).sort((a, b) => dayLoad(a) - dayLoad(b));
      for (const target of targets) {
        const next = insertCheapest(target.ids, id);
        const nextLoad = heavyLoad(next, target.outside);
        if (nextLoad > options.heavyMinutes || nextLoad >= dayHeavyLoad(heavy)) continue;
        target.ids = next;
        target.scores.set(id, heavy.scores.get(id) ?? 0);
        heavy.ids = heavy.ids.filter((x) => x !== id);
        moved = changed = true;
        break;
      }
      if (moved) break;
    }
    if (moved) continue;
    // 3. Nowhere to move it: the lowest-priority stop becomes an optional suggestion of the same day.
    const toOptional = heavy.ids.length > 3 ? movable[0] : undefined;
    if (!toOptional) break;
    heavy.ids = heavy.ids.filter((x) => x !== toOptional);
    heavy.optional.push(toOptional);
    changed = true;
  }

  // 4. Light days (only when there is more than one day) get one more nearby place.
  const used = new Set(days.flatMap((d) => [...d.ids, ...d.optional]));
  for (const day of plan.days.length > 1 ? days : []) {
    if (day.ids.length === 0 || dayLoad(day) >= options.lightMinutes) continue;
    const candidates = config.plannerMetadata
      .filter((m) => !used.has(m.placeId) && !options.gatedPlaceIds.has(m.placeId) && m.priority >= options.minPriorityToAdd && (!relevant || relevant(m.placeId)) && eligible(m.placeId, day.dayNumber) && day.ids.some((x) => linked(x, m.placeId)))
      .sort((a, b) => b.priority - a.priority || a.placeId.localeCompare(b.placeId));
    for (const c of candidates) {
      const next = insertCheapest(day.ids, c.placeId);
      if (heavyLoad(next, day.outside) > options.heavyMinutes) continue;
      day.ids = next;
      day.scores.set(c.placeId, 0);
      used.add(c.placeId);
      changed = true;
      break;
    }
  }

  // 5. A light day that is still light takes, from another day, an optional suggestion or a movable stop (that day keeping
  //    more than 3 stops and not becoming light itself) of a closely linked area, choosing the move that evens the two days
  //    most. Places only move between days; nothing new is added.
  for (const day of plan.days.length > 1 ? days : []) {
    if (day.ids.length === 0 || dayLoad(day) >= options.lightMinutes) continue;
    type Move = { from: WorkDay; id: string; asOptional: boolean; score: number };
    let best: Move | null = null;
    for (const from of days) {
      if (from === day) continue;
      const pool: { id: string; asOptional: boolean }[] = [
        ...from.optional.map((id) => ({ id, asOptional: true })),
        ...(from.ids.length > 3 ? from.ids.filter((id) => !options.protectedPlaceIds.has(id)).map((id) => ({ id, asOptional: false })) : []),
      ];
      for (const { id, asOptional } of pool) {
        // A one-stop day may also reach a weakly linked area (one short ride), so it does not stay a single 90-minute visit.
        const reachable = (x: string) => linked(x, id) || (day.ids.length === 1 && areasOf(x).some((a) => areasOf(id).some((b) => options.compatibility[a]?.[b] === "weak")));
        if (!eligible(id, day.dayNumber) || !day.ids.some(reachable) || (relevant && !relevant(id))) continue;
        const next = insertCheapest(day.ids, id);
        if (heavyLoad(next, day.outside) > options.heavyMinutes) continue;
        const rest = from.ids.filter((x) => x !== id);
        if (!asOptional && load(rest, from.outside) < options.lightMinutes) continue;
        const score = Math.abs(load(next, day.outside) - (asOptional ? dayLoad(from) : load(rest, from.outside)));
        if (!best || score < best.score) best = { from, id, asOptional, score };
      }
    }
    if (!best) continue;
    day.ids = insertCheapest(day.ids, best.id);
    day.scores.set(best.id, best.from.scores.get(best.id) ?? 0);
    if (best.asOptional) best.from.optional = best.from.optional.filter((x) => x !== best!.id);
    else best.from.ids = best.from.ids.filter((x) => x !== best!.id);
    if (best.from.outside.delete(best.id)) day.outside.add(best.id);
    changed = true;
  }

  if (!changed) return { plan, legsByDay };
  const balanced: GeneratedPlannerPlan = {
    ...plan,
    days: plan.days.map((d, i): PlannerDay => {
      const w = days[i];
      return {
        ...d,
        stops: w.ids.map((id) => ({ placeId: id, score: w.scores.get(id) ?? 0, ...(w.outside.has(id) ? { visitMode: "outside" as const } : {}) })),
        totalVisitMinutes: w.ids.reduce((s, id) => s + visit(id, w.outside), 0),
        clusters: [...new Set(w.ids.map(clusterOf))],
        ...(w.optional.length > 0 ? { optionalPlaceIds: w.optional } : {}),
      };
    }),
  };
  return { plan: balanced, legsByDay: config.buildPlanRouteLegs(balanced) };
}
