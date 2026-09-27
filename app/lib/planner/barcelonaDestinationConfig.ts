import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";
import { BARCELONA_DAY_BUILDER_CONFIG } from "./barcelona-planner-day-builder";
import { BARCELONA_ROUTE_CONFIG } from "./barcelona-planner-route-config";
import { buildBarcelonaPlannerPlanRouteLegs } from "./barcelona-planner-route-legs";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { getBarcelonaPlannerOperationalWarnings } from "./barcelonaPlannerOperationalWarnings";
import { presentBarcelonaSmartPlan } from "./barcelona-planner-presentation";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import type { DestinationConfig } from "./destinationConfig";

/**
 * Smart Planner V2 Phase 1 -- Barcelona's TravelPlannerEngine config.
 *
 * Pure composition of already-existing, already-verified Barcelona wrapper functions/config
 * objects. Nothing here is new data or new logic; every field is a direct reference to (or a
 * one-line bound call into) code that already existed before this task:
 * - plannerMetadata / dayBuilderConfig / routeOptimizationConfig: the exact same objects
 *   generateBarcelonaSmartPlan.ts used before this refactor (getBarcelonaPlannerPlaces(),
 *   BARCELONA_DAY_BUILDER_CONFIG, BARCELONA_ROUTE_CONFIG).
 * - buildPlanRouteLegs: bound directly to buildBarcelonaPlannerPlanRouteLegs, so the Montjuïc
 *   permanently-unresolved safety guard (see barcelona-planner-route-legs.ts) is reused intact.
 * - accommodationResolver / operationalWarningResolver / presentationResolver: bound directly
 *   to the existing Barcelona functions, unchanged.
 *
 * No route-leg entries, no metadata entries, no cluster/coverage/similarity config, no
 * accommodation patterns, and no operational warnings are duplicated or re-authored here.
 */

function resolvePlaceDisplayName(placeId: string): string {
  return resolvePlannerPlace(placeId, barcelonaGuide)?.place.name ?? placeId;
}

export const BARCELONA_DESTINATION_CONFIG: DestinationConfig = {
  id: "barcelona",
  name: "Barcelona",
  country: "Spain",
  timezone: "Europe/Madrid",
  plannerMetadata: getBarcelonaPlannerPlaces(),
  dayBuilderConfig: BARCELONA_DAY_BUILDER_CONFIG,
  routeOptimizationConfig: BARCELONA_ROUTE_CONFIG,
  buildPlanRouteLegs: buildBarcelonaPlannerPlanRouteLegs,
  accommodationResolver: resolveBarcelonaAccommodationCluster,
  operationalWarningResolver: getBarcelonaPlannerOperationalWarnings,
  presentationResolver: presentBarcelonaSmartPlan,
  resolvePlaceDisplayName,
};
