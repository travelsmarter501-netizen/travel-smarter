"use client";

import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import { useFavorites } from "../../lib/useFavorites";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { Casino } from "../../lib/guideTypes";

/**
 * Grid of real, licensed casino venues — same visual pattern as ShoppingGrid: a full detail
 * card per item, no separate sheet. A single-venue result (the honest current count for
 * Barcelona — see this guide's own data comment) is centered with a capped width instead of
 * stretching into an awkward half-empty two-column row.
 */
export default function CasinoGrid({ guideSlug, casinos }: { guideSlug: string; casinos: Casino[] }) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);
  const singleVenue = casinos.length === 1;

  return (
    <div className={singleVenue ? "mx-auto max-w-sm sm:max-w-md" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
      {casinos.map((casino) => {
        const favorited = isFavorite("casino", casino.id);
        return (
          <div key={casino.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-32 w-full">
              <Image
                src={casino.image}
                alt={casino.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                style={casino.imagePosition ? { objectPosition: casino.imagePosition } : undefined}
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => toggleFavorite("casino", casino.id)}
                aria-pressed={favorited}
                aria-label={favorited ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm"
              >
                <IconHeart filled={favorited} className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <p dir="ltr" className="text-sm font-bold text-slate-900">
                {casino.name}
              </p>
              <RatingBadge
                rating={casino.rating}
                reviewCount={casino.reviewCount}
                ratingSource={casino.ratingSource}
                ratingUrl={casino.ratingUrl ?? (casino.ratingSource === "Google" ? casino.mapsUrl : undefined)}
                className="mt-1"
              />
              <p dir="auto" className="mt-2 text-sm leading-6 text-slate-600">
                {casino.description}
              </p>

              <div className="mt-2">
                <OpeningHours hours={casino.hours} />
              </div>

              <div className="mt-3">
                <LocationInfo address={casino.address} phone={casino.phone} mapsUrl={casino.mapsUrl} appleMapsUrl={casino.appleMapsUrl} />
              </div>

              {casino.officialUrl && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ExternalLink
                    href={casino.officialUrl}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
                  >
                    🌐 الموقع الرسمي
                    <IconExternalLink className="h-3 w-3 opacity-60" />
                  </ExternalLink>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
