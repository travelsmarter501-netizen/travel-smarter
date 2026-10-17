/**
 * The in-app links of the Personalized Plan flow, in one place.
 *
 * A customer who already has a personalized plan lands on THEIR plans, not on a purchase screen. A second purchase is always an explicit
 * choice ("Create another plan"), and it is carried in the URL so a direct visit, an old bookmark or a stale tab can never be mistaken for it:
 *   - PLANNER_MY_PLANS      /planner           their plans (or the first-time questionnaire if they have none)
 *   - PLANNER_NEW_PLAN      /planner?new=1     a fresh questionnaire for another trip (a new purchase)
 *   - CHECKOUT_NEW_PLAN     /checkout?plan=personalized&new=1   the questionnaire's checkout step (what the wizard opens)
 * The server still decides everything that matters (a paid plan waiting to be built, a duplicate of the answers just bought);
 * these links only say what the visitor asked for.
 */
export const PLANNER_MY_PLANS = "/planner";
export const PLANNER_NEW_PLAN = "/planner?new=1";
export const CHECKOUT_NEW_PLAN = "/checkout?plan=personalized&new=1";
