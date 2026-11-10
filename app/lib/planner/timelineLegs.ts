import type { CityPlannerModule } from "./cityPlannerModule";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

/**
 * Cities with `mealLegsInTimeline`: the leg between two places of a day, for the timeline (buildBarcelonaDayTimeline counts the
 * trip to and from each meal with it). Undefined for every other city, so their timelines are unchanged.
 */
export function timelineLegBetween(city: CityPlannerModule): ((fromPlaceId: string, toPlaceId: string) => PlannerRouteLeg | undefined) | undefined {
  if (!city.mealLegsInTimeline) return undefined;
  return (fromPlaceId, toPlaceId) => {
    if (fromPlaceId === "lunch-break" || toPlaceId === "lunch-break") return undefined; // no set place
    try {
      return city.routeLeg(fromPlaceId, toPlaceId);
    } catch {
      return undefined;
    }
  };
}
