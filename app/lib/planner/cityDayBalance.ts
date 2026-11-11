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
  /**
   * Optional: regroup the trip after balancing (see step 6 for the cost and the limits).
   */
  regroup?: { splitPenalty: number; lightWeight: number; emptyPenalty: number; comfortStops: number; crowdPenalty: number; maxStops: number; hopPenalty: number; restoreBonus: number };
  /**
   * Optional: a light day may also take ONE short, free place of an area it already visits (a walk-by: a park, a wall, an
   * island) that matches the request at least `minRelevance`, even below the normal threshold for added places.
   */
  walkByStop?: { isFreeShort: (placeId: string) => boolean; minRelevance: number };
  /** Optional: ideas for a light day's free time (see step 7), with the lowest interest match they need. */
  freeTimeIdeas?: { minRelevance: number };
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

  // 4. Light days (only when there is more than one day) get one more nearby place: a place that matches the request, or
  //    (cities with walkByStop) one short free place of an area the day already visits.
  const addNearbyToLightDays = () => {
    const used = new Set(days.flatMap((d) => [...d.ids, ...d.optional]));
    for (const day of plan.days.length > 1 ? days : []) {
      if (day.ids.length === 0 || dayLoad(day) >= options.lightMinutes) continue;
      const dayAreas = new Set(day.ids.flatMap((x) => [...areasOf(x)]));
      const nextDoor = (cluster: string) => dayAreas.has(cluster) || [...dayAreas].some((a) => options.compatibility[a]?.[cluster] === "strong");
      const walkBy = (id: string) => !!options.walkByStop && options.walkByStop.isFreeShort(id) && nextDoor(clusterOf(id)) && (relevance?.(id) ?? 0) >= options.walkByStop.minRelevance;
      const strongMatch = (id: string) => (relevance?.(id) ?? 0) >= 7;
      const candidates = config.plannerMetadata
        .filter((m) => !used.has(m.placeId) && !options.gatedPlaceIds.has(m.placeId) && eligible(m.placeId, day.dayNumber) && day.ids.some((x) => linked(x, m.placeId)))
        .filter((m) => ((m.priority >= options.minPriorityToAdd || strongMatch(m.placeId)) && (!relevant || relevant(m.placeId))) || walkBy(m.placeId))
        .sort((a, b) => Number(!!relevant?.(b.placeId)) - Number(!!relevant?.(a.placeId)) || b.priority - a.priority || a.placeId.localeCompare(b.placeId));
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
  };
  addNearbyToLightDays();

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

  // 6. Regroup (cities that opt in). Local search over: one stop moved to another day, two stops swapped, a whole area moved,
  //    an optional place brought back. A move is taken when it lowers the trip cost:
  //        travel inside each day
  //      + lightWeight x (minutes a day is short of lightMinutes, in half hours) squared   -> light days are filled first
  //      + emptyPenalty per day without stops, crowdPenalty per stop above comfortStops
  //      + hopPenalty per walk between two areas that are not neighbours
  //      + splitPenalty for every extra day an area is spread over          -> an area stays on one day unless a day needs it
  //      - restoreBonus per stop in the plan.
  //    A normal day is never taken apart only because another day is a little shorter. Limits: a move never takes a day above
  //    heavyMinutes (meals counted), maxStops stops or 3 areas, never empties a day, a place only moves to a day it is open on,
  //    and every stop that arrives must be next to (same or neighbouring area) a stop that stays on that day. A day without
  //    stops may receive any open place.
  const rg = options.regroup;
  const touched = new Set<number>();
  const areaCount = (ids: readonly string[]) => new Set(ids.map(clusterOf)).size;
  const canJoin = (w: WorkDay, id: string) => w.ids.length === 0 || w.ids.some((x) => linked(x, id));
  if (rg && days.length > 1) {
    const tripCost = (ws: WorkDay[]): number => {
      let cost = 0;
      const daysOfArea = new Map<string, Set<number>>();
      ws.forEach((w, i) => {
        const short = Math.max(0, options.lightMinutes - load(w.ids, w.outside));
        cost += travel(w.ids) + rg.lightWeight * (short / 30) ** 2;
        cost += rg.hopPenalty * w.ids.slice(0, -1).filter((id, k) => !linked(id, w.ids[k + 1])).length;
        if (w.ids.length === 0) cost += rg.emptyPenalty;
        if (w.ids.length > rg.comfortStops) cost += rg.crowdPenalty * (w.ids.length - rg.comfortStops);
        for (const id of w.ids) for (const area of areasOf(id)) (daysOfArea.get(area) ?? daysOfArea.set(area, new Set()).get(area)!).add(i);
      });
      for (const set of daysOfArea.values()) cost += rg.splitPenalty * Math.max(0, set.size - 1);
      return cost - rg.restoreBonus * ws.reduce((n, w) => n + w.ids.length, 0);
    };
    const fits = (was: WorkDay, now: WorkDay) =>
      heavyLoad(now.ids, now.outside) <= Math.max(options.heavyMinutes, dayHeavyLoad(was)) && now.ids.length <= Math.max(rg.maxStops, was.ids.length) && areaCount(now.ids) <= Math.max(3, areaCount(was.ids));
    const without = (w: WorkDay, gone: readonly string[]): WorkDay => ({ ...w, ids: w.ids.filter((x) => !gone.includes(x)), outside: new Set([...w.outside].filter((x) => !gone.includes(x))) });
    const withStops = (w: WorkDay, added: readonly string[], from: WorkDay): WorkDay => {
      let ids = [...w.ids];
      for (const id of added) ids = insertCheapest(ids, id);
      return { ...w, ids, outside: new Set([...w.outside, ...added.filter((x) => from.outside.has(x))]), scores: new Map([...w.scores, ...added.map((x) => [x, from.scores.get(x) ?? 0] as [string, number])]) };
    };
    for (let iteration = 0; iteration < 80; iteration++) {
      const base = tripCost(days);
      let best: { cost: number; next: [number, WorkDay][] } | null = null;
      const consider = (next: [number, WorkDay][]) => {
        const trial = days.map((w, k) => next.find(([i]) => i === k)?.[1] ?? w);
        const c = tripCost(trial);
        if (c < base - 1 && (!best || c < best.cost)) best = { cost: c, next };
      };
      for (let ai = 0; ai < days.length; ai++) {
        const a = days[ai];
        for (let bi = 0; bi < days.length; bi++) {
          if (ai === bi) continue;
          const b = days[bi];
          // One stop a -> b.
          if (a.ids.length > 1) {
            for (const id of a.ids) {
              if (!eligible(id, b.dayNumber) || !canJoin(b, id)) continue;
              const tb = withStops(b, [id], a);
              if (fits(b, tb)) consider([[ai, without(a, [id])], [bi, tb]]);
            }
          }
          // Two stops swapped.
          if (bi > ai) {
            for (const x of a.ids) for (const y of b.ids) {
              if (!eligible(x, b.dayNumber) || !eligible(y, a.dayNumber)) continue;
              if (!canJoin(without(a, [x]), y) || !canJoin(without(b, [y]), x)) continue;
              const ta = withStops(without(a, [x]), [y], b);
              const tb = withStops(without(b, [y]), [x], a);
              if (fits(a, ta) && fits(b, tb)) consider([[ai, ta], [bi, tb]]);
            }
          }
          // A whole area a -> b.
          for (const area of new Set(a.ids.map(clusterOf))) {
            const group = a.ids.filter((x) => clusterOf(x) === area);
            if (group.length < 2 || group.length >= a.ids.length || !group.every((x) => eligible(x, b.dayNumber))) continue;
            if (b.ids.length > 0 && !b.ids.some((x) => group.some((g) => linked(x, g)))) continue;
            const tb = withStops(b, group, a);
            if (fits(b, tb)) consider([[ai, without(a, group)], [bi, tb]]);
          }
        }
        // The stops of one area of a spread over several other days, each to the lightest day next to it that has room
        // (when no single day can take the whole area).
        for (const area of new Set(a.ids.map(clusterOf))) {
          const group = a.ids.filter((x) => clusterOf(x) === area);
          if (group.length < 2 || group.length >= a.ids.length) continue;
          const moved = new Map<number, WorkDay>();
          let placedAll = true;
          for (const id of group) {
            let target: { i: number; w: WorkDay; minutes: number } | null = null;
            for (let bi = 0; bi < days.length; bi++) {
              if (bi === ai) continue;
              const b = moved.get(bi) ?? days[bi];
              if (b.ids.length === 0 || !eligible(id, b.dayNumber) || !canJoin(b, id)) continue;
              const tb = withStops(b, [id], a);
              if (!fits(days[bi], tb)) continue;
              const minutes = load(tb.ids, tb.outside);
              if (!target || minutes < target.minutes) target = { i: bi, w: tb, minutes };
            }
            if (!target) {
              placedAll = false;
              break;
            }
            moved.set(target.i, target.w);
          }
          if (placedAll && moved.size > 1) consider([[ai, without(a, group)], ...moved.entries()]);
        }
        // An optional place of any day brought back into a (linked, open, matching, and the day has room).
        for (let fi = 0; fi < days.length; fi++) {
          for (const id of days[fi].optional) {
            if (!eligible(id, a.dayNumber) || !canJoin(a, id) || (relevant && !relevant(id))) continue;
            const ta: WorkDay = { ...a, ids: insertCheapest(a.ids, id), scores: new Map([...a.scores, [id, 0] as [string, number]]) };
            if (heavyLoad(ta.ids, ta.outside) > options.heavyMinutes || ta.ids.length > rg.maxStops || areaCount(ta.ids) > Math.max(3, areaCount(a.ids))) continue;
            if (fi === ai) consider([[ai, { ...ta, optional: a.optional.filter((v) => v !== id) }]]);
            else consider([[ai, ta], [fi, { ...days[fi], optional: days[fi].optional.filter((v) => v !== id) }]]);
          }
        }
      }
      if (!best) break;
      for (const [i, w] of (best as { next: [number, WorkDay][] }).next) {
        days[i] = w;
        touched.add(w.dayNumber);
      }
      changed = true;
    }

    // 6b. An outside-only stop becomes a full visit again when its day has room for it (meals counted); a strong match
    //     (relevance 7+) may instead move, as a full visit, to another open, linked day that has room.
    for (let di = 0; di < days.length; di++) {
      for (const id of [...days[di].outside].sort((x, y) => (relevance?.(y) ?? 0) - (relevance?.(x) ?? 0))) {
        const day = days[di];
        const inside = new Set([...day.outside].filter((x) => x !== id));
        if (heavyLoad(day.ids, inside) <= options.heavyMinutes) {
          days[di] = { ...day, outside: inside };
          touched.add(day.dayNumber);
          changed = true;
          continue;
        }
        if (day.ids.length < 2 || (relevance?.(id) ?? 0) < 7) continue;
        const target = days
          .map((d, i) => ({ d, i, ids: insertCheapest(d.ids, id) }))
          .filter(({ d, i, ids }) => i !== di && eligible(id, d.dayNumber) && canJoin(d, id) && ids.length <= rg.maxStops && heavyLoad(ids, d.outside) <= options.heavyMinutes && areaCount(ids) <= Math.max(3, areaCount(d.ids)))
          .sort((x, y) => dayLoad(x.d) - dayLoad(y.d))[0];
        if (!target) continue;
        days[target.i] = { ...target.d, ids: target.ids, scores: new Map([...target.d.scores, [id, day.scores.get(id) ?? 0] as [string, number]]) };
        days[di] = { ...day, ids: day.ids.filter((x) => x !== id), outside: inside };
        touched.add(day.dayNumber);
        touched.add(target.d.dayNumber);
        changed = true;
      }
    }

    // 6c. Light days once more (a walk-by or a matching place), now that the days are regrouped.
    const countsBefore = days.map((d) => d.ids.length);
    addNearbyToLightDays();
    days.forEach((d, i) => {
      if (d.ids.length !== countsBefore[i]) touched.add(d.dayNumber);
    });

    // 6d. A day that changed is walked in the order with the least travel, when that saves at least 5 minutes over the order
    //     it has; of two orders with the same travel, the one closer to the order it had.
    const agreement = (order: readonly string[], reference: readonly string[]) => {
      let n = 0;
      for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) if (reference.indexOf(order[i]) < reference.indexOf(order[j])) n++;
      return n;
    };
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      if (!touched.has(day.dayNumber) || day.ids.length < 3 || day.ids.length > 7) continue;
      let bestOrder: string[] | null = null;
      let bestTravel = travel(day.ids) - 4;
      const walk = (prefix: string[], rest: string[]) => {
        if (rest.length === 0) {
          const t = travel(prefix);
          if (t < bestTravel || (bestOrder !== null && t === bestTravel && agreement(prefix, day.ids) > agreement(bestOrder, day.ids))) {
            bestTravel = t;
            bestOrder = [...prefix];
          }
          return;
        }
        for (let i = 0; i < rest.length; i++) walk([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
      };
      walk([], day.ids);
      if (bestOrder) days[di] = { ...day, ids: bestOrder };
    }

    // 6e. A day still without stops: the last day that has stops and is open for all of them on this date moves here, so
    //     days without a program can only be the last ones; those are left out of the plan (the plan then says it covers
    //     fewer days than asked, with the city's own notice).
    for (let k = 0; k < days.length; k++) {
      if (days[k].ids.length > 0) continue;
      for (let j = days.length - 1; j > k; j--) {
        const donor = days[j];
        if (donor.ids.length === 0 || !donor.ids.every((x) => eligible(x, days[k].dayNumber))) continue;
        days[k] = { ...donor, dayNumber: days[k].dayNumber };
        days[j] = { dayNumber: donor.dayNumber, ids: [], scores: new Map(), outside: new Set(), optional: [] };
        changed = true;
        break;
      }
    }
  }

  // 7. A day that stays light gets up to two nearby ideas for its free time (unused places of its own or a closely linked
  //    area that are open that day and match the request at least a little), shown apart from the plan. Nothing is scheduled.
  const ideas = new Map<number, string[]>();
  if (options.freeTimeIdeas) {
    const taken = new Set(days.flatMap((d) => [...d.ids, ...d.optional]));
    for (const day of days) {
      if (day.ids.length === 0 || dayLoad(day) >= options.lightMinutes) continue;
      const list = config.plannerMetadata
        .filter((m) => !taken.has(m.placeId) && !options.gatedPlaceIds.has(m.placeId) && eligible(m.placeId, day.dayNumber) && day.ids.some((x) => linked(x, m.placeId)) && (!relevance || relevance(m.placeId) >= options.freeTimeIdeas!.minRelevance))
        .sort((x, y) => y.priority - x.priority || x.placeId.localeCompare(y.placeId))
        .slice(0, 2)
        .map((m) => m.placeId);
      list.forEach((id) => taken.add(id));
      if (list.length) { ideas.set(day.dayNumber, list); changed = true; }
    }
  }

  if (!changed) return { plan, legsByDay };
  let kept = days.length;
  if (rg) while (kept > 1 && days[kept - 1].ids.length === 0) kept--;
  const balanced: GeneratedPlannerPlan = {
    ...plan,
    days: plan.days.slice(0, kept).map((d, i): PlannerDay => {
      const w = days[i];
      return {
        ...d,
        stops: w.ids.map((id) => ({ placeId: id, score: w.scores.get(id) ?? 0, ...(w.outside.has(id) ? { visitMode: "outside" as const } : {}) })),
        totalVisitMinutes: w.ids.reduce((s, id) => s + visit(id, w.outside), 0),
        clusters: [...new Set(w.ids.map(clusterOf))],
        ...(w.optional.length > 0 ? { optionalPlaceIds: w.optional } : {}),
        ...(ideas.get(w.dayNumber)?.length ? { freeTimePlaceIds: ideas.get(w.dayNumber) } : {}),
      };
    }),
  };
  return { plan: balanced, legsByDay: config.buildPlanRouteLegs(balanced) };
}
