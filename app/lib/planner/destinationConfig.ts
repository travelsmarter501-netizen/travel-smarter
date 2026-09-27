import type { PlannerPlaceMetadata, PlannerPreferences } from "./plannerTypes";
import type { DayBuilderConfig, GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { RouteConfig } from "./plannerRouteOptimizer";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerOperationalWarning } from "./barcelonaPlannerOperationalWarnings";
import type { PresentedPlannerPlan } from "./plannerPresentationTypes";

/**
 * Smart Planner V2 Phase 1 -- generic per-destination configuration for TravelPlannerEngine
 * (see travelPlannerEngine.ts). Every field here already exists in some Barcelona-named form
 * today; this type only gives the SHAPE a name so a future destination (Rome, etc.) can supply
 * its own config object without the engine itself ever referencing a destination by name.
 *
 * Deliberately does NOT merge Guide content and planner metadata (see barcelona-planner-
 * metadata.ts's own header comment) -- `plannerMetadata` stays the lightweight scoring/
 * clustering layer it already is; full place content (name/hours/image/address) is still
 * resolved separately via readyPlan.ts against a destination's own Guide dataset, which is why
 * `resolvePlaceDisplayName` below is a bound function rather than a Guide reference on this
 * type -- keeping Guide access encapsulated per-destination, never a new dependency on this
 * generic config shape.
 */
export type DestinationConfig = {
  id: string;
  name: string;
  country: string;
  timezone: string;

  /** The destination's planner metadata catalog (e.g. getBarcelonaPlannerPlaces()). A direct
   * reference to the existing array -- never copied. */
  plannerMetadata: PlannerPlaceMetadata[];

  /** Day Builder config: cluster compatibility, similarity groups, coverage goals, iconic
   * tiers (e.g. Barcelona's own BARCELONA_DAY_BUILDER_CONFIG). Passed straight into the
   * generic plannerDayBuilder.ts's buildPlannerPlan -- unchanged, untouched. */
  dayBuilderConfig: DayBuilderConfig;

  /** Route Optimizer config: cluster adjacency + directional order + same-cluster order hints
   * (e.g. Barcelona's own BARCELONA_ROUTE_CONFIG). Passed straight into the generic
   * plannerRouteOptimizer.ts's optimizePlannerPlan -- no destination-specific wrapping logic
   * exists beyond supplying this config plus `plannerMetadata`, so the engine calls that
   * generic function itself using these two fields rather than needing a bound closure here. */
  routeOptimizationConfig: RouteConfig;

  /**
   * Resolves route legs for an already-optimized plan. A BOUND FUNCTION, not raw
   * RouteLegDataEntry[] data -- Barcelona's real implementation
   * (buildBarcelonaPlannerPlanRouteLegs) wraps the generic plannerRouteLegs.ts call with an
   * additional safety rule (the Montjuïc permanently-unresolved guard) that is genuine logic,
   * not pure config data. Reusing the existing bound function directly -- instead of having the
   * engine re-derive the call generically from raw route-leg data -- guarantees that safety
   * rule can never be accidentally dropped by how a destination's config happens to be wired.
   */
  buildPlanRouteLegs: (plan: GeneratedPlannerPlan) => PlannerRouteLeg[][];

  /** Free-text accommodation -> cluster id (e.g. resolveBarcelonaAccommodationCluster).
   * Optional -- a destination with no accommodation-personalization data yet can omit it. */
  accommodationResolver?: (text: string) => string | null;

  /** placeId -> hand-written operational warnings (e.g.
   * getBarcelonaPlannerOperationalWarnings). Optional. Not called by the engine's own pipeline
   * (warnings are looked up live by the presentation/UI layer, exactly as today) -- exposed
   * here only so a destination config is a complete, single source of truth for its own data. */
  operationalWarningResolver?: (placeId: string) => PlannerOperationalWarning[] | undefined;

  /** Destination-specific day titles/summaries/highlights/optional-nearby rules (e.g.
   * presentBarcelonaSmartPlan). Optional, and NOT invoked by generateTravelPlan itself in
   * Phase 1 (see travelPlannerEngine.ts's own comment on why) -- kept as an available config
   * field so a future caller can opt in without this type needing to change again. */
  presentationResolver?: (plan: GeneratedPlannerPlan, preferences: PlannerPreferences) => PresentedPlannerPlan;

  /** Resolves a placeId to its real display name, for the mustVisit-capacity-failure error
   * message. Needs the destination's own Guide dataset -- which stays deliberately decoupled
   * from `plannerMetadata` -- so this is a bound function, never a direct Guide reference on
   * this generic type. */
  resolvePlaceDisplayName: (placeId: string) => string;
};
