import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import { BARCELONA_ICONIC_TIER_A, BARCELONA_ICONIC_TIER_B } from "./barcelona-planner-day-builder";
import { BARCELONA_FLAGSHIP_MUST_SEE, BARCELONA_FLAGSHIP_TIER_B } from "./barcelonaMustSeePolicy";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";

/**
 * Reviewed production category-signal helper (Surprise Me Quality V2, Part A). Promoted out of a
 * throwaway audit script into a real module because the Trip Composition Pass
 * (plannerTripCompositionPass.ts) and the permanent quality audit both need the same
 * classification, and this task explicitly asked for one reviewed helper rather than duplicated
 * ad hoc logic in either place.
 *
 * -- Why this reuses V2PlannerInterest, not a new taxonomy ----------------------------------------
 * The codebase already has exactly one customer-facing 8-key category model (V2PlannerInterest,
 * v2PlannerTypes.ts: popular/cultureHistory/natureViews/food/shopping/beachRelax/
 * footballExperiences/nightlife). Inventing a separate "audit category" enum would be exactly the
 * "arbitrary fake category" this task warns against, so this file classifies every place directly
 * into that existing type -- nothing new is introduced, and a caller can compare its output
 * against real V2PlannerInterest values used everywhere else (SURPRISE_ME_LEGACY_INTERESTS,
 * V2_INTEREST_OPTIONS, etc).
 *
 * -- Methodology (transparent, not a new scoring system) -------------------------------------------
 * `PlannerPlaceMetadata.weights` only has the legacy 6-key model (plannerTypes.ts), because that
 * is genuinely the only per-place signal the Day Builder itself ever scores against -- this
 * function does not add new weights, it just reports which of the SAME weights already won. The
 * shared `foodShoppingNightlife` weight (the legacy model's only representation of 3 of the 8 V2
 * keys) is disambiguated using the place's REAL resolved Guide type (attraction/food/shopping/
 * nightlife/experience/beach) -- exactly how v2InterestAdapter.ts's own doc comment describes
 * Layer A (coarse legacy scoring) vs Layer B (real Guide categories) already dividing this
 * responsibility elsewhere in the codebase. This changes no runtime selection/scoring behavior --
 * it is a read-only classification of an already-decided place.
 */
export function classifyPlaceCategorySignal(placeId: string, meta: PlannerPlaceMetadata): V2PlannerInterest {
  const w = meta.weights;
  const entries: [V2PlannerInterest, number][] = [
    ["popular", w.popular],
    ["cultureHistory", w.cultureLocal],
    ["natureViews", w.viewsNature],
    ["beachRelax", w.beachRelax],
    ["footballExperiences", w.footballExperiences],
    ["food", w.foodShoppingNightlife], // provisional -- split below using the real Guide type
  ];
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const winner = entries[0][0];
  if (winner !== "food") return winner;

  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  if (resolved?.type === "shopping") return "shopping";
  if (resolved?.type === "nightlife") return "nightlife";
  return "food";
}

/** The two placeIds the Must-See policy hard-guarantees (barcelonaMustSeePolicy.ts) -- the Trip
 * Composition Pass never relocates these, even though relocating a stop between two days already
 * on the trip can never itself violate a trip-wide coverage guarantee (see that pass's own doc
 * comment for why this is an extra-conservative belt-and-braces exclusion, not a strict
 * necessity). */
export function isProtectedFlagshipPlace(placeId: string): boolean {
  return BARCELONA_FLAGSHIP_MUST_SEE.includes(placeId) || BARCELONA_FLAGSHIP_TIER_B.includes(placeId);
}

/** Either iconic tier (barcelona-planner-day-builder.ts) -- informational only, used by the
 * permanent audit's flagship-distribution report, not by any selection/relocation logic. */
export function isIconicPlace(placeId: string): boolean {
  return BARCELONA_ICONIC_TIER_A.includes(placeId) || BARCELONA_ICONIC_TIER_B.includes(placeId);
}

/** A day's category signals as a set (not a multiset) -- two stops sharing a category count once,
 * matching how the Jaccard similarity check (below) is defined over category SETS. */
export function dayCategorySignals(stopIds: readonly string[], metaById: ReadonlyMap<string, PlannerPlaceMetadata>): Set<V2PlannerInterest> {
  const set = new Set<V2PlannerInterest>();
  for (const id of stopIds) {
    const meta = metaById.get(id);
    if (meta) set.add(classifyPlaceCategorySignal(id, meta));
  }
  return set;
}

/** Standard Jaccard similarity (intersection / union) over two category sets, 0 when both are
 * empty (never NaN). */
export function jaccardSimilarity<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const unionSize = a.size + b.size - intersection;
  return unionSize === 0 ? 0 : intersection / unionSize;
}
