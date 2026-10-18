"use client";

import { useState, useSyncExternalStore } from "react";
import { createClient } from "../../../utils/supabase/client";
import { authCallbackUrl } from "../../lib/authRedirect";
import { authCopy } from "../../lib/authCopy";
import { currentEmbeddedBrowser, suggestedBrowser, type EmbeddedBrowserPlatform } from "../../lib/inAppBrowser";
import { isClaimNext } from "../../lib/useEmbeddedBrowser";
import { useLanguage } from "../../lib/language";

// Inside an embedded browser (TikTok, Instagram, ...) Google sign-in cannot work: Google refuses OAuth in embedded webviews, TikTok does not even
// open the authorization URL, and the PKCE verifier would be stored in the webview's cookies while the callback finished in Safari. So there the
// Google action is not started at all (see embedded below); everywhere else this button works exactly as before.
const noopSubscribe = () => () => {};
// A primitive snapshot ("" = a normal browser) keeps useSyncExternalStore stable. Server render and hydration use "" (the normal button),
// then the real answer is applied on the client -- no markup mismatch.
function embeddedSnapshot(): string {
  return currentEmbeddedBrowser() ?? "";
}

const GOOGLE_MARK = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.26a12 12 0 0 0 0 10.76z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.62l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z"
    />
  </svg>
);

export default function GoogleAuthButton({ label, next }: { label: string; next?: string }) {
  const { language } = useLanguage();
  const embedded = useSyncExternalStore(noopSubscribe, embeddedSnapshot, () => "") as EmbeddedBrowserPlatform | "";
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    // Never start OAuth from an embedded browser (the button is disabled there too; this is the belt to that pair of braces).
    if (embedded) return;
    setLoading(true);
    setFailed(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // /auth/callback?next=<safe in-app path>: Supabase returns the browser here after Google.
        redirectTo: authCallbackUrl(window.location.origin, next ?? "/account"),
      },
    });
    if (error) {
      setFailed(true);
      setLoading(false);
    }
    // On success the browser is redirected to Google, so no further action needed here.
  }

  if (embedded) {
    const copy = authCopy[language === "en" ? "en" : "ar"].common;
    const browser = copy.browserNames[suggestedBrowser(embedded)];
    return (
      <div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-slate-400 opacity-70"
        >
          <span className="grayscale">{GOOGLE_MARK}</span>
          {label}
        </button>
        <div role="note" className="mt-2 space-y-1 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          <p className="font-semibold">{copy.googleEmbeddedOpenIn.replace("{browser}", browser)}</p>
          <p>{copy.googleEmbeddedUseEmail}</p>
          {isClaimNext(next) && <p>{copy.googleEmbeddedClaimWarning}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-300 bg-white px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
      >
        {GOOGLE_MARK}
        {loading ? (language === "en" ? "Redirecting..." : "جاري التحويل...") : label}
      </button>
      {failed && <p role="alert" className="mt-2 text-center text-xs text-red-600">{authCopy[language === "en" ? "en" : "ar"].common.googleStartFailed}</p>}
    </div>
  );
}
