"use client";

import { useChecklist } from "../../lib/useChecklist";
import { IconCheck } from "../icons";
import type { ChecklistItem } from "../../lib/guideTypes";

export default function ChecklistSection({ guideSlug, items }: { guideSlug: string; items: ChecklistItem[] }) {
  const { checked, toggle, isChecked } = useChecklist(guideSlug);
  const doneCount = items.filter((item) => isChecked(item.id)).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm text-slate-500">
        {doneCount} من {items.length} مكتمل
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const done = isChecked(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={done}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-start transition-colors hover:border-teal-200"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    done ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {done && <IconCheck className="h-3.5 w-3.5" />}
                </span>
                <span className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-slate-400">
        {checked.length > 0 ? "التشيك ليست محفوظة بمتصفحك — رح تلاقيها لما ترجع." : "علّم أي عنصر، وراح يُحفظ تلقائيًا بمتصفحك."}
      </p>
    </div>
  );
}
