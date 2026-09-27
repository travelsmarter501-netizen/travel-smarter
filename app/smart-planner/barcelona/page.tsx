import { redirect } from "next/navigation";

/**
 * Unified Personalized Plan merge: the Smart Planner and Custom Plan products no longer exist
 * as two separate customer-facing offerings -- both now live at the single unified route
 * /planner (see app/planner/page.tsx), with Barcelona preselected via ?destination=barcelona.
 * This route is kept only so any old/bookmarked link to /smart-planner/barcelona still lands
 * somewhere correct, via a plain redirect. The actual component (SmartPlannerV2App) and its
 * Server Action (generateBarcelonaPlanV2Action) are completely unmodified by this move -- only
 * page-level routing changed.
 *
 * /smart-planner/barcelona-v1 (the internal-only V1 rollback route) is untouched and does NOT
 * redirect -- it keeps serving V1 directly, exactly as before.
 */
export default function SmartPlannerBarcelonaPage() {
  redirect("/planner?destination=barcelona");
}
