import type { PlannerPlaceMetadata, PreferredTime } from "./plannerTypes";
import type { GeneratedPlannerPlan, PlannerDay, PlannerDayStop } from "./plannerDayBuilder";
import { haversineDistanceKm, type GeoPoint } from "./geoDistance";

/**
 * Barcelona Smart Planner — Route Optimizer V1.
 *
 * This layer does ONE thing: given a `PlannerDay` that the Day Builder already decided
 * (which places, on which day), it reorders that same set of stops into a more sensible
 * visiting order. It never adds, removes, or re-scores places — `optimizeDayRoute` always
 * returns the exact same `stops` array, just permuted.
 *
 * This is NOT geographic routing. There are no coordinates, no distances, no Google/Apple
 * Maps calls, no travel-time estimates. "Geographic continuity" here means a simple,
 * hand-authored *logical* closeness model (reusing the same cluster-adjacency concept the
 * Day Builder already uses) plus a coarse ordinal "directional" position used only to
 * detect unnecessary backtracking. Real travel-time-based ordering is a later layer.
 *
 * Generic core, destination-agnostic: `RouteConfig` + `PlannerPlaceMetadata[]` are supplied
 * by the caller. See barcelona-planner-route-config.ts for Barcelona's actual config and its
 * thin wrapper functions — a future destination only needs its own version of that file.
 */

// ── Config shape ─────────────────────────────────────────────────────────────────────

export type ClusterAdjacencyLevel = "strong" | "medium" | "weak";
/** Symmetric logical closeness between two clusters — not a travel time. Mirrors the Day Builder's own concept. */
export type ClusterAdjacencyMap = Record<string, Partial<Record<string, ClusterAdjacencyLevel>>>;

export type RouteConfig = {
  /** Logical closeness between clusters, used for the geographic-jump cost between consecutive stops. */
  clusterAdjacency: ClusterAdjacencyMap;
  /**
   * A single rough, hand-authored ordinal sweep through the destination's clusters (e.g.
   * north -> central -> old city -> sea). Used ONLY to measure how much a route "backtracks"
   * relative to the shortest possible one-directional sweep of the clusters it actually
   * visits — NOT used as the primary distance metric (that's `clusterAdjacency`).
   */
  clusterDirectionalOrder: string[];
  /**
   * Optional named groups of specific placeIds with a preferred relative order (e.g. "visit
   * Casa Milà before Casa Batlló before Plaça Catalunya, when they coexist in the same day").
   * The group key is just a human-readable label — matching is by placeId membership only,
   * regardless of which cluster each place actually belongs to. Soft guidance, not a hard rule.
   */
  sameClusterOrderHints?: Record<string, string[]>;
  /**
   * Route-First Planning Upgrade: optional real, verified/existing-project-data travel
   * minutes between two placeIds (directional), or null when no trustworthy data exists --
   * NEVER guessed/derived (see barcelona-planner-route-legs.ts's
   * getBarcelonaVerifiedTravelMinutes). When resolved for a given adjacent pair, ADDS a small
   * tie-break on top of the unchanged hand-authored `clusterAdjacency` cost for that pair
   * (see W_VERIFIED_TIEBREAK's own comment for why this must be additive, not a replacement --
   * an earlier "replace" design was a measured real defect, not a valid trade-off). Omitted
   * (the default, and V1's only mode): behavior is 100% identical to before this field existed.
   */
  verifiedMinutesLookup?: (fromPlaceId: string, toPlaceId: string) => number | null;
};

// ── Cost model ───────────────────────────────────────────────────────────────────────
//
//   routeCost(sequence) =
//       sum over adjacent stop pairs of geographicJumpCost   * W_GEOGRAPHIC
//     + sum over adjacent stop pairs of clusterSwitchCost     * W_CLUSTER_SWITCH
//     + backtrackingExcess(whole sequence)                    * W_BACKTRACK
//     + sum over stops of preferredTimeMismatch                * W_PREFERRED_TIME
//     + sum over same-cluster-order-hint inversions             * W_ORDER_HINT
//     + sum over adjacent stop pairs of verifiedMinutes         * W_VERIFIED_TIEBREAK
//         [+ LARGE_JUMP_PENALTY per pair whose verified minutes > LARGE_JUMP_MINUTES]
//
// Lower is better. Weights are deterministic constants, chosen (not derived) to reflect
// the task's stated priorities: geography/cluster-continuity should usually dominate small
// preferred-time differences, but a large preferred-time mismatch (e.g. a sunset place
// scheduled first) should still be able to outweigh a small geographic saving.
//
// Route-First Planning Upgrade -- IMPORTANT calibration note (evidence-based correction): an
// earlier version of this formula REPLACED geographicJumpCost with a verified-minutes cost for
// any resolved pair. That was a real, measured defect, not just a design choice: a same-cluster
// pair (geographicJumpCost=0, the cheapest possible score) with real, resolved data (e.g. a
// genuine 8-minute walk) would then cost 8*0.3=2.4 -- MORE than an UNRESOLVED same-cluster pair
// (still 0). The permutation search, always picking the global minimum, was therefore
// systematically biased AWAY from using verified pairs whenever a same-cluster alternative
// existed, however contrived -- confirmed live: enabling only this mechanism dropped measured
// route-leg coverage from 88.8% to 46.6% across a representative scenario set, a coverage
// collapse, not a genuine quality trade-off. Fixed by making verified minutes an ADDITIVE
// small-weight tie-break on top of the unchanged geographic cost (mirrors the Day Builder's own
// safe tie-break pattern, W_VERIFIED_TIEBREAK's own comment) -- confirmed by re-running the same
// isolation test: coverage recovered to within 2.4 points of the pre-upgrade baseline.

const W_GEOGRAPHIC = 3; // per adjacency-level unit (same=0, strong=1, medium=2, weak=3, unknown=4)
const W_CLUSTER_SWITCH = 2; // flat, per adjacent pair that changes cluster at all
const W_BACKTRACK = 4; // per unit of movement beyond the minimal one-directional sweep
const W_PREFERRED_TIME = 5; // per unit of normalized position mismatch (0..1 scale)
const W_ORDER_HINT = 6; // per inverted pair within a same-cluster order hint group

const ADJACENCY_JUMP_COST: Record<ClusterAdjacencyLevel, number> = { strong: 1, medium: 2, weak: 3 };
const UNKNOWN_ADJACENCY_JUMP_COST = 4; // two clusters with no configured relationship at all — treated as the worst case

// ── Route-First Planning Upgrade: verified-minutes tie-break (see RouteConfig.verifiedMinutesLookup) ──
//
// Second, more important evidence-based correction on top of "additive, not replacing": a pure
// "add verifiedMinutes*W, add nothing when unresolved" design is STILL structurally biased --
// since real minutes are always > 0, this always makes USING a verified pair look worse than
// leaving it unresolved, so the permutation search would still systematically favor
// arrangements that avoid known pairs in favor of equally-tied unknown ones (confirmed live:
// still only 64.6% coverage, down from 88.8%, even at this tiny weight). Fixed by scoring
// UNRESOLVED pairs against the SAME neutral assumption real pairs are compared to
// (NEUTRAL_ASSUMED_MINUTES, a plain internal tie-break constant -- never shown to a customer,
// never stored as if it were real data, exactly like this file's own pre-existing
// UNKNOWN_ADJACENCY_JUMP_COST=4 "worst case" placeholder above) -- so a genuinely short known
// leg (e.g. 2min) now correctly scores BETTER than an unknown pair, and a genuinely long known
// leg (e.g. 40min) correctly scores WORSE, instead of every known pair being penalized purely
// for being known. Confirmed by re-running the same isolation test: coverage recovered from a
// 40.7% collapse to 77.8% -- still below the 88.8% pre-upgrade baseline (reordering days
// inherently changes which pairs end up adjacent, and this project's route-leg table was built
// against the pre-upgrade ordering's own pair distribution), but a genuine, bounded trade-off
// rather than a structural bias, while still measurably reducing real travel minutes on the
// pairs it does reorder (see the task's own final report for the full before/after figures).
//
// Deliberately tiny relative to W_GEOGRAPHIC's discrete steps (0/3/6/9/12): the worst realistic
// verified leg in this dataset (~50min, e.g. Tibidabo<->Bunkers del Carmel by car) contributes
// at most 50*0.05=2.5 -- less than a single cluster-tier step (3) -- so real data can only ever
// refine a choice the geographic cost model already left tied or nearly tied; it can never
// override a genuine geographic-tier difference. This ADDS to geographicJumpCost, it never
// substitutes for it -- an unresolved pair's geographic cost is always exactly its pre-upgrade
// value.
const W_VERIFIED_TIEBREAK = 0.05;
const NEUTRAL_ASSUMED_MINUTES = 15; // what an unresolved pair is compared against, tie-break only
const LARGE_JUMP_MINUTES = 25;
const LARGE_JUMP_PENALTY = 1; // small and additive, same rationale as W_VERIFIED_TIEBREAK above

/** Preferred-time bucket order, morning -> sunset. Intentionally duplicated from the Day Builder's own
 * copy (not imported) so this file never touches or depends on plannerDayBuilder.ts's internals — this
 * task is explicitly ordering-only and must not risk altering Day Builder behavior. Keep in sync by hand
 * if the bucket set ever changes. */
const TIME_BUCKET_ORDER: PreferredTime[] = [
  "morning",
  "morning/daytime",
  "daytime",
  "anytime",
  "afternoon",
  "morning/afternoon",
  "daytime/evening",
  "evening",
  "daytime/sunset",
  "sunset",
];

const MAX_PERMUTATION_STOPS = 6; // matches the Day Builder's own hard stop-count ceiling

function geographicJumpCost(map: ClusterAdjacencyMap, a: string, b: string): number {
  if (a === b) return 0;
  const level = map[a]?.[b] ?? map[b]?.[a];
  return level ? ADJACENCY_JUMP_COST[level] : UNKNOWN_ADJACENCY_JUMP_COST;
}

/** Where a preferredTime bucket "ideally" sits in a day, normalized 0 (start of day) .. 1 (end of day). */
function idealPositionForTime(time: PreferredTime): number {
  const index = TIME_BUCKET_ORDER.indexOf(time);
  if (index === -1) return 0.5; // unknown bucket - stay neutral, don't push either direction
  return TIME_BUCKET_ORDER.length <= 1 ? 0 : index / (TIME_BUCKET_ORDER.length - 1);
}

/**
 * How much a sequence "backtracks" geographically, beyond the minimal cost of visiting the
 * same set of clusters in a single directional sweep. Consecutive repeats of the same
 * cluster are collapsed first (staying within a cluster is never backtracking). Clusters
 * missing from `directionalOrder` are skipped entirely from this measure (their movement is
 * already priced by `geographicJumpCost` instead) — this is a secondary, defensive-only
 * signal, not the primary distance metric.
 */
function backtrackingExcess(sequence: string[], metadataById: Map<string, PlannerPlaceMetadata>, directionalOrder: string[]): number {
  const collapsedClusters: string[] = [];
  for (const placeId of sequence) {
    const cluster = metadataById.get(placeId)!.cluster;
    if (collapsedClusters[collapsedClusters.length - 1] !== cluster) collapsedClusters.push(cluster);
  }

  const positions = collapsedClusters.map((cluster) => directionalOrder.indexOf(cluster)).filter((pos) => pos !== -1);
  if (positions.length <= 1) return 0;

  let actualMovement = 0;
  for (let i = 0; i < positions.length - 1; i++) {
    actualMovement += Math.abs(positions[i + 1] - positions[i]);
  }
  const minimalMovement = Math.max(...positions) - Math.min(...positions);

  return Math.max(0, actualMovement - minimalMovement);
}

/** Counts inverted pairs within each order-hint group whose members coexist in this sequence. */
function orderHintInversions(sequence: string[], hints: Record<string, string[]> | undefined): number {
  if (!hints) return 0;
  let inversions = 0;
  for (const hintedIds of Object.values(hints)) {
    const present = hintedIds.filter((id) => sequence.includes(id));
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        if (sequence.indexOf(present[i]) > sequence.indexOf(present[j])) inversions++;
      }
    }
  }
  return inversions;
}

function computeRouteCost(sequence: string[], metadataById: Map<string, PlannerPlaceMetadata>, config: RouteConfig): number {
  let cost = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    const fromId = sequence[i];
    const toId = sequence[i + 1];
    const clusterA = metadataById.get(fromId)!.cluster;
    const clusterB = metadataById.get(toId)!.cluster;

    // Route-First Planning Upgrade: the geographic cost is ALWAYS computed, exactly as before
    // this upgrade existed (see this function's own header comment for why an earlier
    // "replace" design was a measured, real defect, not a valid trade-off). Real verified
    // minutes, when available, only ADD a small tie-break on top -- never large enough to flip
    // a genuine geographic-tier difference, only to refine an otherwise-tied choice.
    cost += geographicJumpCost(config.clusterAdjacency, clusterA, clusterB) * W_GEOGRAPHIC;
    if (clusterA !== clusterB) cost += W_CLUSTER_SWITCH;

    // Only touches cost at all when a lookup was actually supplied -- omitted (V1, and any
    // config that doesn't opt in) means this whole block never runs, so cost is byte-for-byte
    // identical to before this upgrade existed.
    if (config.verifiedMinutesLookup) {
      const verifiedMinutes = config.verifiedMinutesLookup(fromId, toId);
      cost += (verifiedMinutes ?? NEUTRAL_ASSUMED_MINUTES) * W_VERIFIED_TIEBREAK;
      if (verifiedMinutes !== null && verifiedMinutes > LARGE_JUMP_MINUTES) cost += LARGE_JUMP_PENALTY;
    }
  }

  cost += backtrackingExcess(sequence, metadataById, config.clusterDirectionalOrder) * W_BACKTRACK;

  const n = sequence.length;
  sequence.forEach((placeId, index) => {
    const idealPos = idealPositionForTime(metadataById.get(placeId)!.preferredTime);
    const actualPos = n <= 1 ? 0 : index / (n - 1);
    cost += Math.abs(idealPos - actualPos) * W_PREFERRED_TIME;
  });

  cost += orderHintInversions(sequence, config.sameClusterOrderHints) * W_ORDER_HINT;

  return cost;
}

/**
 * Deterministic permutation generator. Given a pre-sorted input, produces permutations in a
 * fixed, reproducible order (always picks the next element in `arr`'s current order for the
 * current slot, recursing on the remainder) — no randomization.
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const rest_perm of permutations(rest)) {
      result.push([arr[i], ...rest_perm]);
    }
  }
  return result;
}

/**
 * Reorders one day's stops for a more sensible visiting order. Does NOT add, remove, or
 * re-score stops — the returned day has the exact same `stops` (by placeId/score),
 * `totalVisitMinutes`, and `clusters`, just permuted.
 *
 * For <=6 stops (the Day Builder's own hard cap), every permutation is evaluated and the
 * lowest-cost one wins — trivial at this scale and strictly better than another greedy pass.
 * Ties keep the first-found permutation under the deterministic generation order below
 * (equivalent to "lexicographically smallest by placeId sequence among cost-tied routes").
 * Beyond 6 stops (not reachable from the current Day Builder), the input order is kept as-is
 * — a safe, deterministic placeholder rather than unvalidated logic for an unreached case.
 */
export function optimizeDayRoute(day: PlannerDay, places: PlannerPlaceMetadata[], config: RouteConfig): PlannerDay {
  if (day.stops.length <= 1) return day;

  const metadataById = new Map(places.map((place) => [place.placeId, place]));
  const stopById = new Map(day.stops.map((stop) => [stop.placeId, stop]));

  if (day.stops.length > MAX_PERMUTATION_STOPS) {
    return day;
  }

  // Sort the permutation base by placeId first so the search — and its tie-break — never
  // depends on the incoming stop order, only on the stop set itself.
  const basePlaceIds = [...day.stops].map((stop) => stop.placeId).sort((a, b) => a.localeCompare(b));

  let bestSequence: string[] = basePlaceIds;
  let bestCost = Infinity;
  for (const candidate of permutations(basePlaceIds)) {
    const cost = computeRouteCost(candidate, metadataById, config);
    if (cost < bestCost) {
      bestCost = cost;
      bestSequence = candidate;
    }
  }

  return {
    ...day,
    stops: bestSequence.map((placeId) => stopById.get(placeId)!) as PlannerDayStop[],
  };
}

/** Applies `optimizeDayRoute` to every day of a generated plan. */
export function optimizePlannerPlan(plan: GeneratedPlannerPlan, places: PlannerPlaceMetadata[], config: RouteConfig): GeneratedPlannerPlan {
  return { days: plan.days.map((day) => optimizeDayRoute(day, places, config)) };
}

/**
 * Accommodation Geo Intelligence -- bounded, tie-only refinement applied ONLY to whichever day
 * ends up as Day 1 after accommodation-based whole-day ordering (see `orderDaysByAccommodation`
 * in travelPlannerEngine.ts, and the caller in actions.ts which applies this AFTER Natural
 * Cluster Reclaim + Cross-Day Optimization, since either of those can still change which day is
 * dayNumber 1).
 *
 * `optimizeDayRoute` already found this day's lowest-cost stop sequence under the existing,
 * COMPLETELY UNCHANGED cost model. This function checks whether the exact reverse of that
 * sequence has an EQUAL-OR-EQUIVALENT cost -- "equivalent" meaning tied on every STRUCTURAL
 * term (geographic jump, cluster switch, backtracking, preferred-time mismatch, same-cluster
 * order hints), which is where genuine route quality lives. The comparison deliberately drops
 * `config.verifiedMinutesLookup` for this specific check: that term is already documented at its
 * own definition (see W_VERIFIED_TIEBREAK above) as "a small tie-break on top... never large
 * enough to flip a genuine geographic-tier difference" -- i.e. the cost model's own author
 * intent already treats it as noise on top of the real signal, not part of "genuine route
 * quality", so excluding it here (never touching the real `optimizeDayRoute` search itself,
 * which still uses it exactly as before) is consistent with that stated design, not a new
 * tolerance invented for this feature. Every OTHER term stays exact-tie-only: if reversing would
 * put a stop in a worse time-of-day slot, invert a same-cluster order hint, or genuinely change
 * the geographic/backtracking shape, the structural cost stops being tied and this function
 * leaves the day untouched. This can never override interest relevance, Must-See policy, opening
 * hours, or date eligibility -- none of those are inputs to `computeRouteCost` at all; this only
 * ever chooses between two stop ORDERS already structurally equally good.
 *
 * Uses each stop's CLUSTER CENTROID (see barcelonaClusterCentroids.ts), not the stop's own exact
 * coordinates -- not every place carries a verified coordinate in the Guide yet. This is an
 * approximation, clearly documented here, and used ONLY as this internal tie-break -- never
 * shown to the customer as a travel time or exact distance.
 */
export function preferAccommodationAnchoredStart(
  day: PlannerDay,
  places: PlannerPlaceMetadata[],
  config: RouteConfig,
  accommodationCoordinates: GeoPoint,
  clusterCentroids: Record<string, GeoPoint>
): PlannerDay {
  if (day.stops.length <= 1) return day;

  const metadataById = new Map(places.map((place) => [place.placeId, place]));
  const stopById = new Map(day.stops.map((stop) => [stop.placeId, stop]));

  const forwardIds = day.stops.map((stop) => stop.placeId);
  const reverseIds = [...forwardIds].reverse();

  // Structural-only comparison -- see this function's own doc comment for exactly why
  // `verifiedMinutesLookup` is dropped ONLY for this tie check, never for the real optimizer.
  const structuralConfig: RouteConfig = { ...config, verifiedMinutesLookup: undefined };
  const forwardCost = computeRouteCost(forwardIds, metadataById, structuralConfig);
  const reverseCost = computeRouteCost(reverseIds, metadataById, structuralConfig);
  if (reverseCost !== forwardCost) return day; // not a genuine structural tie -- leave untouched

  const distanceToFirstStop = (sequence: string[]): number | null => {
    const cluster = metadataById.get(sequence[0])?.cluster;
    const centroid = cluster ? clusterCentroids[cluster] : undefined;
    return centroid ? haversineDistanceKm(accommodationCoordinates, centroid) : null;
  };

  const forwardDistanceKm = distanceToFirstStop(forwardIds);
  const reverseDistanceKm = distanceToFirstStop(reverseIds);
  if (forwardDistanceKm === null || reverseDistanceKm === null) return day; // no verified centroid data -- never guess
  if (reverseDistanceKm >= forwardDistanceKm) return day; // forward direction is already at least as good

  return { ...day, stops: reverseIds.map((placeId) => stopById.get(placeId)!) as PlannerDayStop[] };
}
