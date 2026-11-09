import "server-only";
import { getCityPlannerModule } from "./cityPlannerRegistry";
import { resolvePlacesForTrip, tripDates } from "./tripHours";
import type { CityPlannerModule } from "./cityPlannerModule";
import type { V2Plan } from "./barcelonaV2Resolve";

/**
 * The city module for a saved plan, with its places' hours resolved for that plan's own dates (cities that plan seasonal
 * hours per trip), so an edit is timed exactly like the original plan.
 */
export function cityForSavedPlan(plan: V2Plan): CityPlannerModule | null {
  const city = getCityPlannerModule(plan.destination);
  if (!city || !city.resolveHoursPerTrip) return city;
  const dates = plan.days.map((day) => day.actualDate).filter((d): d is string => !!d);
  const range = dates.length > 0 ? tripDates(dates[0], dates[dates.length - 1]) : null;
  return { ...city, places: resolvePlacesForTrip(city.places, range) };
}
