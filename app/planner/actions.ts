"use server";

import { createClient } from "../../utils/supabase/server";
import { createAllpayRedirectCheckout } from "../lib/allpay/createPayment";
import { generateClaimToken, hashClaimToken, normalizeGuestEmail } from "../lib/commerce/claimToken";
import {
  createComplimentaryPlanRequest,
  createPersonalizedPlanOrder,
  generatePersonalizedPlanForRequest,
  hasPaidUnbuiltRequest,
  type CreateComplimentaryRequestResult,
  type GeneratePersonalizedPlanResult,
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
export async function startPersonalizedPlanCheckout(input: { destinationId?: unknown; answers?: unknown; email?: unknown }): Promise<StartCheckoutResult> {
  const normalized = normalizePersonalizedAnswers(input?.answers, input?.destinationId);
  if (!normalized.ok) {
    return { ok: false, error: "بيانات الخطة غير صالحة. راجع إجاباتك وحاول مرة أخرى.", code: "invalid_planner_answers" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // A paid plan that has not been built yet is built, not paid for again (also stops a stale tab or an old draft from re-submitting).
    if (await hasPaidUnbuiltRequest(user.id)) {
      return { ok: false, error: "عندك خطة مدفوعة بانتظار البناء. افتح «خططي المخصصة» وابنِها أولًا.", code: "paid_plan_awaiting_build" };
    }
    const order = await createPersonalizedPlanOrder({ userId: user.id, destinationId: normalized.destinationId, answers: normalized.answers });
    if (!order.ok) return { ok: false, error: order.error, code: order.code };

    const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    return createAllpayRedirectCheckout(order.orderId, { name, email: user.email ?? null });
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

  return createAllpayRedirectCheckout(order.orderId, { email }, { claimToken });
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
