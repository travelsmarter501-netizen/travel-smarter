"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Success is not proof of payment — refresh until the webhook has marked the order paid. */
export default function SuccessRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [router]);

  return <p className="mt-4 text-xs text-slate-400">بنحدّث الحالة تلقائيًا…</p>;
}
