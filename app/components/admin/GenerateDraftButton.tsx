"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCustomPlanDraftAction } from "../../admin/custom-plans/actions";

export default function GenerateDraftButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await generateCustomPlanDraftAction(requestId);
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
        className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "جاري الإنشاء..." : "إنشاء مسودة"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
