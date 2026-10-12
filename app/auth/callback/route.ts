import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";
import { loginHref, safeNextPath } from "../../lib/authRedirect";

// Handles the redirect back from Supabase OAuth (e.g. Google) and email confirmation links.
// Exchanges the `code` param for a session, then sends the visitor into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only a plain in-app path is ever honored (see lib/authRedirect.ts) -- `next` can't be an open redirect.
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Sign-in did not complete: back to the login page, keeping where the user was headed (e.g. /claim-purchase).
  const retry = new URL(loginHref(next), origin);
  retry.searchParams.set("error", "auth");
  return NextResponse.redirect(retry);
}
