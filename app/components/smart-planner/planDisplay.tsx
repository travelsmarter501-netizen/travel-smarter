"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PLACE_CARD_TEXT, type PlanLanguage } from "../../lib/i18n/planText";

/**
 * Display options of the plan view, per destination (2026-11-16). Opt-in, so every other city (and the guide pages, which have no
 * provider) renders exactly as before:
 * - isolateTimes: times inside texts ("13:30", "10:00–18:00", ":15") are shown as isolated left-to-right runs, so an Arabic «و» or a
 *   Hebrew prefix next to them cannot reorder them. Display only: the stored texts are not changed.
 * - photoCreditLinks: a place card with a photo shows its author and licence, linked to that photo's entry on /photo-credits.
 */
export type PlanDisplayOptions = { isolateTimes: boolean; photoCreditLinks: boolean };
const NONE: PlanDisplayOptions = { isolateTimes: false, photoCreditLinks: false };
const BY_DESTINATION: Record<string, PlanDisplayOptions> = { budapest: { isolateTimes: true, photoCreditLinks: true } };

const PlanDisplayContext = createContext<PlanDisplayOptions>(NONE);

export function PlanDisplayProvider({ destination, children }: { destination: string; children: ReactNode }) {
  return <PlanDisplayContext.Provider value={BY_DESTINATION[destination] ?? NONE}>{children}</PlanDisplayContext.Provider>;
}

export function usePlanDisplay(): PlanDisplayOptions {
  return useContext(PlanDisplayContext);
}

/**
 * A number range ("9–16", "13:30–17:30", "24–25", "1.5–3": the dash between two numbers is direction-neutral and flips in RTL), a time
 * ("9:00"), or a minute mark (":15"). No lookbehind (older iOS Safari has none): the alternatives are tried left to right, so "13:15" is
 * matched whole before ":15" could match a bare minute mark.
 */
const TIME = /(\d+(?:[.:]\d+)?\s?[–-]\s?\d+(?:[.:]\d+)?|\d{1,2}:\d{2}|:\d{2}(?!\d))/g;

/** A text whose times keep their own direction (with isolateTimes); otherwise the text itself, unchanged. */
export function TimesText({ text }: { text: string | undefined | null }) {
  const { isolateTimes } = usePlanDisplay();
  if (!text) return null;
  if (!isolateTimes) return <>{text}</>;
  const parts = text.split(TIME);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Photo credit under a place photo (with photoCreditLinks): author · licence, linked to the photo's entry on the credits page. */
export function PhotoCreditLink({ placeId, author, license, lang }: { placeId: string; author?: string; license?: string; lang: PlanLanguage }) {
  const { photoCreditLinks } = usePlanDisplay();
  if (!photoCreditLinks || !author) return null;
  return (
    <a
      href={`/photo-credits#photo-${placeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-4 pt-2 text-[11px] leading-4 text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
    >
      📷 {PLACE_CARD_TEXT[lang].photoCredit}:{" "}
      <bdi dir="ltr">
        {author}
        {license ? ` · ${license}` : ""}
      </bdi>
    </a>
  );
}
