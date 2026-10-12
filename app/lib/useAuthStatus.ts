"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export type AuthStatus = "loading" | "signedIn" | "signedOut";

/**
 * Whether the visitor currently has a Supabase session -- for LABELS only (e.g. "Sign in" vs
 * "My Account" in the header). It reuses the app's existing browser Supabase client and cookie session;
 * it grants nothing and protects nothing: every protected page and action still checks the session on
 * the server. Starts as "loading" so the header can avoid flashing the wrong label.
 *
 * Reads the stored session (no network round trip) and then follows sign-in / sign-out events, so the
 * header updates without a reload.
 */
export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setStatus(data.session ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (active) setStatus("signedOut");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setStatus(session ? "signedIn" : "signedOut");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
