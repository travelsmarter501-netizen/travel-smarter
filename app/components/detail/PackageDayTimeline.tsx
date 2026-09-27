import type { PackageDay } from "../../lib/packages-data";

export default function PackageDayTimeline({ days }: { days: PackageDay[] }) {
  return (
    <div className="space-y-4">
      {days.map((day) => (
        <div key={day.day} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
              {day.day}
            </span>
            <h3 className="text-base font-bold text-slate-900">{day.title}</h3>
          </div>

          <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {day.blocks.map((block, index) => (
              <li key={index} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {block.time}
                </span>
                <span>{block.activity}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
