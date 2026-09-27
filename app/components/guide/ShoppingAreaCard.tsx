import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { ShoppingArea } from "../../lib/guideTypes";
import type { Weekday } from "../../lib/hours";

/**
 * Single-place detail card for a `ShoppingArea` — same visual/data pattern as AttractionCard,
 * ExperienceCard, etc. (image, favorite, rating, description, location, official link), reusing
 * the exact fields ShoppingGrid.tsx already renders in its grid tiles. Real guide data only —
 * never invents hours/rating/price this type doesn't have.
 */
export default function ShoppingAreaCard({
  area,
  isFavorite,
  onToggleFavorite,
  plannedWeekday,
}: {
  area: ShoppingArea;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** See PlaceDetailsSheet.tsx's own doc comment. Omitted outside a dated itinerary. */
  plannedWeekday?: Weekday;
}) {
  const imageLinkHref = area.officialUrl ?? area.mapsUrl;
  const imageLinkLabel = area.officialUrl ? `افتح الموقع الرسمي لـ ${area.name}` : `افتح ${area.name} في خرائط جوجل`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ExternalLink
        href={imageLinkHref}
        aria-label={imageLinkLabel}
        className="group relative block aspect-[16/10] w-full cursor-pointer overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {area.image ? (
          <Image src={area.image} alt={area.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <span className="text-2xl">🛍️</span>
            <span className="text-[11px] font-medium">لا توجد صورة موثقة</span>
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite();
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        >
          <IconHeart filled={isFavorite} className="h-4.5 w-4.5" />
        </button>
      </ExternalLink>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p dir="auto" className="text-base font-bold text-slate-900">
            {area.name}
          </p>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{area.bestFor}</span>
        </div>
        <RatingBadge
          rating={area.rating}
          reviewCount={area.reviewCount}
          ratingSource={area.ratingSource}
          ratingUrl={area.ratingUrl ?? (area.ratingSource === "Google" ? area.mapsUrl : undefined)}
          className="mt-1"
        />
        <p className="mt-1 text-sm leading-6 text-slate-600">{area.description}</p>

        <div className="mt-3">
          <OpeningHours hours={area.hours} plannedWeekday={plannedWeekday} />
        </div>

        <div className="mt-3">
          <LocationInfo address={area.address} phone={area.phone} mapsUrl={area.mapsUrl} appleMapsUrl={area.appleMapsUrl} label={area.locationLabel} />
        </div>

        {area.officialUrl && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ExternalLink
              href={area.officialUrl}
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
