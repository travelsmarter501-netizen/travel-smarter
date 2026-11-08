import Image from "next/image";
import CardFavoriteButton from "./CardFavoriteButton";
import { IconExternalLink, IconHeart } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { Experience } from "../../lib/guideTypes";
import type { Weekday } from "../../lib/hours";
import { PLACE_CARD_TEXT, type PlanLanguage } from "../../lib/i18n/planText";

export default function ExperienceCard({
  experience,
  isFavorite,
  onToggleFavorite,
  plannedWeekday,
  lang = "ar",
}: {
  experience: Experience;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** See PlaceDetailsSheet.tsx's own doc comment. Omitted outside a dated itinerary. */
  plannedWeekday?: Weekday;
  /** Display language (plan view); the guide pages omit it and stay Arabic. */
  lang?: PlanLanguage;
}) {
  const ui = PLACE_CARD_TEXT[lang];
  const websiteHref = experience.bookingUrl ?? experience.officialUrl;
  const imageLinkHref = websiteHref ?? experience.mapsUrl;
  const imageLinkLabel = websiteHref ? ui.openBooking(experience.name) : ui.openMaps(experience.name);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {imageLinkHref && experience.image ? (
        <ExternalLink
          href={imageLinkHref}
          aria-label={imageLinkLabel}
          className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {experience.image ? (
            <Image
              src={experience.image}
              alt={experience.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              style={experience.imagePosition ? { objectPosition: experience.imagePosition } : undefined}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <span className="text-2xl">🔥</span>
              <span className="text-[11px] font-medium">{ui.noImage}</span>
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
            aria-label={isFavorite ? ui.favoriteRemove : ui.favoriteAdd}
            className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
          >
            <IconHeart filled={isFavorite} className="h-4 w-4" />
          </button>
        </ExternalLink>
      ) : null}
      <div className={`relative flex flex-1 flex-col p-4 ${imageLinkHref && experience.image ? "" : "pl-14"}`}>
        {!(imageLinkHref && experience.image) && <CardFavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} addLabel={ui.favoriteAdd} removeLabel={ui.favoriteRemove} />}
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p dir="auto" className="text-sm font-bold text-slate-900">
            {experience.name}
          </p>
          <span className="text-sm font-semibold text-teal-700">
            {experience.priceVaries ? `${experience.priceText}` : experience.priceText}
          </span>
        </div>

        <RatingBadge lang={lang}
          rating={experience.rating}
          reviewCount={experience.reviewCount}
          ratingSource={experience.ratingSource}
          ratingUrl={experience.ratingUrl ?? (experience.ratingSource === "Google" ? experience.mapsUrl : undefined)}
          className="mt-1"
        />

        <p className="mt-2 text-sm leading-6 text-slate-600">{experience.description}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {experience.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {experience.duration && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
              <p className="text-slate-500">{ui.duration}</p>
              <p className="mt-0.5 font-semibold text-slate-800">{experience.duration}</p>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="text-slate-500">{ui.booking}</p>
            <p className="mt-0.5 font-semibold text-slate-800">{experience.bookingRequired ? ui.bookingRequired : ui.bookingUsuallyNot}</p>
          </div>
          {experience.ageRequirement && (
            <div className="rounded-lg bg-slate-50 px-2.5 py-2">
              <p className="text-slate-500">{ui.age}</p>
              <p className="mt-0.5 font-semibold text-slate-800">{experience.ageRequirement}</p>
            </div>
          )}
          {experience.priceVaries && (
            <div className="rounded-lg bg-amber-50 px-2.5 py-2">
              <p className="text-amber-700">{ui.priceVaries}</p>
              <p className="mt-0.5 font-semibold text-amber-800">{ui.priceVariesNote}</p>
            </div>
          )}
        </div>

        {experience.hours && (
          <div className="mt-3">
            <OpeningHours lang={lang} hours={experience.hours} plannedWeekday={plannedWeekday} />
          </div>
        )}

        {experience.mapsUrl && experience.appleMapsUrl && (
          <div className="mt-3">
            <LocationInfo lang={lang} area={experience.area} address={experience.address} mapsUrl={experience.mapsUrl} appleMapsUrl={experience.appleMapsUrl} />
          </div>
        )}

        {(experience.officialUrl || experience.bookingUrl) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {experience.officialUrl && (
              <ExternalLink
                href={experience.officialUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
              >
                {ui.official}
                <IconExternalLink className="h-3 w-3 opacity-60" />
              </ExternalLink>
            )}
            {experience.bookingUrl && (
              <ExternalLink
                href={experience.bookingUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:border-amber-300"
              >
                {ui.bookNow}
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
