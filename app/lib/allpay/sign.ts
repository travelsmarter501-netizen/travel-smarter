import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Canonical Allpay SHA256 signature (API v12 docs).
 * Used for both Create Payment requests and webhook verification — same algorithm, no extra transforms.
 *
 * Steps (official):
 * 1. Remove `sign`
 * 2. Exclude empty values (`""`, `null`, missing)
 * 3. Sort keys A–Z (including keys inside each `items[]` object)
 * 4. Join values with `:`
 * 5. Append `:` + API key
 * 6. SHA256 UTF-8 hex
 *
 * `0` is a real value and is included. Do not trim client/webhook values.
 */
export function allpaySign(params: Record<string, unknown>, apiKey: string): string {
  const d: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === "sign") continue;
    if (value === "" || value == null) continue;
    d[key] = value;
  }

  const chunks: string[] = [];
  for (const key of Object.keys(d).sort()) {
    const val = d[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
        const record = item as Record<string, unknown>;
        for (const subKey of Object.keys(record).sort()) {
          const subVal = record[subKey];
          if (subVal !== "" && subVal != null) chunks.push(String(subVal));
        }
      }
    } else {
      chunks.push(String(val));
    }
  }
  chunks.push(apiKey);
  return createHash("sha256").update(chunks.join(":"), "utf8").digest("hex");
}

export function allpaySignaturesMatch(expectedHex: string, received: unknown): boolean {
  if (typeof received !== "string" || received.length === 0) return false;
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
