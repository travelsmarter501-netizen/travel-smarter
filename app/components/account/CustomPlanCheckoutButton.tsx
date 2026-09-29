"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCustomPlanAllpayCheckout } from "../../checkout/actions";

/**
 * "متابعة للدفع" for a `draft` Custom Plan request already saved in /account. Calls the same
 * trusted Custom Plan -> Commerce Bridge Server Action as the form's own success screen (see
 * app/lib/customPlanCommerce.ts) -- creates/reuses a real pending order and links it to this
 * request. On success, router.refresh() re-fetches the request list from the server, so the
 * row itself flips from `draft` (this button) to `pending_payment` (the "بانتظار الدفع" badge)
 * without a full page reload.
 */
export default function CustomPlanCheckoutButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startCustomPlanAllpayCheckout(requestId);
    setLoading(false);

    if (!result.ok) {
      if (result.requiresLogin) {
        router.push("/login?next=/account");
        return;
      }
      setError(result.error);
      return;
    }

    window.location.href = result.paymentUrl;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded-full bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "جاري التجهيز..." : "متابعة للدفع"}
      </button>
      {error && <p className="max-w-[14rem] text-left text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
