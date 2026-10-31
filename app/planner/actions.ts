"use server";

import { createClient } from "../../utils/supabase/server";
import { createAllpayRedirectCheckout } from "../lib/allpay/createPayment";
import { finishAttribution, recordOrderAttribution } from "../lib/commerce/orderAttribution";
import { generateClaimToken, hashClaimToken, normalizeGuestEmail } from "../lib/commerce/claimToken";
import {
  createComplimentaryPlanRequest,
  createPersonalizedPlanOrder,
  deleteOwnSavedPlan,
  generateOwnerPersonalizedPlan,
  generatePersonalizedPlanForRequest,
  ownsPersonalizedPlan,
  type CreateComplimentaryRequestResult,
  type DeleteSavedPlanResult,
  type GeneratePersonalizedPlanResult,
  type OwnerPlanResult,
} from "../lib/commerce/personalizedPlan";
import { normalizePersonalizedAnswers } from "../lib/planner/personalizedPlanAnswers";
import type { StartCheckoutResult } from "../checkout/actions";

/**
 * Personalized Plan purchase, step 2 of the flow:
 *   questionnaire (free, nothing generated) -> review -> THIS action -> Allpay -> ... -> generatePersonalizedPlanAction.
 *
 * The browser sends only its raw questionnaire answers (and, for a guest, an email). Everything else is decided
 * here: the answers are re-validated and rebuilt from an allow-list, the destination is checked against the
 * server's list, the price comes from the database inside create_personalized_plan_order, and the order and its
 * stored answers are created in one SQL transaction. Nothing is granted by this action; entitlements still come
 * only from the verified Allpay webhook (signed-in) or the guest claim.
 */
export async function startPersonalizedPlanCheckout(input: { destinationId?: unknown; answers?: unknown; email?: unknown; attribution?: unknown }): Promise<StartCheckoutResult> {
  const normalized = normalizePersonalizedAnswers(input?.answers, input?.destinationId);
  if (!normalized.ok) {
    return { ok: false, error: "بيانات الخطة غير صالحة. راجع إجاباتك وحاول مرة أخرى.", code: "invalid_planner_answers" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // The Personalized Plan is bought ONCE. An owner (a stale tab, an old draft, a direct link) is never charged again: the planner is
    // already unlocked for them and creating plans is free.
    if (await ownsPersonalizedPlan(user.id)) {
      return { ok: false, error: "مخطط الرحلات المخصص مفتوح لك مسبقًا — أنشئ خطتك بدون أي دفع جديد.", code: "planner_already_unlocked" };
    }
    const order = await createPersonalizedPlanOrder({ userId: user.id, destinationId: normalized.destinationId, answers: normalized.answers });
    if (!order.ok) return { ok: false, error: order.error, code: order.code };

    const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    // Campaign attribution: best effort, bounded, alongside the payment-page request (see lib/commerce/orderAttribution.ts).
    const attribution = recordOrderAttribution(order.orderId, input?.attribution);
    const result = await createAllpayRedirectCheckout(order.orderId, { name, email: user.email ?? null });
    await finishAttribution(attribution);
    return result;
  }

  // ---- Guest: same model as the cart checkout (email = receipt only; one-time claim token, only its hash is stored) ----
  const email = normalizeGuestEmail(input?.email);
  if (!email) {
    return { ok: false, error: "أدخل بريدًا إلكترونيًا صحيحًا — بنرسل عليه تأكيد الدفع.", code: "invalid_email" };
  }

  const claimToken = generateClaimToken();
  const order = await createPersonalizedPlanOrder({
    userId: null,
    destinationId: normalized.destinationId,
    answers: normalized.answers,
    claimTokenHash: hashClaimToken(claimToken),
    guestEmail: email,
  });
  if (!order.ok) return { ok: false, error: order.error, code: order.code };

  const attribution = recordOrderAttribution(order.orderId, input?.attribution);
  const result = await createAllpayRedirectCheckout(order.orderId, { email }, { claimToken });
  await finishAttribution(attribution);
  return result;
}

/**
 * Builds the ONE plan a paid request entitles its owner to, from the answers stored on the server.
 * Only a request id is accepted; the user comes from the verified session and the answers from the database.
 */
export async function generatePersonalizedPlanAction(requestId: string): Promise<GeneratePersonalizedPlanResult> {
  return generatePersonalizedPlanForRequest(requestId);
}

/**
 * Complimentary (demo) plan for allowlisted accounts only -- the questionnaire is the normal one, only the payment step is
 * replaced. The browser sends just its raw answers; the server (1) takes the user from the verified session, (2) checks that
 * user against the server-side COMPLIMENTARY_USER_IDS allowlist, (3) re-validates and rebuilds the answers with exactly the
 * same normalizePersonalizedAnswers as a paid plan, and (4) stores a request that has NO order: no payment is created or
 * faked, nothing is granted, and nothing can be counted as revenue. The plan is then built with the very same one-request-one-plan
 * generation as a purchased one (generatePersonalizedPlanAction).
 */
export async function startComplimentaryPlan(input: { destinationId?: unknown; answers?: unknown }): Promise<CreateComplimentaryRequestResult> {
  const normalized = normalizePersonalizedAnswers(input?.answers, input?.destinationId);
  if (!normalized.ok) return { ok: false, code: "invalid_planner_answers" };
  return createComplimentaryPlanRequest({ destinationId: normalized.destinationId, answers: normalized.answers });
}

/**
 * Creates -- or, with `replacePlanId`, regenerates in place ("Edit plan") -- one personalized plan for an OWNER of the Personalized Plan, with no
 * payment. The user comes from the verified session; whether they own the product is decided by the database
 * (user_owns_personalized_plan inside begin_owner_plan_generation). A non-owner gets `not_owner` and nothing is generated. No order, order item,
 * payment, request or entitlement is created.
 */
export async function generateOwnerPlanAction(input: { destinationId?: unknown; answers?: unknown; replacePlanId?: unknown }): Promise<OwnerPlanResult> {
  return generateOwnerPersonalizedPlan({ destinationId: input?.destinationId, answers: input?.answers, replacePlanId: input?.replacePlanId });
}

/**
 * Permanently deletes one of the signed-in customer's own saved plans. Only that plan row goes: the paid order, the payment and the
 * entitlements (so the customer stays an owner and may create plans again) are untouched, and so are all other plans.
 */
export async function deleteSavedPlanAction(planId: string): Promise<DeleteSavedPlanResult> {
  return deleteOwnSavedPlan(planId);
}
