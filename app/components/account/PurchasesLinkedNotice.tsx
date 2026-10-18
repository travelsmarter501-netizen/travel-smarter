"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../lib/language";

const COOKIE = "ts_purchases_linked";

/**
 * Shown on /account when purchases made as a guest were linked to this account automatically. Nothing technical, no button.
 *
 * `show` is true when this render linked something itself, or when the sign-in step left the one-shot flag cookie (see linkedNoticeCookie).
 * Once mounted the component deletes the cookie and remembers it was shown, so the message survives the refresh that follows sign-in but a
 * later visit (fresh mount, no cookie) shows nothing.
 */
export default function PurchasesLinkedNotice({ show }: { show: boolean }) {
  const { language } = useLanguage();
  const [seen, setSeen] = useState(show);
  if (show && !seen) setSeen(true);

  useEffect(() => {
    if (!show) return;
    document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  }, [show]);

  if (!seen) return null;
  return (
    <p role="status" className="mt-5 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
      {language === "en" ? "Your purchases were linked to your account ✓" : "تم ربط مشترياتك بحسابك ✓"}
    </p>
  );
}
