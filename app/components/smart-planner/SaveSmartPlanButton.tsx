export type SaveSmartPlanStatus = "idle" | "checking" | "saving" | "saved" | "duplicate" | "error";

const BUSY_LABEL: Record<"checking" | "saving", string> = {
  checking: "بنتحقق...",
  saving: "بنحفظ...",
};

const DONE_LABEL: Record<"saved" | "duplicate", string> = {
  saved: "تم حفظ خطتك ✓",
  duplicate: "الخطة محفوظة عندك أصلاً ✓",
};

/** Compact save action for the generated Smart Planner result. Purely presentational -- all
 * auth/save logic lives in the caller (see SmartPlannerApp's handleSave). */
export default function SaveSmartPlanButton({ status, onSave }: { status: SaveSmartPlanStatus; onSave: () => void }) {
  if (status === "saved" || status === "duplicate") {
    return <p className="mt-3 inline-flex items-center text-xs font-bold text-teal-700">{DONE_LABEL[status]}</p>;
  }

  const busy = status === "checking" || status === "saving";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-100 disabled:opacity-60"
      >
        {busy ? BUSY_LABEL[status as "checking" | "saving"] : "احفظ خطتي"}
      </button>
      {status === "error" && <span className="text-xs font-semibold text-rose-600">تعذّر الحفظ، حاول مرة أخرى.</span>}
    </div>
  );
}
