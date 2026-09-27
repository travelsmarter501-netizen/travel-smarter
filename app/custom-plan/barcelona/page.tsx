import { redirect } from "next/navigation";

/**
 * Unified Personalized Plan merge: Custom Plan is no longer a separate customer-facing product
 * -- both it and the old Smart Planner now live at the single unified route /planner (see
 * app/planner/page.tsx), fully automated with immediate generation. This route is kept only so
 * any old/bookmarked link to /custom-plan/barcelona still lands somewhere correct.
 *
 * The old CustomPlanRequestForm component, its Server Actions (actions.ts), and every piece of
 * live Custom Plan admin/fulfillment infrastructure (custom_plan_requests/drafts/final_plans,
 * /admin/custom-plans/*) are all left completely untouched -- this route simply no longer sends
 * new customers into that flow. Historical request rows and the admin tooling remain exactly as
 * they were.
 */
export default function CustomPlanBarcelonaPage() {
  redirect("/planner?destination=barcelona");
}
