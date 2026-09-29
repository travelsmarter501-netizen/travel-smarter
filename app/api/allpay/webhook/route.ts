import { NextResponse } from "next/server";
import { assertAllpayTestMode, getAllpayCredentials } from "../../../lib/allpay/config";
import { allpaySign, allpaySignaturesMatch } from "../../../lib/allpay/sign";
import { fulfillPaidAllpayOrder } from "../../../lib/commerce/fulfillPaidOrder";

export const runtime = "nodejs";

async function readWebhookPayload(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as unknown;
    if (json && typeof json === "object" && !Array.isArray(json)) return json as Record<string, unknown>;
    return null;
  }
  const text = await request.text();
  if (!text) return null;
  try {
    const json = JSON.parse(text) as unknown;
    if (json && typeof json === "object" && !Array.isArray(json)) return json as Record<string, unknown>;
  } catch {
    const params = new URLSearchParams(text);
    const record: Record<string, unknown> = {};
    params.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  return null;
}

function webhookStatusIsPaid(status: unknown): boolean {
  return status === 1 || status === "1";
}

/**
 * Allpay payment webhook. Access is granted only after signature verification and status == 1.
 * Failed attempts (status 0) are acknowledged and do not cancel the pending order (customer may retry).
 */
export async function POST(request: Request) {
  try {
    assertAllpayTestMode();
    const { apiKey } = getAllpayCredentials();
    const payload = await readWebhookPayload(request);
    if (!payload) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const expected = allpaySign(payload, apiKey);
    if (!allpaySignaturesMatch(expected, payload.sign)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }

    if (!webhookStatusIsPaid(payload.status)) {
      return new NextResponse("OK", { status: 200 });
    }

    const orderId = typeof payload.order_id === "string" ? payload.order_id : String(payload.order_id ?? "");
    if (!orderId) {
      return NextResponse.json({ error: "missing_order" }, { status: 400 });
    }

    const result = await fulfillPaidAllpayOrder({
      orderId,
      amount: payload.amount,
      currency: payload.currency,
    });

    if (!result.ok) {
      if (result.error === "order_not_found" || result.error === "amount_mismatch" || result.error === "currency_mismatch") {
        return new NextResponse("OK", { status: 200 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch {
    return NextResponse.json({ error: "webhook_error" }, { status: 500 });
  }
}
