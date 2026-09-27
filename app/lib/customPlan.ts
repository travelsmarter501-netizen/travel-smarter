/**
 * Custom Plan V2 — pricing/duration domain.
 *
 * Custom Plan is a distinct, human-built concierge product: the customer picks a trip length,
 * we build and personally review their itinerary around their stay/interests, not an instant
 * algorithmic generation (that's what the Smart Planner already does — a separate product,
 * unchanged by this file). Kept as its own tiny module (not inside barcelona-guide.ts or the
 * planner lib) since Custom Plan isn't Barcelona-specific in principle and doesn't touch
 * Guide/Ready Plan/Smart Planner data at all.
 *
 * Product Simple Intake V2 (Custom Plan Simple Intake V2 task): replaced the old duration-
 * tiered pricing (3/5/7 days -> 69/89/109 ILS) with ONE fixed price for any supported
 * duration. Duration now only affects itinerary length, never price. Matches the live product
 * `barcelona-custom-plan` (99 ILS) added by
 * supabase/migrations/20260904120000_custom_plan_fixed_price_simplified_intake.sql -- see that
 * migration for the authoritative source; this constant is display/preview convenience only,
 * the real price authority is always public.products.price_ils, enforced server-side by
 * create_custom_plan_request (always inserts 99) and create_custom_plan_order (requires the
 * request's stored price_ils to match the live product price before creating an order).
 */

export const CUSTOM_PLAN_MIN_DURATION_DAYS = 1;
export const CUSTOM_PLAN_MAX_DURATION_DAYS = 10;

/** Fixed display order, 1..10 -- every supported duration, all at the same price. */
export const CUSTOM_PLAN_DURATIONS: readonly number[] = Array.from(
  { length: CUSTOM_PLAN_MAX_DURATION_DAYS - CUSTOM_PLAN_MIN_DURATION_DAYS + 1 },
  (_, i) => i + CUSTOM_PLAN_MIN_DURATION_DAYS
);

/** ONE fixed price for any supported duration (1-10 days) -- duration never affects price. */
export const CUSTOM_PLAN_PRICE_ILS = 99;

export const CUSTOM_PLAN_DEFAULT_DURATION_DAYS = 5;

export function isCustomPlanDuration(value: number): boolean {
  return Number.isInteger(value) && value >= CUSTOM_PLAN_MIN_DURATION_DAYS && value <= CUSTOM_PLAN_MAX_DURATION_DAYS;
}
