import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { NightlifeVenue } from "../../lib/guideTypes";
import type { Weekday } from "../../lib/hours";

export default function NightlifeVenueCard({
  venue,
  isFavorite,
  onToggleFavorite,
  plannedWeekday,
}: {
  venue: NightlifeVenue;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** See PlaceDetailsSheet.tsx's own doc comment. Omitted outside a dated itinerary. */
  plannedWeekday?: Weekday;
}) {
  const websiteHref = venue.officialUrl ?? venue.officialSocialUrl;
  const websiteLabel = venue.officialUrl ? "🌐 الموقع الرسمي" : "Instagram الرسمي";
  const imageLinkHref = websiteHref ?? venue.mapsUrl;
  const imageLinkLabel = websiteHref ? `افتح الموقع الرسمي لـ ${venue.name}` : `افتح ${venue.name} في خرائط جوجل`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ExternalLink
        href={imageLinkHref}
        aria-label={imageLinkLabel}
        className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {venue.image ? (
          <Image
            src={venue.image}
            alt={venue.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            style={venue.imagePosition ? { objectPosition: venue.imagePosition } : undefined}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
            <span className="text-2xl">🌙</span>
            <span className="text-[11px] font-medium">لا توجد صورة موثقة</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite();
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        >
          <IconHeart filled={isFavorite} className="h-4 w-4" />
        </button>
        <p dir="auto" className="absolute bottom-2.5 right-2.5 text-base font-bold text-white drop-shadow">
          {venue.name}
        </p>
      </ExternalLink>

      <div className="flex flex-1 flex-col p-4">
        <RatingBadge
          rating={venue.rating}
          reviewCount={venue.reviewCount}
          ratingSource={venue.ratingSource}
          ratingUrl={venue.ratingUrl ?? (venue.ratingSource === "Google" ? venue.mapsUrl : undefined)}
        />

        <p className="mt-2 text-sm leading-6 text-slate-600">{venue.description}</p>

        {venue.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {venue.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3">
          <OpeningHours hours={venue.hours} plannedWeekday={plannedWeekday} />
        </div>

        {(venue.entryPriceText || venue.musicStyle || venue.dressCode || venue.ageRequirement) && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {venue.entryPriceText && (
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <p className="text-slate-500">💰 الدخول</p>
                <p className="mt-0.5 font-semibold text-slate-800">{venue.entryPriceText}</p>
              </div>
            )}
            {venue.musicStyle && (
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <p className="text-slate-500">🎵 الموسيقى</p>
                <p className="mt-0.5 font-semibold text-slate-800">{venue.musicStyle}</p>
              </div>
            )}
            {venue.dressCode && (
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <p className="text-slate-500">👕 Dress code</p>
                <p className="mt-0.5 font-semibold text-slate-800">{venue.dressCode}</p>
              </div>
            )}
            {venue.ageRequirement && (
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <p className="text-slate-500">🔞 العمر</p>
                <p className="mt-0.5 font-semibold text-slate-800">{venue.ageRequirement}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-3">
          <LocationInfo area={venue.area} address={venue.address} mapsUrl={venue.mapsUrl} appleMapsUrl={venue.appleMapsUrl} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {websiteHref && (
            <ExternalLink
              href={websiteHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
            >
              {websiteLabel}
              <IconExternalLink className="h-3 w-3 opacity-60" />
            </ExternalLink>
          )}
          {venue.ticketUrl && (
            <ExternalLink
              href={venue.ticketUrl}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:border-amber-300"
            >
              🎟 التذاكر الرسمية
            </ExternalLink>
          )}
        </div>
      </div>
    </article>
  );
}
