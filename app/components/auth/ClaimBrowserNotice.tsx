"use client";

import { authCopy } from "../../lib/authCopy";
import { suggestedBrowser } from "../../lib/inAppBrowser";
import { useLanguage } from "../../lib/language";
import { isClaimNext, useEmbeddedBrowser } from "../../lib/useEmbeddedBrowser";

/**
 * Shown ONLY to a visitor in an embedded browser (TikTok, Instagram, ...) who is signing in to attach a purchase they just paid for.
 *
 * Why: a guest purchase is attached through a claim link that lives in the address bar and in a cookie of the browser that finished the
 * payment. If the visitor then switches to Safari without carrying that link, Safari has neither and the purchase cannot be linked
 * automatically. So the notice says to finish in THIS browser (email + password works here) -- and that Google needs Safari opened
 * before buying. It never shows the claim link or token.
 *
 * The claim page itself uses useClaimNoticeText() for its heading and paragraphs; login / signup use <ClaimBrowserNotice /> as a compact note.
 */
export function useClaimNoticeText() {
  const { language } = useLanguage();
  const platform = useEmbeddedBrowser();
  const c = authCopy[language === "en" ? "en" : "ar"].common;
  const browser = c.browserNames[suggestedBrowser(platform)];
  return { title: c.claimSameBrowserTitle, body: c.claimSameBrowserBody, google: c.claimSameBrowserGoogle.replace("{browser}", browser) };
}

export default function ClaimBrowserNotice({ next }: { next: string | null | undefined }) {
  const platform = useEmbeddedBrowser();
  const text = useClaimNoticeText();
  if (!platform || !isClaimNext(next)) return null;
  return (
    <div role="note" className="mt-4 space-y-1 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
      <p className="font-semibold">{text.body}</p>
      <p>{text.google}</p>
    </div>
  );
}
