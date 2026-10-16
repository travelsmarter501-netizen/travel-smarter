/**
 * Products whose purchase also includes Barcelona Guide access, even though the owner never bought "barcelona-guide" directly.
 * Deliberately does NOT include "barcelona-ready-plan-1day": the 1-day plan is a standalone product and does not bundle the Guide.
 *
 * Plain constants (no server imports) so BOTH the server-side access checks (lib/entitlements.ts, re-exported from there) and the
 * browser-side "you already own this" product cards use the one list.
 */
export const GUIDE_BUNDLE_PRODUCT_SLUGS = ["barcelona-ready-plan", "barcelona-ready-plan-3day", "barcelona-smart-planner"] as const;
