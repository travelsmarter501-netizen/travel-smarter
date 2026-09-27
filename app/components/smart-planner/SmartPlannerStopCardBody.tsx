"use client";

import { useState } from "react";
import Image from "next/image";
import { IconArrowRight, IconClock } from "../icons";
import { formatMinutesAr } from "../../lib/readyPlan";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { PlannerOperationalWarning } from "../../lib/planner/barcelonaPlannerOperationalWarnings";

/**
 * Redesign Food Stops + Timeline UI -- the shared CARD CONTENT for one itinerary stop: image,
 * name, area/duration-or-food-meta line, description, warnings, "تفاصيل المكان". Deliberately
 * carries NO route number and NO time label of its own -- both now live in the caller's own
 * timeline rail (see SmartPlannerV2Day.tsx), never duplicated inside the card. Extracted out of
 * SmartPlannerPlaceCard.tsx so a real Guide restaurant/café can render with the EXACT SAME
 * visual chrome as a real attraction (per this task's own "food places must look like normal
 * itinerary stops" requirement) -- SmartPlannerPlaceCard (still used by V1 and MustSeeSelector,
 * which have no timeline rail) now wraps this body with its own number-circle, byte-identical
 * to its pre-existing output.
 *
 * `foodMeta` (optional): when set, this is a food stop -- shows a small category badge
 * (🍳 فطور / ☕ كافيه / 🍽️ غداء / 🍢 تاباس / 🌙 عشاء) plus a compact "cuisine · price · rating"
 * line, in place of the attraction-style duration line. The badge is deliberately secondary
 * (small, muted) -- the card itself is still a normal, first-class stop.
 */

export type StopCardFoodMeta = {
  mealTypeIcon: string;
  mealTypeLabel: string;
  cuisineLabel: string;
  priceLevel: string;
  rating?: number;
};

export default function SmartPlannerStopCardBody({
  summary,
  areaName,
  description,
  visitDurationMinutes,
  warnings,
  onClick,
  priority,
  foodMeta,
}: {
  summary: ResolvedPlaceSummary;
  areaName?: string;
  description?: string;
  visitDurationMinutes?: number;
  warnings?: PlannerOperationalWarning[];
  onClick: () => void;
  priority?: boolean;
  foodMeta?: StopCardFoodMeta;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-1 flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-right shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {summary.image ? (
            <>
              {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
              <Image
                src={summary.image}
                alt={summary.name}
                width={64}
                height={64}
                priority={priority}
                onLoad={() => setLoaded(true)}
                // See this file's own history (SmartPlannerPlaceCard.tsx before extraction) for
                // why this exact width/height + callback-ref combination is required.
                ref={(img) => {
                  if (img?.complete) setLoaded(true);
                }}
                style={summary.imagePosition ? { objectPosition: summary.imagePosition } : undefined}
                className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-lg text-slate-400">📍</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p dir="auto" className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
            {summary.name}
          </p>
          {areaName && (
            <p dir="auto" className="mt-0.5 truncate text-xs text-slate-500">
              {areaName}
            </p>
          )}
          {foodMeta ? (
            <>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                <span>
                  {foodMeta.mealTypeIcon} {foodMeta.mealTypeLabel}
                </span>
              </p>
              <p dir="auto" className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-slate-500">
                <span>{foodMeta.cuisineLabel}</span>
                <span>·</span>
                <span>{foodMeta.priceLevel}</span>
                {typeof foodMeta.rating === "number" && (
                  <>
                    <span>·</span>
                    <span>⭐ {foodMeta.rating.toFixed(1)}</span>
                  </>
                )}
              </p>
            </>
          ) : (
            visitDurationMinutes !== undefined && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                <IconClock className="h-3 w-3" />
                {formatMinutesAr(visitDurationMinutes)}
              </p>
            )
          )}
        </div>
      </div>

      {description && <p className="line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>}

      {warnings && warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {warnings.map((warning, index) => (
            <p key={index} dir="auto" className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold leading-5 text-amber-800">
              {warning.textAr}
            </p>
          ))}
        </div>
      )}

      <span className="flex items-center gap-1 self-start text-xs font-bold text-teal-700">
        تفاصيل المكان
        <IconArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
      </span>
    </button>
  );
}
