"use client";

import { useMemo, useState } from "react";
import AttractionCard from "./AttractionCard";
import { useFavorites } from "../../lib/useFavorites";
import { IconHeart, IconSearch, IconStar } from "../icons";
import type { Attraction, Area } from "../../lib/guideTypes";

export default function AttractionsExplorer({
  guideSlug,
  attractions,
  areas,
}: {
  guideSlug: string;
  attractions: Attraction[];
  areas: Area[];
}) {
  const [query, setQuery] = useState("");
  const [mustSeeOnly, setMustSeeOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  const areaNameById = useMemo(() => {
    const map = new Map<string, string>();
    areas.forEach((area) => map.set(area.id, area.name));
    return map;
  }, [areas]);

  const filtered = attractions.filter((attraction) => {
    if (mustSeeOnly && !attraction.mustSee) return false;
    if (favoritesOnly && !isFavorite("attraction", attraction.id)) return false;
    if (query.trim()) {
      const areaName = areaNameById.get(attraction.areaId) ?? "";
      const haystack = `${attraction.name} ${attraction.description} ${areaName} ${attraction.address ?? ""}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="شو بتدور عليه في Barcelona؟"
          className="w-full rounded-full border border-slate-200 bg-white py-3 pe-11 ps-4 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMustSeeOnly((value) => !value)}
          aria-pressed={mustSeeOnly}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            mustSeeOnly ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
          }`}
        >
          <IconStar filled={mustSeeOnly} className="h-4 w-4" />
          Must See
        </button>

        <button
          type="button"
          onClick={() => setFavoritesOnly((value) => !value)}
          aria-pressed={favoritesOnly}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            favoritesOnly ? "border-rose-500 bg-rose-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-rose-300"
          }`}
        >
          <IconHeart filled={favoritesOnly} className="h-4 w-4" />
          محفوظاتي
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">ما فيه نتائج مطابقة. جرّب تعديل البحث أو الفلاتر.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((attraction) => (
            <AttractionCard
              key={attraction.id}
              attraction={attraction}
              areaName={areaNameById.get(attraction.areaId) ?? ""}
              isFavorite={isFavorite("attraction", attraction.id)}
              onToggleFavorite={() => toggleFavorite("attraction", attraction.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
