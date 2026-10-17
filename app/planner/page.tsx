import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlannerPageView from "../components/planner/PlannerPageView";
import { loadMyPersonalizedPlans } from "../lib/commerce/personalizedPlan";
import { pendingClaimState } from "../claim-purchase/pendingClaimStatus";
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
 *     /checkout?plan=personalized&new=1 (compact summary + Allpay button). Nothing is generated and nothing paid-for is shown here.
 *   - A signed-in customer who already has a personalized purchase (a built plan, a paid plan to build, or plans they removed from
 *     the list) sees "My Personalized Plans" by default -- their plans, a "Build my plan" card for each paid-but-unbuilt request,
 *     and "Create another plan". They are never dropped into a fresh questionnaire.
 *   - Only the explicit paths "Create another plan" (?new=1) and "Edit answers" (?edit=1) open the questionnaire for them, at
 *     step 1 -> a new order -> a new payment. A bare /planner or a ?destination= link does not.
 *
 * Owning the product entitlement does NOT unlock the planner any more: generation is authorized per paid request
 * (see lib/commerce/personalizedPlan.ts), never by the entitlement.
 *
 * What this page shows is decided HERE from the database, never from the browser (session storage drafts, an old tab):
 *   - a paid purchase of this browser that is not attached to an account yet  -> /claim-purchase (it attaches it automatically);
 *   - an UNPAID (pending) order never changes this page -- not a global banner, not the owned state, not the view. It is shown as
 *     "awaiting payment confirmation" only for the specific order in ?order=<id> that is still pending (see loadMyPersonalizedPlans);
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

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ destination?: string; new?: string; edit?: string; order?: string | string[] }> }) {
  const { destination, new: wantsNew, edit, order } = await searchParams;
  // The one purchase attempt this visit is about, if any (a well-formed order id). Only that order can ever show "awaiting payment confirmation".
  const orderParam = Array.isArray(order) ? order[0] : order;
  const pendingOrderId = typeof orderParam === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderParam) ? orderParam : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This browser holds a paid purchase that is not in an account yet: finish that first (signed out it asks to sign in, signed in it attaches it).
  if ((await pendingClaimState(user?.id ?? null)) === "paid") redirect("/claim-purchase");

  const initialDestinationId = isAvailablePlannerDestinationId(destination) ? (destination as string) : DEFAULT_PLANNER_DESTINATION_ID;
  const mine = user
    ? await loadMyPersonalizedPlans(user.id, { pendingOrderId })
    : { plans: [], archivedPlans: [], requests: [], generatedCount: 0, hasAnyRequest: false };
  // Has this customer already bought a personalized plan (built, waiting to be built, awaiting confirmation, or removed from their list)?
  // Then /planner is THEIR plans, not a fresh questionnaire -- a repeat purchase is an explicit choice (?new=1).
  const hasPlans = mine.plans.length > 0 || mine.archivedPlans.length > 0 || mine.generatedCount > 0 || mine.requests.length > 0;
  // A legacy owner: bought before the questionnaire-first model, so there is an entitlement but never a request or plan.
  const legacyOwnerWithoutPlan =
    !!user && mine.plans.length === 0 && mine.archivedPlans.length === 0 && mine.generatedCount === 0 && !mine.hasAnyRequest && (await hasProductAccess(PRODUCT_SLUGS.personalizedPlan, user.id));
  // A visitor who ASKED for the questionnaire (the homepage button, "Create a new plan", "Edit answers", an old destination link)
  // always gets it -- even a customer who already has plans. Plain /planner is the signed-in customer's My Personalized Plans.
  // A paid plan waiting to be built always wins over a request for the questionnaire.
  const hasPaidUnbuilt = mine.requests.some((request) => request.state === "ready" && !request.complimentary);
  // Only the two explicit new-plan paths open the questionnaire for a customer who already has plans: ?new=1 ("Create another plan") and
  // ?edit=1 ("Edit answers" inside that same new purchase). A bare /planner or a ?destination= link shows their existing plans.
  const wantsQuestionnaire = (wantsNew === "1" || edit === "1") && !hasPaidUnbuilt;
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
      archivedPlans={mine.archivedPlans}
      requests={mine.requests}
    />
  );
}
