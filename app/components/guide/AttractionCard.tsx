import Image from "next/image";
import { IconExternalLink, IconHeart, IconStar } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { Attraction } from "../../lib/guideTypes";
import type { Weekday } from "../../lib/hours";

const bookingNeeded = new Set(["ضروري مسبقًا", "يفضل مسبقًا"]);

export default function AttractionCard({
  attraction,
  areaName,
  isFavorite,
  onToggleFavorite,
  plannedWeekday,
}: {
  attraction: Attraction;
  areaName: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** See PlaceDetailsSheet.tsx's own doc comment. Omitted outside a dated itinerary. */
  plannedWeekday?: Weekday;
}) {
  const imageLinkHref = attraction.officialUrl ?? attraction.mapsUrl;
  const imageLinkLabel = attraction.officialUrl
    ? `افتح الموقع الرسمي لـ ${attraction.name}`
    : `افتح ${attraction.name} في خرائط جوجل`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ExternalLink
        href={imageLinkHref}
        aria-label={imageLinkLabel}
        className="group relative block aspect-[16/10] w-full cursor-pointer overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {attraction.image ? (
          <Image
            src={attraction.image}
            alt={attraction.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            style={attraction.imagePosition ? { objectPosition: attraction.imagePosition } : undefined}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <span className="text-2xl">🏛️</span>
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
        {attraction.mustSee && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <IconStar filled className="h-3 w-3" />
            Must See
          </span>
        )}
      </ExternalLink>

      <div className="flex flex-1 flex-col p-4">
        <p dir="ltr" className="text-base font-bold text-slate-900">
          {attraction.name}
        </p>
        <RatingBadge
          rating={attraction.rating}
          reviewCount={attraction.reviewCount}
          ratingSource={attraction.ratingSource}
          ratingUrl={attraction.ratingUrl ?? (attraction.ratingSource === "Google" ? attraction.mapsUrl : undefined)}
          className="mt-1"
        />
        <p className="mt-1 text-sm leading-6 text-slate-600">{attraction.description}</p>

        <div className="mt-3">
          <LocationInfo
            area={areaName || undefined}
            address={attraction.address}
            mapsUrl={attraction.mapsUrl}
            appleMapsUrl={attraction.appleMapsUrl}
            label={attraction.locationLabel}
          />
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-1.5 text-slate-700">
            <span>🎟️</span>
            <span>{attraction.priceText}</span>
          </p>
          {bookingNeeded.has(attraction.bookingStatus) && (
            <p className="flex items-center gap-1.5 text-slate-700">
              <span>📅</span>
              <span>{attraction.bookingStatus}</span>
            </p>
          )}
        </div>

        <div className="mt-2">
          <OpeningHours hours={attraction.hours} plannedWeekday={plannedWeekday} />
        </div>

        <div className="mt-3 rounded-xl bg-teal-50 p-3">
          <p className="text-xs font-bold text-teal-800">Travel Smarter Tip</p>
          <p className="mt-1 text-xs leading-5 text-teal-700">{attraction.tip}</p>
        </div>

        {(attraction.officialUrl || attraction.ticketsUrl) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attraction.officialUrl && (
              <ExternalLink
                href={attraction.officialUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-teal-300 hover:text-teal-700"
              >
                🌐 الموقع الرسمي
                <IconExternalLink className="h-3 w-3 opacity-60" />
              </ExternalLink>
            )}
            {attraction.ticketsUrl && (
              <ExternalLink
                href={attraction.ticketsUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:border-amber-300"
              >
                🎟 التذاكر الرسمية
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
