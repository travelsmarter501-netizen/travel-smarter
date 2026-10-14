import type { Metadata } from "next";
import PlannerPageView from "../components/planner/PlannerPageView";
import { getPersonalizedPlanPriceIls, loadMyPersonalizedPlans } from "../lib/commerce/personalizedPlan";
import { isAvailablePlannerDestinationId, DEFAULT_PLANNER_DESTINATION_ID } from "../lib/planner/plannerDestinations";
import { hasProductAccess } from "../lib/entitlements";
import { PRODUCT_SLUGS } from "../lib/commerce/catalog";
import { createClient } from "../../utils/supabase/server";

/**
 * Unified Personalized Plan -- "خطة مخصصة إلك ✨", the ONE customer-facing planner route (the old
 * /smart-planner/barcelona and /custom-plan/barcelona routes redirect here).
 *
 * "One purchase = one plan", questionnaire BEFORE payment:
 *   - Anyone (signed out, or signed in without plans) sees the free questionnaire, then a review of the order, and
 *     only "Continue to payment" starts checkout. Nothing is generated and nothing paid-for is shown here.
 *   - A signed-in customer who already has plans or paid/pending requests sees "My Personalized Plans" (their plans,
 *     a "Build my plan" card for each paid-but-unbuilt request, and "Create a new plan").
 *   - "Create a new plan" (?new=1) is simply the questionnaire again -> a new order -> a new payment.
 *
 * Owning the product entitlement does NOT unlock the planner any more: generation is authorized per paid request
 * (see lib/commerce/personalizedPlan.ts), never by the entitlement.
 *
 * Customers who bought under the OLD pay-first model have the entitlement but no request:
 *   - with saved plans -> they land on "My Personalized Plans" and their plans open normally; their old entitlement is
 *     never shown as an unused paid request, and "Create a new plan" is a new paid purchase;
 *   - with no saved plan -> they see the questionnaire plus an explicit notice that their purchase is safe and how to
 *     get help (nothing is granted automatically and nothing is fabricated).
 */
export const metadata: Metadata = {
  title: "خطة مخصصة إلك ✨ | Travel Smarter",
  description:
    "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك. برشلونة متاحة الآن — وجهات جديدة قريبًا. Pick your destination and interests and we’ll build a smart plan for your trip.",
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ destination?: string; new?: string }> }) {
  const { destination, new: wantsNew } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialDestinationId = isAvailablePlannerDestinationId(destination) ? (destination as string) : DEFAULT_PLANNER_DESTINATION_ID;
  const mine = user ? await loadMyPersonalizedPlans(user.id) : { plans: [], requests: [], hasAnyRequest: false };
  const hasPlans = mine.plans.length > 0 || mine.requests.length > 0;
  // A legacy owner: bought before the questionnaire-first model, so there is an entitlement but never a request or plan.
  const legacyOwnerWithoutPlan =
    !!user && mine.plans.length === 0 && !mine.hasAnyRequest && (await hasProductAccess(PRODUCT_SLUGS.personalizedPlan, user.id));
  const view = user && hasPlans && wantsNew !== "1" ? "mine" : "wizard";

  // Display-only price for the review step (the charge itself is computed in the database).
  const priceIls = view === "wizard" ? await getPersonalizedPlanPriceIls() : null;

  return (
    <PlannerPageView
      view={view}
      initialDestinationId={initialDestinationId}
      priceIls={priceIls}
      signedIn={!!user}
      hasPlans={hasPlans}
      legacyOwnerNotice={legacyOwnerWithoutPlan && view === "wizard"}
      plans={mine.plans}
      requests={mine.requests}
    />
  );
}
