"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCustomPlanPreparationAction } from "../../admin/custom-plans/actions";

export default function StartPreparationButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startCustomPlanPreparationAction(requestId);
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
        className="rounded-full border border-teal-700 px-5 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-60"
      >
        {loading ? "جاري التحديث..." : "بدء التجهيز"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
