import { planningHoursOf, type HoursInfo, type Weekday } from "../hours";
import { buildBarcelonaDayTimeline, findCoveringInterval, MEAL_ASSUMED_DURATION_MINUTES, type DayTimeline, type MealType, type TimelineMealInput, type TimelineStopInput } from "./barcelonaV2Timeline";
import type { V2Day, V2Plan } from "./barcelonaV2Resolve";
import type { CityPlannerModule } from "./cityPlannerModule";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import { timelineLegBetween } from "./timelineLegs";

/**
 * Multi-city planner, cities that opt in (`timingGuard`): opening hours are a hard constraint on the FINAL plan.
 *
 * The timeline (barcelonaV2Timeline.ts) places each visit and meal at the first moment the day allows and, when a place
 * closes too early, only caps the displayed window at closing time. That keeps the times honest but can still produce a
 * visit that is cut short (e.g. a tower at 17:30-18:30 that closes at 18:00) or one that starts after the last entry.
 * This guard runs on the built plan (meals included), finds such days, tries every order of that day's stops (days have
 * at most 7) on a simulated timeline with the same meals, and keeps the order with the fewest violations, then the least
 * walking / transit time, then the fewest moved stops. The plan is then rebuilt with that order (meals re-chosen by the
 * normal rules) and checked again. A visit that still cannot fit gets a warning instead of a silent short slot.
 *
 * Checked only where it is verifiable: a fixed schedule (or a seasonal place's per-trip planning schedule) and a known
 * weekday -- or, in a plan without dates, a schedule that is the same every day.
 */

export const TIMING_WARNING_AR = "⚠️ الوقت ضيق: حسب ساعات العمل ممكن ما يكفي الوقت لهالزيارة قبل الإغلاق أو آخر دخول. ابدأ فيها بدري أو بدّل ترتيبها.";

export type TimingViolation = { dayNumber: number; kind: "stop" | "meal"; placeId: string; reason: "closed" | "past-closing" | "after-last-entry"; start: number; end: number };

const ALL_DAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function checkWindow(rawHours: HoursInfo | undefined, weekday: Weekday | null, start: number, end: number, fullDuration: number): TimingViolation["reason"] | null {
  const hours = planningHoursOf(rawHours);
  if (!hours || hours.type !== "fixed") return null;
  if (!weekday) {
    // A plan without dates can only be checked against a schedule that is the same every day.
    const days = ALL_DAYS.map((d) => JSON.stringify(hours.schedule[d] ?? []));
    if (days.some((d) => d !== days[0])) return null;
  }
  const covering = findCoveringInterval(hours, weekday, start);
  if (!covering) return "closed";
  if (end - start < fullDuration || start + fullDuration > covering.close) return "past-closing";
  if (hours.lastEntry && start > toMinutes(hours.lastEntry)) return "after-last-entry";
  return null;
}

export function findTimingViolations(day: Pick<V2Day, "dayNumber" | "weekday" | "stops" | "mealStops" | "timeline">): TimingViolation[] {
  const weekday = day.weekday ?? null;
  const out: TimingViolation[] = [];
  if (!day.timeline) return out;
  const mealStops = day.mealStops ?? [];
  day.timeline.stops.forEach((window, index) => {
    const stop = day.stops[index];
    if (!stop) return;
    const reason = checkWindow(stop.hours, weekday, window.startMinutes, window.endMinutes, stop.visitDurationMinutes);
    if (reason) out.push({ dayNumber: day.dayNumber, kind: "stop", placeId: stop.id, reason, start: window.startMinutes, end: window.endMinutes });
  });
  for (const window of day.timeline.meals) {
    const meal = mealStops.find((m) => m.id === window.placeId);
    if (!meal) continue;
    const reason = checkWindow(meal.hours, weekday, window.startMinutes, window.endMinutes, MEAL_ASSUMED_DURATION_MINUTES[window.mealType as MealType]);
    if (reason) out.push({ dayNumber: day.dayNumber, kind: "meal", placeId: meal.id, reason, start: window.startMinutes, end: window.endMinutes });
  }
  return out;
}

function permutations(n: number): number[][] {
  const result: number[][] = [];
  const walk = (prefix: number[], rest: number[]) => {
    if (rest.length === 0) {
      result.push(prefix);
      return;
    }
    rest.forEach((value, i) => walk([...prefix, value], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  walk([], Array.from({ length: n }, (_, i) => i));
  return result;
}

function legMinutes(leg: PlannerRouteLeg): number {
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? option.durationMinutesMax : 0;
}

function simulate(city: CityPlannerModule, day: V2Day, order: number[], month: number | null): { timeline: DayTimeline; legs: PlannerRouteLeg[] } {
  const stops: TimelineStopInput[] = order.map((i) => {
    const stop = day.stops[i];
    const meta = city.metadataById(stop.id);
    return { placeId: stop.id, visitDurationMinutes: stop.visitDurationMinutes, hours: stop.hours, preferredTime: meta?.preferredTime ?? "anytime", arrivalBufferMinutes: meta?.arrivalBufferMinutes };
  });
  const legs: PlannerRouteLeg[] = [];
  for (let i = 0; i < order.length - 1; i++) legs.push(city.routeLeg(day.stops[order[i]].id, day.stops[order[i + 1]].id));
  const meals: TimelineMealInput[] = (day.mealStops ?? []).map((meal) => ({ placeId: meal.id, mealType: meal.mealType, afterStopIndex: meal.afterStopIndex, hours: meal.hours, ...(meal.optional ? { optional: true } : {}), ...(meal.earliestStart !== undefined ? { earliestStart: meal.earliestStart } : {}) }));
  return { timeline: buildBarcelonaDayTimeline(stops, legs, meals, day.weekday ?? null, month, null, timelineLegBetween(city)), legs };
}

type Ranked = { violations: number; hops: number; travel: number; moved: number };

/** Fewer violations first, then fewer hops between non-neighbouring areas, then less travel, then fewer moved stops. */
function isBetter(a: Ranked, b: Ranked): boolean {
  if (a.violations !== b.violations) return a.violations < b.violations;
  if (a.hops !== b.hops) return a.hops < b.hops;
  if (a.travel !== b.travel) return a.travel < b.travel;
  return a.moved < b.moved;
}

function bestOrderForDay(city: CityPlannerModule, day: V2Day): number[] | null {
  const n = day.stops.length;
  if (n < 2 || n > 7) return null;
  const month = day.actualDate ? Number(day.actualDate.slice(5, 7)) : null;
  const compatibility = city.destinationConfig.dayBuilderConfig.clusterCompatibility as Record<string, Record<string, unknown> | undefined>;
  const clusterOf = (index: number) => city.metadataById(day.stops[index].id)?.cluster ?? "";
  // A hop between areas that are not neighbours (the same rule the day builder uses) counts against an order.
  const hopsOf = (order: number[]) => order.slice(0, -1).filter((value, k) => { const a = clusterOf(value), b = clusterOf(order[k + 1]); return a !== b && !compatibility[a]?.[b] && !compatibility[b]?.[a]; }).length;
  let best: { order: number[]; violations: number; hops: number; travel: number; moved: number } | null = null;
  for (const order of permutations(n)) {
    const { timeline, legs } = simulate(city, day, order, month);
    const simulatedDay = { ...day, stops: order.map((i) => day.stops[i]), timeline };
    // A flagship that cannot fit weighs as much as ten smaller stops: better to lose a small stop than cut the castle short.
    const flagships = new Set(city.compositionProtectedPlaceIds ?? []);
    const violations = findTimingViolations(simulatedDay).reduce((sum, v) => sum + (flagships.has(v.placeId) ? 10 : 1), 0);
    const travel = legs.reduce((sum, leg) => sum + legMinutes(leg), 0);
    const moved = order.filter((value, index) => value !== index).length;
    const hops = hopsOf(order);
    const candidate = { order, violations, hops, travel, moved };
    if (!best || isBetter(candidate, best)) best = candidate;
  }
  if (!best) return null;
  const currentFlagships = new Set(city.compositionProtectedPlaceIds ?? []);
  const current = findTimingViolations(day).reduce((sum, v) => sum + (currentFlagships.has(v.placeId) ? 10 : 1), 0);
  if (best.violations >= current) return null;
  return best.order;
}

/**
 * Applies the guard. `build` turns a (re-ordered) engine plan into the final V2 plan with the normal presentation /
 * resolve steps; it is called again only when a day actually changes.
 */
export function applyTimingGuard(params: {
  city: CityPlannerModule;
  plan: GeneratedPlannerPlan;
  legsByDay: PlannerRouteLeg[][];
  data: V2Plan;
  build: (plan: GeneratedPlannerPlan, legsByDay: PlannerRouteLeg[][], mealExclusionsByDay?: Readonly<Record<number, readonly string[]>>) => V2Plan;
}): V2Plan {
  const { city, build } = params;
  let plan = params.plan;
  let legsByDay = params.legsByDay;
  let data = params.data;
  const mealExclusions: Record<number, string[]> = {};

  for (let round = 0; round < 3; round++) {
    let changed = false;
    const days = plan.days.map((day, index) => {
      const v2Day = data.days[index];
      if (!v2Day || findTimingViolations(v2Day).length === 0) return day;
      const order = bestOrderForDay(city, v2Day);
      if (!order) return day;
      changed = true;
      const stops = order.map((i) => day.stops[i]);
      const reordered = { ...day, stops };
      const legs: PlannerRouteLeg[] = city.buildDayRouteLegs
        ? city.buildDayRouteLegs(reordered)
        : stops.slice(0, -1).map((stop, i) => city.routeLeg(stop.placeId, stops[i + 1].placeId));
      legsByDay = legsByDay.map((dayLegs, d) => (d === index ? legs : dayLegs));
      return reordered;
    });
    if (!changed) break;
    plan = { ...plan, days };
    data = build(plan, legsByDay, mealExclusions);
  }

  // A meal that still runs past closing (e.g. dinner starting late) -> that restaurant is excluded for that day and the
  // meals are chosen again by the normal rules.
  for (let round = 0; round < 3; round++) {
    let added = false;
    for (const day of data.days) {
      for (const violation of findTimingViolations(day).filter((v) => v.kind === "meal")) {
        const list = (mealExclusions[day.dayNumber] ??= []);
        if (!list.includes(violation.placeId)) {
          list.push(violation.placeId);
          added = true;
        }
      }
    }
    if (!added) break;
    data = build(plan, legsByDay, mealExclusions);
  }

  // Cities with `mealLegsInTimeline`: a stop that still runs past closing or starts after the last entry is not kept as a cut-short
  // visit. It leaves the day and becomes that day's optional suggestion ("if there is time left"), and the day is rebuilt. Never
  // the city's protected flagships, and never a day's only stop.
  if (city.mealLegsInTimeline) {
    const isOpenThatDay = (day: V2Day, placeId: string): boolean => {
      const hours = planningHoursOf(day.stops.find((s) => s.id === placeId)?.hours);
      if (!hours || hours.type !== "fixed") return false;
      const weekday = day.weekday ?? "monday";
      return (hours.schedule[weekday] ?? []).length > 0;
    };
    const protectedIds = new Set(city.compositionProtectedPlaceIds ?? []);
    // Repeated (at most 3 rounds): dropping a stop re-chooses the meals, which can move a later stop past closing.
    for (let dropRound = 0; dropRound < 3; dropRound++) {
    let dropped = false;
    const days = plan.days.map((day, index) => {
      const v2Day = data.days[index];
      if (!v2Day) return day;
      const late = findTimingViolations(v2Day)
        // "closed" here also covers a visit pushed to the closing minute (no time left); a place really closed that weekday is
        // left to the date repair and keeps its warning.
        .filter((v) => v.kind === "stop" && !protectedIds.has(v.placeId) && (v.reason !== "closed" || isOpenThatDay(v2Day, v.placeId)))
        .map((v) => v.placeId);
      const remove = late.filter((id) => day.stops.length - late.length >= 1 || id !== day.stops[0]?.placeId).slice(0, Math.max(0, day.stops.length - 1));
      if (remove.length === 0) return day;
      dropped = true;
      const removedMinutes = remove.reduce((sum, id) => sum + (v2Day.stops.find((s) => s.id === id)?.visitDurationMinutes ?? 0), 0);
      return {
        ...day,
        stops: day.stops.filter((s) => !remove.includes(s.placeId)),
        totalVisitMinutes: Math.max(0, day.totalVisitMinutes - removedMinutes),
        optionalPlaceIds: [...(day.optionalPlaceIds ?? []), ...remove.filter((id) => !(day.optionalPlaceIds ?? []).includes(id))],
      };
    });
    if (dropped) {
      plan = { ...plan, days };
      legsByDay = days.map((day) => (city.buildDayRouteLegs ? city.buildDayRouteLegs(day) : day.stops.slice(0, -1).map((stop, i) => city.routeLeg(stop.placeId, day.stops[i + 1].placeId))));
      data = build(plan, legsByDay, mealExclusions);
    }
    if (!dropped) break;
    }
  }

  // Whatever still cannot fit is said plainly on the stop (meals are re-chosen by the normal hours rules and are only reported).
  const days = data.days.map((day) => {
    const stopViolations = findTimingViolations(day).filter((v) => v.kind === "stop");
    if (stopViolations.length === 0) return day;
    const ids = new Set(stopViolations.map((v) => v.placeId));
    return {
      ...day,
      stops: day.stops.map((stop) => (ids.has(stop.id) && !stop.warnings.some((w) => w.textAr === TIMING_WARNING_AR) ? { ...stop, warnings: [...stop.warnings, { textAr: TIMING_WARNING_AR }] } : stop)),
    };
  });
  return { ...data, days };
}
