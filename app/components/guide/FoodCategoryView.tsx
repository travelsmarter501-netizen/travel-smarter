"use client";

import { useState } from "react";
import Link from "next/link";
import FoodPlaceCard from "./FoodPlaceCard";
import { useFavorites } from "../../lib/useFavorites";
import { IconArrowRight, IconSearch } from "../icons";
import type { FoodCategory, FoodPlace } from "../../lib/guideTypes";

type SortOption = "default" | "rating" | "budget";

export default function FoodCategoryView({
  guideSlug,
  category,
  places,
  basePath,
}: {
  guideSlug: string;
  category: FoodCategory;
  places: FoodPlace[];
  basePath: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("default");
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  const filtered = places.filter((place) => {
    if (!query.trim()) return true;
    const haystack = `${place.name} ${place.area} ${place.address ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sort === "budget") return a.priceLevel.length - b.priceLevel.length;
    return 0;
  });

  return (
    <div>
      <Link href={`${basePath}?s=food`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
        <IconArrowRight className="h-4 w-4" />
        كل الفئات
      </Link>

      <p className="mt-3 flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="text-xl">{category.icon}</span>
        {category.label}
      </p>

      <div className="relative mt-4">
        <IconSearch className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="دور على مطعم أو منطقة..."
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pe-10 ps-4 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            { id: "default", label: "الترتيب الافتراضي" },
            { id: "rating", label: "⭐ الأعلى تقييمًا" },
            { id: "budget", label: "💸 اقتصادي" },
          ] as { id: SortOption; label: string }[]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSort(option.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              sort === option.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">ما فيه نتائج مطابقة.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((place) => (
            <FoodPlaceCard
              key={place.id}
              place={place}
              isFavorite={isFavorite("food", place.id)}
              onToggleFavorite={() => toggleFavorite("food", place.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
