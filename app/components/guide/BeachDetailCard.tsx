import Image from "next/image";
import { IconHeart } from "../icons";
import LocationInfo from "./LocationInfo";
import RatingBadge from "./RatingBadge";
import type { Beach } from "../../lib/guideTypes";

const CROWD_LABELS: Record<Beach["crowdLevel"], string> = {
  low: "🟢 هادئ",
  medium: "🟡 متوسط",
  high: "🔴 مزدحم",
};

/**
 * Single-place detail card for a `Beach` — same visual/data pattern as AttractionCard,
 * ExperienceCard, etc., reusing the exact fields BeachesGrid.tsx already renders in its grid
 * tiles (name overlay, rating, vibe, bestFor tags, crowd level, tip, location). Real guide data
 * only — never invents hours/price this type doesn't have. Named "BeachDetailCard" (not
 * "BeachCard") to stay distinct from BeachesGrid's own internal per-tile rendering.
 */
export default function BeachDetailCard({ beach, isFavorite, onToggleFavorite }: { beach: Beach; isFavorite: boolean; onToggleFavorite: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] w-full bg-slate-100">
        {beach.image ? (
          <Image
            src={beach.image}
            alt={beach.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            style={beach.imagePosition ? { objectPosition: beach.imagePosition } : undefined}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
            <span className="text-2xl">🏖️</span>
            <span className="text-[11px] font-medium">لا توجد صورة موثقة</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
        >
          <IconHeart filled={isFavorite} className="h-4.5 w-4.5" />
        </button>
        <p dir="ltr" className="absolute bottom-2.5 right-3 text-base font-bold text-white drop-shadow">
          {beach.name}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <RatingBadge rating={beach.rating} reviewCount={beach.reviewCount} ratingSource={beach.ratingSource} ratingUrl={beach.ratingUrl ?? (beach.ratingSource === "Google" ? beach.mapsUrl : undefined)} />
        <p className={`text-sm leading-6 text-slate-600 ${beach.rating ? "mt-1" : ""}`}>{beach.vibe}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {beach.bestFor.map((label) => (
            <span key={label} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {label}
            </span>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-500">{CROWD_LABELS[beach.crowdLevel]}</p>

        <div className="mt-3 rounded-xl bg-teal-50 p-3">
          <p className="text-xs font-bold text-teal-800">Travel Smarter Tip</p>
          <p className="mt-1 text-xs leading-5 text-teal-700">{beach.tip}</p>
        </div>

        <div className="mt-3">
          <LocationInfo area={beach.area} address={beach.address} mapsUrl={beach.mapsUrl} appleMapsUrl={beach.appleMapsUrl} label="نقطة الوصول" />
        </div>
      </div>
    </article>
  );
}
