"use client";

import Image from "next/image";
import { useFavorites } from "../../lib/useFavorites";
import { IconHeart } from "../icons";
import LocationInfo from "./LocationInfo";
import RatingBadge from "./RatingBadge";
import type { Beach } from "../../lib/guideTypes";

const crowdLabels: Record<Beach["crowdLevel"], string> = {
  low: "🟢 هادئ",
  medium: "🟡 متوسط",
  high: "🔴 مزدحم",
};

export default function BeachesGrid({ guideSlug, beaches }: { guideSlug: string; beaches: Beach[] }) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {beaches.map((beach) => {
        const favorited = isFavorite("beach", beach.id);
        return (
          <div key={beach.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-video w-full">
              <Image
                src={beach.image}
                alt={beach.name}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                style={beach.imagePosition ? { objectPosition: beach.imagePosition } : undefined}
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => toggleFavorite("beach", beach.id)}
                aria-pressed={favorited}
                aria-label={favorited ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm"
              >
                <IconHeart filled={favorited} className="h-4 w-4" />
              </button>
              <p dir="ltr" className="absolute bottom-2.5 right-2.5 text-base font-bold text-white drop-shadow">
                {beach.name}
              </p>
            </div>
            <div className="p-4">
              <RatingBadge
                rating={beach.rating}
                reviewCount={beach.reviewCount}
                ratingSource={beach.ratingSource}
                ratingUrl={beach.ratingUrl ?? (beach.ratingSource === "Google" ? beach.mapsUrl : undefined)}
              />
              <p className={`text-sm leading-6 text-slate-600 ${beach.rating ? "mt-1" : ""}`}>{beach.vibe}</p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {beach.bestFor.map((label) => (
                  <span key={label} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {label}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-500">{crowdLabels[beach.crowdLevel]}</p>

              <div className="mt-3 rounded-xl bg-teal-50 p-3">
                <p className="text-xs leading-5 text-teal-700">{beach.tip}</p>
              </div>

              <div className="mt-3">
                <LocationInfo
                  area={beach.area}
                  address={beach.address}
                  mapsUrl={beach.mapsUrl}
                  appleMapsUrl={beach.appleMapsUrl}
                  label="نقطة الوصول"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
