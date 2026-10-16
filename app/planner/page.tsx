import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlannerPageView from "../components/planner/PlannerPageView";
import { loadMyPersonalizedPlans } from "../lib/commerce/personalizedPlan";
import { pendingClaimState } from "../claim-purchase/pendingClaimStatus";
import { isComplimentaryUser } from "../lib/commerce/complimentary";
import { isAvailablePlannerDestinationId, DEFAULT_PLANNER_DESTINATION_ID } from "../lib/planner/plannerDestinations";
import { hasProductAccess } from "../lib/entitlements";
import { PRODUCT_SLUGS } from "../lib/commerce/catalog";
import { createClient } from "../../utils/supabase/server";

/**
 * Unified Personalized Plan -- "خطة مخصصة إلك ✨", the ONE customer-facing planner route (the old
 * /smart-planner/barcelona and /custom-plan/barcelona routes redirect here).
 *
 * "One purchase = one plan", questionnaire BEFORE payment:
 *   - Anyone (signed out, or signed in without plans) sees the free questionnaire; its last button goes straight to
 *     /checkout?plan=personalized (compact summary + Allpay button). Nothing is generated and nothing paid-for is shown here.
 *   - A signed-in customer who already has plans or paid/pending requests sees "My Personalized Plans" (their plans,
 *     a "Build my plan" card for each paid-but-unbuilt request, and "Create a new plan").
 *   - "Create a new plan", the homepage "ابدأ خطتك" button and "Edit answers" (?new=1 / ?edit=1) always open the questionnaire
 *     itself, at step 1 for a new plan -> a new order -> a new payment.
 *
 * Owning the product entitlement does NOT unlock the planner any more: generation is authorized per paid request
 * (see lib/commerce/personalizedPlan.ts), never by the entitlement.
 *
 * What this page shows is decided HERE from the database, never from the browser (session storage drafts, an old tab):
 *   - a paid purchase of this browser that is not attached to an account yet  -> /claim-purchase (it attaches it automatically);
 *   - a PAID request that has not been built yet -> always "My Personalized Plans" with its "Build my plan" button, even for
 *     ?new=1 / ?edit=1 -- the questionnaire (and its "Continue to payment") is never offered while a paid plan is waiting;
 *   - otherwise unpaid -> the questionnaire -> checkout; paid-not-built -> Build my plan; built -> Open my plan.
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

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ destination?: string; new?: string; edit?: string }> }) {
  const { destination, new: wantsNew, edit } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This browser holds a paid purchase that is not in an account yet: finish that first (signed out it asks to sign in, signed in it attaches it).
  if ((await pendingClaimState(user?.id ?? null)) === "paid") redirect("/claim-purchase");

  const initialDestinationId = isAvailablePlannerDestinationId(destination) ? (destination as string) : DEFAULT_PLANNER_DESTINATION_ID;
  const mine = user ? await loadMyPersonalizedPlans(user.id, { hidePending: isComplimentaryUser(user.id) }) : { plans: [], requests: [], hasAnyRequest: false };
  const hasPlans = mine.plans.length > 0 || mine.requests.length > 0;
  // A legacy owner: bought before the questionnaire-first model, so there is an entitlement but never a request or plan.
  const legacyOwnerWithoutPlan =
    !!user && mine.plans.length === 0 && !mine.hasAnyRequest && (await hasProductAccess(PRODUCT_SLUGS.personalizedPlan, user.id));
  // A visitor who ASKED for the questionnaire (the homepage button, "Create a new plan", "Edit answers", an old destination link)
  // always gets it -- even a customer who already has plans. Plain /planner is the signed-in customer's My Personalized Plans.
  // A paid plan waiting to be built always wins over a request for the questionnaire.
  const hasPaidUnbuilt = mine.requests.some((request) => request.state === "ready" && !request.complimentary);
  const wantsQuestionnaire = (wantsNew === "1" || edit === "1" || typeof destination === "string") && !hasPaidUnbuilt;
  const view = user && hasPlans && !wantsQuestionnaire ? "mine" : "wizard";

  return (
    <PlannerPageView
      view={view}
      initialDestinationId={initialDestinationId}
      restoreDraft={edit === "1"}
      signedIn={!!user}
      hasPlans={hasPlans}
      legacyOwnerNotice={legacyOwnerWithoutPlan && view === "wizard"}
      plans={mine.plans}
      requests={mine.requests}
    />
  );
}
