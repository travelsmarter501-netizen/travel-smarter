import type { PlannerRouteLeg, TransportOption } from "./plannerTransportTypes";

/**
 * Distances shown to the customer come from the legs only (checked, routed or estimated, each says which). Nothing is filled in
 * here: a leg or option without a distance of its own shows no distance (e.g. an estimate to a park, which gives a time only).
 */
type Point = { coordinates?: { lat: number; lng: number } } | undefined;

/** Distance of a leg in km, for display: recommended mode, then walking, then any option with a distance. null when none has one. */
export function legDistanceKm(leg: Pick<PlannerRouteLeg, "recommendedMode" | "options"> | undefined): number | null {
  const options: TransportOption[] = leg?.options ?? [];
  const pick = (mode: string | null | undefined) => options.find((o) => o.mode === mode && o.distanceKm !== undefined)?.distanceKm;
  return pick(leg?.recommendedMode) ?? pick("walking") ?? options.find((o) => o.distanceKm !== undefined)?.distanceKm ?? null;
}

/**
 * The distance shown next to ONE transport option: that option's own distance only. A car or public-transport time never borrows
 * the walking distance or the straight line, which would describe a different trip.
 */
export function optionDistanceKm(option: Pick<TransportOption, "mode" | "distanceKm">): number | null {
  return option.distanceKm ?? null;
}

/**
 * Total distance between the day's places in order: shown only when EVERY leg has a distance (a partial sum would read as the
 * whole day). `estimated` = at least one leg is an estimate, shown as "≈".
 */
export function dayDistanceKm(day: { stops: Point[]; legs: PlannerRouteLeg[] }): { km: number; estimated: boolean } | null {
  if (day.stops.length < 2) return null;
  let total = 0;
  let estimated = false;
  for (let i = 0; i + 1 < day.stops.length; i++) {
    const leg = day.legs[i];
    const km = legDistanceKm(leg);
    if (km === null) return null;
    total += km;
    if (leg?.sourceStatus !== "verified" && leg?.sourceStatus !== "existing-project-data") estimated = true;
  }
  return { km: total, estimated };
}

/** Idea reasons saved before "free time" was dropped from the plan start with this prefix; show only what follows it. */
export function stripFreeTimePrefix(text: string | undefined): string | undefined {
  if (!text) return text;
  const stripped = text.replace(/^(عندك وقت حر|You have free time|יש לכם זמן חופשי)\s*[:：]\s*/u, "");
  return stripped === text ? text : stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
