"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

/** RLS scopes the delete to the current user's own row (user_id = auth.uid()) -- deleting a
 * foreign id is simply a no-op, never another user's row. */
export default function DeleteSavedPlanButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("حذف هاي الخطة المحفوظة؟")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("smart_planner_saved_plans").delete().eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
    >
      {loading ? "جاري الحذف..." : "حذف"}
    </button>
  );
}
