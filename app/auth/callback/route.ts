import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

// Handles the redirect back from Supabase OAuth (e.g. Google) and email confirmation links.
// Exchanges the `code` param for a session, then sends the visitor into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Only allow a relative in-app path — never an absolute/external URL — so `next` can't be abused as an open redirect.
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") ? rawNext : "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
