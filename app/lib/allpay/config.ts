import "server-only";

export type AllpayMode = "test" | "live";

/**
 * The single, explicit switch for the Allpay integration: ALLPAY_MODE must be exactly "test" or
 * "live". Anything else (unset, misspelled) fails closed -- no payment session is ever created.
 *
 * "live" is additionally restricted to the Vercel *Production* environment
 * (VERCEL_ENV === "production"). A laptop, a Preview deployment, or an env file copied somewhere
 * else can therefore never create real charges, even if ALLPAY_MODE=live ends up set there.
 * Local development and Preview deployments run in "test".
 */
export function getAllpayMode(): AllpayMode {
  const mode = (process.env.ALLPAY_MODE ?? "").trim();
  if (mode === "test") return "test";
  if (mode === "live") {
    if (process.env.VERCEL_ENV !== "production") {
      throw new Error("ALLPAY_MODE=live is only allowed on the Vercel Production environment.");
    }
    return "live";
  }
  throw new Error('ALLPAY_MODE must be set to "test" or "live".');
}

export function getAllpayCredentials(): { login: string; apiKey: string } {
  const login = process.env.ALLPAY_API_LOGIN;
  const apiKey = process.env.ALLPAY_API_KEY;
  if (!login) throw new Error("ALLPAY_API_LOGIN is not set.");
  if (!apiKey) throw new Error("ALLPAY_API_KEY is not set.");
  return { login, apiKey };
}

export function getPublicBaseUrl(mode: AllpayMode): string {
  const explicit = process.env.ALLPAY_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  let base: string;
  if (explicit) {
    base = explicit.trim().replace(/\/$/, "");
  } else if (process.env.VERCEL_URL) {
    base = `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  } else {
    throw new Error("ALLPAY_PUBLIC_BASE_URL (or NEXT_PUBLIC_SITE_URL) is required for Allpay redirect URLs.");
  }

  // Live redirect/webhook URLs must be real, public https addresses -- Allpay's servers have to
  // be able to reach the webhook, and customers return to success/cancel pages on this origin.
  if (mode === "live") {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      throw new Error("Live Allpay payments require a public https base URL.");
    }
  }
  return base;
}

/** Current Allpay API (docs: POST JSON, show/mode in the query string only — not signed). */
export const ALLPAY_CREATE_PAYMENT_URL = "https://allpay.to/app/?show=getpayment&mode=api12";
