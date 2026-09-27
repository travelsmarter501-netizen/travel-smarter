"use client";

import { useState } from "react";
import Link from "next/link";
import NightlifeVenueCard from "./NightlifeVenueCard";
import { useFavorites } from "../../lib/useFavorites";
import { IconArrowRight } from "../icons";
import type { NightlifeCategory, NightlifeVenue } from "../../lib/guideTypes";

type SubFilter = "all" | "rating" | "budget" | "views" | "party" | "relaxed" | "beach";

const SUB_FILTER_LABELS: Record<SubFilter, string> = {
  all: "الكل",
  rating: "⭐ الأعلى تقييمًا",
  budget: "💸 أقل تكلفة",
  views: "🌅 Views",
  party: "🎉 Party",
  relaxed: "😌 Relaxed",
  beach: "🌊 Beach",
};

/** Sort options — always available whenever the category has venues, regardless of tags. */
const SORT_FILTERS: SubFilter[] = ["rating", "budget"];

/** Content filters — each depends on venue tags/category, so only shown when at least one venue actually matches. */
const CONTENT_FILTERS: SubFilter[] = ["views", "party", "relaxed", "beach"];

function tagMatch(venue: NightlifeVenue, keyword: string) {
  return venue.tags.some((tag) => tag.toLowerCase().includes(keyword)) || venue.description.toLowerCase().includes(keyword);
}

/** Same matching rules the filtering logic already used — reused here to decide which chips are worth showing. */
function matchesContentFilter(venue: NightlifeVenue, filter: SubFilter): boolean {
  if (filter === "views") return tagMatch(venue, "view") || tagMatch(venue, "sunset");
  if (filter === "party") return tagMatch(venue, "iconic") || tagMatch(venue, "commercial") || venue.categoryId === "clubs";
  if (filter === "relaxed") return tagMatch(venue, "هادئ") || tagMatch(venue, "relaxed") || tagMatch(venue, "cozy");
  if (filter === "beach") return venue.categoryId === "beach" || tagMatch(venue, "beach");
  return false;
}

export default function NightlifeCategoryView({
  guideSlug,
  category,
  venues,
  basePath,
}: {
  guideSlug: string;
  category: NightlifeCategory;
  venues: NightlifeVenue[];
  basePath: string;
}) {
  const [filter, setFilter] = useState<SubFilter>("all");
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  // Only offer chips that can actually return something for THIS category's venues.
  // "all" and the two sort options are always available when there's anything to show;
  // content filters (views/party/relaxed/beach) are hidden unless a venue truly matches.
  const availableFilters: SubFilter[] =
    venues.length === 0
      ? []
      : ["all", ...SORT_FILTERS, ...CONTENT_FILTERS.filter((option) => venues.some((venue) => matchesContentFilter(venue, option)))];

  // If the previously selected filter isn't valid for this category's venues (e.g. right after
  // switching category), fall back to "all" instead of silently producing zero results.
  const activeFilter: SubFilter = availableFilters.includes(filter) ? filter : "all";

  const filtered = CONTENT_FILTERS.includes(activeFilter) ? venues.filter((venue) => matchesContentFilter(venue, activeFilter)) : venues;

  const sorted = [...filtered].sort((a, b) => {
    if (activeFilter === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    if (activeFilter === "budget") return (a.priceLevel ?? "$$").length - (b.priceLevel ?? "$$").length;
    return 0;
  });

  return (
    <div>
      <Link href={`${basePath}?s=nightlife`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
        <IconArrowRight className="h-4 w-4" />
        كل الفئات
      </Link>

      <p className="mt-3 flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="text-xl">{category.icon}</span>
        {category.title}
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {availableFilters.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {SUB_FILTER_LABELS[id]}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">ما فيه نتائج مطابقة لهذا الفلتر.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((venue) => (
            <NightlifeVenueCard
              key={venue.id}
              venue={venue}
              isFavorite={isFavorite("nightlife", venue.id)}
              onToggleFavorite={() => toggleFavorite("nightlife", venue.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
