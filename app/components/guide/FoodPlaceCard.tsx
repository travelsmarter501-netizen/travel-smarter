import Image from "next/image";
import { IconExternalLink, IconHeart } from "../icons";
import ExternalLink from "./ExternalLink";
import LocationInfo from "./LocationInfo";
import OpeningHours from "./OpeningHours";
import RatingBadge from "./RatingBadge";
import type { DietaryTag, FoodBadge, FoodPlace } from "../../lib/guideTypes";
import type { Weekday } from "../../lib/hours";

const dietaryIcons: Record<DietaryTag, string> = {
  "pork-maybe": "🐷",
  vegetarian: "🥬",
  vegan: "🌱",
  seafood: "🐟",
  meat: "🥩",
  coffee: "☕",
  dessert: "🍰",
};

const badgeLabels: Record<FoodBadge, string> = {
  "best-overall": "⭐ Best overall",
  "great-value": "💸 Great value",
  popular: "📸 Popular",
  "local-experience": "🥘 Local experience",
  trending: "🔥 Trending",
  "less-touristy": "🤫 Less touristy",
  "best-atmosphere": "🌅 Best atmosphere",
};

export default function FoodPlaceCard({
  place,
  isFavorite,
  onToggleFavorite,
  plannedWeekday,
}: {
  place: FoodPlace;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** See PlaceDetailsSheet.tsx's own doc comment. Omitted outside a dated itinerary. */
  plannedWeekday?: Weekday;
}) {
  const imageLinkHref = place.officialUrl ?? place.mapsUrl;
  const imageLinkLabel = place.officialUrl ? `افتح الموقع الرسمي لـ ${place.name}` : `افتح ${place.name} في خرائط جوجل`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ExternalLink
        href={imageLinkHref}
        aria-label={imageLinkLabel}
        className={`group relative block w-full cursor-pointer overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${place.image ? "aspect-[4/3]" : "h-20"}`}
      >
        {place.image ? (
          <Image
            src={place.image}
            alt={place.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            style={place.imagePosition ? { objectPosition: place.imagePosition } : undefined}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">
            <span className="text-xl">🍴</span>
            <span className="text-[11px] font-medium text-slate-400">بدون صورة موثقة</span>
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
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        >
          <IconHeart filled={isFavorite} className="h-4 w-4" />
        </button>
      </ExternalLink>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p dir="auto" className="text-sm font-bold text-slate-900">
            {place.name}
          </p>
          <span className="shrink-0 text-sm font-semibold text-teal-700">{place.priceLevel}</span>
        </div>

        {place.badges && place.badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {place.badges.map((badge) => (
              <span key={badge} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                {badgeLabels[badge]}
              </span>
            ))}
          </div>
        )}

        <RatingBadge
          rating={place.rating}
          reviewCount={place.reviewCount}
          ratingSource={place.ratingSource}
          ratingUrl={place.ratingUrl ?? (place.ratingSource === "Google" ? place.mapsUrl : undefined)}
          className="mt-1"
        />

        <p className="mt-2 text-sm leading-6 text-slate-600">{place.why}</p>

        {place.dietaryTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {place.dietaryTags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                {dietaryIcons[tag]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2">
          <OpeningHours hours={place.hours} plannedWeekday={plannedWeekday} />
        </div>

        <div className="mt-3">
          <LocationInfo area={place.area} address={place.address} phone={place.phone} mapsUrl={place.mapsUrl} appleMapsUrl={place.appleMapsUrl} />
        </div>

        {place.officialUrl && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ExternalLink
              href={place.officialUrl}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300"
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
