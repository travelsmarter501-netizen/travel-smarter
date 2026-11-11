import type { CityPlannerModule } from "./cityPlannerModule";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

/**
 * Cities with `mealLegsInTimeline`: the leg between two places of a day, for the timeline (buildBarcelonaDayTimeline counts the
 * trip to and from each meal with it). Undefined for every other city, so their timelines are unchanged.
 */
/** Minutes of the recommended option of the leg between two places (middle of its range); null when the leg is not known. */
export function legMidMinutes(city: CityPlannerModule, fromPlaceId: string, toPlaceId: string): number | null {
  if (fromPlaceId === toPlaceId) return 0;
  try {
    const leg = city.routeLeg(fromPlaceId, toPlaceId);
    const option = leg.sourceStatus === "unresolved" ? undefined : leg.options.find((o) => o.mode === leg.recommendedMode);
    return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
  } catch {
    return null;
  }
}

export function timelineLegBetween(city: CityPlannerModule): ((fromPlaceId: string, toPlaceId: string) => PlannerRouteLeg | undefined) | undefined {
  if (!city.mealLegsInTimeline) return undefined;
  return (fromPlaceId, toPlaceId) => {
    if (fromPlaceId === "lunch-break" || toPlaceId === "lunch-break") return undefined; // no set place (handled by the timeline)
    try {
      return city.routeLeg(fromPlaceId, toPlaceId);
    } catch {
      return undefined;
    }
  };
}
