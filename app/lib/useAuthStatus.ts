"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export type AuthStatus = "loading" | "signedIn" | "signedOut";

/**
 * Whether the visitor currently has a Supabase session -- for LABELS only (e.g. "Sign in" vs
 * "My Account" in the header). It grants nothing and protects nothing: every protected page and action
 * still checks the session on the server. Starts as "loading" so the header can avoid flashing the wrong label.
 *
 * Performance: the Supabase browser client is about a quarter of the homepage's JavaScript, and a visitor who
 * has never signed in (most first-time / social-media traffic) does not need it. The session lives in a cookie
 * (sb-<project>-auth-token, chunked as .0/.1 when large), so a cheap cookie test decides: no cookie means signed
 * out without loading the client at all; a cookie means the client is loaded on demand and read exactly as before
 * (stored session, no network round trip, then follow sign-in / sign-out events). The test is repeated on every
 * route change, so a visitor who signs in on /login and is routed back to a page with this header gets the right
 * label without a reload. If cookies cannot be read, the client is loaded (the safe direction).
 *
 * One shared store serves every component that calls the hook (header links and the product cards), so the
 * session is read and the auth event subscription made once, not once per component.
 */
const SESSION_COOKIE = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/;

function mayHaveSession(): boolean {
  try {
    return SESSION_COOKIE.test(document.cookie);
  } catch {
    return true;
  }
}

let status: AuthStatus = "loading";
let subscribedToClient = false;
let refreshing = false;
const listeners = new Set<() => void>();

function setStatus(next: AuthStatus) {
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
}

async function refresh() {
  if (!mayHaveSession()) {
    setStatus("signedOut");
    return;
  }
  if (refreshing) return;
  refreshing = true;
  try {
    const { createClient } = await import("../../utils/supabase/client");
    const supabase = createClient();
    if (!subscribedToClient) {
      subscribedToClient = true;
      supabase.auth.onAuthStateChange((_event, session) => setStatus(session ? "signedIn" : "signedOut"));
    }
    const { data } = await supabase.auth.getSession();
    setStatus(data.session ? "signedIn" : "signedOut");
  } catch {
    setStatus("signedOut");
  } finally {
    refreshing = false;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useAuthStatus(): AuthStatus {
  const pathname = usePathname();

  useEffect(() => {
    // Runs once after hydration and again on every route change (see the note above).
    void refresh();
  }, [pathname]);

  return useSyncExternalStore(subscribe, () => status, () => "loading" as AuthStatus);
}
