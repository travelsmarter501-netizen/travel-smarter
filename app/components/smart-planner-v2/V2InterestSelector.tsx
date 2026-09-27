"use client";

import { V2_INTEREST_DISPLAY_GROUPS, isV2DisplayGroupActive, toggleV2DisplayGroup } from "../../lib/planner/v2PlannerTypes";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";

/**
 * Interests UI Simplification -- 6 customer-facing display groups (down from the original 8
 * separate buttons) + Surprise Me. Still emits/accepts the exact same 8-key `V2PlannerInterest[]`
 * shape as before (see v2PlannerTypes.ts's `V2_INTEREST_DISPLAY_GROUPS` /
 * `toggleV2DisplayGroup` / `isV2DisplayGroupActive`) -- selecting "طبيعة وشواطئ" or "تجارب
 * وترفيه" always adds/removes BOTH of that group's internal keys together. No Guide/
 * planner-metadata import -- pure presentational, same established visual pattern as before
 * (2-column pill grid, count badge) so it also still reads correctly for an old saved plan's
 * single split key (natureViews-only, etc. -- see isV2DisplayGroupActive's own doc comment).
 *
 * Planner Intelligence Upgrade: Surprise Me is now a real, independent mode, not just a button
 * that fills `selected` with a fixed preset -- it has its own `surpriseMeActive` state (owned
 * by the parent, since the actual generation request needs to know this explicitly too, see
 * SmartPlannerV2App.tsx) and its own selected/unselected visual treatment, matching the 6
 * group cards. When active, NONE of the 6 group cards show as selected, even defensively (the
 * parent always clears `selected` to `[]` when Surprise Me is chosen, but the render below
 * never trusts that alone).
 */

export default function V2InterestSelector({
  selected,
  onChange,
  surpriseMeActive,
  onSurpriseMe,
}: {
  selected: V2PlannerInterest[];
  onChange: (next: V2PlannerInterest[]) => void;
  surpriseMeActive: boolean;
  onSurpriseMe: () => void;
}) {
  const activeGroupCount = surpriseMeActive ? 0 : V2_INTEREST_DISPLAY_GROUPS.filter((group) => isV2DisplayGroupActive(selected, group)).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">شو بتحب بالرحلة؟</h2>
        {surpriseMeActive ? (
          <span className="shrink-0 text-xs font-bold text-teal-700">فاجئني مختارة</span>
        ) : (
          activeGroupCount > 0 && <span className="shrink-0 text-xs font-bold text-teal-700">{activeGroupCount} مختارة</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {V2_INTEREST_DISPLAY_GROUPS.map((group) => {
          const active = !surpriseMeActive && isV2DisplayGroupActive(selected, group);
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(toggleV2DisplayGroup(selected, group))}
              className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-right text-sm font-bold transition-colors ${
                active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{group.emoji}</span>
              <span>{group.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={surpriseMeActive}
        onClick={onSurpriseMe}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
          surpriseMeActive ? "border-teal-700 bg-teal-700 text-white" : "border-dashed border-teal-300 bg-teal-50/60 text-teal-700 hover:bg-teal-50"
        }`}
      >
        فاجئني ✨
      </button>
    </div>
  );
}
