"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { regenerateCustomPlanDraftAction } from "../../admin/custom-plans/actions";

/**
 * "إعادة إنشاء المسودة" -- the ONLY UI path that can overwrite an existing draft's content, so
 * per the task's own "never overwrite silently" rule this is gated behind a native
 * window.confirm() before the server action (which independently re-checks that the draft isn't
 * already approved) is ever called.
 */
export default function RegenerateDraftButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = window.confirm("مسودة موجودة بالفعل لهذا الطلب. إعادة الإنشاء رح تستبدل محتواها الحالي بالكامل. متأكد؟");
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const result = await regenerateCustomPlanDraftAction(requestId);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
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
        className="rounded-full border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
      >
        {loading ? "جاري إعادة الإنشاء..." : "إعادة إنشاء المسودة"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
