"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Success is not proof of payment — refresh until the webhook has marked the order paid.
 * `showNote` only controls the small grey helper text under the spinner; the refresh itself is identical
 * either way (the claim page hides the note, /checkout/success keeps it).
 */
export default function SuccessRefresh({ showNote = true }: { showNote?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [router]);

  return showNote ? <p className="mt-4 text-xs text-slate-400">بنحدّث الحالة تلقائيًا…</p> : null;
}
