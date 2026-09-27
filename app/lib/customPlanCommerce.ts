import "server-only";
import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import type { OrderStatus } from "./orders";
import type { CustomPlanRequestStatus } from "./customPlanRequest";

/**
 * Custom Plan -> Commerce Bridge V1 -- the ONLY code path allowed to call
 * create_custom_plan_order. Mirrors createPendingOrder (app/lib/orders.ts) and
 * createCustomPlanRequest (app/lib/customPlanRequests.ts) exactly: independently verifies the
 * caller's identity via the session-bound client BEFORE ever touching the service-role client,
 * and the service-role-only RPC it calls is unreachable from the browser (see the migration's
 * own comment for the full writeup).
 *
 * The client sends nothing but a request id -- never a user id, product slug, price, or any
 * status. Everything else (ownership check, product mapping, price authority, idempotent
 * order reuse) happens inside the RPC itself, atomically.
 */

export type CreateCustomPlanPendingOrderResult =
  | {
      ok: true;
      data: {
        requestId: string;
        orderId: string;
        orderStatus: OrderStatus;
        totalILS: number;
        productSlug: string;
        reused: boolean;
      };
    }
  | { ok: false; error: string; requiresLogin?: boolean };

type BridgeRow = {
  order_id: string;
  order_status: OrderStatus;
  total_ils: number;
  request_id: string;
  request_status: CustomPlanRequestStatus;
  product_slug: string;
  reused: boolean;
};

/**
 * Creates (or idempotently reuses) a real pending order for one of the current user's own
 * Custom Plan requests. Returns only the normalized fields a client needs to show checkout
 * status -- never raw DB rows, never service-role data.
 */
export async function createCustomPlanPendingOrder(requestId: string): Promise<CreateCustomPlanPendingOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "لازم تسجل الدخول لمتابعة الدفع.", requiresLogin: true };
  }

  if (typeof requestId !== "string" || requestId.trim().length === 0) {
    return { ok: false, error: "طلب غير صالح." };
  }

  // service_role is only ever reached here, after identity has already been verified above via
  // the session-bound client -- p_user_id below is relayed from that trust boundary, never
  // client-supplied (see the RPC's own comment for the full trust-model writeup).
  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole
    .rpc("create_custom_plan_order", { p_user_id: user.id, p_custom_plan_request_id: requestId })
    .single<BridgeRow>();

  if (error || !data) {
    return { ok: false, error: "تعذّر تجهيز طلبك للدفع. حاول مرة أخرى." };
  }

  return {
    ok: true,
    data: {
      requestId: data.request_id,
      orderId: data.order_id,
      orderStatus: data.order_status,
      totalILS: data.total_ils,
      productSlug: data.product_slug,
      reused: data.reused,
    },
  };
}
