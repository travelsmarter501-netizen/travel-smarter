export default function ReadyPlanDayTabs({
  days,
  activeDayId,
  onSelect,
}: {
  days: { id: string; label: string }[];
  activeDayId: string;
  onSelect: (dayId: string) => void;
}) {
  return (
    <div className="flex gap-1.5 sm:gap-2" role="tablist">
      {days.map((day) => {
        const active = day.id === activeDayId;
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day.id)}
            // min-w-0 overrides the flex default `min-width: auto` -- without it, 5 tabs (the
            // 5-day plan) never shrink below their own text's natural width and force the whole
            // row wider than its container (confirmed: a real ~40px horizontal page overflow at
            // 320px). Text wraps (never truncates -- "اليوم 1" stays fully readable, just on two
            // lines when a narrow tab can't fit it on one) rather than shrinking the font further.
            className={`min-w-0 flex-1 rounded-full border px-1.5 py-1.5 text-center text-xs font-bold leading-tight text-balance transition-colors sm:px-3 sm:py-2 sm:text-sm ${
              active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
