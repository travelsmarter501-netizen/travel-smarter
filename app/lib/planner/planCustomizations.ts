import "server-only";
import { buildBarcelonaDayTimeline, type TimelineMealInput, type TimelineStopInput } from "./barcelonaV2Timeline";
import { buildMealAdjacentLegs, resolveStop, type V2Day, type V2Plan } from "./barcelonaV2Resolve";
import { lunchIndexByClock } from "./barcelonaV2MealStops";
import type { CityPlannerModule } from "./cityPlannerModule";
import { findTimingViolations, TIMING_WARNING_AR } from "./plannerTimingGuard";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import { resolvePlannerPlace, summarizeResolvedPlace, type ResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";

/**
 * Customer edits to a saved plan, made with buttons on the plan page (no free text): the day's start time, a stop's
 * duration, moving a stop up or down, removing a stop, adding a nearby place (see addCandidates), and resetting the day.
 *
 * Stored next to the untouched original (`generated_plan_json.customizations`), so "reset" always works and the engine's
 * plan is never rewritten. The effective day is rebuilt on the server from the original + the edits: route legs for the
 * new order, meals kept and re-placed (breakfast first, lunch in the middle, dinner last), the timeline recomputed, and
 * the same opening-hours check as the planner (a stop that no longer fits gets the "time is tight" warning).
 * Editing the plan from the questionnaire ("edit plan") rebuilds it and drops these edits, as before.
 */

export type DayCustomization = {
  /** Day start, minutes after midnight. */
  startMinutes?: number;
  /** The day's stops, in order (may drop stops of the original or add nearby suggestions). */
  order?: string[];
  /** Visit length per stop, minutes. */
  durations?: Record<string, number>;
};

export type PlanCustomizations = Record<string, DayCustomization>;

export type PlanChange =
  | { kind: "start"; dayNumber: number; minutes: number }
  | { kind: "duration"; dayNumber: number; placeId: string; minutes: number }
  | { kind: "move"; dayNumber: number; placeId: string; direction: -1 | 1 }
  | { kind: "remove"; dayNumber: number; placeId: string }
  | { kind: "add"; dayNumber: number; placeId: string }
  | { kind: "reset"; dayNumber: number };

export const START_MIN = 6 * 60;
export const START_MAX = 13 * 60;
export const DURATION_MIN = 15;
export const DURATION_MAX = 6 * 60;
export const DURATION_STEP = 15;
const MAX_STOPS = 8;

function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/** Validates an untrusted change from the browser; null when it is not a well-formed change. */
export function parsePlanChange(input: unknown): PlanChange | null {
  if (!input || typeof input !== "object") return null;
  const c = input as Record<string, unknown>;
  if (!isInt(c.dayNumber) || c.dayNumber < 1 || c.dayNumber > 10) return null;
  const dayNumber = c.dayNumber;
  const placeId = typeof c.placeId === "string" && /^[a-z0-9-]{1,80}$/.test(c.placeId) ? c.placeId : null;
  switch (c.kind) {
    case "start":
      return isInt(c.minutes) && c.minutes >= START_MIN && c.minutes <= START_MAX && c.minutes % 15 === 0 ? { kind: "start", dayNumber, minutes: c.minutes } : null;
    case "duration":
      return placeId && isInt(c.minutes) && c.minutes >= DURATION_MIN && c.minutes <= DURATION_MAX && c.minutes % DURATION_STEP === 0 ? { kind: "duration", dayNumber, placeId, minutes: c.minutes } : null;
    case "move":
      return placeId && (c.direction === -1 || c.direction === 1) ? { kind: "move", dayNumber, placeId, direction: c.direction } : null;
    case "remove":
      return placeId ? { kind: "remove", dayNumber, placeId } : null;
    case "add":
      return placeId ? { kind: "add", dayNumber, placeId } : null;
    case "reset":
      return { kind: "reset", dayNumber };
    default:
      return null;
  }
}

/** Keeps only well-formed entries (stored data is re-checked on every read). */
export function sanitizeCustomizations(raw: unknown): PlanCustomizations {
  if (!raw || typeof raw !== "object") return {};
  const out: PlanCustomizations = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^(10|[1-9])$/.test(key) || !value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const day: DayCustomization = {};
    if (isInt(v.startMinutes) && v.startMinutes >= START_MIN && v.startMinutes <= START_MAX) day.startMinutes = v.startMinutes;
    if (Array.isArray(v.order) && v.order.length <= MAX_STOPS && v.order.every((id) => typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id))) day.order = [...new Set(v.order as string[])];
    if (v.durations && typeof v.durations === "object") {
      const durations: Record<string, number> = {};
      for (const [id, minutes] of Object.entries(v.durations as Record<string, unknown>)) {
        if (/^[a-z0-9-]{1,80}$/.test(id) && isInt(minutes) && minutes >= DURATION_MIN && minutes <= DURATION_MAX) durations[id] = minutes;
      }
      if (Object.keys(durations).length > 0) day.durations = durations;
    }
    if (Object.keys(day).length > 0) out[key] = day;
  }
  return out;
}

const MAX_ADD_OPTIONS = 4;

function dayOrder(baseDay: V2Day, edit: DayCustomization | undefined): string[] {
  return edit?.order ?? baseDay.stops.map((s) => s.id);
}

/** Every main stop of the plan as edited (a place is never offered twice in one trip). */
function usedPlaceIds(base: V2Plan, customizations: PlanCustomizations): Set<string> {
  return new Set(base.days.flatMap((day) => dayOrder(day, customizations[String(day.dayNumber)])));
}

/**
 * The places the customer may add to a day, best first (at most 4): that day's own "nearby" suggestions, then unused places
 * of the day's own area, then of a close neighbouring area (the city's cluster adjacency, "strong" / "medium"). Only real
 * main-stop places of the city (planner metadata + place data), never a place gated behind an interest, never one already in
 * the trip, and only one that still fits the day: appended at the end, it must not break its opening hours.
 */
export function addCandidates(city: CityPlannerModule, base: V2Plan, customizations: PlanCustomizations, dayNumber: number): string[] {
  const baseDay = base.days.find((d) => d.dayNumber === dayNumber);
  if (!baseDay) return [];
  const edit = customizations[String(dayNumber)] ?? {};
  const order = dayOrder(baseDay, edit);
  if (order.length >= MAX_STOPS) return [];
  const used = usedPlaceIds(base, customizations);
  const clusters = new Set(order.map((id) => city.metadataById(id)?.cluster).filter((c): c is string => !!c));
  const adjacency = city.destinationConfig.routeOptimizationConfig.clusterAdjacency;
  const closeness = (cluster: string): number | null => {
    if (clusters.has(cluster)) return 1;
    for (const c of clusters) {
      const level = adjacency[c]?.[cluster];
      if (level === "strong" || level === "medium") return 2;
    }
    return null;
  };

  const ranked: { id: string; rank: number; tie: number }[] = [];
  baseDay.optionalNearby.forEach((n, i) => ranked.push({ id: n.id, rank: 0, tie: i }));
  for (const meta of city.destinationConfig.plannerMetadata) {
    const rank = closeness(meta.cluster);
    if (rank !== null) ranked.push({ id: meta.placeId, rank, tie: -meta.priority });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.tie - b.tie || a.id.localeCompare(b.id));

  const out: string[] = [];
  const seen = new Set<string>();
  for (const { id } of ranked) {
    if (out.length >= MAX_ADD_OPTIONS) break;
    if (seen.has(id)) continue;
    seen.add(id);
    if (used.has(id) || city.experiencesGatedPlaceIds.has(id) || !city.metadataById(id) || !resolvePlannerPlace(id, city.places)) continue;
    const trial = effectiveDay(city, baseDay, { ...edit, order: [...order, id] }, { ...(base.placeDetails ?? {}) });
    const added = trial.stops.find((s) => s.id === id);
    if (added && !added.warnings.some((w) => w.textAr === TIMING_WARNING_AR)) out.push(id);
  }
  return out;
}

export type PlanAddOptions = { byDay: Record<string, ResolvedPlaceSummary[]>; details: Record<string, ResolvedPlace> };

/** The add candidates of every day, ready for the page (card summaries + the details sheet data). */
export function planAddOptions(city: CityPlannerModule, base: V2Plan, customizations: PlanCustomizations): PlanAddOptions {
  const byDay: Record<string, ResolvedPlaceSummary[]> = {};
  const details: Record<string, ResolvedPlace> = {};
  for (const day of base.days) {
    byDay[String(day.dayNumber)] = addCandidates(city, base, customizations, day.dayNumber).flatMap((id) => {
      const resolved = resolvePlannerPlace(id, city.places);
      if (!resolved) return [];
      details[id] = resolved;
      return [summarizeResolvedPlace(resolved)];
    });
  }
  return { byDay, details };
}

/** Applies one change to the stored edits; null when it does not apply to this plan. */
export function applyPlanChange(city: CityPlannerModule, base: V2Plan, current: PlanCustomizations, change: PlanChange): PlanCustomizations | null {
  const baseDay = base.days.find((d) => d.dayNumber === change.dayNumber);
  if (!baseDay) return null;
  const key = String(change.dayNumber);
  const day: DayCustomization = { ...(current[key] ?? {}) };
  const order = day.order ?? baseDay.stops.map((s) => s.id);
  const next: PlanCustomizations = { ...current };

  switch (change.kind) {
    case "reset":
      delete next[key];
      return next;
    case "start":
      day.startMinutes = change.minutes;
      break;
    case "duration":
      if (!order.includes(change.placeId)) return null;
      day.durations = { ...(day.durations ?? {}), [change.placeId]: change.minutes };
      break;
    case "move": {
      const i = order.indexOf(change.placeId);
      const j = i + change.direction;
      if (i < 0 || j < 0 || j >= order.length) return null;
      const moved = [...order];
      [moved[i], moved[j]] = [moved[j], moved[i]];
      day.order = moved;
      break;
    }
    case "remove": {
      if (!order.includes(change.placeId) || order.length <= 1) return null;
      day.order = order.filter((id) => id !== change.placeId);
      if (day.durations) delete day.durations[change.placeId];
      break;
    }
    case "add": {
      if (!addCandidates(city, base, current, change.dayNumber).includes(change.placeId)) return null;
      day.order = [...order, change.placeId];
      break;
    }
  }
  next[key] = day;
  return next;
}

function placeMeals(baseDay: V2Day, stopCount: number, lunchAfterIndex?: number) {
  // Breakfast before the first stop, lunch after the middle stop (or by the clock, cities with lunchByClock), dinner after the last.
  const lunchAfter = lunchAfterIndex ?? Math.max(0, Math.floor((stopCount - 1) / 2));
  return (baseDay.mealStops ?? []).map((meal) => ({
    ...meal,
    afterStopIndex: meal.afterStopIndex === -1 ? -1 : meal.mealType === "lunch" ? Math.min(lunchAfter, stopCount - 1) : stopCount - 1,
  }));
}

function effectiveDay(city: CityPlannerModule, baseDay: V2Day, edit: DayCustomization, placeDetails: Record<string, ResolvedPlace>): V2Day {
  const baseStops = new Map(baseDay.stops.map((s) => [s.id, s]));
  // Stored edits are re-checked: a stop is either one of the original day's or a real main-stop place of this city.
  const order = (edit.order ?? baseDay.stops.map((s) => s.id)).filter((id) => baseStops.has(id) || (!!city.metadataById(id) && !!resolvePlannerPlace(id, city.places)));
  const stops = order.map((id) => {
    const stop = baseStops.get(id) ?? resolveStop(city, id, 0, placeDetails, baseDay.weekday ?? null);
    const minutes = edit.durations?.[id];
    return {
      ...stop,
      visitDurationMinutes: minutes ?? stop.visitDurationMinutes,
      warnings: stop.warnings.filter((w) => w.textAr !== TIMING_WARNING_AR),
    };
  });
  if (stops.length === 0) return baseDay;

  const legs: PlannerRouteLeg[] = stops.slice(0, -1).map((stop, i) => city.routeLeg(stop.id, stops[i + 1].id));
  const lunchAfterIndex = city.mealStops.lunchByClock ? lunchIndexByClock(stops.map((stop) => stop.visitDurationMinutes), (baseDay.mealStops ?? []).some((m) => m.mealType === "breakfast")) : undefined;
  const mealStops = placeMeals(baseDay, stops.length, lunchAfterIndex);
  const timelineStops: TimelineStopInput[] = stops.map((stop) => ({
    placeId: stop.id,
    visitDurationMinutes: stop.visitDurationMinutes,
    hours: stop.hours,
    preferredTime: city.metadataById(stop.id)?.preferredTime ?? "anytime",
    arrivalBufferMinutes: city.metadataById(stop.id)?.arrivalBufferMinutes,
  }));
  const timelineMeals: TimelineMealInput[] = mealStops.map((meal) => ({ placeId: meal.id, mealType: meal.mealType, afterStopIndex: meal.afterStopIndex, hours: meal.hours }));
  const month = baseDay.actualDate ? Number(baseDay.actualDate.slice(5, 7)) : null;
  const timeline = buildBarcelonaDayTimeline(timelineStops, legs, timelineMeals, baseDay.weekday ?? null, month, edit.startMinutes ?? null);

  let day: V2Day = {
    ...baseDay,
    stops,
    legs,
    mealStops,
    timeline,
    totalVisitMinutes: stops.reduce((sum, stop) => sum + stop.visitDurationMinutes, 0),
    optionalNearby: baseDay.optionalNearby.filter((n) => !order.includes(n.id)),
  };
  const late = new Set(findTimingViolations(day).filter((v) => v.kind === "stop").map((v) => v.placeId));
  if (late.size > 0) day = { ...day, stops: day.stops.map((s) => (late.has(s.id) ? { ...s, warnings: [...s.warnings, { textAr: TIMING_WARNING_AR }] } : s)) };
  return { ...day, mealLegs: buildMealAdjacentLegs(city, day) };
}

/** The plan as the customer edited it (the original when there are no edits). */
export function applyPlanCustomizations(city: CityPlannerModule, base: V2Plan, customizations: PlanCustomizations): V2Plan {
  if (Object.keys(customizations).length === 0) return base;
  const placeDetails = { ...(base.placeDetails ?? {}) };
  const days = base.days.map((day) => {
    const edit = customizations[String(day.dayNumber)];
    return edit ? effectiveDay(city, day, edit, placeDetails) : day;
  });
  return { ...base, days, placeDetails };
}
