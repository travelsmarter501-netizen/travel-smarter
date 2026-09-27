import { INTEREST_OPTIONS } from "./InterestSelector";
import type { PlannerInterest } from "../../lib/planner/plannerTypes";

/**
 * V1.5: "which of your selected interests matters most" step. Only rendered by
 * SmartPlannerApp when 2+ interests are selected (a single selected interest implicitly
 * becomes primary with no extra question -- see SmartPlannerApp's handleInterestsChange).
 * Only ever shows the interests the customer already selected, in the same fixed order as
 * InterestSelector's own grid (never re-sorted by selection order, which is not a safe
 * signal -- see the "Primary Interest Design Audit" task's report).
 */
export default function PrimaryInterestSelector({
  interests,
  primaryInterest,
  onSelect,
}: {
  interests: PlannerInterest[];
  primaryInterest: PlannerInterest | null;
  onSelect: (interest: PlannerInterest) => void;
}) {
  const options = INTEREST_OPTIONS.filter((option) => interests.includes(option.key));

  return (
    <div>
      <h2 className="text-base font-bold text-slate-900">شو الأهم إلك بهاي الرحلة؟</h2>
      <p className="mt-1 text-sm text-slate-500">بنستخدم اختيارك حتى نعطي أولوية أكبر للأشياء اللي بتهمك.</p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {options.map((option) => {
          const active = option.key === primaryInterest;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.key)}
              className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-right text-sm font-bold transition-colors ${
                active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
