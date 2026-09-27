"use server";

import { createCustomPlanRequest, type CreateCustomPlanRequestResult } from "../../lib/customPlanRequests";
import { createCustomPlanPendingOrder, type CreateCustomPlanPendingOrderResult } from "../../lib/customPlanCommerce";
import type { CustomPlanRequest } from "../../lib/customPlanRequest";

/**
 * The one client-callable entry point for saving a Custom Plan request. A thin wrapper around
 * createCustomPlanRequest (app/lib/customPlanRequests.ts) so that file can stay a plain
 * server-only helper module (reusable from other server code later, e.g. a future payment
 * webhook) while this file is the actual Server Action boundary CustomPlanRequestForm calls.
 */
export async function submitCustomPlanRequest(request: CustomPlanRequest): Promise<CreateCustomPlanRequestResult> {
  return createCustomPlanRequest(request);
}

/**
 * The one client-callable entry point for the "متابعة للدفع" CTA -- both on the form's success
 * screen and on each `draft` request in /account. Accepts ONLY a request id; everything else
 * (ownership, product/price derivation, idempotent order reuse) is resolved server-side by
 * createCustomPlanPendingOrder (app/lib/customPlanCommerce.ts). No PayPlus/payment integration
 * happens here -- this only ever creates or reuses a `pending` order.
 */
export async function requestCustomPlanCheckout(requestId: string): Promise<CreateCustomPlanPendingOrderResult> {
  return createCustomPlanPendingOrder(requestId);
}
