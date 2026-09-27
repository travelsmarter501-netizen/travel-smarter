import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { PlannerInterest } from "./plannerTypes";

/**
 * Smart Planner V2 Phase 3B -- Layer A of the two-layer interest strategy (see the task's own
 * architecture note): a coarse, honest adapter from the 8-key V2 model down to the legacy
 * 6-key scoring model the Day Builder/scoring engine still use, completely unchanged.
 *
 * `food`, `shopping`, and `nightlife` all collapse onto the SAME legacy
 * `foodShoppingNightlife` key -- the legacy scoring engine genuinely cannot distinguish them
 * (it has no separate weight column for any of the three), so this adapter does not pretend
 * otherwise. It exists only to give the Day Builder a coarse relevance signal for MAIN VISIT
 * stop selection (e.g. does this profile care about food/shopping/nightlife-adjacent areas at
 * all) -- real per-type differentiation for food vs. shopping vs. nightlife happens entirely
 * in Layer B (see barcelonaV2Supplementary.ts), which reads real Guide categories
 * (foodPlaces/shoppingAreas/nightlifeVenues), never legacy scoring weights.
 *
 * No weight value on any of the 30 planner-metadata entries is invented or retuned by this
 * file -- it only ever maps interest KEYS, never touches `weights` objects.
 */
const V2_TO_LEGACY_INTEREST: Record<V2PlannerInterest, PlannerInterest> = {
  popular: "popular",
  cultureHistory: "cultureLocal",
  natureViews: "viewsNature",
  beachRelax: "beachRelax",
  footballExperiences: "footballExperiences",
  food: "foodShoppingNightlife",
  shopping: "foodShoppingNightlife",
  nightlife: "foodShoppingNightlife",
};

/** Deduplicated -- selecting both "food" and "nightlife" (both -> foodShoppingNightlife)
 * contributes that legacy interest only once, exactly like any other legacy multi-select. */
export function mapV2InterestsToLegacy(v2Interests: V2PlannerInterest[]): PlannerInterest[] {
  const mapped = new Set<PlannerInterest>();
  for (const interest of v2Interests) {
    mapped.add(V2_TO_LEGACY_INTEREST[interest]);
  }
  return [...mapped];
}

/** The single legacy interest a mapped V2 interest corresponds to -- used only to derive an
 * internal primaryInterest when exactly one V2 interest is selected (see the Server Action;
 * V2's UI never asks this as a separate question). */
export function mapSingleV2InterestToLegacy(interest: V2PlannerInterest): PlannerInterest {
  return V2_TO_LEGACY_INTEREST[interest];
}

/**
 * Planner Intelligence Upgrade -- Surprise Me, made a real independent mode. Previously the UI
 * silently forwarded the fixed 3-interest set {popular, cultureLocal, viewsNature} as if the
 * customer had manually selected exactly those; this widens the underlying legacy interest set
 * to 5 (still deterministic, still the exact same scoring/Day Builder engine, no AI) so a
 * balanced Surprise Me plan can genuinely draw from iconic/popular, culture/history,
 * nature/views, beach/relax, AND food-related-experience candidates -- "not only the first
 * three interest groups" per the task's own wording.
 *
 * `footballExperiences` is deliberately EXCLUDED, not merely deprioritized: Barcelona's own
 * BARCELONA_REQUIRED_COVERAGE_GOALS (barcelona-planner-day-builder.ts) treats footballExperiences
 * as a real, guaranteed-coverage interest -- including it here would force Camp Nou into EVERY
 * Surprise Me plan regardless of trip length or what else fits, which is exactly the
 * "over-select football" outcome the task explicitly warns against. `foodShoppingNightlife` is
 * safe to include precisely because its only MAIN-stop candidates in the real Barcelona pool are
 * genuine food/market EXPERIENCES (e.g. mercat-sant-antoni, cook-and-taste-paella-class,
 * gothic-quarter-tapas-wine-tour) -- there are no bar/club/shop-only entries in the main
 * candidate pool for this weight to pull in (those exist only as supplementary suggestions, a
 * separate layer this constant never touches).
 */
export const SURPRISE_ME_LEGACY_INTERESTS: PlannerInterest[] = [
  "popular",
  "cultureLocal",
  "viewsNature",
  "beachRelax",
  "foodShoppingNightlife",
];
