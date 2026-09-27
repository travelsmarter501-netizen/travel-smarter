"use client";

import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import { useFavorites } from "../../lib/useFavorites";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { ShoppingArea } from "../../lib/guideTypes";

export default function ShoppingGrid({ guideSlug, areas }: { guideSlug: string; areas: ShoppingArea[] }) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {areas.map((area) => {
        const favorited = isFavorite("shopping", area.id);
        // A street/neighborhood entry (no fixed business hours, e.g. El Born, Portal de
        // l'Àngel) reads as an AREA to browse, not a single mall/business — flagged here
        // rather than guessed per-entry so any future no-hours addition gets the same
        // honest treatment automatically.
        const isArea = !area.hours;
        return (
          <div key={area.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-32 w-full">
              <Image src={area.image} alt={area.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              <button
                type="button"
                onClick={() => toggleFavorite("shopping", area.id)}
                aria-pressed={favorited}
                aria-label={favorited ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm"
              >
                <IconHeart filled={favorited} className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p dir="auto" className="text-sm font-bold text-slate-900">
                  {area.name}
                </p>
                <span className="flex items-center gap-1.5">
                  {area.priceLevel && <span className="text-xs font-semibold text-teal-700">{area.priceLevel}</span>}
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{area.bestFor}</span>
                </span>
              </div>
              {isArea && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  🏘️ منطقة/شارع — تسوق حر بدون ساعات ثابتة
                </span>
              )}
              <RatingBadge
                rating={area.rating}
                reviewCount={area.reviewCount}
                ratingSource={area.ratingSource}
                ratingUrl={area.ratingUrl ?? (area.ratingSource === "Google" ? area.mapsUrl : undefined)}
                className="mt-1"
              />
              <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>

              {area.hours && (
                <div className="mt-2">
                  <OpeningHours hours={area.hours} />
                </div>
              )}

              <div className="mt-3">
                <LocationInfo address={area.address} phone={area.phone} mapsUrl={area.mapsUrl} appleMapsUrl={area.appleMapsUrl} label={area.locationLabel} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {area.officialUrl && (
                  <ExternalLink
                    href={area.officialUrl}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
                  >
                    🌐 الموقع الرسمي
                    <IconExternalLink className="h-3 w-3 opacity-60" />
                  </ExternalLink>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
