import type { PlannerInterest } from "../../lib/planner/plannerTypes";

export const INTEREST_OPTIONS: { key: PlannerInterest; label: string; emoji: string }[] = [
  { key: "popular", label: "الأماكن الأشهر", emoji: "⭐" },
  { key: "cultureLocal", label: "ثقافة وأماكن محلية", emoji: "🏛️" },
  { key: "viewsNature", label: "مناظر وطبيعة", emoji: "📸" },
  { key: "beachRelax", label: "شاطئ وراحة", emoji: "🏖️" },
  { key: "footballExperiences", label: "كرة قدم وتجارب", emoji: "⚽" },
  { key: "foodShoppingNightlife", label: "أكل وتسوق وسهر", emoji: "🍽️" },
];

/** Deterministic preset — never random, never AI. */
export const SURPRISE_ME_PRESET: PlannerInterest[] = ["popular", "cultureLocal", "viewsNature"];

export default function InterestSelector({
  selected,
  onChange,
}: {
  selected: PlannerInterest[];
  onChange: (next: PlannerInterest[]) => void;
}) {
  function toggle(key: PlannerInterest) {
    if (selected.includes(key)) {
      onChange(selected.filter((item) => item !== key));
      return;
    }
    onChange([...selected, key]);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">شو بتحب أكثر؟</h2>
        {selected.length > 0 && (
          <span className="shrink-0 text-xs font-bold text-teal-700">{selected.length} مختارة</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">اختار كل الأشياء اللي بتحبها، وبنرتبلك الرحلة حسب ذوقك.</p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {INTEREST_OPTIONS.map((option) => {
          const active = selected.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.key)}
              className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-right text-sm font-bold transition-colors ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(SURPRISE_ME_PRESET)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-300 bg-teal-50/60 px-4 py-3 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50"
      >
        ✨ فاجئني بخطة متوازنة
      </button>
    </div>
  );
}
