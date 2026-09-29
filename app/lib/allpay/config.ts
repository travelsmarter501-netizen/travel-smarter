import "server-only";

/**
 * Test-mode-only Allpay config. Live charges are refused in code even if the dashboard
 * were switched — Allpay also requires Test Mode on the integration itself
 * (Settings → Integrations). There is no live Create Payment path in this app.
 */
export function assertAllpayTestMode(): void {
  if (process.env.ALLPAY_LIVE_PAYMENTS === "true") {
    throw new Error("Live Allpay payments are disabled in this app.");
  }
  if (process.env.ALLPAY_TEST_MODE !== "true") {
    throw new Error("Allpay checkout is test-mode only. Set ALLPAY_TEST_MODE=true.");
  }
}

export function getAllpayCredentials(): { login: string; apiKey: string } {
  const login = process.env.ALLPAY_API_LOGIN;
  const apiKey = process.env.ALLPAY_API_KEY;
  if (!login) throw new Error("ALLPAY_API_LOGIN is not set.");
  if (!apiKey) throw new Error("ALLPAY_API_KEY is not set.");
  return { login, apiKey };
}

export function getPublicBaseUrl(): string {
  const explicit = process.env.ALLPAY_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  throw new Error("ALLPAY_PUBLIC_BASE_URL (or NEXT_PUBLIC_SITE_URL) is required for Allpay redirect URLs.");
}

/** Current Allpay API (docs: POST JSON, show/mode in the query string only — not signed). */
export const ALLPAY_CREATE_PAYMENT_URL = "https://allpay.to/app/?show=getpayment&mode=api12";
