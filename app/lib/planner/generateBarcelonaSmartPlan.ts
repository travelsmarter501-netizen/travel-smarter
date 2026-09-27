import { generateTravelPlan, type GenerateTravelPlanResult, type TravelPlan } from "./travelPlannerEngine";
import { BARCELONA_DESTINATION_CONFIG } from "./barcelonaDestinationConfig";
import type { PlannerPreferences } from "./plannerTypes";

/**
 * Smart Planner UI V1 -- single orchestration boundary between the UI and the existing,
 * already-tested planner pipeline (Scoring -> Day Builder -> Route Optimizer -> Transport
 * Legs).
 *
 * Smart Planner V2 Phase 1: this is now a THIN ADAPTER around the generic TravelPlannerEngine
 * (see travelPlannerEngine.ts) + BARCELONA_DESTINATION_CONFIG (see
 * barcelonaDestinationConfig.ts) -- no orchestration logic lives here anymore. Public API
 * (function name, input type, output type/shape) is unchanged from before this refactor, so
 * every existing caller (SmartPlannerApp.tsx, smartPlannerSavedPlans.ts's type re-exports,
 * etc.) keeps working without any change. See the "Phase 1: Generic Engine + Barcelona Config"
 * task's own regression report for the byte-for-byte proof this refactor changes zero output.
 *
 * V1 only supports 3-day plans (the only length the engine has been built and tested
 * against) -- this is not exposed as a parameter on purpose, so the UI can never
 * accidentally request an unsupported length. The generic engine itself accepts a `days`
 * parameter (see travelPlannerEngine.ts) -- this adapter is the ONE place that still always
 * passes the literal `3`, unchanged from before this refactor.
 */

export type SmartPlannerPlan = TravelPlan;
export type GenerateSmartPlanResult = GenerateTravelPlanResult;

export function generateBarcelonaSmartPlan(rawPreferences: PlannerPreferences): GenerateSmartPlanResult {
  return generateTravelPlan(BARCELONA_DESTINATION_CONFIG, rawPreferences, 3);
}
