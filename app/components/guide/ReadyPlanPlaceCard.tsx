import Image from "next/image";
import { IconArrowRight } from "../icons";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { ItineraryStop } from "../../lib/readyPlanTypes";

/**
 * Compact itinerary row: route number, image, name, category — no hours/price/rating/
 * address here. Tapping it opens the existing full place-details card (PlaceDetailsSheet).
 */
export default function ReadyPlanPlaceCard({
  routeNumber,
  summary,
  stop,
  onClick,
}: {
  routeNumber: number;
  summary: ResolvedPlaceSummary;
  stop: ItineraryStop;
  onClick: () => void;
}) {
  // `role`/`suggestedDuration` are short, deliberately-brief flavor text (e.g. "عشاء" · "90–150
  // دقيقة") and stay on one compact line together. `note` is kept SEPARATE -- unlike the other
  // two, it can be a genuinely long sentence (e.g. Camp Nou's Espai Barça renovation warning),
  // so it gets its own wrapping block below rather than being joined+truncated into the same
  // line, which used to hide most of it on narrow screens. Never shortened, never dropped.
  const meta = [stop.role, stop.suggestedDuration].filter(Boolean) as string[];

  return (
    <div className="flex items-start gap-3">
      <div className="flex w-8 flex-shrink-0 justify-center sm:w-9">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white sm:h-9 sm:w-9">
          {routeNumber}
        </span>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-right shadow-sm transition-shadow hover:shadow-md active:scale-[0.99] sm:p-3"
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-16">
          {summary.image ? (
            <Image
              src={summary.image}
              alt={summary.name}
              fill
              sizes="64px"
              style={summary.imagePosition ? { objectPosition: summary.imagePosition } : undefined}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-lg text-slate-400">
              📍
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p dir="auto" className="break-words text-sm font-bold leading-5 text-slate-900">
            {summary.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{summary.categoryLabel}</p>
          {meta.length > 0 && <p className="mt-1 truncate text-[11px] font-semibold text-teal-700">{meta.join(" · ")}</p>}
          {stop.note && <p dir="auto" className="mt-1.5 break-words text-[11px] leading-5 text-slate-500">{stop.note}</p>}
        </div>

        <IconArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 self-start rotate-180 text-slate-300" aria-hidden="true" />
      </button>
    </div>
  );
}
