import { redirect } from "next/navigation";

/**
 * Unified Personalized Plan merge: the real product now lives at /planner (see that route's own
 * page.tsx). Redirects straight there (not through /smart-planner/barcelona, which itself now
 * redirects to /planner too) to avoid an unnecessary double-hop -- kept only so an old/bookmarked
 * link to /smart-planner/barcelona-v2 still lands somewhere correct.
 */
export default function SmartPlannerBarcelonaV2Page() {
  redirect("/planner?destination=barcelona");
}
