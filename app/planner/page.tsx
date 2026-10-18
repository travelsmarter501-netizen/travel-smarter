import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlannerPageView from "../components/planner/PlannerPageView";
import { loadEditablePlan, loadMyPersonalizedPlans, ownsPersonalizedPlan } from "../lib/commerce/personalizedPlan";
import { parsePlannerDraft, type PlannerDraft } from "../lib/planner/plannerDraft";
import { pendingClaimState } from "../claim-purchase/pendingClaimStatus";
import { isAvailablePlannerDestinationId, DEFAULT_PLANNER_DESTINATION_ID } from "../lib/planner/plannerDestinations";
import { createClient } from "../../utils/supabase/server";

/**
 * Unified Personalized Plan -- "خطة مخصصة إلك ✨", the ONE customer-facing planner route (the old
 * /smart-planner/barcelona and /custom-plan/barcelona routes redirect here).
 *
 * The Personalized Plan is an UNLOCK: a customer pays once (₪39) and then OWNS the planner. This page is decided on the server from the database
 * (never from a stale browser draft):
 *   - someone who does not own it sees the free questionnaire; its last step goes to /checkout?plan=personalized (summary + Allpay button);
 *   - an owner lands on "My Personalized Plans" (Open / Edit / Delete, plus a free "Create a new plan"); "Create a new plan" (?new=1) and
 *     "Edit plan" (?editPlan=<id>) open the questionnaire, which ends in "Create my plan" / "Update my plan" -- no checkout, no Allpay;
 *   - a paid purchase of this browser that is not attached to an account yet goes to /claim-purchase first (it attaches it automatically);
 *   - an UNPAID (pending) order never changes this page: it shows as "awaiting payment confirmation" only for the specific order in ?order=<id>.
 */
export const metadata: Metadata = {
  title: "خطة مخصصة إلك ✨ | Travel Smarter",
  description:
    "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك. برشلونة متاحة الآن — وجهات جديدة قريبًا. Pick your destination and interests and we’ll build a smart plan for your trip.",
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; new?: string; edit?: string; editPlan?: string | string[]; order?: string | string[] }>;
}) {
  const { destination, new: wantsNew, edit, editPlan: editPlanParam, order } = await searchParams;
  // The one purchase attempt this visit is about, if any (a well-formed order id). Only that order can ever show "awaiting payment confirmation".
  const orderParam = Array.isArray(order) ? order[0] : order;
  const pendingOrderId = typeof orderParam === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderParam) ? orderParam : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The two lookups below are independent of each other, so they run together instead of one after the other. Both are read-only, and the
  // answer to each is still decided on the server from the database.
  const [claimState, owner] = await Promise.all([pendingClaimState(user?.id ?? null), user ? ownsPersonalizedPlan(user.id) : Promise.resolve(false)]);
  // This browser holds a paid purchase that is not in an account yet: finish that first (signed out it asks to sign in, signed in it attaches it).
  if (claimState === "paid") redirect("/claim-purchase");

  const initialDestinationId = isAvailablePlannerDestinationId(destination) ? (destination as string) : DEFAULT_PLANNER_DESTINATION_ID;

  // "Edit plan": an owner's questionnaire pre-filled from one of THEIR plans (read with their own session, so another customer's id finds nothing).
  let editPlan: { id: string; draft: PlannerDraft } | null = null;
  const editPlanId = Array.isArray(editPlanParam) ? editPlanParam[0] : editPlanParam;
  if (user && owner && editPlanId) {
    const plan = await loadEditablePlan(editPlanId);
    const booked = (plan?.rawAnswers.accommodation as { booked?: unknown } | undefined)?.booked === true;
    const draft = plan ? parsePlannerDraft(JSON.stringify({ destinationId: plan.destinationId, answers: plan.rawAnswers, accommodationStatus: booked ? "hotel" : "not_booked" })) : null;
    if (plan && draft) editPlan = { id: plan.id, draft };
  }

  // The plan / request lists are only shown on "My Personalized Plans". The questionnaire (?new=1, ?edit=1, or editing one of their plans) never
  // reads them, so those queries are skipped there -- the page does not wait for data it will not render.
  const questionnaireRequested = wantsNew === "1" || edit === "1" || !!editPlan;
  const mine = user && !questionnaireRequested ? await loadMyPersonalizedPlans(user.id, { pendingOrderId }) : { plans: [], requests: [] };

  const hasPlans = mine.plans.length > 0 || mine.requests.length > 0;
  const asksForQuestionnaire = wantsNew === "1" || edit === "1" || !!editPlan;
  // Who sees what:
  //   - signed out                         -> the questionnaire (it ends in checkout);
  //   - an OWNER of the Personalized Plan  -> their plans by default; a questionnaire only when they ask for one (new plan / edit plan) and
  //                                          it ends in "Create my plan" -- never in payment;
  //   - everyone else                      -> their paid/complimentary requests if they have any, otherwise the questionnaire (-> checkout).
  const view: "mine" | "wizard" = !user ? "wizard" : owner ? (asksForQuestionnaire ? "wizard" : "mine") : hasPlans && wantsNew !== "1" && edit !== "1" ? "mine" : "wizard";

  return (
    <PlannerPageView
      view={view}
      initialDestinationId={initialDestinationId}
      restoreDraft={edit === "1" && !owner}
      signedIn={!!user}
      owner={owner}
      editPlan={editPlan}
      plans={mine.plans}
      requests={mine.requests}
    />
  );
}
