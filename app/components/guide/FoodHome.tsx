import Link from "next/link";
import type { FoodCategory, FoodPlace } from "../../lib/guideTypes";

export default function FoodHome({
  categories,
  places,
  basePath,
}: {
  categories: FoodCategory[];
  places: FoodPlace[];
  basePath: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => {
          const count = places.filter((place) => place.categoryId === category.id).length;
          return (
            <Link
              key={category.id}
              href={`${basePath}?s=food&fc=${category.id}`}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-bold text-slate-900">{category.label}</span>
              <span className="text-xs text-slate-500">{count} خيار</span>
            </Link>
          );
        })}
      </div>

      <Link
        href={`${basePath}?s=food&fc=dishes`}
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 transition-colors hover:border-teal-300"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-teal-800">
          <span className="text-xl">🍽️</span>
          أكلات لازم تجربها
        </span>
        <span className="text-teal-700">←</span>
      </Link>
    </div>
  );
}
