"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deliverCustomPlanAction } from "../../admin/custom-plans/actions";

export default function DeliverButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = window.confirm("رح يتم تسليم الخطة النهائية للزبون وما رح تقدر تسحبها. متأكد إنك خلصت المراجعة؟");
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const result = await deliverCustomPlanAction(requestId);
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
        className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "جاري التسليم..." : "تسليم الخطة"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
