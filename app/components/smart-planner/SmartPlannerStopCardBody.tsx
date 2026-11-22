"use client";

import { useState } from "react";
import Image from "next/image";
import { IconArrowRight, IconClock } from "../icons";
import { formatMinutes, nameDir, PLAN_TEXT, type PlanLanguage } from "../../lib/i18n/planText";
import { TimesText } from "./planDisplay";
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
  priceLevel?: string;
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
  outsideOnly,
  lang = "ar",
  compact,
  placeholderIcon,
}: {
  summary: ResolvedPlaceSummary;
  areaName?: string;
  description?: string;
  visitDurationMinutes?: number;
  warnings?: PlannerOperationalWarning[];
  onClick: () => void;
  priority?: boolean;
  foodMeta?: StopCardFoodMeta;
  /** The plan visits only the outside of this place (short stop). */
  outsideOnly?: boolean;
  /** Display language (plan view). V1 and other callers omit it = Arabic. */
  lang?: PlanLanguage;
  /**
   * Day screen (2026-11-22): a tighter card (smaller photo and padding) and, when the place has no photo, a neutral placeholder with
   * this icon instead of no picture at all, so the cards line up. Other callers omit both and render as before.
   */
  compact?: boolean;
  placeholderIcon?: string;
}) {
  // Photo state per URL (a new place in the same card starts again). A photo that FAILS (missing file, the image service refusing it)
  // is never retried and never replaced by another place's photo: the card shows the neutral tile instead (2026-11-22 review).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = summary.image || undefined;
  const loaded = !!image && loadedSrc === image;
  const failed = !!image && failedSrc === image;
  const ui = PLAN_TEXT[lang];
  const pageRtl = lang !== "en";
  // Two neutral tiles: no photo for this place (its type's icon), and a photo that could not load (🖼️ with a dashed border).
  const tileClass = `flex flex-shrink-0 items-center justify-center rounded-xl text-2xl ${compact ? "h-14 w-14" : "h-16 w-16"} ${failed ? "border border-dashed border-slate-300 bg-slate-50" : "bg-teal-50"}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white text-start shadow-sm transition-shadow hover:shadow-md active:scale-[0.99] ${compact ? "gap-2 p-2" : "gap-2.5 p-3"}`}
    >
      <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
        {(!image || failed) && (placeholderIcon || failed) && (
          // No photo, or the photo failed to load: a neutral tile with the place type's icon (never a photo of somewhere else).
          <div role="img" aria-label={failed ? ui.photoUnavailable : ui.noPhoto} title={failed ? ui.photoUnavailable : undefined} className={tileClass}>
            <span aria-hidden="true">{failed ? "🖼️" : placeholderIcon}</span>
          </div>
        )}
        {image && !failed && (
        <div className={`relative flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 ${compact ? "h-14 w-14" : "h-16 w-16"}`}>
          {image ? (
            <>
              {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
              <Image
                src={image}
                alt={summary.name}
                width={64}
                height={64}
                priority={priority}
                onLoad={() => setLoadedSrc(image)}
                onError={() => setFailedSrc(image)}
                // See this file's own history (SmartPlannerPlaceCard.tsx before extraction) for
                // why this exact width/height + callback-ref combination is required. An image that finished BEFORE hydration fired its
                // load / error event unseen: naturalWidth tells which (0 = failed).
                ref={(img) => {
                  if (!img?.complete) return;
                  if (img.naturalWidth > 0) setLoadedSrc(image);
                  else setFailedSrc(image);
                }}
                style={summary.imagePosition ? { objectPosition: summary.imagePosition } : undefined}
                className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            </>
          ) : (
            null
          )}
        </div>
        )}

        <div className="min-w-0 flex-1">
          {/* The name in its OWN direction (a long Latin name in an Arabic page is clamped at its own end, not cut at its start), aligned
              with the page so every card lines up. */}
          <p dir={nameDir(summary.name, lang)} style={{ textAlign: pageRtl ? "right" : "left" }} className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
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
                {foodMeta.cuisineLabel && <span>{foodMeta.cuisineLabel}</span>}
                {foodMeta.priceLevel && (
                  <>
                    {foodMeta.cuisineLabel && <span>·</span>}
                    <span>{foodMeta.priceLevel}</span>
                  </>
                )}
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
                {formatMinutes(lang, visitDurationMinutes)}
                {outsideOnly && <span className="ms-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">{PLAN_TEXT[lang].outsideOnly}</span>}
              </p>
            )
          )}
        </div>
        {/* Concise card (Rhyme-style): the whole card opens the details; a small arrow says so. */}
        <IconArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 rtl:rotate-180" aria-label={PLAN_TEXT[lang].placeDetails} />
      </div>

      {description && <p className="line-clamp-2 text-xs leading-5 text-slate-500"><TimesText text={description} /></p>}

      {warnings && warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {warnings.map((warning, index) => (
            <p key={index} dir="auto" className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold leading-5 text-amber-800">
              <TimesText text={warning.textAr} />
            </p>
          ))}
        </div>
      )}
    </button>
  );
}
