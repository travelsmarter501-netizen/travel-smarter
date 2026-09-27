"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markCustomPlanReadyAction } from "../../admin/custom-plans/actions";

export default function MarkReadyButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrors(null);
    const result = await markCustomPlanReadyAction(requestId);
    setLoading(false);

    if (!result.ok) {
      setErrors(result.error.split(" | "));
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "جاري التحقق..." : "وضع الخطة كجاهزة"}
      </button>
      {errors && errors.length > 0 && (
        <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-bold text-rose-700">ما ينفع -- لازم تصلّح هاي النقاط أولاً:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-rose-700">
            {errors.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
