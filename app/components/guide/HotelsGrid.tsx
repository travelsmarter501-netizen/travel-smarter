"use client";

import { useState } from "react";
import Image from "next/image";
import BottomSheet from "./BottomSheet";
import HotelDetailCard from "./HotelDetailCard";
import { IconHeart } from "../icons";
import { useFavorites } from "../../lib/useFavorites";
import RatingBadge from "./RatingBadge";
import type { Hotel } from "../../lib/guideTypes";

/**
 * Compact hotel cards — image, name, area, rating, one-line "best for", price wording, and a
 * single "التفاصيل" action. Full address/maps/official-site links live in the details sheet
 * (HotelDetailCard), opened on tap — kept out of the card itself so it stays scannable
 * instead of repeating everything AttractionCard-style inline.
 */
export default function HotelsGrid({ guideSlug, hotels }: { guideSlug: string; hotels: Hotel[] }) {
  const { isFavorite, toggleFavorite } = useFavorites(guideSlug);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const activeHotel = hotels.find((hotel) => hotel.id === activeHotelId);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hotels.map((hotel) => {
          const favorited = isFavorite("hotel", hotel.id);
          return (
            <div key={hotel.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={hotel.image}
                  alt={hotel.name}
                  fill
                  sizes="80px"
                  style={hotel.imagePosition ? { objectPosition: hotel.imagePosition } : undefined}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => toggleFavorite("hotel", hotel.id)}
                  aria-pressed={favorited}
                  aria-label={favorited ? "إزالة من المفضلة" : "حفظ في المفضلة"}
                  className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm"
                >
                  <IconHeart filled={favorited} className="h-3.5 w-3.5" />
                </button>
              </div>

              <button type="button" onClick={() => setActiveHotelId(hotel.id)} className="min-w-0 flex-1 text-right">
                <p dir="ltr" className="truncate text-sm font-bold text-slate-900">
                  {hotel.name}
                </p>
                {hotel.area && (
                  <p dir="auto" className="mt-0.5 truncate text-xs text-slate-500">
                    {hotel.area}
                  </p>
                )}
                <RatingBadge rating={hotel.rating} reviewCount={hotel.reviewCount} ratingSource={hotel.ratingSource} className="mt-1" />
                <p dir="auto" className="mt-1 line-clamp-1 text-xs leading-5 text-slate-600">
                  {hotel.bestFor}
                </p>
                <p dir="auto" className="mt-1 truncate text-[11px] font-semibold text-teal-700">
                  {hotel.priceText}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      <BottomSheet open={!!activeHotel} onClose={() => setActiveHotelId(null)} title={activeHotel?.name}>
        {activeHotel && (
          <HotelDetailCard
            hotel={activeHotel}
            isFavorite={isFavorite("hotel", activeHotel.id)}
            onToggleFavorite={() => toggleFavorite("hotel", activeHotel.id)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
