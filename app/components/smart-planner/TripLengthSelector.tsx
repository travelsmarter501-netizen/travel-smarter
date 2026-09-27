type DayOption = { days: 1 | 3 | 5; label: string; supported: boolean };

const DAY_OPTIONS: DayOption[] = [
  { days: 1, label: "1 يوم", supported: false },
  { days: 3, label: "3 أيام", supported: true },
  { days: 5, label: "5 أيام", supported: false },
];

/**
 * V1 only fully supports 3-day plans (the only length the Day Builder/Route Optimizer/
 * Transport Legs pipeline has been built and tested for). 1 and 5 are shown for context
 * but disabled with a "قريبًا" badge, never faked.
 */
export default function TripLengthSelector({ selectedDays, onSelect }: { selectedDays: 1 | 3 | 5; onSelect: (days: 1 | 3 | 5) => void }) {
  return (
    <div>
      <h2 className="text-base font-bold text-slate-900">كم يوم رحلتك؟</h2>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {DAY_OPTIONS.map((option) => {
          const active = option.days === selectedDays;
          return (
            <button
              key={option.days}
              type="button"
              disabled={!option.supported}
              onClick={() => option.supported && onSelect(option.days)}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-4 text-sm font-bold transition-colors ${
                !option.supported
                  ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                  : active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {!option.supported && (
                <span className="absolute -top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">قريبًا</span>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
