import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "../icons";
import type { DietaryNote, MustTryDish } from "../../lib/guideTypes";

const dietaryLabels: Record<DietaryNote, { label: string; className: string }> = {
  "usually-pork": { label: "🐷 يحتوي عادةً على خنزير", className: "bg-rose-50 text-rose-700" },
  "usually-pork-free": { label: "✅ عادة بدون خنزير", className: "bg-emerald-50 text-emerald-700" },
  "depends-ask": { label: "⚠️ ممكن يحتوي — اسأل المطعم", className: "bg-amber-50 text-amber-700" },
};

export default function DishesGrid({ dishes, basePath }: { dishes: MustTryDish[]; basePath: string }) {
  return (
    <div>
      <Link href={`${basePath}?s=food`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
        <IconArrowRight className="h-4 w-4" />
        كل الفئات
      </Link>

      <p className="mt-3 flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="text-xl">🍽️</span>
        أكلات لازم تجربها
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => {
          const dietary = dietaryLabels[dish.dietary];
          return (
            <div key={dish.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-32 w-full">
                <Image src={dish.image} alt={dish.name} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="p-4">
                <p dir="ltr" className="text-sm font-bold text-slate-900">
                  {dish.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{dish.description}</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${dietary.className}`}>
                  {dietary.label}
                </span>
                {dish.dietary === "depends-ask" && <p className="mt-1 text-[11px] text-slate-400">*الوصفة ممكن تختلف من مطعم لمطعم.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
