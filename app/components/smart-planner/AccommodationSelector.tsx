export type AccommodationChoice = "has" | "none";

/**
 * V1: "where are you staying" questionnaire step. Visual language matches TripLengthSelector/
 * InterestSelector (same heading style, same rounded-2xl choice-button pattern). Purely
 * controlled -- all state lives in SmartPlannerApp, same pattern as the other selectors.
 *
 * Accommodation is always optional: choosing "لسا ما حجزت" or leaving the question unanswered
 * never blocks generation (see SmartPlannerApp's `canGenerate`, unchanged by this feature).
 */
export default function AccommodationSelector({
  choice,
  text,
  useAsDailyAnchor,
  onChoiceChange,
  onTextChange,
  onAnchorToggle,
}: {
  choice: AccommodationChoice | null;
  text: string;
  useAsDailyAnchor: boolean;
  onChoiceChange: (choice: AccommodationChoice) => void;
  onTextChange: (text: string) => void;
  onAnchorToggle: (value: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-slate-900">وين ساكن ببرشلونة؟</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {(
          [
            { key: "has" as const, label: "عندي فندق / شقة" },
            { key: "none" as const, label: "لسا ما حجزت" },
          ]
        ).map((option) => {
          const active = option.key === choice;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChoiceChange(option.key)}
              className={`rounded-2xl border px-3 py-4 text-sm font-bold transition-colors ${
                active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {choice === "has" && (
        <div className="mt-3 space-y-2.5">
          <input
            type="text"
            dir="auto"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="اكتب اسم الفندق أو عنوان الشقة"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
          />

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">استخدم مكان السكن كنقطة بداية لكل يوم</span>
            <input
              type="checkbox"
              checked={useAsDailyAnchor}
              onChange={(event) => onAnchorToggle(event.target.checked)}
              className="h-5 w-5 accent-teal-700"
            />
          </label>

          <p className="text-xs leading-5 text-slate-500">
            إذا ما قدرنا نحدد المنطقة بدقة، الخطة بتظل مرتبة كالمعتاد ونوفرلك روابط المسار من مكان إقامتك.
          </p>
          <p className="text-[11px] leading-5 text-slate-400">إذا حفظت الخطة، بيتم حفظ اسم/عنوان مكان الإقامة معها.</p>
        </div>
      )}
    </div>
  );
}
