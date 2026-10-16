import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "../../../utils/supabase/server";
import { loginHref, safeNextPath } from "../../lib/authRedirect";

const EMAIL_OTP_TYPES: readonly string[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

// Handles the redirect back from Supabase for Google sign-in, the email-confirmation link and the password-reset link.
// Turns what Supabase hands back into a session, then sends the visitor on to where they were headed.
//   - `?code=`                  the normal (PKCE) return: exchanged for a session. The browser that STARTED the flow holds the
//                               matching verifier cookie, so this needs to be the same browser.
//   - `?token_hash=&type=`      an email link that carries its own proof (an email template that links straight here). It does not
//                               depend on which browser opens it, so it also works when the email is opened on another device.
// The destination is always `next`, a plain in-app path (see lib/authRedirect.ts) -- never an open redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Only a plain in-app path is ever honored (see lib/authRedirect.ts) -- `next` can't be an open redirect.
  const next = safeNextPath(searchParams.get("next"));

  // Google / Supabase reported a failure itself (e.g. the visitor cancelled): don't try to exchange anything.
  const providerFailed = searchParams.has("error") || searchParams.has("error_code") || searchParams.has("error_description");

  if (!providerFailed) {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      console.warn("[auth] callback: code exchange failed:", error.code ?? "no-code");
    } else if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      console.warn("[auth] callback: email link verification failed:", error.code ?? "no-code");
    }
  } else {
    console.warn("[auth] callback: provider returned an error:", searchParams.get("error_code") ?? searchParams.get("error") ?? "unknown");
  }

  // A password-reset link that could not be used: the reset page itself explains it and offers a new link.
  if (next === "/reset-password" || next.startsWith("/reset-password?")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Sign-in did not complete: back to the login page, keeping where the user was headed (e.g. /claim-purchase).
  const retry = new URL(loginHref(next), origin);
  retry.searchParams.set("error", "auth");
  return NextResponse.redirect(retry);
}
