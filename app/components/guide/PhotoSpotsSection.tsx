"use client";

import Image from "next/image";
import { useFavorites } from "../../lib/useFavorites";
import { IconHeart } from "../icons";
import LocationInfo from "./LocationInfo";
import type { PhotoSpot } from "../../lib/guideTypes";

export default function PhotoSpotsSection({ guideSlug, spots }: { guideSlug: string; spots: PhotoSpot[] }) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot) => {
        const favorited = isFavorite("photo-spot", spot.id);
        return (
          <div key={spot.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={spot.image}
                alt={spot.name}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                style={spot.imagePosition ? { objectPosition: spot.imagePosition } : undefined}
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => toggleFavorite("photo-spot", spot.id)}
                aria-pressed={favorited}
                aria-label={favorited ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm"
              >
                <IconHeart filled={favorited} className="h-4 w-4" />
              </button>
              <p dir="ltr" className="absolute bottom-2.5 right-2.5 text-base font-bold text-white drop-shadow">
                {spot.name}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-teal-700">{spot.bestTime}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{spot.whySpecial}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">💡 {spot.tip}</p>
              <div className="mt-3">
                <LocationInfo address={spot.address} mapsUrl={spot.mapsUrl} appleMapsUrl={spot.appleMapsUrl} label="نقطة التصوير" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
