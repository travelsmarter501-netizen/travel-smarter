import "server-only";
import { BARCELONA_CITY_MODULE } from "./barcelonaCityModule";
import { PRAGUE_CITY_MODULE } from "./prague/pragueCityModule";
import type { CityPlannerModule } from "./cityPlannerModule";

/**
 * Multi-city foundation: destination id -> the city's planner module. Having a module here means the ENGINE can build a
 * plan for that city; whether customers may choose it is decided separately by plannerDestinations.ts (`available`, or
 * the local-only preview switch), and the server refuses any destination that is not enabled there.
 */
const CITY_PLANNER_MODULES: Record<string, CityPlannerModule> = {
  barcelona: BARCELONA_CITY_MODULE,
  // Engine-ready, NOT public: plannerDestinations.ts keeps Prague unavailable (local preview switch only).
  prague: PRAGUE_CITY_MODULE,
};

export function getCityPlannerModule(destinationId: string): CityPlannerModule | null {
  return Object.prototype.hasOwnProperty.call(CITY_PLANNER_MODULES, destinationId) ? CITY_PLANNER_MODULES[destinationId] : null;
}
