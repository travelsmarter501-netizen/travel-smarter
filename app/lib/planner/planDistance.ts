import { haversineDistanceKm } from "./geoDistance";
import type { PlannerRouteLeg, TransportOption } from "./plannerTransportTypes";

/** Straight-line distance is shorter than a real walk; the same 1.3 factor the transit estimates use. */
const WALK_FACTOR = 1.3;

type Point = { coordinates?: { lat: number; lng: number } } | undefined;

/** Distance between two stops in km, for display: the leg's own number (recommended mode, then walking, then any), else straight line x 1.3. null when nothing is known. */
export function legDistanceKm(leg: Pick<PlannerRouteLeg, "recommendedMode" | "options"> | undefined, from?: Point, to?: Point): number | null {
  const options: TransportOption[] = leg?.options ?? [];
  const pick = (mode: string | null | undefined) => options.find((o) => o.mode === mode && o.distanceKm !== undefined)?.distanceKm;
  const known = pick(leg?.recommendedMode) ?? pick("walking") ?? options.find((o) => o.distanceKm !== undefined)?.distanceKm;
  if (known !== undefined) return known;
  if (from?.coordinates && to?.coordinates) return haversineDistanceKm(from.coordinates, to.coordinates) * WALK_FACTOR;
  return null;
}

/** Total distance between the day's places in order (km), or null when no leg could be measured. */
export function dayDistanceKm(day: { stops: Point[]; legs: PlannerRouteLeg[] }): number | null {
  let total = 0;
  let any = false;
  for (let i = 0; i + 1 < day.stops.length; i++) {
    const km = legDistanceKm(day.legs[i], day.stops[i], day.stops[i + 1]);
    if (km !== null) {
      total += km;
      any = true;
    }
  }
  return any ? total : null;
}

/** Idea reasons saved before "free time" was dropped from the plan start with this prefix; show only what follows it. */
export function stripFreeTimePrefix(text: string | undefined): string | undefined {
  if (!text) return text;
  const stripped = text.replace(/^(عندك وقت حر|You have free time|יש לכם זמן חופשי)\s*[:：]\s*/u, "");
  return stripped === text ? text : stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
