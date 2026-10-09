import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Guest-purchase claim tokens.
 *
 * A token is 32 random bytes (256 bits) from the OS CSPRNG, base64url-encoded (43 chars, URL-safe).
 * Only its SHA-256 hash is ever stored (orders.claim_token_hash); the plaintext exists solely in the
 * buyer's redirect URL. A fast unsalted hash is correct here: the input is already 256 bits of
 * entropy, so there is nothing to brute-force, and the hash must be deterministic to be looked up.
 */

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isWellFormedClaimToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

/** Lowercase hex SHA-256 -- the exact shape the SQL functions validate (^[0-9a-f]{64}$). */
export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** How long a paid guest order stays claimable (mirrored by the webhook, which stamps the expiry). */
export const CLAIM_WINDOW_DAYS = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Format check only -- an email is a receipt/contact address, NEVER proof of ownership. */
export function normalizeGuestEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  if (email.length === 0 || email.length > 254) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}
