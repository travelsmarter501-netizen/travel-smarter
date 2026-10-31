import "server-only";
import { after } from "next/server";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";
import { normalizeAttribution } from "../attributionTag";

/**
 * Credits a newly created order to the marketing campaign the buyer came from (public.order_attribution; the reporting views live in the
 * private `reporting` schema). Strictly best effort: it can never delay, fail or change a checkout.
 *
 * How it is kept safe and reliable:
 *   - The tag is re-validated here against the closed list in lib/attributionTag.ts; the browser's copy is never trusted.
 *   - The insert is started right after the order exists and runs WHILE the Allpay payment page is being created, so in the normal case it
 *     has finished before the checkout has anything to wait for. Nothing waits for it on the way to Allpay.
 *   - It has its own hard time limit (aborted after ATTRIBUTION_TIMEOUT_MS) and never rejects: every failure -- a missing table, a database
 *     error, a timeout, a missing env var -- is logged as a short code only (no order id, no tag) and swallowed.
 *   - After the Allpay result is ready, finishAttribution() waits at most a short moment for the write; if it is still running it is handed
 *     to Next's after() so the platform keeps the function alive until it settles, and the checkout response goes out immediately.
 *   - It writes only to its own table, insert-once (primary key = order id). It reads or changes nothing else: orders, prices, entitlements
 *     and the Allpay verification are not touched.
 */
const ATTRIBUTION_TIMEOUT_MS = 1500;
const MAX_WAIT_AFTER_PAYMENT_PAGE_MS = 250;

/** Starts the insert and returns a promise that always resolves. Does nothing (already resolved) when there is no valid tag. */
export function recordOrderAttribution(orderId: string, raw: unknown): Promise<void> {
  const tag = normalizeAttribution(raw);
  if (!tag || typeof orderId !== "string" || orderId.length === 0) return Promise.resolve();

  return (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTRIBUTION_TIMEOUT_MS);
    try {
      const { error } = await createServiceRoleClient()
        .from("order_attribution")
        .insert({ order_id: orderId, channel: tag.channel, campaign: tag.campaign ?? null })
        .abortSignal(controller.signal);
      // 23505 = this order already has its tag (insert-once): fine.
      if (error && error.code !== "23505") console.warn("[attribution] not recorded:", error.code ?? "no-code");
    } catch (error) {
      console.warn("[attribution] not recorded:", error instanceof Error ? error.name : "unknown");
    } finally {
      clearTimeout(timer);
    }
  })();
}

/** Call after the checkout result is ready. Waits at most a moment, then lets the platform finish the write in the background. */
export async function finishAttribution(write: Promise<void>): Promise<void> {
  let waitTimer: ReturnType<typeof setTimeout> | undefined;
  const finished = await Promise.race([
    write.then(() => true),
    new Promise<boolean>((resolve) => {
      waitTimer = setTimeout(() => resolve(false), MAX_WAIT_AFTER_PAYMENT_PAGE_MS);
    }),
  ]);
  if (waitTimer) clearTimeout(waitTimer);
  if (finished) return;
  try {
    after(() => write);
  } catch {
    // not inside a request scope: the write simply continues on its own
  }
}
