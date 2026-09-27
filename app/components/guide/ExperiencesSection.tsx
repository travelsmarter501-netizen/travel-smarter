"use client";

import { useMemo, useState } from "react";
import ExperienceCard from "./ExperienceCard";
import { useFavorites } from "../../lib/useFavorites";
import type { Experience, ExperienceCategory } from "../../lib/guideTypes";

/** Cross-cutting quick filters that match a tag, not a primary category — only shown when at least 2 experiences carry that tag. */
const QUICK_TAGS = ["Sunset", "Couples", "Family"];

export default function ExperiencesSection({
  guideSlug,
  categories,
  experiences,
}: {
  guideSlug: string;
  categories: ExperienceCategory[];
  experiences: Experience[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  const availableQuickTags = useMemo(
    () => QUICK_TAGS.filter((tag) => experiences.filter((experience) => experience.tags.includes(tag)).length >= 2),
    [experiences]
  );

  const chips = useMemo(
    () => [
      { id: "all", label: "🔥 الكل" },
      ...categories.map((category) => ({ id: category.id, label: `${category.icon} ${category.label}` })),
      ...availableQuickTags.map((tag) => ({ id: `tag:${tag}`, label: tag === "Sunset" ? "🌅 Sunset" : tag === "Couples" ? "💑 Couples" : "👨‍👩‍👧 Family" })),
    ],
    [categories, availableQuickTags]
  );

  const filtered = experiences.filter((experience) => {
    if (filter === "all") return true;
    if (filter.startsWith("tag:")) return experience.tags.includes(filter.slice(4));
    return experience.categoryId === filter;
  });

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filter === chip.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">ما فيه تجارب مطابقة لهذا الفلتر حاليًا.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              isFavorite={isFavorite("experience", experience.id)}
              onToggleFavorite={() => toggleFavorite("experience", experience.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
