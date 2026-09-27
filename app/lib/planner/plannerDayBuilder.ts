import { rankPlaces } from "./plannerScoring";
import type { ScoredPlannerPlace } from "./plannerScoring";
import type { PlannerInterest, PlannerPlaceMetadata, PlannerPreferences, PreferredTime } from "./plannerTypes";

/**
 * Barcelona Smart Planner -- Day Builder V1.3 (real mustVisit support).
 *
 * Deterministic, logical day composition on top of the existing scoring engine. This is
 * NOT geographic routing: no coordinates, no Google/Apple Maps calls, no travel-time
 * estimation. It only decides *which* places go on *which* day and in what order, using
 * score + priority + cluster + visitDurationMinutes + preferredTime + diversification.
 *
 * The core (`buildPlannerPlan`) takes a plain `PlannerPlaceMetadata[]` plus a destination
 * config object and never references Barcelona -- see barcelona-planner-day-builder.ts for
 * the Barcelona-specific cluster map / iconic tiers / similarity groups / coverage goals
 * and its thin `buildBarcelonaPlannerPlan` wrapper.
 *
 * -- What changed from V1.2 -----------------------------------------------------------
 * `request.preferences.mustVisit` (user-selected placeIds, validated against trip capacity --
 * see plannerScoring.ts) is now a REAL, top-priority
 * guarantee, not a UI-only label: every valid mustVisit place is boosted for the initial
 * greedy build, protected from similarity-cap exclusion up front, and -- if still missing
 * after the greedy build -- inserted by the same coverage-repair pass used for required-
 * interest/Tier-A coverage, but running FIRST so it outranks everything else. See
 * `applyCoverageRepairs` for the full, updated priority order. Whether every mustVisit
 * place actually made it into the plan is checked by the caller (see
 * generateBarcelonaSmartPlan.ts) -- this module never fabricates a plan that violates the
 * normal density/cluster limits just to force one in.
 *
 * -- What changed from V1.1 to V1.2 (still true) ---------------------------------------
 * 1. Coverage was split into two concepts: a "boost" (nudges selection priority, no
 *    guarantee -- the existing `CoverageGoal`) and a real post-selection GUARANTEE
 *    (`RequiredCoverageGoal` / `TierCoverageGoal`), resolved by a deterministic repair
 *    pass after the initial greedy build. A boost alone could still lose a geographically
 *    isolated place (e.g. Camp Nou) to the greedy fill order; the repair pass cannot.
 * 2. The 420-minute soft upper is now an UNCONDITIONAL ceiling for normal generation --
 *    checked regardless of current stop count. `HARD_MINUTES_CEILING` (480) is kept only
 *    as an unused emergency constant -- normal generation and the repair pass both cap at 420.
 */

// -- Input/output types ----------------------------------------------------------------

// V2 Phase 3A: widened from the original `1 | 3 | 5` literal union to a plain `number`, so the
// generic engine can accept validated day counts up to 10 (see the Day Builder's own `for`
// loop below, which was already parametrized over `request.days` and never assumed exactly 3
// -- only the TYPE was restrictive, not the logic). This is a type-only relaxation: nothing in
// this file's runtime behavior changes for any caller that already passed 1, 3, or 5. Bounds
// checking (integer, 1-10) is intentionally NOT enforced here -- it belongs at the trusted
// input boundary that constructs this request (e.g. a Server Action), matching every other
// "never trust client input" boundary already established elsewhere in this project. Every
// current caller (generateBarcelonaSmartPlan.ts's adapter always passes literal 3; a future
// V2 Server Action validates 1-10 before ever constructing this object) already guarantees a
// safe positive integer, so no redundant guard is added here.
export type PlannerBuildRequest = {
  days: number;
  preferences: PlannerPreferences;
};

export type PlannerDayStop = {
  placeId: string;
  /** The real, unmodified score from the scoring engine -- never boosted by day-builder heuristics. */
  score: number;
};

export type PlannerDay = {
  dayNumber: number;
  stops: PlannerDayStop[];
  totalVisitMinutes: number;
  clusters: string[];
};

export type GeneratedPlannerPlan = {
  days: PlannerDay[];
};

// -- Destination-specific configuration (Barcelona's own values live in the sibling file) --

/** Symmetric closeness/compatibility between two clusters. Not a travel time -- a logical layer only. */
export type ClusterCompatibilityLevel = "strong" | "medium" | "weak";
export type ClusterCompatibilityMap = Record<string, Partial<Record<string, ClusterCompatibilityLevel>>>;

/** A group of functionally-similar places (e.g. "the 3 beaches") the builder should avoid over-selecting from. */
export type SimilarityGroup = {
  id: string;
  placeIds: string[];
  /** Max places from this group allowed in the whole plan, by default. */
  maxByDefault: number;
  /** If set, selecting this interest raises the cap to `maxWithInterest`. */
  unlockedByInterest?: PlannerInterest;
  maxWithInterest?: number;
};

/** When `interest` is selected, nudge these places up in selection priority (used only for ordering, never the reported score). No guarantee -- see RequiredCoverageGoal / TierCoverageGoal for guaranteed coverage, and mustVisit for the strongest guarantee of all. */
export type CoverageGoal = {
  interest: PlannerInterest;
  placeIds: string[];
  minimumCoverage: number;
  boost: number;
};

/**
 * V1.2: a selected interest with one or more dedicated "anchor" places that must actually
 * survive into the final plan, not just receive a scoring boost. `candidates` is an ordered
 * preference list (first one present in the metadata pool is the one guaranteed); this does
 * NOT pin a fixed day or route position -- the repair pass places it wherever fits best.
 */
export type RequiredCoverageGoal = {
  interest: PlannerInterest;
  candidates: string[];
  minCoverage: number;
};

/**
 * V1.2: a named tier of places (e.g. Popular's Tier A icons) that should reach a minimum
 * count across the whole plan via deterministic post-selection repair, not just a boost.
 */
export type TierCoverageGoal = {
  interest: PlannerInterest;
  tierPlaceIds: string[];
  minCoverage: number;
};

/**
 * Must-See Priority Audit: a coverage guarantee that applies regardless of which interests the
 * customer selected -- unlike RequiredCoverageGoal/TierCoverageGoal/CoverageGoal, which only
 * ever activate `if (preferences.interests.includes(goal.interest))`. This exists because a
 * destination's single most iconic landmark (e.g. Barcelona's Sagrada Família) should have
 * exceptionally strong priority independent of interest selection -- a Food-only or
 * Shopping-only visitor to Barcelona should still very likely see it, not receive zero
 * elevated priority for it just because "popular"/"cultureLocal" wasn't picked (see
 * barcelonaMustSeePolicy.ts for the full root-cause finding and Barcelona's own flagship list).
 * `candidates`/`minCoverage` mirror RequiredCoverageGoal's own shape exactly (ordered
 * preference list, first present-in-metadata wins); `boost` is added to selection priority
 * during the initial greedy build (see buildPlannerPlan) so inclusion happens naturally in the
 * common case, with the repair-pass guarantee below only as a backstop for the rest. Optional
 * and additive: a destination that never sets this field behaves exactly as before.
 */
export type FlagshipCoverageGoal = {
  candidates: string[];
  minCoverage: number;
  boost: number;
};

/**
 * Round 2 Fix (Shopping Personalization): a bounded, NON-flagship, NON-interest-keyed coverage
 * guarantee -- unlike RequiredCoverageGoal/TierCoverageGoal (both keyed on the legacy
 * PlannerInterest, which cannot distinguish V2's separate shopping/food/nightlife selections --
 * see v2InterestAdapter.ts) and unlike FlagshipCoverageGoal (interest-INDEPENDENT, always
 * active). A SecondaryCoverageGoal is supplied per-request by the caller (see
 * barcelonaV2PersonalizationScoring.ts's buildBarcelonaV2ShoppingCoverageGoals), which already
 * decides both WHETHER it applies (only when the customer's real, un-collapsed interest
 * selection warrants it) and its minCoverage (e.g. scaled by trip length) -- this file never
 * inspects preferences.interests for it, unlike every other coverage-goal type. Resolved via
 * the exact same attemptCoverageSwap machinery as every other guarantee, at LOWER priority
 * than mustVisit/flagship/required-interest/Tier-A (see applyCoverageRepairs's own priority-order
 * comment) -- so it can never displace any of those, and is honestly left unsatisfied (never
 * forced) when no valid swap exists. Optional and additive: a destination/request that never
 * sets this field behaves exactly as before.
 */
export type SecondaryCoverageGoal = {
  candidates: string[];
  minCoverage: number;
};

export type DayBuilderConfig = {
  clusterCompatibility: ClusterCompatibilityMap;
  similarityGroups: SimilarityGroup[];
  coverageGoals: CoverageGoal[];
  /**
   * Ordered iconic tiers, best first (e.g. [tierA, tierB]). Used only to break ties when a
   * similarity-group cap must exclude some members -- an untiered place always loses that
   * tie-break against a tiered one. Optional: omit for destinations with no tier concept yet.
   */
  iconicTiers?: string[][];
  /** V1.2 -- see RequiredCoverageGoal. Optional: omit for destinations with no required anchors yet. */
  requiredCoverageGoals?: RequiredCoverageGoal[];
  /** V1.2 -- see TierCoverageGoal. Optional: omit for destinations with no tier-guarantee concept yet. */
  tierCoverageGoals?: TierCoverageGoal[];
  /** Must-See Priority Audit -- see FlagshipCoverageGoal. Optional: omit for destinations with no interest-independent flagship concept yet. */
  flagshipCoverageGoals?: FlagshipCoverageGoal[];
  /**
   * Fix Repetitive Montjuïc Day -- see SECOND_LONG_EXPERIENCE_SAME_CLUSTER_VALUE_FACTOR's own
   * doc comment. Cluster ids named here (never placeIds) opt into the "a second long experience
   * in this same cluster must earn its place" gate; every other cluster keeps the exact prior
   * behavior. Optional: omit (the default) for a destination with no such cluster yet.
   */
  secondLongExperienceGateClusters?: ReadonlySet<string>;
  /**
   * V2 Phase 3A: optional per-place, per-day eligibility gate, consulted at every point this
   * file could assign a place to a specific day (initial greedy fill, coverage-repair swaps,
   * density-rebalance moves/adds). `dayNumber` is 1-based, matching `PlannerDay.dayNumber`
   * everywhere else in this file.
   *
   * Omitted (the default): every place is eligible for every day, which is EXACTLY the
   * behavior this file already had before this field existed -- the two `config.
   * isPlaceEligibleForDay && ...` checks below are unreachable when this is undefined, so an
   * omitted callback cannot change output for any existing config (see the Phase 3A task
   * report's own regression proof against V1's unmodified BARCELONA_DAY_BUILDER_CONFIG, which
   * never sets this field).
   *
   * Intended use: Barcelona's V2 specific-date mode supplies a per-REQUEST callback (built
   * fresh for each arrivalDate) that excludes a place from a day when its real Guide opening
   * hours show it closed on that day's actual weekday -- see
   * barcelonaV2DateEligibility.ts. Destination-agnostic by design: this file never reads
   * calendar dates, weekdays, or opening-hours data itself, only calls the callback it's
   * given.
   */
  isPlaceEligibleForDay?: (placeId: string, dayNumber: number) => boolean;
  /**
   * Route-First Planning Upgrade: optional real, verified/existing-project-data travel
   * minutes between two placeIds (directional), or null when no trustworthy data exists for
   * that exact pair -- NEVER a guessed/derived number (see barcelona-planner-route-legs.ts's
   * getBarcelonaVerifiedTravelMinutes, the only implementation, which also honors the
   * permanent Montjuïc guard). When present, used ONLY as a secondary tie-break inside the
   * fill loop's own candidate sort below -- checked AFTER cluster-compatibility level, BEFORE
   * priority/score -- so it can only ever resolve an existing tie, never override interest
   * relevance, must-see guarantees, hours eligibility, or the cluster-compatibility filter
   * itself. Omitted (the default, and V1's only mode): behavior is 100% identical to before
   * this field existed.
   */
  getVerifiedTravelMinutes?: (fromPlaceId: string, toPlaceId: string) => number | null;
  /**
   * P1 Personalization Fix (Shopping/Nightlife) -- optional per-place selection-priority bonus,
   * computed by the caller from information the legacy `PlannerInterest` model has already lost
   * by the time it reaches here (V2's distinct "shopping"/"food"/"nightlife" keys all collapse
   * onto the single legacy `foodShoppingNightlife` interest before this file ever sees them --
   * see v2InterestAdapter.ts). `CoverageGoal` above can't express this: it's keyed on
   * `PlannerInterest`, so a goal keyed on `foodShoppingNightlife` would fire identically for
   * Food, Shopping, AND Nightlife. This callback lets a caller add priority for specific
   * placeIds using whatever finer-grained signal it actually has (e.g. barcelonaV2Personalization
   * ScoringPolicy.ts, built from the real, un-collapsed V2 interest selection).
   *
   * Added directly into `selectionPriority` (ordering/inclusion only, same as the coverage-goal
   * boosts above -- never the reported `score`), so a boosted candidate still has to survive
   * every existing route-quality mechanism (cluster compatibility, density limits, similarity
   * caps, Must-See guarantees) completely unchanged -- this can shift WHICH candidates compete
   * for a slot, never bypass how slots are decided. Omitted (the default, and V1's only mode):
   * behavior is 100% identical to before this field existed.
   */
  placeSelectionBonus?: (placeId: string) => number;
  /** Round 2 Fix -- see SecondaryCoverageGoal's own doc comment. Optional: omit for a
   * destination/request with no such target (the default, and every non-Shopping-selecting V2
   * request, and all of V1). */
  secondaryCoverageGoals?: SecondaryCoverageGoal[];
};

// Daily density targets -- see file header point 2.
const PREFERRED_MIN_STOPS_PER_DAY = 4;
const PREFERRED_MAX_STOPS_PER_DAY = 5;
const EXTENDED_MAX_STOPS_PER_DAY = 6; // only reachable under the extra conditions in `canExtendToSixthStop`
const SOFT_MINUTES_TARGET = 390; // once at/above this AND at the preferred stop count, only high-value additions continue
const SOFT_MINUTES_UPPER = 420; // the real, unconditional cap for normal generation AND repair (including mustVisit) -- never exceeded
/**
 * Kept only as an unused emergency constant per the V1.2 task spec ("keep 480 only as an
 * internal emergency constant if architecture requires it"). Nothing in normal generation
 * or the repair pass references this anymore -- SOFT_MINUTES_UPPER (420) is the real cap.
 */
export const HARD_MINUTES_CEILING = 480;
const MAX_CLUSTERS_PER_DAY = 3; // hard limit
const PREFERRED_MAX_CLUSTERS_PER_DAY = 2; // a 3rd cluster requires meaningful value (see `isWorthAdding`)

// Value-density thresholds. Deterministic heuristics, not ML.
const CONTINUE_VALUE_FACTOR = 0.6; // once preferred targets are met, a candidate needs >= 60% of the day's current average priority
const THIRD_CLUSTER_VALUE_FACTOR = 1.0; // introducing a 3rd cluster needs >= 100% of the day's current average priority
/**
 * Fix Repetitive Montjuïc Day: within a destination-opted-in cluster (see DayBuilderConfig.
 * secondLongExperienceGateClusters), a SECOND genuinely-long (>=LONG_EXPERIENCE_MIN_MINUTES)
 * stop joining an already-selected long stop's SAME cluster needs to clearly earn its place,
 * exactly like a 3rd cluster does above -- generalizing the same "same cluster is a free pass
 * while a day is still filling up" gap that let a low-scoring long experience (e.g. Montjuïc,
 * 180min) ride in behind a stronger one in the same cluster (e.g. MNAC, also 180min) with zero
 * value-competition, purely because same-cluster fill has no other gate before a day is full.
 *
 * Deliberately opt-in PER CLUSTER (not applied everywhere two long same-cluster stops could
 * meet) -- an early version applied this unconditionally to every cluster and was found, via
 * this task's own regression run, to also gate an unrelated, already-fine old-city pairing
 * (gaudi-bike-tour 210min + gothic-quarter-tapas-wine-tour 180min) that was never part of the
 * measured problem, occasionally splitting it apart and creating a NEW thin day elsewhere. This
 * file stays fully destination-agnostic (never references a Barcelona cluster name itself) --
 * see barcelona-planner-day-builder.ts for the one place that opts "montjuic" in, based on the
 * specific 23/24-co-occurrence evidence measured there.
 */
const SECOND_LONG_EXPERIENCE_SAME_CLUSTER_VALUE_FACTOR = 1.0;

/** V1.3: added to a mustVisit place's selection priority for the initial greedy build --
 * large enough to dominate the normal score range, so mustVisit places are strongly
 * preferred as anchors/fill candidates and the repair pass is only needed as a fallback,
 * not the primary mechanism. The repair pass (not this boost) is the actual guarantee. */
const MUST_VISIT_BOOST = 1000;

/** V1.5: primary-interest-gated long-experience reservation thresholds -- see
 * `isEligibleLongExperience` below for the full rule and rationale. */
const LONG_EXPERIENCE_MIN_MINUTES = 150;
const LONG_EXPERIENCE_MIN_WEIGHT = 9;

const COMPATIBILITY_SCORE: Record<ClusterCompatibilityLevel, number> = { strong: 3, medium: 2, weak: 1 };
const SAME_CLUSTER_SCORE = 4;

/** Preferred-time bucket order -- sunset/evening late in the day, morning first. Exactly the order requested. */
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

function clusterCompatibility(map: ClusterCompatibilityMap, a: string, b: string): number {
  if (a === b) return SAME_CLUSTER_SCORE;
  const level = map[a]?.[b] ?? map[b]?.[a];
  return level ? COMPATIBILITY_SCORE[level] : 0;
}

/** Deterministic fallback tie-break shared with the scoring engine's own ordering. */
function baseTieBreak(a: ScoredPlannerPlace, b: ScoredPlannerPlace): number {
  if (b.metadata.priority !== a.metadata.priority) return b.metadata.priority - a.metadata.priority;
  if (b.metadata.weights.popular !== a.metadata.weights.popular) return b.metadata.weights.popular - a.metadata.weights.popular;
  return a.placeId.localeCompare(b.placeId);
}

/** Sum of metadata.weights for only the currently-selected interests -- used by similarity-group resolution. */
function interestScoreOf(metadata: PlannerPlaceMetadata, preferences: PlannerPreferences): number {
  return preferences.interests.reduce((sum, interest) => sum + metadata.weights[interest], 0);
}

/**
 * V1.5: the single strongest-weighted interest for a place, considering ONLY the customer's
 * selected interests (never one they didn't choose). Deterministic tie-break: the
 * alphabetically-first interest key wins -- no randomness, no priority-based tie-break needed
 * since this only feeds `isEligibleLongExperience` below, which already requires an exact
 * `primaryInterest` match regardless of how close a tie was.
 */
function strongestInterestOf(metadata: PlannerPlaceMetadata, preferences: PlannerPreferences): { interest: PlannerInterest | null; weight: number } {
  let best: PlannerInterest | null = null;
  let bestWeight = -Infinity;
  for (const interest of preferences.interests) {
    const weight = metadata.weights[interest];
    if (best === null || weight > bestWeight || (weight === bestWeight && interest.localeCompare(best) < 0)) {
      best = interest;
      bestWeight = weight;
    }
  }
  return { interest: best, weight: best === null ? 0 : bestWeight };
}

/**
 * V1.5: whether `placeId` may be RESERVED early (right after a day's anchor, before normal
 * same-cluster fill -- see the reservation step in `buildPlannerPlan`) as a long-experience
 * anchor. This is a PREFERENCE, never a guarantee: it only lets a genuinely long (>=150min),
 * primary-interest-defining experience skip ahead of the normal score-ordered fill queue, so
 * it isn't rejected purely because several shorter same-cluster stops already consumed the
 * day's 420-minute budget by the time its own (already-competitive) score would otherwise come
 * up -- see the "Long Experience / Day Budget Diagnosis" task's report for the exact mechanism
 * this fixes. It does NOT touch cluster compatibility, similarity caps, or the 420-minute cap
 * -- the caller's normal `tryAdd` still enforces all of those unconditionally on every call,
 * reservation or not. Requires an EXACT primaryInterest match (not just "one of the selected
 * interests"), per the "Primary Interest Design Audit" task's finding that a looser rule leaks
 * a long experience into profiles where its interest is only secondary (e.g. Cook & Taste
 * appearing in a beach-primary trip merely because foodShoppingNightlife was also selected).
 * A place already covered by `mustVisit` is excluded -- it's already guaranteed a different,
 * stronger way, and doesn't need (or benefit from) this preference.
 */
function isEligibleLongExperience(
  placeId: string,
  byId: Map<string, ScoredPlannerPlace>,
  preferences: PlannerPreferences,
  mustVisitPlaceIds: ReadonlySet<string>
): boolean {
  const primaryInterest = preferences.primaryInterest;
  if (!primaryInterest) return false;
  if (mustVisitPlaceIds.has(placeId)) return false;
  const metadata = byId.get(placeId)!.metadata;
  if (metadata.visitDurationMinutes < LONG_EXPERIENCE_MIN_MINUTES) return false;
  const { interest, weight } = strongestInterestOf(metadata, preferences);
  return interest === primaryInterest && weight >= LONG_EXPERIENCE_MIN_WEIGHT;
}

/** Index of the first tier containing `placeId` (0 = best), or `Infinity` if untiered/not found. */
function tierRankOf(iconicTiers: string[][] | undefined, placeId: string): number {
  if (!iconicTiers) return Infinity;
  const index = iconicTiers.findIndex((tier) => tier.includes(placeId));
  return index === -1 ? Infinity : index;
}

/**
 * Resolves every similarity group's cap ONCE, up front, using an explicit priority order:
 * 1. mustVisit membership (a user-selected place ALWAYS outranks a non-mustVisit one --
 *    V1.3: this runs before the pre-selection exclusion pass even sees the group, so a
 *    mustVisit place can never be silently excluded before the repair pass gets a chance
 *    to protect it; see the file header and the "Casa Mila must survive" example in the
 *    mustVisit task spec)
 * 2. iconic tier (lower/better tier wins)
 * 3. the place's score against only the user's selected interests
 * 4. metadata priority
 * 5. full computed score
 * 6. placeId (deterministic final tie-break)
 *
 * Returns the set of placeIds that must be excluded because their group is over capacity --
 * decided independently of build order. A mustVisit place is NEVER added to this set, even
 * if that means the group temporarily holds more than its normal cap (mustVisit places are
 * capped against the whole trip's real capacity by validation -- see plannerScoring.ts --
 * so this can't runaway).
 */
function resolveSimilarityExclusions(
  ranked: ScoredPlannerPlace[],
  preferences: PlannerPreferences,
  groups: SimilarityGroup[],
  iconicTiers: string[][] | undefined,
  mustVisitPlaceIds: ReadonlySet<string>,
  flagshipPlaceIds: ReadonlySet<string> = new Set()
): Set<string> {
  const byId = new Map(ranked.map((entry) => [entry.placeId, entry]));
  const excluded = new Set<string>();

  for (const group of groups) {
    const cap =
      group.unlockedByInterest && preferences.interests.includes(group.unlockedByInterest)
        ? (group.maxWithInterest ?? group.maxByDefault)
        : group.maxByDefault;

    const members = group.placeIds.filter((id) => byId.has(id));
    if (members.length <= cap) continue; // group isn't over capacity, nothing to resolve

    const sortedByPriority = [...members].sort((a, b) => {
      const mustVisitDiff = Number(mustVisitPlaceIds.has(b)) - Number(mustVisitPlaceIds.has(a));
      if (mustVisitDiff !== 0) return mustVisitDiff;

      // Must-See Priority Audit: a flagship place (e.g. Sagrada Família) ranks right after an
      // actual user-selected mustVisit, ABOVE plain iconic-tier membership -- otherwise a
      // similarity group already full of other tier-0 places (e.g. "gaudi-core" without
      // cultureLocal selected) could still silently exclude it via an ordinary interest-score
      // tie-break, defeating the whole point of an interest-independent guarantee.
      const flagshipDiff = Number(flagshipPlaceIds.has(b)) - Number(flagshipPlaceIds.has(a));
      if (flagshipDiff !== 0) return flagshipDiff;

      const tierDiff = tierRankOf(iconicTiers, a) - tierRankOf(iconicTiers, b);
      if (tierDiff !== 0) return tierDiff;

      const metaA = byId.get(a)!.metadata;
      const metaB = byId.get(b)!.metadata;
      const interestDiff = interestScoreOf(metaB, preferences) - interestScoreOf(metaA, preferences);
      if (interestDiff !== 0) return interestDiff;

      if (metaB.priority !== metaA.priority) return metaB.priority - metaA.priority;
      if (byId.get(b)!.score !== byId.get(a)!.score) return byId.get(b)!.score - byId.get(a)!.score;
      return a.localeCompare(b);
    });

    for (const loserId of sortedByPriority.slice(cap)) {
      if (mustVisitPlaceIds.has(loserId)) continue; // never pre-exclude a mustVisit place
      if (flagshipPlaceIds.has(loserId)) continue; // never pre-exclude a flagship must-see either
      excluded.add(loserId);
    }
  }

  return excluded;
}

type DayBuildState = {
  stopIds: string[];
  clusters: string[];
  totalMinutes: number;
};

/** Average selection priority of the stops already placed in this day (0 if empty). */
function averagePriorityOfDay(state: DayBuildState, selectionPriority: Map<string, number>): number {
  if (state.stopIds.length === 0) return 0;
  const sum = state.stopIds.reduce((acc, id) => acc + (selectionPriority.get(id) ?? 0), 0);
  return sum / state.stopIds.length;
}

/**
 * The V1.1 "marginal value" gate: once a day already has a reasonable shape, further
 * additions must earn their place instead of padding toward a stop-count target.
 * Deterministic and simple -- no learning, just clear thresholds. The 420-minute cap itself
 * is enforced unconditionally by the caller (`tryAdd`) before this is even consulted.
 */
function isWorthAdding(
  state: DayBuildState,
  candidatePriority: number,
  isNewCluster: boolean,
  selectionPriority: Map<string, number>,
  isSecondLongExperienceSameCluster = false
): boolean {
  const currentAverage = averagePriorityOfDay(state, selectionPriority);
  if (currentAverage === 0) return true; // day is empty (the anchor) -- always allowed

  if (isNewCluster && state.clusters.length >= PREFERRED_MAX_CLUSTERS_PER_DAY) {
    // A 3rd cluster needs to clearly earn its place.
    if (candidatePriority < currentAverage * THIRD_CLUSTER_VALUE_FACTOR) return false;
  }

  // Fix Repetitive Montjuïc Day: see SECOND_LONG_EXPERIENCE_SAME_CLUSTER_VALUE_FACTOR's own doc
  // comment. Checked independently of the metTargets gate below, since the exact failure mode
  // measured (Montjuïc riding in right behind MNAC as the day's 2nd stop) happens well before
  // metTargets would ever be true.
  if (isSecondLongExperienceSameCluster && candidatePriority < currentAverage * SECOND_LONG_EXPERIENCE_SAME_CLUSTER_VALUE_FACTOR) return false;

  const metTargets = state.stopIds.length >= PREFERRED_MIN_STOPS_PER_DAY && state.totalMinutes >= SOFT_MINUTES_TARGET;
  if (metTargets && candidatePriority < currentAverage * CONTINUE_VALUE_FACTOR) return false;

  return true;
}

function canExtendToSixthStop(state: DayBuildState, projectedMinutes: number): boolean {
  return projectedMinutes <= SOFT_MINUTES_UPPER && state.clusters.length <= PREFERRED_MAX_CLUSTERS_PER_DAY;
}

// -- Coverage-repair pass (mustVisit + required-interest + Tier A) --------------------

function removeStopFromState(state: DayBuildState, placeId: string, byId: Map<string, ScoredPlannerPlace>): void {
  const metadata = byId.get(placeId)!.metadata;
  state.stopIds = state.stopIds.filter((id) => id !== placeId);
  state.totalMinutes -= metadata.visitDurationMinutes;
  state.clusters = state.clusters.filter((cluster) => state.stopIds.some((id) => byId.get(id)!.metadata.cluster === cluster));
}

function addStopToState(state: DayBuildState, placeId: string, byId: Map<string, ScoredPlannerPlace>): void {
  const metadata = byId.get(placeId)!.metadata;
  state.stopIds.push(placeId);
  state.totalMinutes += metadata.visitDurationMinutes;
  if (!state.clusters.includes(metadata.cluster)) state.clusters.push(metadata.cluster);
}

function violatesSimilarityCap(stopIds: Set<string>, groups: SimilarityGroup[], preferences: PlannerPreferences): boolean {
  for (const group of groups) {
    const cap =
      group.unlockedByInterest && preferences.interests.includes(group.unlockedByInterest)
        ? (group.maxWithInterest ?? group.maxByDefault)
        : group.maxByDefault;
    const count = group.placeIds.filter((id) => stopIds.has(id)).length;
    if (count > cap) return true;
  }
  return false;
}

/**
 * Picks the day-state index that best fits `candidateId`, respecting the SAME normal-day
 * limits as the greedy build (<=420 min, <=6 stops, <=3 clusters), preferring a day that
 * already has the candidate's cluster, then the day with the strongest cluster
 * compatibility, then (via stable array order) the earliest day. Returns -1 if no day can
 * take it without breaking a normal-generation limit -- this applies equally to mustVisit,
 * per the task spec ("Do NOT exceed 420 just to satisfy mustVisit").
 */
function findBestDayForInsertion(
  candidateId: string,
  dayStates: DayBuildState[],
  byId: Map<string, ScoredPlannerPlace>,
  config: DayBuilderConfig
): number {
  const metadata = byId.get(candidateId)!.metadata;
  let bestIndex = -1;
  let bestScore = -Infinity;

  dayStates.forEach((state, index) => {
    if (state.stopIds.includes(candidateId)) return;
    // V2 Phase 3A: see DayBuilderConfig.isPlaceEligibleForDay -- unreachable/no-op when unset.
    if (config.isPlaceEligibleForDay && !config.isPlaceEligibleForDay(candidateId, index + 1)) return;
    const projectedMinutes = state.totalMinutes + metadata.visitDurationMinutes;
    if (projectedMinutes > SOFT_MINUTES_UPPER) return;
    if (state.stopIds.length >= EXTENDED_MAX_STOPS_PER_DAY) return;

    const isNewCluster = !state.clusters.includes(metadata.cluster);
    if (isNewCluster && state.clusters.length >= MAX_CLUSTERS_PER_DAY) return;

    const compatibility = isNewCluster
      ? Math.max(0, ...state.clusters.map((cluster) => clusterCompatibility(config.clusterCompatibility, cluster, metadata.cluster)))
      : SAME_CLUSTER_SCORE;
    const score = compatibility - (isNewCluster ? 0.5 : 0); // small nudge to prefer not introducing a new cluster

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * Tries to guarantee `candidateId` is present somewhere in the plan by replacing a
 * REPLACEABLE stop (never a `protectedPlaceIds` member, never a member of the same
 * coverage goal being repaired, never a day's only stop) with it, inserted into whichever
 * day fits best (see `findBestDayForInsertion`). Tries removable stops lowest-value first;
 * `softAvoidPlaceIds` (V1.3) marks stops that should only be removed as a LAST resort --
 * they're still eligible, just tried after every other option (used so mustVisit repair
 * prefers not to displace a required-interest place like Camp Nou "unless there is truly
 * no valid alternative", per the mustVisit task spec, without an absolute ban that could
 * make a satisfiable mustVisit request fail unnecessarily). Rolls back and moves on if a
 * candidate removal would break a similarity cap or find no valid day. Returns false
 * (repair honestly skipped, never faked) if no single swap can satisfy it.
 */
function attemptCoverageSwap(
  candidateId: string,
  dayStates: DayBuildState[],
  byId: Map<string, ScoredPlannerPlace>,
  selectionPriority: Map<string, number>,
  preferences: PlannerPreferences,
  config: DayBuilderConfig,
  protectedPlaceIds: Set<string>,
  sameGoalPlaceIds: Set<string>,
  softAvoidPlaceIds: ReadonlySet<string> = new Set()
): boolean {
  if (dayStates.some((state) => state.stopIds.includes(candidateId))) return true; // already present

  const removableStops: { dayIndex: number; placeId: string; priority: number }[] = [];
  dayStates.forEach((state, dayIndex) => {
    if (state.stopIds.length <= 1) return; // never empty a day
    for (const placeId of state.stopIds) {
      if (protectedPlaceIds.has(placeId) || sameGoalPlaceIds.has(placeId)) continue;
      removableStops.push({ dayIndex, placeId, priority: selectionPriority.get(placeId) ?? 0 });
    }
  });
  // Soft-avoid stops sort as if they had a very high priority, so they're only ever tried
  // once every normal candidate has already failed -- a true last resort, not a hard ban.
  const SOFT_AVOID_BIAS = 1_000_000;
  removableStops.sort((a, b) => {
    const aBiased = a.priority + (softAvoidPlaceIds.has(a.placeId) ? SOFT_AVOID_BIAS : 0);
    const bBiased = b.priority + (softAvoidPlaceIds.has(b.placeId) ? SOFT_AVOID_BIAS : 0);
    return aBiased - bBiased || a.placeId.localeCompare(b.placeId);
  });

  for (const removable of removableStops) {
    const state = dayStates[removable.dayIndex];
    const savedStopIds = [...state.stopIds];
    const savedClusters = [...state.clusters];
    const savedMinutes = state.totalMinutes;

    removeStopFromState(state, removable.placeId, byId);

    const wholePlanStopIds = new Set(dayStates.flatMap((s) => s.stopIds));
    wholePlanStopIds.add(candidateId);
    if (violatesSimilarityCap(wholePlanStopIds, config.similarityGroups, preferences)) {
      state.stopIds = savedStopIds;
      state.clusters = savedClusters;
      state.totalMinutes = savedMinutes;
      continue;
    }

    const targetDayIndex = findBestDayForInsertion(candidateId, dayStates, byId, config);
    if (targetDayIndex === -1) {
      state.stopIds = savedStopIds;
      state.clusters = savedClusters;
      state.totalMinutes = savedMinutes;
      continue;
    }

    addStopToState(dayStates[targetDayIndex], candidateId, byId);
    return true;
  }

  // V2: single-swap-insufficient fallback. A single removable stop is sometimes smaller than
  // the candidate itself (e.g. freeing up a 45-minute stop can't make room for a 120-minute
  // mustVisit place in an already-maxed day), so no single swap above succeeds even though a
  // day genuinely has enough LOW-VALUE content to sacrifice in total. Try removing TWO
  // removable stops from the SAME day (lowest-combined-priority first, same day never emptied
  // below 1 stop, same protections/similarity/limit checks) before giving up entirely. Both
  // removed stops simply drop out of the plan, same as the single-swap case above -- never
  // reinserted elsewhere, since they lost out to a higher-priority guarantee.
  const removableByDay = new Map<number, typeof removableStops>();
  for (const removable of removableStops) {
    if (!removableByDay.has(removable.dayIndex)) removableByDay.set(removable.dayIndex, []);
    removableByDay.get(removable.dayIndex)!.push(removable);
  }

  for (const [dayIndex, stops] of removableByDay) {
    const state = dayStates[dayIndex];
    if (state.stopIds.length - 2 < 1) continue; // never empty a day

    for (let i = 0; i < stops.length; i++) {
      for (let j = i + 1; j < stops.length; j++) {
        const savedStopIds = [...state.stopIds];
        const savedClusters = [...state.clusters];
        const savedMinutes = state.totalMinutes;

        removeStopFromState(state, stops[i].placeId, byId);
        removeStopFromState(state, stops[j].placeId, byId);

        const wholePlanStopIds = new Set(dayStates.flatMap((s) => s.stopIds));
        wholePlanStopIds.add(candidateId);
        if (violatesSimilarityCap(wholePlanStopIds, config.similarityGroups, preferences)) {
          state.stopIds = savedStopIds;
          state.clusters = savedClusters;
          state.totalMinutes = savedMinutes;
          continue;
        }

        const targetDayIndex = findBestDayForInsertion(candidateId, dayStates, byId, config);
        if (targetDayIndex === -1) {
          state.stopIds = savedStopIds;
          state.clusters = savedClusters;
          state.totalMinutes = savedMinutes;
          continue;
        }

        addStopToState(dayStates[targetDayIndex], candidateId, byId);
        return true;
      }
    }
  }

  return false;
}

/**
 * Coverage-repair / "rebalance" pass: runs once, after the initial greedy build, across ALL
 * days at once (a repair may move a stop between days). Never reorders stops within a day
 * (`orderDayStops` still runs afterward) and never changes selection beyond what a
 * guarantee actually needs.
 *
 * Coverage priority order when goals conflict (Must-See Priority Audit):
 *   0.   user-selected mustVisit places          (PlannerPreferences.mustVisit)
 *   0.5. flagship must-see coverage              (FlagshipCoverageGoal -- interest-INDEPENDENT, e.g. Sagrada Família)
 *   1.   explicit required-interest protection   (RequiredCoverageGoal, e.g. Camp Nou)
 *   2.   Popular Tier A minimum coverage          (TierCoverageGoal)
 *   3.   preferred special-interest coverage      (CoverageGoal boost only -- no repair)
 *   4.   Tier B popular coverage                  (CoverageGoal boost only -- no repair)
 *   5.   normal score-based fill                  (the greedy build itself)
 *
 * Priorities 3-5 are pure boosts applied before the greedy build runs -- only 0, 0.5, 1, and 2
 * get a real post-selection guarantee here, and they resolve strictly in that order so a
 * mustVisit place can never be displaced by a required-interest or Tier A repair, and a
 * required-interest place can never be displaced by a Tier A repair. mustVisit repair also
 * treats currently-active required-interest candidates as a last-resort-only removal
 * target (see `attemptCoverageSwap`'s `softAvoidPlaceIds`), so it prefers not to sacrifice
 * e.g. Camp Nou for a mustVisit place unless there is truly no other valid swap.
 *
 * Returns the mustVisit placeIds (if any) that could not be scheduled even via repair --
 * the caller (generateBarcelonaSmartPlan.ts) turns a non-empty list into a typed error
 * rather than silently returning an incomplete plan.
 */
function applyCoverageRepairs(
  dayStates: DayBuildState[],
  byId: Map<string, ScoredPlannerPlace>,
  selectionPriority: Map<string, number>,
  preferences: PlannerPreferences,
  config: DayBuilderConfig
): { unsatisfiedMustVisit: string[]; protectedPlaceIds: Set<string> } {
  const protectedPlaceIds = new Set<string>();
  const unsatisfiedMustVisit: string[] = [];

  // Priority 0: user-selected mustVisit places -- outranks everything else.
  const mustVisit = (preferences.mustVisit ?? []).filter((id) => byId.has(id));
  const mustVisitSameGoal = new Set(mustVisit);
  const requiredInterestCandidates = new Set<string>();
  for (const goal of config.requiredCoverageGoals ?? []) {
    if (!preferences.interests.includes(goal.interest)) continue;
    for (const candidateId of goal.candidates) {
      if (byId.has(candidateId)) requiredInterestCandidates.add(candidateId);
    }
  }

  for (const placeId of mustVisit) {
    const alreadyIn = dayStates.some((state) => state.stopIds.includes(placeId));
    if (alreadyIn) {
      protectedPlaceIds.add(placeId);
      continue;
    }
    const inserted = attemptCoverageSwap(
      placeId,
      dayStates,
      byId,
      selectionPriority,
      preferences,
      config,
      protectedPlaceIds,
      mustVisitSameGoal,
      requiredInterestCandidates
    );
    if (inserted) {
      protectedPlaceIds.add(placeId);
    } else {
      unsatisfiedMustVisit.push(placeId);
    }
  }

  // Priority 0.5: flagship must-see coverage -- see FlagshipCoverageGoal's own doc comment.
  // UNCONDITIONAL on interest selection (unlike every goal below), which is the entire point:
  // a destination's single most iconic landmark should have exceptionally strong priority
  // regardless of which interests the customer picked. Never displaces a mustVisit place
  // (mustVisit is already fully resolved above and `attemptCoverageSwap` never touches a
  // `protectedPlaceIds` member), and is itself never displaced by anything below (also
  // protected the same way as mustVisit/required-interest candidates once inserted).
  for (const goal of config.flagshipCoverageGoals ?? []) {
    const availableCandidates = goal.candidates.filter((id) => byId.has(id));
    const sameGoalPlaceIds = new Set(availableCandidates);

    let satisfiedCount = 0;
    for (const id of availableCandidates) {
      if (dayStates.some((state) => state.stopIds.includes(id))) {
        protectedPlaceIds.add(id);
        satisfiedCount++;
      }
    }

    for (const candidateId of availableCandidates) {
      if (satisfiedCount >= goal.minCoverage) break;
      if (protectedPlaceIds.has(candidateId)) continue;
      const inserted = attemptCoverageSwap(candidateId, dayStates, byId, selectionPriority, preferences, config, protectedPlaceIds, sameGoalPlaceIds);
      if (inserted) {
        protectedPlaceIds.add(candidateId);
        satisfiedCount++;
      }
      // If not inserted: honestly left short -- e.g. a genuine date/hours eligibility
      // conflict or no day with any remaining capacity. Never fabricated, never forced.
    }
  }

  // Priority 1: explicit required-interest protection.
  for (const goal of config.requiredCoverageGoals ?? []) {
    if (!preferences.interests.includes(goal.interest)) continue;

    const availableCandidates = goal.candidates.filter((id) => byId.has(id));
    const sameGoalPlaceIds = new Set(availableCandidates);

    // Protect every already-present candidate FIRST, decoupled from the minCoverage check
    // below. A candidate the greedy build already happened to pick still needs protecting
    // even when minCoverage is already met -- otherwise (V2.2 bug, found when Les Corts grew
    // a second/third real place) the loop below can `break` on its very first iteration
    // without ever reaching the `protectedPlaceIds.add` for an already-present candidate, and
    // the density-rebalance pass then silently donates it away since nothing marked it
    // protected -- undoing this guarantee without a single swap ever being attempted.
    let satisfiedCount = 0;
    for (const id of availableCandidates) {
      if (dayStates.some((state) => state.stopIds.includes(id))) {
        protectedPlaceIds.add(id);
        satisfiedCount++;
      }
    }

    for (const candidateId of availableCandidates) {
      if (satisfiedCount >= goal.minCoverage) break;
      if (protectedPlaceIds.has(candidateId)) continue; // already protected above
      const inserted = attemptCoverageSwap(candidateId, dayStates, byId, selectionPriority, preferences, config, protectedPlaceIds, sameGoalPlaceIds);
      if (inserted) {
        protectedPlaceIds.add(candidateId);
        satisfiedCount++;
      }
      // If not inserted: honestly left short. No fabrication, no forced append.
    }
  }

  // Priority 2: Popular Tier A minimum coverage.
  for (const goal of config.tierCoverageGoals ?? []) {
    if (!preferences.interests.includes(goal.interest)) continue;

    const sameGoalPlaceIds = new Set(goal.tierPlaceIds);
    // Same fix as Priority 1 above: protect every already-present Tier A place first, even
    // when coverage is already met, so the rebalance pass can never silently undo it.
    let covered = goal.tierPlaceIds.filter((id) => dayStates.some((state) => state.stopIds.includes(id)));
    for (const id of covered) protectedPlaceIds.add(id);
    if (covered.length >= goal.minCoverage) continue;

    const missingRanked = goal.tierPlaceIds
      .filter((id) => byId.has(id) && !covered.includes(id))
      .sort((a, b) => (selectionPriority.get(b) ?? 0) - (selectionPriority.get(a) ?? 0) || baseTieBreak(byId.get(a)!, byId.get(b)!));

    for (const candidateId of missingRanked) {
      if (covered.length >= goal.minCoverage) break;
      const inserted = attemptCoverageSwap(candidateId, dayStates, byId, selectionPriority, preferences, config, protectedPlaceIds, sameGoalPlaceIds);
      if (inserted) {
        protectedPlaceIds.add(candidateId);
        covered = [...covered, candidateId];
      }
      // If not inserted: honestly left short -- visible in the plan, never faked.
    }
  }

  // Priority 2.5 (Round 2 Fix): bounded secondary coverage (currently only Shopping) -- see
  // SecondaryCoverageGoal's own doc comment. Unlike every goal above, this never checks
  // `preferences.interests` itself -- the caller already decided whether/how this applies.
  for (const goal of config.secondaryCoverageGoals ?? []) {
    const availableCandidates = goal.candidates.filter((id) => byId.has(id));
    const sameGoalPlaceIds = new Set(availableCandidates);

    let satisfiedCount = 0;
    for (const id of availableCandidates) {
      if (dayStates.some((state) => state.stopIds.includes(id))) {
        protectedPlaceIds.add(id);
        satisfiedCount++;
      }
    }

    for (const candidateId of availableCandidates) {
      if (satisfiedCount >= goal.minCoverage) break;
      if (protectedPlaceIds.has(candidateId)) continue;
      const inserted = attemptCoverageSwap(candidateId, dayStates, byId, selectionPriority, preferences, config, protectedPlaceIds, sameGoalPlaceIds);
      if (inserted) {
        protectedPlaceIds.add(candidateId);
        satisfiedCount++;
      }
      // If not inserted: honestly left short -- never forced, never fabricated filler.
    }
  }

  return { unsatisfiedMustVisit, protectedPlaceIds };
}

// -- Density rebalance pass (V1.1 polish) ----------------------------------------------

// V2: every normal day should land in the 4-6 main-stop range (see PREFERRED_MIN_STOPS_PER_DAY
// above, already 4 -- this pass previously targeted only 3, one below the greedy build's own
// floor, which is exactly why a day could still end up with 3 stops post-repair and never get
// topped up. Raising this to 4 closes that gap.
const MIN_HEALTHY_STOPS_PER_DAY = 4;
/** A donor day must still have at least this many stops left AFTER giving one away -- never
 * push a donor itself under the healthy floor just to fix another day. */
const DONOR_MIN_STOPS_AFTER_GIVING = 4;
/**
 * A day must have at least this many stops (= floor + 1) before it may donate one, regardless
 * of how underfilled the receiving day is -- one flat threshold, not two severity tiers. An
 * earlier two-tier version required a bigger (6-stop) donor for a merely-one-short (3-stop)
 * day, which blocked the exact "5 -> 4/4" trades the 4-6 target distributions (e.g. "5/4/5")
 * depend on; worst-first processing order (below) already gives the most underfilled day first
 * access to any donor headroom, so a severity-scaled donor size isn't needed on top of that.
 */
const DONOR_MIN_STOPS_TO_GIVE = DONOR_MIN_STOPS_AFTER_GIVING + 1;

/**
 * Post-repair density-balancing pass (V2): fixes day-to-day stop-count imbalance (e.g. 1 stop
 * on one day, 6 on another) so every normal day lands within the 4-6 main-stop target, WITHOUT
 * padding days with irrelevant places and WITHOUT enforcing an artificial fixed stop count.
 * Runs once, after coverage repairs, before final day ordering -- never touches Route
 * Optimizer's ordering concerns.
 *
 * Strategy, in priority order:
 * 1. MOVE an already-selected, non-protected stop from an overloaded day to an underfilled
 *    one, but only when the move is geographically sensible (real cluster compatibility with
 *    the receiving day, or the receiving day is empty), keeps both days within the normal
 *    420-minute/3-cluster limits, and never touches a mustVisit/required-interest/Tier-A
 *    protected place (so every existing guarantee survives unchanged) or empties a donor day
 *    below a healthy floor.
 * 2. Only if no legal move exists: ADD one currently-unselected place, but only when it's
 *    actually relevant (positive selection priority -- never pure padding), geographically
 *    compatible, and keeps the receiving day within the normal limits.
 * 3. If neither works, the day is left honestly as-is -- a genuinely niche profile can still
 *    end up with a light day; this pass only removes SEVERE, fixable imbalance, never forces
 *    symmetry.
 *
 * Fully deterministic: candidates are always ranked by (geographic fit, then priority, then
 * placeId) with no randomness, and days are processed worst-first (fewest stops first) so the
 * most severe imbalance gets first access to any available donor headroom.
 */
function applyDensityRebalance(
  dayStates: DayBuildState[],
  byId: Map<string, ScoredPlannerPlace>,
  selectionPriority: Map<string, number>,
  preferences: PlannerPreferences,
  config: DayBuilderConfig,
  protectedPlaceIds: ReadonlySet<string>
): void {
  if (dayStates.length < 2) return; // nothing to balance across

  function clusterFitScore(candidateCluster: string, targetClusters: string[]): number {
    if (targetClusters.length === 0) return SAME_CLUSTER_SCORE; // an empty/near-empty day has no incompatible cluster yet
    return Math.max(0, ...targetClusters.map((cluster) => clusterCompatibility(config.clusterCompatibility, cluster, candidateCluster)));
  }

  function canReceive(state: DayBuildState, placeId: string, dayIndex: number): boolean {
    if (state.stopIds.includes(placeId)) return false;
    // V2 Phase 3A: see DayBuilderConfig.isPlaceEligibleForDay -- unreachable/no-op when unset.
    if (config.isPlaceEligibleForDay && !config.isPlaceEligibleForDay(placeId, dayIndex + 1)) return false;
    const metadata = byId.get(placeId)!.metadata;
    const projectedMinutes = state.totalMinutes + metadata.visitDurationMinutes;
    if (projectedMinutes > SOFT_MINUTES_UPPER) return false;
    if (state.stopIds.length >= EXTENDED_MAX_STOPS_PER_DAY) return false;
    const isNewCluster = !state.clusters.includes(metadata.cluster);
    if (isNewCluster && state.clusters.length >= MAX_CLUSTERS_PER_DAY) return false;
    return true;
  }

  /** Tries to move one real stop from an overloaded day into `dayStates[targetIndex]`. Returns true if it did. */
  function tryMoveStopIntoDay(targetIndex: number, minDonorStops: number): boolean {
    const target = dayStates[targetIndex];
    type Candidate = { dayIndex: number; placeId: string; fit: number; priority: number };
    const candidates: Candidate[] = [];

    dayStates.forEach((donor, donorIndex) => {
      if (donorIndex === targetIndex) return;
      if (donor.stopIds.length < minDonorStops) return;
      if (donor.stopIds.length - 1 < DONOR_MIN_STOPS_AFTER_GIVING) return;

      for (const placeId of donor.stopIds) {
        if (protectedPlaceIds.has(placeId)) continue; // never move a mustVisit/required-interest/Tier-A guaranteed stop
        if (!canReceive(target, placeId, targetIndex)) continue;
        const fit = clusterFitScore(byId.get(placeId)!.metadata.cluster, target.clusters);
        if (fit <= 0 && target.clusters.length > 0) continue; // never force a geographically incompatible move
        candidates.push({ dayIndex: donorIndex, placeId, fit, priority: selectionPriority.get(placeId) ?? 0 });
      }
    });

    if (candidates.length === 0) return false;

    // Best geographic fit first; among ties, move the donor's LOWEST-priority stop (the donor
    // keeps its best content), then a deterministic placeId tie-break.
    candidates.sort((a, b) => b.fit - a.fit || a.priority - b.priority || a.placeId.localeCompare(b.placeId));

    const chosen = candidates[0];
    const donorState = dayStates[chosen.dayIndex];
    const savedStopIds = [...donorState.stopIds];
    const savedClusters = [...donorState.clusters];
    const savedMinutes = donorState.totalMinutes;

    removeStopFromState(donorState, chosen.placeId, byId);

    // A moved stop never changes WHICH places are selected, only which day they're on, so this
    // should always pass -- checked anyway as a safety net, matching attemptCoverageSwap's own caution.
    const wholePlanStopIds = new Set(dayStates.flatMap((state) => state.stopIds));
    if (violatesSimilarityCap(wholePlanStopIds, config.similarityGroups, preferences)) {
      donorState.stopIds = savedStopIds;
      donorState.clusters = savedClusters;
      donorState.totalMinutes = savedMinutes;
      return false;
    }

    addStopToState(target, chosen.placeId, byId);
    return true;
  }

  /**
   * Last-resort fallback: adds one genuinely relevant, geographically-compatible unselected
   * place. Tries candidates best-fit-first and skips (never gives up on) one that would break
   * a similarity cap -- e.g. a 3rd beach on an already-2-beach day -- falling through to the
   * next-best real candidate instead, matching attemptCoverageSwap's own "try the next option"
   * behavior. Returns the added id, or null if no candidate at all is legal.
   */
  function tryAddUnselectedCandidate(targetIndex: number, unassignedIds: ReadonlySet<string>): string | null {
    const target = dayStates[targetIndex];

    const ranked = [...unassignedIds]
      .filter((id) => canReceive(target, id, targetIndex))
      .filter((id) => (selectionPriority.get(id) ?? 0) > 0) // relevant to selected interests -- never pure padding
      .filter((id) => {
        const fit = clusterFitScore(byId.get(id)!.metadata.cluster, target.clusters);
        return fit > 0 || target.clusters.length === 0;
      })
      .sort((a, b) => {
        const fitDiff = clusterFitScore(byId.get(b)!.metadata.cluster, target.clusters) - clusterFitScore(byId.get(a)!.metadata.cluster, target.clusters);
        if (fitDiff !== 0) return fitDiff;
        const priorityDiff = (selectionPriority.get(b) ?? 0) - (selectionPriority.get(a) ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return a.localeCompare(b);
      });

    const currentStopIds = new Set(dayStates.flatMap((state) => state.stopIds));
    for (const candidateId of ranked) {
      const wholePlanStopIds = new Set(currentStopIds);
      wholePlanStopIds.add(candidateId);
      if (violatesSimilarityCap(wholePlanStopIds, config.similarityGroups, preferences)) continue;

      addStopToState(target, candidateId, byId);
      return candidateId;
    }

    return null;
  }

  const unassignedIds = new Set(byId.keys());
  for (const state of dayStates) {
    for (const placeId of state.stopIds) unassignedIds.delete(placeId);
  }

  // Worst-first: the day with the fewest stops gets first access to any donor headroom.
  const processOrder = dayStates.map((_, index) => index).sort((a, b) => dayStates[a].stopIds.length - dayStates[b].stopIds.length);

  for (const index of processOrder) {
    let guard = 0; // defensive bound only -- each successful step strictly increases this day's stop count
    while (dayStates[index].stopIds.length < MIN_HEALTHY_STOPS_PER_DAY && guard < EXTENDED_MAX_STOPS_PER_DAY) {
      guard++;

      if (tryMoveStopIntoDay(index, DONOR_MIN_STOPS_TO_GIVE)) continue;

      const added = tryAddUnselectedCandidate(index, unassignedIds);
      if (added) {
        unassignedIds.delete(added);
        continue;
      }

      break; // no legal rebalance available -- leave this day honestly as-is, never fabricate
    }
  }
}

/**
 * Deterministic, greedy, cluster-aware day builder. See file header for what this is (and
 * is not). Quality rules (iconic tiers / similarity limits / coverage boosts / value
 * density / coverage guarantees, including mustVisit) only ever influence *internal
 * selection*; the `score` reported on each output stop is always the untouched
 * scoring-engine value. Whether every mustVisit place actually made it in is the caller's
 * responsibility to check (see generateBarcelonaSmartPlan.ts) -- this function always
 * returns a plan that respects the normal density/cluster limits, never a plan that breaks
 * them just to force a mustVisit place to fit.
 */
export function buildPlannerPlan(places: PlannerPlaceMetadata[], request: PlannerBuildRequest, config: DayBuilderConfig): GeneratedPlannerPlan {
  const ranked = rankPlaces(places, request.preferences);
  const byId = new Map(ranked.map((entry) => [entry.placeId, entry]));

  const mustVisitPlaceIds = new Set((request.preferences.mustVisit ?? []).filter((id) => byId.has(id)));
  // Must-See Priority Audit: every candidate named in any flagshipCoverageGoal, regardless of
  // interest selection -- see FlagshipCoverageGoal's own doc comment.
  const flagshipPlaceIds = new Set((config.flagshipCoverageGoals ?? []).flatMap((goal) => goal.candidates).filter((id) => byId.has(id)));

  const similarityExclusions = resolveSimilarityExclusions(
    ranked,
    request.preferences,
    config.similarityGroups,
    config.iconicTiers,
    mustVisitPlaceIds,
    flagshipPlaceIds
  );

  // Selection priority = real score + any active coverage-goal boosts + flagship boost +
  // mustVisit boost. Used ONLY to decide ordering/inclusion during building and repair -- never
  // written back as the reported `score`.
  const selectionPriority = new Map<string, number>(ranked.map((entry) => [entry.placeId, entry.score]));
  for (const goal of config.coverageGoals) {
    if (!request.preferences.interests.includes(goal.interest)) continue;
    for (const placeId of goal.placeIds) {
      if (selectionPriority.has(placeId)) {
        selectionPriority.set(placeId, selectionPriority.get(placeId)! + goal.boost);
      }
    }
  }
  // Must-See Priority Audit: applied UNCONDITIONALLY (no interest gate), unlike the loop above --
  // this is the natural-selection half of flagship priority; attemptCoverageSwap in
  // applyCoverageRepairs below is the guaranteed-repair backstop for the rest.
  for (const goal of config.flagshipCoverageGoals ?? []) {
    for (const placeId of goal.candidates) {
      if (selectionPriority.has(placeId)) {
        selectionPriority.set(placeId, selectionPriority.get(placeId)! + goal.boost);
      }
    }
  }
  for (const placeId of mustVisitPlaceIds) {
    if (selectionPriority.has(placeId)) {
      selectionPriority.set(placeId, selectionPriority.get(placeId)! + MUST_VISIT_BOOST);
    }
  }
  // P1 Personalization Fix (Shopping/Nightlife) -- see DayBuilderConfig.placeSelectionBonus.
  if (config.placeSelectionBonus) {
    for (const placeId of selectionPriority.keys()) {
      const bonus = config.placeSelectionBonus(placeId);
      if (bonus) selectionPriority.set(placeId, selectionPriority.get(placeId)! + bonus);
    }
  }

  const unassigned = new Set(ranked.filter((entry) => !similarityExclusions.has(entry.placeId)).map((entry) => entry.placeId));

  function sortedUnassignedByPriority(ids: Iterable<string>): string[] {
    return [...ids].sort((a, b) => {
      const diff = (selectionPriority.get(b) ?? 0) - (selectionPriority.get(a) ?? 0);
      if (diff !== 0) return diff;
      return baseTieBreak(byId.get(a)!, byId.get(b)!);
    });
  }

  const dayStates: DayBuildState[] = [];

  // V1.5: shared across the WHOLE plan (not per-day) so at most ONE long experience is ever
  // reserved across all 3 days -- the "max one reserved long experience per plan" guardrail
  // that prevents e.g. Cook & Taste AND Tibidabo both getting reserved into the same trip.
  let longExperienceReserved = false;

  for (let dayNumber = 1; dayNumber <= request.days; dayNumber++) {
    const state: DayBuildState = { stopIds: [], clusters: [], totalMinutes: 0 };

    function tryAdd(placeId: string): boolean {
      // V2 Phase 3A: per-day eligibility gate (see DayBuilderConfig.isPlaceEligibleForDay) --
      // checked first, before any other rule. Unreachable when the config doesn't set this
      // field (every existing config, including Barcelona's V1/V2-flexible config), so this
      // line changes nothing for any caller that doesn't opt in.
      if (config.isPlaceEligibleForDay && !config.isPlaceEligibleForDay(placeId, dayNumber)) return false;

      const metadata = byId.get(placeId)!.metadata;
      const cluster = metadata.cluster;
      const isNewCluster = !state.clusters.includes(cluster);

      // Hard stop-count ceiling, with the 5th->6th step requiring the extra conditions below.
      if (state.stopIds.length >= EXTENDED_MAX_STOPS_PER_DAY) return false;
      const projectedMinutes = state.totalMinutes + metadata.visitDurationMinutes;
      if (state.stopIds.length >= PREFERRED_MAX_STOPS_PER_DAY && !canExtendToSixthStop(state, projectedMinutes)) return false;

      // 420 minutes is the real, unconditional cap for normal generation -- checked
      // regardless of current stop count, closing the loophole where a single
      // large-duration place could jump a day from well under 390 straight past 420 in
      // one step while under the preferred stop count.
      if (projectedMinutes > SOFT_MINUTES_UPPER) return false;

      // Cluster fragmentation: hard cap, plus a value bar for the 3rd cluster (checked below).
      if (isNewCluster && state.clusters.length >= MAX_CLUSTERS_PER_DAY) return false;

      // Fix Repetitive Montjuïc Day: see SECOND_LONG_EXPERIENCE_SAME_CLUSTER_VALUE_FACTOR's own
      // doc comment -- only relevant for a same-cluster addition, within a destination-opted-in
      // cluster, where BOTH the candidate and an already-selected same-cluster stop are
      // independently long experiences.
      const isSecondLongExperienceSameCluster =
        !isNewCluster &&
        !!config.secondLongExperienceGateClusters?.has(cluster) &&
        metadata.visitDurationMinutes >= LONG_EXPERIENCE_MIN_MINUTES &&
        state.stopIds.some((id) => {
          const existing = byId.get(id)!.metadata;
          return existing.cluster === cluster && existing.visitDurationMinutes >= LONG_EXPERIENCE_MIN_MINUTES;
        });

      if (!isWorthAdding(state, selectionPriority.get(placeId) ?? 0, isNewCluster, selectionPriority, isSecondLongExperienceSameCluster)) return false;

      state.stopIds.push(placeId);
      if (isNewCluster) state.clusters.push(cluster);
      state.totalMinutes = projectedMinutes;
      unassigned.delete(placeId);
      return true;
    }

    // 1. Anchor: highest-priority unassigned place.
    //
    // Long-trip candidate-pool exhaustion fix (evidence: 1-10 day audit of the 34-place V2
    // pool found 9-10 day single/narrow-interest plans silently generated only 8-9 days
    // instead of the requested count, because this loop used to `break` -- abandoning every
    // remaining day outright -- the moment `unassigned` ran dry, never even creating a
    // PlannerDay for them. That is strictly worse than an honestly thin day: the day is
    // structurally missing rather than present-but-light. Now the day is still pushed
    // (initially empty when no anchor remains), so `applyDensityRebalance` below -- which
    // already exists specifically to redistribute stops from over-full sibling days -- gets a
    // chance to MOVE or ADD real, already-scored places into it. When rebalance also finds
    // nothing legal to move/add (real geographic/cluster incompatibility), the day is still
    // left honestly light, exactly as any other thin day already is -- this never fabricates
    // content, it only stops discarding whole days that a later pass could have helped.
    // No-op for every 1-5 day request in this project's real candidate pool: `unassigned`
    // never actually empties before the requested day count is reached that early.
    const anchorId = sortedUnassignedByPriority(unassigned)[0];
    if (anchorId) tryAdd(anchorId);

    // 1.5. V1.5: primary-interest-gated long-experience reservation -- tried right after the
    // anchor, before normal same-cluster fill (step 2 below), so an eligible long experience
    // isn't rejected purely because several shorter same-cluster stops would otherwise consume
    // the day's budget first. Still cluster-compatible-gated (same rule as step 2's own
    // filter) and still subject to every limit inside `tryAdd` (420-minute cap, cluster caps,
    // similarity caps via the similarity-exclusion set already applied above) -- this only
    // changes WHEN an already-eligible candidate is tried, never bypasses why it would fail.
    if (!longExperienceReserved) {
      const reservedCandidateId = sortedUnassignedByPriority(unassigned).find((id) => {
        const cluster = byId.get(id)!.metadata.cluster;
        const clusterCompatible = state.clusters.some((existing) => clusterCompatibility(config.clusterCompatibility, existing, cluster) > 0);
        return clusterCompatible && isEligibleLongExperience(id, byId, request.preferences, mustVisitPlaceIds);
      });
      if (reservedCandidateId && tryAdd(reservedCandidateId)) {
        longExperienceReserved = true;
      }
    }

    // 2. Fill: repeatedly take the best-remaining place compatible with the day's clusters
    // so far (same cluster > strong > medium > weak), stopping once nothing clears the bar.
    let progressed = true;
    while (state.stopIds.length < EXTENDED_MAX_STOPS_PER_DAY && progressed) {
      progressed = false;

      const compatible = sortedUnassignedByPriority(unassigned)
        .filter((id) => {
          const cluster = byId.get(id)!.metadata.cluster;
          return state.clusters.some((existing) => clusterCompatibility(config.clusterCompatibility, existing, cluster) > 0);
        })
        .sort((a, b) => {
          const clusterA = byId.get(a)!.metadata.cluster;
          const clusterB = byId.get(b)!.metadata.cluster;
          const bestA = Math.max(...state.clusters.map((c) => clusterCompatibility(config.clusterCompatibility, c, clusterA)));
          const bestB = Math.max(...state.clusters.map((c) => clusterCompatibility(config.clusterCompatibility, c, clusterB)));
          if (bestB !== bestA) return bestB - bestA;

          // Route-First Planning Upgrade: within the SAME cluster-compatibility tier, prefer
          // whichever candidate has a LOWER verified real travel time from the day's
          // most-recently-added stop -- only when BOTH candidates have resolved data (never
          // let one-sided/partial data bias the decision). This can only refine an existing
          // tie; it never runs when one candidate is already a clearly better cluster match.
          if (config.getVerifiedTravelMinutes && state.stopIds.length > 0) {
            const lastStopId = state.stopIds[state.stopIds.length - 1];
            const minutesA = config.getVerifiedTravelMinutes(lastStopId, a);
            const minutesB = config.getVerifiedTravelMinutes(lastStopId, b);
            if (minutesA !== null && minutesB !== null && minutesA !== minutesB) {
              return minutesA - minutesB;
            }
          }

          const priorityDiff = (selectionPriority.get(b) ?? 0) - (selectionPriority.get(a) ?? 0);
          if (priorityDiff !== 0) return priorityDiff;
          return baseTieBreak(byId.get(a)!, byId.get(b)!);
        });

      for (const candidateId of compatible) {
        if (tryAdd(candidateId)) {
          progressed = true;
          break;
        }
      }
    }

    dayStates.push(state);
  }

  // Coverage-repair pass -- see applyCoverageRepairs for the full priority order (mustVisit
  // first). Mutates dayStates in place; never touches Route Optimizer concerns (order).
  // Whether mustVisit fully succeeded is checked by the caller.
  const { protectedPlaceIds } = applyCoverageRepairs(dayStates, byId, selectionPriority, request.preferences, config);

  // Density-balancing pass (V1.1 polish) -- fixes severe day-to-day stop-count imbalance
  // left over after coverage repairs, still before final day ordering. Never moves/removes a
  // protectedPlaceIds member, so every coverage guarantee above is preserved unchanged.
  applyDensityRebalance(dayStates, byId, selectionPriority, request.preferences, config, protectedPlaceIds);

  const days: PlannerDay[] = dayStates.map((state, index) => ({
    dayNumber: index + 1,
    stops: orderDayStops(
      state.stopIds.map((placeId) => ({ placeId, score: byId.get(placeId)!.score })),
      byId,
      state.clusters
    ),
    totalVisitMinutes: state.totalMinutes,
    clusters: state.clusters,
  }));

  return { days };
}

/**
 * Orders a day's already-selected stops into a sensible logical sequence: preferredTime
 * first (morning things before evening things), then grouped by cluster (using the day's
 * cluster visit order so same-cluster stops stay adjacent), then by score, then placeId --
 * fully deterministic. This is NOT geographic routing (see plannerRouteOptimizer.ts, which
 * reorders this same stop set using real adjacency/travel-time data) -- just a reasonable
 * default order before that pass runs.
 */
function orderDayStops(stops: PlannerDayStop[], byId: Map<string, ScoredPlannerPlace>, clusters: string[]): PlannerDayStop[] {
  const clusterRank = new Map(clusters.map((cluster, index) => [cluster, index]));

  return [...stops].sort((a, b) => {
    const metaA = byId.get(a.placeId)!.metadata;
    const metaB = byId.get(b.placeId)!.metadata;

    const timeDiff = TIME_BUCKET_ORDER.indexOf(metaA.preferredTime) - TIME_BUCKET_ORDER.indexOf(metaB.preferredTime);
    if (timeDiff !== 0) return timeDiff;

    const clusterDiff = (clusterRank.get(metaA.cluster) ?? 0) - (clusterRank.get(metaB.cluster) ?? 0);
    if (clusterDiff !== 0) return clusterDiff;

    if (b.score !== a.score) return b.score - a.score;

    return a.placeId.localeCompare(b.placeId);
  });
}
