"use client";

import { useState } from "react";
import Image from "next/image";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";

/**
 * Compact "اختياري قريب منك" suggestion card — image, type label, name, short reason only.
 * Full address/hours/rating appear after click, in the shared PlaceDetailsSheet — never here.
 *
 * Image sizing: `width={144} height={80}` (matching the card's fixed `w-36` box exactly) rather
 * than `fill` + `sizes="144px"` — see SmartPlannerPlaceCard.tsx's own comment for the exact
 * Next.js srcset behavior this avoids (a literal "144px" sizes value, with no "vw" unit,
 * otherwise makes Next offer every configured size up to 3840px as a srcset candidate).
 */
export default function SmartPlannerNearbyCard({
  summary,
  typeLabel,
  reason,
  onClick,
}: {
  summary: ResolvedPlaceSummary;
  typeLabel: string;
  reason?: string;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-36 shrink-0 flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 text-right transition-colors hover:border-teal-300"
    >
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-100">
        {summary.image ? (
          <>
            {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
            <Image
              src={summary.image}
              alt={summary.name}
              width={144}
              height={80}
              onLoad={() => setLoaded(true)}
              // See SmartPlannerPlaceCard.tsx's identical comment: catches an image that was
              // already complete (e.g. served from cache) before onLoad could ever fire.
              ref={(img) => {
                if (img?.complete) setLoaded(true);
              }}
              style={summary.imagePosition ? { objectPosition: summary.imagePosition } : undefined}
              className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">📍</div>
        )}
      </div>
      <span className="text-[10px] font-bold text-teal-700">{typeLabel}</span>
      <span dir="auto" className="line-clamp-1 text-xs font-bold text-slate-800">
        {summary.name}
      </span>
      {reason && (
        <span dir="auto" className="line-clamp-2 text-[11px] leading-4 text-slate-500">
          {reason}
        </span>
      )}
    </button>
  );
}
