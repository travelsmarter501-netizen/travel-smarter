/**
 * The in-app links of the Personalized Plan flow, in one place.
 *
 * The Personalized Plan is bought ONCE and then unlocks the planner for that customer, so:
 *   - PLANNER_MY_PLANS      /planner                 their plans (or, for someone who has not bought it, the questionnaire that ends in checkout)
 *   - PLANNER_NEW_PLAN      /planner?new=1           an owner's fresh questionnaire -- free, it ends in "Create my plan". This is where the owned homepage card
 *                                                    and the checkout "unlocked" panel send an owner: straight into the questionnaire, no plans page first
 *   - plannerEditPlanHref   /planner?editPlan=<id>   an owner's questionnaire pre-filled from one of their plans -- free, it ends in "Update my plan"
 *   - CHECKOUT_PERSONALIZED /checkout?plan=personalized   the ₪39 checkout (only ever shown to someone who does not own the planner yet)
 * The server decides who is an owner (user_owns_personalized_plan); these links only say what the visitor asked for.
 */
export const PLANNER_MY_PLANS = "/planner";
export const PLANNER_NEW_PLAN = "/planner?new=1";
export const CHECKOUT_PERSONALIZED = "/checkout?plan=personalized";

export function plannerEditPlanHref(planId: string): string {
  return `/planner?editPlan=${encodeURIComponent(planId)}`;
}
