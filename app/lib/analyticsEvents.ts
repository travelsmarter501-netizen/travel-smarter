import { track } from "@vercel/analytics";

/**
 * Conversion-funnel events for Vercel Web Analytics (custom events). Cookieless and anonymous.
 *
 * What may be sent: only fixed, non-personal labels chosen HERE -- a product id from the catalog below, an action name, or a yes/no flag.
 * Never an email, name, phone number, order id, payment reference, claim token or anything typed by the visitor. Every value passes through
 * an allowlist, so even a caller mistake cannot put free text into an event.
 *
 * What is NOT here on purpose: "purchase completed". A page visit, a redirect from Allpay or an existing entitlement is not proof of a
 * payment, and a browser cannot report a payment exactly once. Only the verified Allpay webhook knows (see the conversion-reporting note in
 * the change that introduced this file). Vercel's Pro plan allows two properties per custom event, so each event carries at most two.
 *
 * Every call is fire-and-forget and swallows its own errors: analytics must never be able to break a purchase flow.
 */

// Cart ids of the storefront products (the same ids app/lib/commerce/pricing.ts prices). Anything else is reported as "other".
const KNOWN_PRODUCT_IDS: ReadonlySet<string> = new Set(["personalized-trip-plan", "barcelona-1day", "barcelona-guide", "barcelona-3day", "barcelona-5day"]);

/** "barcelona-3day", or "barcelona-guide+barcelona-3day" for a multi-product cart (sorted, so the same cart is always the same label). */
function productLabel(ids: readonly string[]): string {
  const known = [...new Set(ids.filter((id) => KNOWN_PRODUCT_IDS.has(id)))].sort();
  return known.length > 0 ? known.join("+") : "other";
}

type AnalyticsQueueWindow = Window & { va?: (...args: unknown[]) => void; vaq?: unknown[] };

// The same event is never reported twice within this window (a rapid double tap on one button).
const DUPLICATE_WINDOW_MS = 1500;
let lastKey = "";
let lastAt = 0;

function send(name: string, properties: Record<string, string | boolean>): void {
  try {
    if (typeof window === "undefined") return;
    const key = name + JSON.stringify(properties);
    const now = Date.now();
    if (key === lastKey && now - lastAt < DUPLICATE_WINDOW_MS) return;
    lastKey = key;
    lastAt = now;

    // <WebAnalytics /> sits after the page in the layout, so on the FIRST render its script has not been set up yet when a page component
    // fires an event from its own mount effect. track() would then find no queue and drop the event. Create the same queue the script
    // creates (it only sets its own when none exists) so such an event waits there and is sent as soon as the script loads.
    const w = window as AnalyticsQueueWindow;
    if (!w.va) {
      w.va = (...args: unknown[]) => {
        (w.vaq = w.vaq || []).push(args);
      };
    }
    track(name, properties);
  } catch {
    // never let analytics interfere with the page
  }
}

/** A visitor chose a product on the storefront: pressed "Buy now" or "Add to cart" on its card. */
export function trackProductSelected(cartId: string, action: "buy_now" | "add_to_cart"): void {
  send("product_selected", { product: productLabel([cartId]), action });
}

// The questionnaire can mount more than once in one visit (back / forward, a re-render): report it once per page load.
let plannerStartReported = false;

/** A visitor opened a NEW Personalized Plan questionnaire (not an edit of an existing answer set). `owner`: they already own the planner. */
export function trackPlannerStarted(owner: boolean): void {
  if (plannerStartReported) return;
  plannerStartReported = true;
  send("planner_started", { owner });
}

/**
 * The server created the order and returned a payment page, and the visitor is about to be sent to Allpay. Call it ONLY on a successful
 * result -- a failed or refused start must not be counted. This is the start of a payment, never a completed one.
 */
export function trackCheckoutStarted(cartIds: readonly string[], signedIn: boolean): void {
  send("checkout_started", { products: productLabel(cartIds), buyer: signedIn ? "member" : "guest" });
}
