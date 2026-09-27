import { BARCELONA_DESTINATION_CONFIG } from "./barcelonaDestinationConfig";
import { getBarcelonaV2PlannerPlaces } from "./barcelonaV2Metadata";
import { getBarcelonaVerifiedTravelMinutes } from "./barcelona-planner-route-legs";
import type { DestinationConfig } from "./destinationConfig";

/**
 * Smart Planner V2 Phase 4 -- the V2-only destination config: identical to
 * BARCELONA_DESTINATION_CONFIG (same buildPlanRouteLegs, accommodationResolver,
 * operationalWarningResolver, presentationResolver -- every one of those is reused
 * byte-for-byte, unchanged) EXCEPT `plannerMetadata` (the expanded 36-entry V2 pool, see
 * barcelonaV2Metadata.ts) and, as of the Route-First Planning Upgrade, `dayBuilderConfig` /
 * `routeOptimizationConfig`, which now ALSO opt into real verified-minutes-aware selection
 * tie-breaking and ordering (see plannerDayBuilder.ts's `getVerifiedTravelMinutes` and
 * plannerRouteOptimizer.ts's `verifiedMinutesLookup`) on top of the shared base config. Every
 * other field on those two configs (cluster compatibility, similarity groups, coverage goals,
 * directional order, order hints) is still spread from the exact same shared objects V1 uses,
 * unchanged.
 *
 * V1 (generateBarcelonaSmartPlan.ts) never imports this file and keeps using
 * BARCELONA_DESTINATION_CONFIG directly -- this is a genuinely separate, additive object, not
 * a mutation of the shared one, so V1's day-building and route-ordering behavior is completely
 * unaffected by this upgrade (see the Route-First Planning Upgrade task's own regression proof
 * against V1's unmodified output).
 *
 * Tibidabo/Bunkers Audit (see that task's report): a same-day discouragement for
 * tibidabo/bunkers-carmel was implemented and evidence-tested here, but was REVERTED -- a
 * boolean same-day gate in the Day Builder's tryAdd/coverage-repair/density-rebalance choke
 * points could not express "discourage, but still allow as a last resort in the ~4 cases where
 * separating them makes a day worse" without a hard block that regressed exactly those cases
 * (new veryThin 1-stop Tibidabo days) and rippled into unrelated days/scenarios. No planner
 * logic change was kept for this finding; see the task report for the full evidence trail.
 */
export const BARCELONA_V2_DESTINATION_CONFIG: DestinationConfig = {
  ...BARCELONA_DESTINATION_CONFIG,
  plannerMetadata: getBarcelonaV2PlannerPlaces(),
  dayBuilderConfig: {
    ...BARCELONA_DESTINATION_CONFIG.dayBuilderConfig,
    getVerifiedTravelMinutes: getBarcelonaVerifiedTravelMinutes,
  },
  routeOptimizationConfig: {
    ...BARCELONA_DESTINATION_CONFIG.routeOptimizationConfig,
    verifiedMinutesLookup: getBarcelonaVerifiedTravelMinutes,
  },
};
