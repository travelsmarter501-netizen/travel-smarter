import Link from "next/link";
import type { GuideCategory } from "../../lib/guideTypes";

export default function CategoryGrid({ categories, basePath }: { categories: GuideCategory[]; basePath: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`${basePath}?s=${category.id}`}
          className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
        >
          <span className="text-2xl">{category.icon}</span>
          <span className="text-sm font-bold text-slate-900">{category.label}</span>
          <span className="text-xs leading-5 text-slate-500">{category.subtitle}</span>
        </Link>
      ))}
    </div>
  );
}
