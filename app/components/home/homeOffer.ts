import { PRODUCT_PRICES_ILS } from "../../lib/commerce/pricing";
import { PLANNER_MY_PLANS, PLANNER_NEW_PLAN } from "../../lib/planner/planLinks";

/**
 * The homepage's one offer, in one place.
 *
 * - START_PLAN_HREF opens a NEW questionnaire (/planner?new=1) for everyone: a visitor, a customer who has not bought yet and an owner alike.
 *   The planner page still runs its own safeguards first (a paid purchase waiting to be attached goes to /claim-purchase), and an owner's
 *   questionnaire ends in "Create my plan" with no payment, so this link can never ask an owner to pay again.
 * - MY_PLANS_HREF is the returning owner's list of plans.
 * - PLAN_PRICE_ILS is the display price from the same table the old homepage cards used (app/lib/commerce/pricing.ts). The amount actually
 *   charged comes only from the database at checkout; nothing here touches payment or entitlements.
 */
export const START_PLAN_HREF = PLANNER_NEW_PLAN;
export const MY_PLANS_HREF = PLANNER_MY_PLANS;
export const PLAN_PRICE_ILS = PRODUCT_PRICES_ILS["personalized-trip-plan"].launch;
