import Link from "next/link";
import type { NightlifeCategory, NightlifeVenue } from "../../lib/guideTypes";

export default function NightlifeHome({
  categories,
  venues,
  basePath,
}: {
  categories: NightlifeCategory[];
  venues: NightlifeVenue[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category) => {
        const count = venues.filter((venue) => venue.categoryId === category.id).length;
        return (
          <Link
            key={category.id}
            href={`${basePath}?s=nightlife&nc=${category.id}`}
            className="flex flex-col items-start gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
          >
            <span className="text-2xl">{category.icon}</span>
            <span className="text-sm font-bold text-slate-900">{category.title}</span>
            <span className="text-xs text-slate-500">{count} خيار</span>
          </Link>
        );
      })}
    </div>
  );
}
