import type { TouristMistake } from "../../lib/guideTypes";

export default function MistakesSection({ mistakes }: { mistakes: TouristMistake[] }) {
  return (
    <div className="space-y-3">
      {mistakes.map((mistake) => (
        <div key={mistake.id} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
          <span className="mt-0.5 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-bold text-slate-900">{mistake.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{mistake.explanation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
