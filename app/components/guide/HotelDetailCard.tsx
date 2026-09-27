import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import RatingBadge from "./RatingBadge";
import type { Hotel } from "../../lib/guideTypes";

/**
 * Full hotel detail — shown inside a BottomSheet, opened from the compact card in
 * HotelsGrid.tsx. Everything the compact card doesn't have room for (full address,
 * maps links, official site) lives here instead, matching AttractionCard's pattern.
 */
export default function HotelDetailCard({ hotel, isFavorite, onToggleFavorite }: { hotel: Hotel; isFavorite: boolean; onToggleFavorite: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={hotel.image}
          alt={hotel.name}
          fill
          sizes="(min-width: 640px) 512px, 100vw"
          style={hotel.imagePosition ? { objectPosition: hotel.imagePosition } : undefined}
          className="object-cover"
        />
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        >
          <IconHeart filled={isFavorite} className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p dir="ltr" className="text-base font-bold text-slate-900">
          {hotel.name}
        </p>
        <RatingBadge
          rating={hotel.rating}
          reviewCount={hotel.reviewCount}
          ratingSource={hotel.ratingSource}
          ratingUrl={hotel.ratingUrl ?? (hotel.ratingSource === "Google" ? hotel.mapsUrl : undefined)}
          className="mt-1"
        />
        <p dir="auto" className="mt-2 text-sm leading-6 text-slate-600">
          {hotel.bestFor}
        </p>
        <p dir="auto" className="mt-2 text-sm font-semibold text-teal-700">
          {hotel.priceText}
        </p>

        <div className="mt-3">
          <LocationInfo area={hotel.area} address={hotel.address} mapsUrl={hotel.mapsUrl} appleMapsUrl={hotel.appleMapsUrl} />
        </div>

        {hotel.officialUrl && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ExternalLink
              href={hotel.officialUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700"
            >
              🌐 الموقع الرسمي
              <IconExternalLink className="h-3 w-3 opacity-60" />
            </ExternalLink>
          </div>
        )}
      </div>
    </article>
  );
}
