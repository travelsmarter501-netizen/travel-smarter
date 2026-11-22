"use client";

import { useState } from "react";
import Image from "next/image";
import { PLAN_TEXT, nameDir, type PlanLanguage } from "../../lib/i18n/planText";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";

/**
 * Day screen, Rhyme-style layout (owner, 2026-11-22; Travel Smarter colours). One row = a time pill on the rail + a card: the photo
 * with the stop number on it, the name on one line, short chips (duration, meal, "optional"). No sentences on the card: the plan's
 * notes for a place open with its details.
 */

/** Width of the rail (time pills, dashed line); the transport rows use the same. */
export const DAY_RAIL_WIDTH = "w-14";

/** The rail of one row: dashed line above and below a time pill (or only the line when there is no time). */
export function DayRail({ time, muted, first }: { time?: string; muted?: boolean; first?: boolean }) {
  return (
    <div className={`flex ${DAY_RAIL_WIDTH} shrink-0 flex-col items-center self-stretch`} aria-hidden={time ? undefined : true}>
      <span className={`w-px flex-1 border-r border-dashed ${first ? "border-transparent" : "border-slate-300"}`} />
      {time && (
        <span dir="ltr" className={`my-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${muted ? "border border-dashed border-slate-300 bg-white text-slate-500" : "bg-teal-50 text-teal-700"}`}>
          {time}
        </span>
      )}
      <span className="w-px flex-1 border-r border-dashed border-slate-300" />
    </div>
  );
}

export type DayChip = { label: string; icon?: string; tone: "time" | "food" | "muted" | "warn" };
const CHIP_TONE: Record<DayChip["tone"], string> = {
  time: "bg-teal-50 text-teal-700",
  food: "bg-orange-50 text-orange-700",
  muted: "bg-slate-100 text-slate-600",
  warn: "bg-amber-50 text-amber-800",
};

/** A stop of the day: photo (or a neutral tile) with its number, the name, chips. The whole card opens the place's details. */
export function DayStopCard({
  summary,
  number,
  chips,
  onClick,
  placeholderIcon,
  lang,
  priority,
  muted,
}: {
  summary: ResolvedPlaceSummary;
  /** The stop's number on the photo; 0 = none (an optional suggestion). */
  number: number;
  chips: DayChip[];
  /** Absent: the card does not open anything (a lunch break without a place). */
  onClick?: () => void;
  placeholderIcon: string;
  lang: PlanLanguage;
  priority?: boolean;
  /** An optional suggestion: lighter card. */
  muted?: boolean;
}) {
  const ui = PLAN_TEXT[lang];
  // Photo state per URL: a failed photo is never retried and never replaced by another place's photo (neutral tile instead).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = summary.image || undefined;
  const loaded = !!image && loadedSrc === image;
  const failed = !!image && failedSrc === image;
  const pageRtl = lang !== "en";
  const body = (
    <>
      <div className="relative h-16 w-16 shrink-0">
        {image && !failed ? (
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100">
            {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
            <Image
              src={image}
              alt={summary.name}
              width={64}
              height={64}
              priority={priority}
              onLoad={() => setLoadedSrc(image)}
              onError={() => setFailedSrc(image)}
              ref={(img) => {
                if (!img?.complete) return;
                if (img.naturalWidth > 0) setLoadedSrc(image);
                else setFailedSrc(image);
              }}
              style={summary.imagePosition ? { objectPosition: summary.imagePosition } : undefined}
              className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        ) : (
          <div role="img" aria-label={failed ? ui.photoUnavailable : ui.noPhoto} className={`flex h-full w-full items-center justify-center rounded-xl text-2xl ${failed ? "border border-dashed border-slate-300 bg-slate-50" : "bg-teal-50"}`}>
            <span aria-hidden="true">{failed ? "🖼️" : placeholderIcon}</span>
          </div>
        )}
        {number > 0 && (
          <span className="absolute -top-1.5 start-[-6px] flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-[11px] font-bold text-white ring-2 ring-white">
            {number}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {/* The name in its own direction (a Latin name in an Arabic page ends with "…" at its own end), aligned with the page. */}
        <p dir={nameDir(summary.name, lang)} style={{ textAlign: pageRtl ? "right" : "left" }} className="truncate text-[15px] font-bold leading-snug text-slate-900">
          {summary.name}
        </p>
        {chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map((chip, index) => (
              <span key={index} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${CHIP_TONE[chip.tone]}`}>
                {chip.icon && <span aria-hidden="true">{chip.icon}</span>}
                <span dir="auto">{chip.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
  const cardClass = `flex w-full items-center gap-3 rounded-2xl border p-2.5 text-start shadow-sm ${muted ? "border-dashed border-slate-300 bg-slate-50/80" : "border-slate-200 bg-white"}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cardClass} transition-shadow hover:shadow-md active:scale-[0.99]`}>
      {body}
    </button>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}
