import { optimizeDayRoute, optimizePlannerPlan } from "./plannerRouteOptimizer";
import type { RouteConfig } from "./plannerRouteOptimizer";
import type { GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";
import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";

/**
 * Barcelona-specific config for the generic Route Optimizer: reuses the Day Builder's own
 * cluster-adjacency map (already vetted, already the source of truth for "how close two
 * clusters logically are"), plus a coarse directional sweep and a few same-cluster order
 * hints. None of this changes which places are selected — that remains the Day Builder's
 * job entirely. A future destination supplies its own version of this file.
 */

// ── Directional order (backtracking detection only — NOT the primary distance metric) ──
//
// A single rough, hand-authored sweep through Barcelona's clusters, following the "suggested
// rough city flow" concept: north/upper city -> central -> a west/southwest detour -> old
// Barcelona/east -> sea. This is explicitly NOT coordinates and NOT precise — it exists only
// so the optimizer can tell whether a route zigzags more than a single directional pass
// would require. The real distance signal is `BARCELONA_CLUSTER_COMPATIBILITY` below.
export const BARCELONA_CLUSTER_DIRECTIONAL_ORDER: string[] = [
  "tibidabo", // north/upper
  "gracia-north",
  "eixample-north",
  "passeig-gracia", // central
  "city-center",
  "les-corts", // west/southwest detour
  "montjuic",
  "old-city", // old Barcelona / east
  "born",
  "seafront", // sea
  "seafront-east",
];

// ── Same-cluster / closely-related order hints ──────────────────────────────────────────
// Soft guidance only (see plannerRouteOptimizer.ts's order-hint cost) — applies whenever the
// listed places coexist in the same day, regardless of which cluster each is actually
// assigned to in the metadata. Not a complete itinerary, just pairwise/sequence preferences.
export const BARCELONA_SAME_CLUSTER_ORDER_HINTS: Record<string, string[]> = {
  "eixample-north": ["sagrada-familia", "sant-pau"],
  "gracia-north": ["park-guell", "bunkers-carmel"],
  "passeig-gracia": ["casa-mila", "casa-batllo", "placa-catalunya"],
};

export const BARCELONA_ROUTE_CONFIG: RouteConfig = {
  clusterAdjacency: BARCELONA_CLUSTER_COMPATIBILITY,
  clusterDirectionalOrder: BARCELONA_CLUSTER_DIRECTIONAL_ORDER,
  sameClusterOrderHints: BARCELONA_SAME_CLUSTER_ORDER_HINTS,
};

export function optimizeBarcelonaDayRoute(day: PlannerDay): PlannerDay {
  return optimizeDayRoute(day, getBarcelonaPlannerPlaces(), BARCELONA_ROUTE_CONFIG);
}

export function optimizeBarcelonaPlannerPlan(plan: GeneratedPlannerPlan): GeneratedPlannerPlan {
  return optimizePlannerPlan(plan, getBarcelonaPlannerPlaces(), BARCELONA_ROUTE_CONFIG);
}
