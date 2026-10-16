/**
 * The email rule for attaching a paid GUEST purchase to an account.
 *
 * The address typed at checkout is not proof that the buyer owns it, so the claim only goes through when the signed-in account
 * has a VERIFIED email that equals the order's checkout email. Both sides are compared after trim + lowercase, nothing cleverer
 * (no dot or "+tag" folding), so two genuinely different mailboxes can never be treated as the same.
 *
 * Pure and dependency-free, so the claim action, the claim page and the tests all share the one rule.
 *
 * - "unverified": the account's email is not confirmed (Supabase confirms it for Google and after the email link) -> never claim.
 * - "mismatch":   a confirmed email that is not the checkout email -> never claim.
 * - "ok":         confirmed and equal. An order that has NO email on file (not possible for new orders; kept only so an old order is
 *                 not stranded) falls back to the claim token alone, exactly as before this rule existed.
 */
export type ClaimEmailVerdict = "ok" | "mismatch" | "unverified";

export function normalizeEmailForClaim(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length === 0 ? null : email;
}

export function claimEmailVerdict(input: { orderEmail: unknown; accountEmail: unknown; accountEmailConfirmed: boolean }): ClaimEmailVerdict {
  if (!input.accountEmailConfirmed) return "unverified";
  const orderEmail = normalizeEmailForClaim(input.orderEmail);
  if (orderEmail === null) return "ok";
  const accountEmail = normalizeEmailForClaim(input.accountEmail);
  return accountEmail !== null && accountEmail === orderEmail ? "ok" : "mismatch";
}
