import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * P1 Personalization Fix -- Make Shopping and Nightlife Genuinely Affect the Main Itinerary.
 *
 * Root cause (see v2InterestAdapter.ts's own doc comment): `food`, `shopping`, and `nightlife`
 * all collapse onto the SAME legacy `foodShoppingNightlife` interest key before
 * plannerDayBuilder.ts ever sees them -- the legacy scoring engine has exactly one weight column
 * for all three, so a Shopping-only, Food-only, and Nightlife-only request all score the SAME
 * candidate pool identically.
 *
 * Fix: a small, additive, V2-only selection-priority bonus (see plannerDayBuilder.ts's
 * `DayBuilderConfig.placeSelectionBonus`) computed from the REAL, un-collapsed V2 interest
 * selection -- built and consumed only by the V2 Server Action (barcelona-v2/actions.ts), never
 * touching `metadata.weights` (shared with V1) or the legacy `CoverageGoal` mechanism (keyed on
 * the collapsed `PlannerInterest`, which cannot distinguish these three). V1 and any V2 request
 * that doesn't select shopping/experiences gets a bonus of 0 for every place -- byte-identical to
 * before this file existed.
 *
 * -- Round 2 Fix: Shopping Personalization (targeted implementation) ------------------------
 * The original fix above (a flat +5 on exactly 2 placeIds) was diagnosed as insufficient: only
 * 2 of the pool's genuinely shopping-identity candidates were covered, no coverage guarantee
 * existed (unlike football's 3-layer guarantee), and the bonus was dwarfed by unconditional
 * flagship/priority boosts on generic landmarks. This revision:
 *   1. Curates TWO explicit tiers by REAL PLACE IDENTITY, not by legacy foodShoppingNightlife
 *      weight alone (a market/food-experience/plaza/beach/stadium-tour can carry a high FSN
 *      weight while having zero real shopping character -- see this task's own diagnostic
 *      report for the full per-candidate audit):
 *        - STRONG: a genuine shopping street/market/boutique-district as its PRIMARY identity.
 *        - MIXED: real secondary shopping character, but a different primary identity.
 *   2. Scales the bonus by whether Shopping is the customer's ONLY interest (materially
 *      stronger) or one of several (proportional, same order of magnitude as before -- no
 *      regression for an already-tuned Shopping+Food/Shopping+Popular profile).
 *   3. Adds a bounded, NON-flagship trip-level coverage target (see
 *      `buildBarcelonaV2ShoppingCoverageGoals` below and plannerDayBuilder.ts's new
 *      `DayBuilderConfig.secondaryCoverageGoals`) so a longer Shopping-only trip doesn't run out
 *      of real shopping content on its later days purely because the greedy/boost-only build
 *      happened to place every curated candidate early. This reuses the EXACT SAME
 *      `attemptCoverageSwap` machinery Camp Nou/Sagrada Família already use -- never displaces a
 *      mustVisit/flagship/required-interest/Tier-A protected stop, never forces a day past what
 *      a real swap can achieve, and is a complete no-op unless Shopping is explicitly selected.
 *
 * Candidate lists are DATA-DERIVED, not invented -- see each set's own comment below for the
 * real-identity reasoning (cross-checked against barcelona-guide.ts's own descriptions).
 *
 * - `EXPERIENCE_BONUS_PLACE_IDS`: unchanged from the original P1 fix -- the V2-only "genuine
 *   experience/entertainment" candidates (barcelona-planner-v2-extra-metadata.ts) that were
 *   deliberately added for exactly this interest but whose `footballExperiences` weight is 0.
 *   camp-nou is deliberately EXCLUDED (already strongly scored + separately Must-See-guaranteed);
 *   mnac/tibidabo are also excluded (already score well, need no help).
 * - `FOOD_MARKET_PLACE_IDS`: real Guide food-market/food-experience main-stop candidates that
 *   share the same `foodShoppingNightlife` weight as genuine shopping streets but are food-first
 *   in real identity -- de-prioritized for a Shopping-only/Shopping+Popular/etc. customer (never
 *   when "food" is also selected). `mercat-sant-antoni` was REMOVED from this set in the Round 2
 *   Fix: its real identity (a historic iron-market building AND a genuine, well-known local
 *   shopping/market destination -- see this task's own re-evaluation) is now classified STRONG
 *   shopping instead, so it would be self-contradictory to simultaneously boost and penalize it.
 *   `mercat-sagrada-familia` stays penalized here (and only reaches the smaller MIXED tier, never
 *   STRONG): a small, quick (15-20 min) neighborhood grocery/produce stop whose own Guide
 *   description centers entirely on food, not shopping.
 */

/**
 * STRONG shopping: a genuine shopping street/market/boutique-district AS ITS PRIMARY real-world
 * identity (per barcelona-guide.ts's own descriptions, not merely a nonzero legacy weight):
 *   - passeig-de-gracia / portal-angel: real Guide `shoppingAreas` entries (luxury boulevard /
 *     popular-brand pedestrian street) -- the original P1 fix's own 2 candidates, unchanged.
 *   - el-born: newly promoted in the Round 2 Fix, also a real Guide `shoppingAreas` entry
 *     ("حي أنيق فيه محلات مستقلة وماركات محلية صغيرة" -- independent boutiques/small local
 *     brands) -- see barcelona-planner-v2-extra-metadata.ts's own promotion comment.
 *   - la-rambla: Barcelona's iconic boulevard, historically and presently lined with kiosks/
 *     stalls/shops along its full length -- a real, well-known shopping-adjacent promenade, not
 *     merely a "walk past" street.
 *   - mercat-sant-antoni: a real, well-known local market/shopping destination (historic iron
 *     market building, Sunday book/market day) -- re-evaluated UP from the original P1 fix's
 *     food-market penalty list (see FOOD_MARKET_PLACE_IDS's own comment above).
 *   - mercat-santa-caterina: a real local produce/shopping market with genuine browsing/shopping
 *     character (famous mosaic-roof market hall), distinct from a pure sit-down food experience.
 * Deliberately EXCLUDES boqueria (real identity: a flagship FOOD market, not general shopping --
 * stays in FOOD_MARKET_PLACE_IDS), Plaça Catalunya/Plaça Reial/Camp Nou/beaches/paella
 * class/tapas-wine-tour (all carry a nonzero legacy weight but have a different real identity --
 * transit square, evening plaza, stadium tour, beach, food experience, tasting tour) -- see this
 * task's own diagnostic report for the full per-candidate reasoning.
 */
const STRONG_SHOPPING_PLACE_IDS: ReadonlySet<string> = new Set([
  "passeig-de-gracia",
  "portal-angel",
  "el-born",
  "la-rambla",
  "mercat-sant-antoni",
  "mercat-santa-caterina",
]);

/**
 * MIXED shopping: real, genuine secondary shopping/craft/market character, but a DIFFERENT
 * primary real-world identity -- gets a smaller bonus than STRONG, and is included in the trip
 * coverage target only as a supporting pool (see buildBarcelonaV2ShoppingCoverageGoals below).
 *   - gothic-quarter: primary identity is medieval heritage wandering; boutique/souvenir shops
 *     genuinely line its alleys as a real secondary character (not invented).
 *   - poble-espanyol: primary identity is an open-air architecture village; its own Guide
 *     description explicitly names on-site "ورش حرفيين" (craft workshops) as part of the visit.
 *   - mercat-sagrada-familia: primary identity is a small neighborhood food market (see
 *     FOOD_MARKET_PLACE_IDS's own comment) -- kept here only as a minor secondary signal, never
 *     promoted to STRONG.
 * Plaça de la Vila de Gràcia was explicitly evaluated and EXCLUDED from both tiers: its own
 * Guide description ("محاطة بمقاهي محلية" -- surrounded by local cafés; "whyRecommend" mentions
 * only free wandering through quiet alleys) names cafés and atmosphere, never shops or
 * boutiques -- giving it a shopping signal here would not be honestly grounded in the Guide's own
 * data, regardless of Gràcia's real-world reputation for boutiques elsewhere in the
 * neighborhood. No duplicate "Gràcia Shopping" candidate was created either, per this task's own
 * explicit instruction.
 */
const MIXED_SHOPPING_PLACE_IDS: ReadonlySet<string> = new Set(["gothic-quarter", "poble-espanyol", "mercat-sagrada-familia"]);

const EXPERIENCE_BONUS_PLACE_IDS: ReadonlySet<string> = new Set([
  "tablao-cordobes-flamenco",
  "gaudi-bike-tour",
  "sunset-catamaran-sail",
  "gothic-quarter-tapas-wine-tour",
  "teleferic-montjuic",
]);

const FOOD_MARKET_PLACE_IDS: ReadonlySet<string> = new Set([
  "boqueria",
  "mercat-sagrada-familia",
  "cook-and-taste-paella-class",
  "gothic-quarter-tapas-wine-tour",
]);

/** Round 2 Retune: lowered from 6 to 3 -- the retune audit found +6 was moderately too
 * aggressive, letting a STRONG candidate (e.g. mercat-santa-caterina, base priority ~9) beat a
 * geographically-relevant but non-curated filler (e.g. placa-catalunya, ~11.5) on a day whose
 * own cluster has no real affinity with it (e.g. the Camp Nou/les-corts day), even when the
 * trip's Shopping coverage target was already satisfied elsewhere. +3 narrows that margin
 * (9+3=12 vs 11.5) so a STRONG candidate still competes fairly for its OWN natural-cluster day
 * (where it already wins by a wide margin on real weight alone -- see the audit's own "entering
 * naturally" findings) without reliably tipping a marginal, off-cluster slot in its favor.
 * Applied whenever Shopping is one of several selected interests (proportional influence, per
 * this task's own explicit "if Shopping is one of several interests, it should influence the
 * trip proportionally, not dominate it" direction). MIXED_SHOPPING_BONUS_MULTI is unchanged --
 * the audit found no off-cluster over-selection evidence for MIXED candidates. */
const STRONG_SHOPPING_BONUS_MULTI = 3;
const MIXED_SHOPPING_BONUS_MULTI = 2;

/** New in the Round 2 Fix: when Shopping is the customer's ONLY selected interest, its
 * influence should be "materially stronger" (this task's own explicit direction) -- still well
 * short of a Sagrada-like flagship boost (+25) or even Camp Nou's own Tier-B boost (+10), but
 * enough that the now 6-candidate STRONG set can reliably out-compete the generic landmarks
 * (gothic-quarter's own base priority ~10, la-rambla/placa-catalunya ~7-8) that previously won
 * every slot under an identical-scoring Shopping-only request. */
const STRONG_SHOPPING_BONUS_SOLO = 9;
const MIXED_SHOPPING_BONUS_SOLO = 4;

const EXPERIENCE_SCORE_BONUS = 6;

/** Unchanged from the original P1 fix. See FOOD_MARKET_PLACE_IDS's own comment for why
 * mercat-sant-antoni was removed from the penalized set in the Round 2 Fix. */
const FOOD_MARKET_SHOPPING_PENALTY = 6;

/**
 * Builds the per-placeId selection-priority bonus for one V2 request, from the ORIGINAL
 * (un-collapsed) V2 interest selection. Returns a pure function of `placeId` -- 0 for Surprise Me
 * (which always passes `[]` here, see actions.ts) and for any request that selected neither
 * "shopping" nor "footballExperiences"/"nightlife", byte-identical to omitting
 * `placeSelectionBonus` entirely.
 */
export function buildBarcelonaV2PlaceSelectionBonus(v2Interests: readonly V2PlannerInterest[]): (placeId: string) => number {
  const shoppingSelected = v2Interests.includes("shopping");
  const shoppingIsOnlyInterest = shoppingSelected && v2Interests.length === 1;
  const foodSelected = v2Interests.includes("food");
  const experiencesSelected = v2Interests.includes("footballExperiences") || v2Interests.includes("nightlife");

  const strongBonus = shoppingIsOnlyInterest ? STRONG_SHOPPING_BONUS_SOLO : STRONG_SHOPPING_BONUS_MULTI;
  const mixedBonus = shoppingIsOnlyInterest ? MIXED_SHOPPING_BONUS_SOLO : MIXED_SHOPPING_BONUS_MULTI;

  return (placeId: string): number => {
    let bonus = 0;
    if (shoppingSelected && STRONG_SHOPPING_PLACE_IDS.has(placeId)) bonus += strongBonus;
    if (shoppingSelected && MIXED_SHOPPING_PLACE_IDS.has(placeId)) bonus += mixedBonus;
    if (experiencesSelected && EXPERIENCE_BONUS_PLACE_IDS.has(placeId)) bonus += EXPERIENCE_SCORE_BONUS;
    if (shoppingSelected && !foodSelected && FOOD_MARKET_PLACE_IDS.has(placeId)) bonus -= FOOD_MARKET_SHOPPING_PENALTY;
    return bonus;
  };
}

/**
 * Round 2 Fix: trip-level Shopping coverage target -- product intent is "roughly N meaningful
 * shopping-oriented experiences across the trip" (2 for 3-4 days, 3 for 5-6, 4 for 7-8, 5 for
 * 9+), deliberately pinned to the CONSERVATIVE end of each range and expressed as a plain
 * candidate-count guarantee (never a "one per day" rule, never a forced/filler stop -- see
 * plannerDayBuilder.ts's `attemptCoverageSwap`, reused unchanged, which already refuses to
 * empty a day or displace a protected stop and simply leaves a goal honestly unsatisfied when no
 * valid swap exists). Trips of 1-2 days get no target at all -- too tight to spare a guaranteed
 * slot without risking a visibly forced day. Returns `undefined` (a true no-op, byte-identical
 * to omitting the field) whenever Shopping wasn't selected, exactly like the bonus function
 * above.
 *
 * Candidates are STRONG-first, then MIXED, so `attemptCoverageSwap` -- which tries its
 * `candidates` list in order -- always prefers a real shopping-identity stop over a merely
 * mixed-identity one when both could still satisfy the goal.
 */
export function buildBarcelonaV2ShoppingCoverageGoals(
  v2Interests: readonly V2PlannerInterest[],
  days: number
): { candidates: string[]; minCoverage: number }[] {
  if (!v2Interests.includes("shopping")) return [];
  if (days <= 2) return [];

  const minCoverage = days <= 4 ? 2 : days <= 6 ? 3 : days <= 8 ? 4 : 5;
  const candidates = [...STRONG_SHOPPING_PLACE_IDS, ...MIXED_SHOPPING_PLACE_IDS];
  return [{ candidates, minCoverage }];
}
