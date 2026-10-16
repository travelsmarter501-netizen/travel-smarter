/**
 * Turns a Supabase Auth error into a stable key the pages map to a bilingual message (see authCopy.ts).
 *
 * Supabase reports why a call failed in `error.code` (and `status`); matching on those -- with the message text only as a fallback for
 * older responses -- is what lets the signup / login screens say something useful ("too many emails", "that address isn't allowed",
 * "confirm your email first") instead of one generic failure. Pure, so it is shared by the pages and covered by tests.
 */
export type AuthErrorLike = { code?: string | null; message?: string | null; status?: number | null };

export type SignupErrorKey = "alreadyRegistered" | "weakPassword" | "rateLimited" | "emailNotAllowed" | "sendFailed" | "invalidEmail" | "generic";
export type LoginErrorKey = "emailNotConfirmed" | "wrongCredentials" | "genericError";

function parts(error: AuthErrorLike) {
  return { code: (error.code ?? "").toLowerCase(), message: (error.message ?? "").toLowerCase(), status: error.status ?? 0 };
}

export function signupErrorKey(error: AuthErrorLike): SignupErrorKey {
  const { code, message, status } = parts(error);
  if (code === "user_already_exists" || code === "email_exists" || message.includes("already registered") || message.includes("already been registered")) return "alreadyRegistered";
  if (code === "weak_password" || message.includes("password should") || message.includes("weak password")) return "weakPassword";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429 || message.includes("rate limit")) return "rateLimited";
  if (code === "email_address_not_authorized" || message.includes("not authorized")) return "emailNotAllowed";
  if (code === "email_address_invalid" || message.includes("invalid email") || message.includes("unable to validate email")) return "invalidEmail";
  if (message.includes("sending confirmation") || message.includes("sending email") || message.includes("smtp") || code === "unexpected_failure") return "sendFailed";
  return "generic";
}

export function loginErrorKey(error: AuthErrorLike): LoginErrorKey {
  const { code, message } = parts(error);
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "emailNotConfirmed";
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "wrongCredentials";
  return "genericError";
}

/** Same rate-limit test for the password-reset request (the only other thing that sends an email). */
export function isEmailRateLimited(error: AuthErrorLike): boolean {
  const { code, message, status } = parts(error);
  return code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429 || message.includes("rate limit");
}
