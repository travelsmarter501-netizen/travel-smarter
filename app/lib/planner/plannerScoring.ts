import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerPlaceMetadata, PlannerPreferences } from "./plannerTypes";
import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";

/**
 * Barcelona Smart Planner — scoring engine V1.
 *
 * Deterministic, typed ranking of planner places by selected interests. No AI, no
 * itinerary generation — just: given metadata + preferences, produce a score and an
 * order. The core (`scorePlannerPlace`, `scorePlaces`, `rankPlaces`, `diversifyRankedPlaces`)
 * takes a `PlannerPlaceMetadata[]` and never references Barcelona — a future destination
 * only needs its own metadata file plus two thin wrappers like `scoreBarcelonaPlannerPlaces`
 * / `rankBarcelonaPlannerPlaces` below.
 */

export type ScoredPlannerPlace = {
  placeId: string;
  score: number;
  metadata: PlannerPlaceMetadata;
};

export class PlannerPreferencesError extends Error {}

/**
 * V2: a 3-day plan's real physical capacity -- 4 to 6 main stops per day (see
 * plannerDayBuilder.ts's density-rebalance target), so 12 is the minimum a normal plan should
 * fill and 18 is the absolute most it could ever hold. mustVisit selections beyond that simply
 * cannot all fit, however the rest of generation goes -- validated up front so the caller gets
 * a clear message instead of an impossible/silently-truncated plan.
 */
const MAX_MUST_VISIT_FOR_3_DAY_TRIP = 18;

/**
 * Validates preferences without throwing — use this when you want to surface a message
 * to a caller (e.g. a form) instead of catching an exception.
 *
 * `availablePlaceIds`, when provided, also validates `mustVisit` id existence against the
 * destination's real planner metadata set — omit it (e.g. from generic scoring-only
 * callers with no place list handy) to skip that specific check and validate only the
 * structural mustVisit rules (capacity, no duplicates).
 */
export function validatePlannerPreferences(
  preferences: PlannerPreferences,
  availablePlaceIds?: ReadonlySet<string>
): { valid: true } | { valid: false; reason: string } {
  const interests = preferences?.interests;

  if (!Array.isArray(interests) || interests.length === 0) {
    return { valid: false, reason: "اختر اهتمامًا واحدًا على الأقل." };
  }
  if (interests.length > PLANNER_INTERESTS.length) {
    return { valid: false, reason: `لا يمكن اختيار أكثر من ${PLANNER_INTERESTS.length} اهتمامات.` };
  }
  if (new Set(interests).size !== interests.length) {
    return { valid: false, reason: "لا يمكن تكرار نفس الاهتمام أكثر من مرة." };
  }
  for (const interest of interests) {
    if (!PLANNER_INTERESTS.includes(interest)) {
      return { valid: false, reason: `اهتمام غير معروف: "${interest}".` };
    }
  }

  const mustVisit = preferences?.mustVisit;
  if (mustVisit !== undefined) {
    if (!Array.isArray(mustVisit)) {
      return { valid: false, reason: "قائمة الأماكن المؤكدة غير صالحة." };
    }
    if (mustVisit.length > MAX_MUST_VISIT_FOR_3_DAY_TRIP) {
      return { valid: false, reason: "اخترت أماكن أكثر من اللي بتسعها خطة 3 أيام. خفّف عدد الأماكن أو زِد مدة الرحلة." };
    }
    if (new Set(mustVisit).size !== mustVisit.length) {
      return { valid: false, reason: "في مكان مكرر بقائمة الأماكن المؤكدة." };
    }
    if (availablePlaceIds) {
      for (const placeId of mustVisit) {
        if (!availablePlaceIds.has(placeId)) {
          return { valid: false, reason: `مكان غير معروف ضمن بيانات المخطط: "${placeId}".` };
        }
      }
    }
  }

  return { valid: true };
}

/** Throws PlannerPreferencesError if invalid — the "loud failure" entry point used by the scoring functions below. */
function assertValidPreferences(preferences: PlannerPreferences): void {
  const result = validatePlannerPreferences(preferences);
  if (!result.valid) {
    throw new PlannerPreferencesError(result.reason);
  }
}

/** Rounds to 2 decimal places — enough precision for this formula, no float noise. */
function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Base scoring formula (kept intentionally simple/easy to change later):
 *
 *   interestScore   = sum of metadata.weights[interest] for each selected interest
 *   priorityBonus    = priority * 0.5
 *   popularBaseline  = weights.popular * 0.25, ONLY when "popular" is a selected interest
 *   score            = interestScore + priorityBonus + popularBaseline
 */
export function scorePlannerPlace(metadata: PlannerPlaceMetadata, preferences: PlannerPreferences): number {
  assertValidPreferences(preferences);

  const interestScore = preferences.interests.reduce((sum, interest) => sum + metadata.weights[interest], 0);
  const priorityBonus = metadata.priority * 0.5;
  const popularBaseline = preferences.interests.includes("popular") ? metadata.weights.popular * 0.25 : 0;

  return roundScore(interestScore + priorityBonus + popularBaseline);
}

/** Generic, destination-agnostic: scores an arbitrary list of places (unordered). */
export function scorePlaces(places: PlannerPlaceMetadata[], preferences: PlannerPreferences): ScoredPlannerPlace[] {
  assertValidPreferences(preferences);
  return places.map((metadata) => ({
    placeId: metadata.placeId,
    score: scorePlannerPlace(metadata, preferences),
    metadata,
  }));
}

/**
 * Deterministic tie-break, applied whenever scores are equal:
 * 1. higher priority first
 * 2. then higher `weights.popular`
 * 3. then placeId alphabetically
 */
function compareScoredPlaces(a: ScoredPlannerPlace, b: ScoredPlannerPlace): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.metadata.priority !== a.metadata.priority) return b.metadata.priority - a.metadata.priority;
  if (b.metadata.weights.popular !== a.metadata.weights.popular) return b.metadata.weights.popular - a.metadata.weights.popular;
  return a.placeId.localeCompare(b.placeId);
}

/** Generic, destination-agnostic: scores and sorts an arbitrary list of places, highest score first. */
export function rankPlaces(places: PlannerPlaceMetadata[], preferences: PlannerPreferences): ScoredPlannerPlace[] {
  return scorePlaces(places, preferences).sort(compareScoredPlaces);
}

/**
 * Generic, destination-agnostic candidate diversification: caps how many places from the
 * same `cluster` can appear in the first `limit` results, only exceeding the cap if there
 * aren't enough distinct-cluster places to fill the requested limit otherwise.
 *
 * V1 rule: max 3 per cluster. This is candidate diversification only — NOT itinerary
 * generation (no day grouping, no route ordering).
 */
export function diversifyRankedPlaces(ranked: ScoredPlannerPlace[], limit: number, maxPerCluster = 3): ScoredPlannerPlace[] {
  const clusterCounts = new Map<string, number>();
  const selected: ScoredPlannerPlace[] = [];
  const overflow: ScoredPlannerPlace[] = [];

  for (const place of ranked) {
    if (selected.length >= limit) break;
    const count = clusterCounts.get(place.metadata.cluster) ?? 0;
    if (count < maxPerCluster) {
      selected.push(place);
      clusterCounts.set(place.metadata.cluster, count + 1);
    } else {
      overflow.push(place);
    }
  }

  // Backfill from over-cap places, in original rank order, only if the limit couldn't
  // otherwise be filled from diverse clusters.
  for (const place of overflow) {
    if (selected.length >= limit) break;
    selected.push(place);
  }

  return selected;
}

// ── Barcelona-specific wrappers ─────────────────────────────────────────────────────
// Thin convenience functions over the generic core above, bound to Barcelona's metadata.

export function scoreBarcelonaPlannerPlaces(preferences: PlannerPreferences): ScoredPlannerPlace[] {
  return scorePlaces(getBarcelonaPlannerPlaces(), preferences);
}

export function rankBarcelonaPlannerPlaces(preferences: PlannerPreferences): ScoredPlannerPlace[] {
  return rankPlaces(getBarcelonaPlannerPlaces(), preferences);
}

/** Barcelona convenience wrapper over `diversifyRankedPlaces` — see its docs for the diversification rule. */
export function selectTopPlannerCandidates(preferences: PlannerPreferences, limit: number): ScoredPlannerPlace[] {
  return diversifyRankedPlaces(rankBarcelonaPlannerPlaces(preferences), limit);
}
