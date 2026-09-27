import type { FlagshipCoverageGoal } from "./plannerDayBuilder";

/**
 * Barcelona Must-See Priority Audit -- the ONE central location for any explicit,
 * place-specific flagship rule in the Barcelona planner (per this task's own "do not scatter
 * `if (place.id === 'sagrada-familia')` across multiple modules" instruction). Every other
 * planner module reads this file's exports; none hardcodes a placeId of its own.
 *
 * -- Root cause (measured via mustSeePriorityAudit.debug.ts, 110-plan matrix) ------------------
 * Barcelona's existing Must-See mechanisms (`BARCELONA_COVERAGE_GOALS`/`BARCELONA_TIER_COVERAGE_
 * GOALS` in barcelona-planner-day-builder.ts) only ever activate `if (preferences.interests.
 * includes(goal.interest))`. Sagrada Família sits in the "popular" Tier A bucket alongside 4
 * other icons (park-guell, gothic-quarter, casa-batllo, barceloneta-beach) with a shared
 * `minCoverage: 4` -- i.e. the guarantee is satisfied as long as ANY 4 of those 5 appear, with
 * no guarantee it's specifically Sagrada. Combined with its planner weights being concentrated
 * almost entirely in `popular`/`cultureLocal` (weights: 10/10, but 0/0/3/2 on the other four
 * axes -- see barcelona-planner-metadata.ts), this produced measured BEFORE inclusion of just
 * 36.4% (1-day), 68.2% (2-3 day), and a striking 0% for the "Experiences+Entertainment" profile
 * at every length up to 5 days -- a real, measured defect, not a hypothetical one. Every OTHER
 * Guide mustSee-flagged attraction was already at 100% inclusion in every bucket (at least one
 * appeared in every single generated plan) -- this is specifically a Sagrada/shared-bucket
 * problem, not a general "must-see attractions vanish" problem.
 *
 * -- Tiers (conceptual classification of the Guide's existing `mustSee: true` attractions) -----
 * TIER A -- Core Barcelona icon, exceptionally strong priority, INTEREST-INDEPENDENT (this
 *   file's own `BARCELONA_FLAGSHIP_MUST_SEE` list + `plannerDayBuilder.ts`'s new
 *   FlagshipCoverageGoal mechanism). Currently: sagrada-familia only -- the sole icon whose
 *   real-world importance to a Barcelona trip clearly outweighs interest-based scoring alone,
 *   per this task's own explicit framing ("Most importantly: sagrada-familia"). Deliberately a
 *   short list: promoting more places here without equally strong justification would be
 *   exactly the "generic tourist itinerary" outcome this task warns against (section 6).
 * TIER B FLAGSHIP -- Increase Camp Nou Must-See Coverage: `camp-nou` promoted from ordinary
 *   Tier B iconic status (see below) into its own, WEAKER `FlagshipCoverageGoal` entry
 *   (`BARCELONA_FLAGSHIP_TIER_B` / `FLAGSHIP_TIER_B_BOOST`, see that constant's own doc comment
 *   for the full root-cause + A/B evidence). Everything else in Tier B is unchanged.
 * TIER B -- Major Must-See, strong priority but still genuinely competes on interest/geography/
 *   trip length -- unchanged, existing `BARCELONA_ICONIC_TIER_A`/`BARCELONA_ICONIC_TIER_B`
 *   (park-guell, gothic-quarter, casa-batllo, barceloneta-beach, bunkers-carmel, camp-nou, mnac,
 *   boqueria, ciutadella, casa-mila, barcelona-cathedral, arc-de-triomf). These already measured
 *   at 100% "at least one included" and were not touched by this task.
 * TIER C -- Optional iconic coverage preference, not mandatory: every other Guide `mustSee: true`
 *   attraction not already in Tier A/B (la-rambla, montjuic) -- relies on ordinary scoring only,
 *   unchanged.
 *
 * -- Feature flag -------------------------------------------------------------------------------
 * `ENABLE_MUST_SEE_PRIORITY`: default true only after the full regression matrix
 * (mustSeePriorityAudit.debug.ts, barcelonaV2LongTripAudit.debug.ts,
 * naturalClusterReclaimAudit.debug.ts, crossDayRouteOptimizationAudit.debug.ts, dated
 * eligibility) passed clean -- see this task's own final report for the evidence. Set to false
 * to instantly revert to the pre-existing (interest-gated-only) behavior without touching any
 * other file: `BARCELONA_DAY_BUILDER_CONFIG.flagshipCoverageGoals` becomes `[]`, which is a
 * complete no-op in `plannerDayBuilder.ts` (see FlagshipCoverageGoal's own doc comment).
 */
export const ENABLE_MUST_SEE_PRIORITY = true;

/** Tier A: interest-independent flagship coverage. See this file's header for why the list is short. */
export const BARCELONA_FLAGSHIP_MUST_SEE: string[] = ["sagrada-familia"];

/**
 * Selection-priority boost applied unconditionally (see FlagshipCoverageGoal.boost). Sized
 * against the real observed score range for this planner (interest-weighted scores typically
 * land in the 5-35 range -- see plannerScoring.ts's `scorePlannerPlace`): large enough to make
 * natural inclusion the common case even for a specialized single-interest profile where
 * Sagrada's own weights are near-zero, without being an absolute override on the scale of
 * `MUST_VISIT_BOOST` (1000) -- this is a very strong preference, not an unconditional guarantee;
 * the coverage-repair guarantee below (`minCoverage: 1`) is the actual backstop for the rest.
 */
export const FLAGSHIP_MUST_SEE_BOOST = 25;

/**
 * Must-See Final Polish -- audited whether the coverage-repair GUARANTEE (as opposed to the
 * `boost` above alone) should be relaxed for genuinely specialized 1-day trips (Food/Shopping/
 * Nature+Beaches/Experiences+Entertainment), to avoid forcing Sagrada into a day that would
 * otherwise be built entirely around one specific interest. A real A/B comparison was built
 * (mustSeePriorityAudit.debug.ts's Part 3: identical requests run once with the guarantee always
 * on, once with it disabled and only the boost active) across all 8 required 1-day profiles
 * (the 4 specialized ones above plus the Popular/Culture/Surprise Me/All-interests controls).
 *
 * RESULT: byte-identical stop lists, visit minutes, travel minutes, unresolved-leg counts, and
 * density in EVERY one of the 8 profiles. The `FLAGSHIP_MUST_SEE_BOOST` (25) is already large
 * enough that Sagrada wins its slot on natural, boost-driven selection alone in every tested
 * case -- the coverage-repair guarantee never actually had to fire for any of them, specialized
 * or not. There is therefore no measured personalization cost to the current unconditional
 * guarantee: it is not what is "forcing" Sagrada into these itineraries, and disabling it would
 * only remove a backstop for some untested future edge case (e.g. a narrower interest
 * combination, or a request where a hours/date conflict removes Sagrada's natural competitors)
 * without any offsetting benefit. Per this task's own explicit fallback ("if no meaningful
 * personalization loss: KEEP 100%"), the guarantee stays UNCONDITIONAL -- no per-request
 * conditional policy was added, keeping this file's surface area minimal.
 */

/**
 * Increase Camp Nou Must-See Coverage -- Tier B flagship: `camp-nou`, weaker than Sagrada's
 * Tier A entry above (lower boost, and crucially NO coverage-repair guarantee -- see below).
 *
 * -- Root cause (measured via campNouCoverageAudit.debug.ts, 110-plan matrix) -------------------
 * Camp Nou's only interest-independent-ish mechanisms were the existing Tier B iconic-tier entry
 * (a shared, un-guaranteed `boost: 3` split across 8 places) and the `footballExperiences`-gated
 * `BARCELONA_REQUIRED_COVERAGE_GOALS`/`BARCELONA_COVERAGE_GOALS` entries in
 * barcelona-planner-day-builder.ts, both of which only fire when the visitor explicitly selects
 * Experiences+Entertainment. For every OTHER profile, Camp Nou competed as an ordinary candidate
 * in the geographically isolated `les-corts` cluster -- BEFORE inclusion measured just 18.2% for
 * every bucket up to 5 days (identical across 1-day/2-3-day/4-5-day: only the
 * Experiences+Entertainment and All-6-interests profiles ever included it), jumping to 92.7% only
 * for 6-10 day trips once the Fix Repetitive Montjuïc Day task's `montjuic<->les-corts` cluster
 * link gave it a geographic home. Short-to-medium trips (2-5 days) were the real gap.
 *
 * -- Boost sizing (A/B tested via a temporary tuning script, since removed) ---------------------
 * Tested boost values 6/10/14/18 at minCoverage 0 and 1 across the full 110-plan matrix.
 * minCoverage: 1 (a coverage-repair guarantee, same as Sagrada's) forces Camp Nou into ALL
 * 1-day plans (11/11) regardless of profile -- directly contradicting this task's own target
 * ("1 day: optional unless especially relevant"), so the guarantee is deliberately left OFF
 * (`minCoverage: 0`): Camp Nou wins its slot purely on selection-priority boost, exactly like
 * the Sagrada boost-only variant tested (and shipped) in the Must-See Final Polish task.
 * boost: 10 (minCoverage: 0) produced the cleanest match to every graduated target in the task:
 *   1 day:    2/11  (18.2%, unchanged -- only Experiences+Entertainment / All-6 include it)
 *   2 days:   6/11  (54.5%, moderate-to-high)
 *   3 days:   8/11  (72.7%, majority)
 *   4-5 days: 10/11 (90.9%, majority)
 *   6-10 days: 11/11 (100%, very likely -- up from 92.7%)
 * Sagrada stayed at 100% inclusion in every bucket across every tested boost/minCoverage
 * combination -- the two flagship goals are independent boost additions, never a substitution.
 * Per-profile curve (boost=10) is also well-graduated rather than forced: Nature+Beaches only
 * picks it up from day 5, Popular+Nature from day 4, Culture/Popular+Culture from day 3, while
 * Popular/Food/Shopping/Food+Shopping pick it up from day 2 (Camp Nou remains just one stop among
 * several on those days -- it does not take over the itinerary).
 */
export const BARCELONA_FLAGSHIP_TIER_B: string[] = ["camp-nou"];
export const FLAGSHIP_TIER_B_BOOST = 10;

export const BARCELONA_FLAGSHIP_COVERAGE_GOALS: FlagshipCoverageGoal[] = ENABLE_MUST_SEE_PRIORITY
  ? [
      { candidates: BARCELONA_FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
      { candidates: BARCELONA_FLAGSHIP_TIER_B, minCoverage: 0, boost: FLAGSHIP_TIER_B_BOOST },
    ]
  : [];

/**
 * Fix 3-Day Surprise Me Camp Nou Coverage -- a SMALL, bounded, Surprise-Me-only extra boost for
 * `camp-nou` on trips of 3+ days. `BARCELONA_FLAGSHIP_COVERAGE_GOALS` above is unchanged and
 * still governs V1 and every non-Surprise-Me V2 request; this is a separate, opt-in override
 * that only `app/smart-planner/barcelona-v2/actions.ts` applies, and only when the customer
 * picked "فاجئني ✨" for a 3+ day trip -- see `getBarcelonaFlagshipCoverageGoals` below.
 *
 * -- Root cause (measured via a temporary per-place selection-priority dump, since removed) -----
 * Surprise Me's own interest set (`SURPRISE_ME_LEGACY_INTERESTS`) deliberately excludes
 * `footballExperiences` (see that constant's own doc comment), so Camp Nou scores purely on
 * popular/cultureLocal/viewsNature/foodShoppingNightlife -- rawScore 25, selectionPriority 38
 * with the existing +10 Tier B flagship boost. That is genuinely competitive (rank #7 of 36
 * candidates, ahead of casa-batllo/boqueria/bunkers-carmel/tibidabo/casa-mila and more) -- Camp
 * Nou is NOT under-scored for Surprise Me. The actual blocker is purely GREEDY-FILL CLUSTER
 * COMPATIBILITY: `les-corts` (Camp Nou's cluster) has only WEAK links to montjuic/passeig-gracia/
 * city-center, so within any day's fill loop it always ranks behind same-cluster (score 4) and
 * medium/strong-tier (score 2-3) candidates, no matter how high its own priority is -- it can
 * only win a slot by becoming a day's ANCHOR outright (the one place chosen before any cluster
 * exists yet). For a 3-day trip, exactly 6 places outrank it (sagrada-familia, barceloneta-beach,
 * gothic-quarter, mnac, park-guell, barcelona-cathedral); park-guell/gothic-quarter/barcelona-
 * cathedral all get absorbed as FILL (not anchors) into Days 1-2 via their own strong/medium
 * cluster links, which leaves mnac (selectionPriority 43.5) as the highest remaining unassigned
 * place and therefore Day 3's anchor -- Camp Nou (38) never gets to be an anchor, and once Day 3's
 * cluster is `montjuic`, every old-city/montjuic candidate (medium/same-cluster tier) keeps
 * outranking Camp Nou's weak-tier link until the day fills up. Since `BARCELONA_FLAGSHIP_TIER_B`
 * has `minCoverage: 0` (see its own doc comment for why -- keeping 1-day/2-day optional), there is
 * no coverage-repair backstop for this case either. Because `minCoverage: 0` also means the
 * flagship boost is the ONLY lever available (no repair pass runs), this is fixed via extra
 * boost, not by flipping `minCoverage`.
 *
 * -- Why extra BOOST, not a coverage-repair guarantee (tested both, boost-only wins) -------------
 * Tested a conditional `minCoverage: 1` repair (same boost=10) against a plain boost escalation
 * for 3-day Surprise Me. The repair path DOES get Camp Nou included, but `attemptCoverageSwap`
 * only inserts a single place into whichever day has a removable low-value stop -- it landed Camp
 * Nou on DAY 1 paired with Sagrada Família (eixample-north/gracia-north/les-corts, 3 clusters),
 * completely disconnected from its natural les-corts teammates (monestir-pedralbes,
 * jardins-palau-pedralbes) and from mnac/Montjuïc -- exactly the "insert it just to hit coverage"
 * outcome this task's own section 6 warns against. It also has no day-count gate built in --
 * tested unconditionally, it fired for 1-day AND 2-day Surprise Me too, contradicting the target.
 *
 * Escalating the boost instead lets Camp Nou win an ANCHOR slot, which lets the ordinary greedy
 * FILL loop naturally assemble its real geographic cluster around it. Tested boost values 10/15/
 * 19/20/22/25/30 (minCoverage still 0) for 3-day Surprise Me: 10-15 -> not included (matches
 * BEFORE); >=19 -> Day 3 becomes exactly
 *   [monestir-pedralbes, camp-nou, jardins-palau-pedralbes, passeig-de-gracia, casa-batllo, boqueria]
 * (les-corts + passeig-gracia + old-city, 395min, 6 stops, healthy) -- the precise
 * "Camp Nou + Pedralbes + Montjuïc/MNAC-adjacent" geography this task's section 6 asks for,
 * assembled by the existing greedy fill logic itself, not hand-placed. `FLAGSHIP_TIER_B_SURPRISE_
 * ME_BOOST = 20` was chosen for a safety margin above the measured 19 threshold. Re-tested across
 * 3-10 days: mnac (which Camp Nou's Day-3 anchor takes over from) still appears at 100% for every
 * day count 4-10 in both the boost=10 and boost=20 variants -- the anchor-order change only
 * actually matters at exactly 3 days, where the whole plan is tight enough that Camp Nou's day and
 * mnac's day would otherwise be the same day. This IS an honest, disclosed capacity tradeoff at
 * 3 days (mnac drops out of that one specific plan), not a bug: Old City, beach, food, and
 * views/nature (via park-guell/bunkers-carmel/jardins-palau-pedralbes) all remain represented, so
 * the plan is still "Sagrada + Camp Nou + diverse", never "Sagrada + Camp Nou + only must-sees".
 *
 * Gated to `surpriseMe && days >= 3` only -- 1-day and 2-day Surprise Me keep using the plain
 * `FLAGSHIP_TIER_B_BOOST` (10), so Camp Nou stays exactly as optional there as it was before this
 * task (see campNouCoverageAudit.debug.ts's own 1d/2d Surprise Me numbers, unchanged).
 */
export const FLAGSHIP_TIER_B_SURPRISE_ME_BOOST = 20;

/**
 * Returns the Barcelona flagship coverage goals to use for one V2 request. Identical to
 * `BARCELONA_FLAGSHIP_COVERAGE_GOALS` for every request except Surprise Me at 3+ days, where
 * Camp Nou's boost is raised to `FLAGSHIP_TIER_B_SURPRISE_ME_BOOST` -- see that constant's own
 * doc comment for the full evidence. `minCoverage` is left at 0 either way: this is a boost
 * escalation (lets Camp Nou win a day anchor and pull in its real geographic cluster via the
 * ordinary greedy fill), never a coverage-repair guarantee.
 */
export function getBarcelonaFlagshipCoverageGoals(context: { surpriseMe: boolean; days: number }): FlagshipCoverageGoal[] {
  if (!ENABLE_MUST_SEE_PRIORITY) return [];
  const tierBBoost = context.surpriseMe && context.days >= 3 ? FLAGSHIP_TIER_B_SURPRISE_ME_BOOST : FLAGSHIP_TIER_B_BOOST;
  return [
    { candidates: BARCELONA_FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
    { candidates: BARCELONA_FLAGSHIP_TIER_B, minCoverage: 0, boost: tierBBoost },
  ];
}
