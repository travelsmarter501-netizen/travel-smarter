import { barcelonaGuide } from "./barcelona-guide";
import { resolvePlace, resolvePlannerPlace, summarizeResolvedPlace, type ResolvedPlace } from "./readyPlan";
import type { CustomPlanDraftStop, CustomPlanDraftStopKind } from "./customPlanDraft";
import type { CustomPlanFinalPlanData, CustomPlanFinalPlanDay } from "./customPlanFinalPlan";

/**
 * Custom Plan Admin Builder V1 -- resolves a draft stop's `placeId` back to real, current
 * Barcelona Guide data for display (name/category/address/image), instead of ever trusting
 * the stop's own stored `title` snapshot as authoritative. Pure/no side effects, safe to call
 * from a Server Component or the client editor's initial props alike.
 */

export type ResolvedStopDisplay = {
  placeId: string;
  name: string;
  categoryLabel: string;
  address?: string;
  image?: string;
  /** Real, curated links straight off the guide entry (see barcelona-guide.ts) -- never
   * constructed/guessed here, and never a directions URL (this is a single-place "open this
   * place" link, not a between-two-stops route). */
  mapsUrl?: string;
  appleMapsUrl?: string;
  area?: string;
  /** True only when the placeId no longer resolves against the current Barcelona Guide (e.g. a
   * guide entry was removed after this draft was generated/edited) -- the Mark Ready checklist
   * (customPlanAdmin.ts) blocks on this instead of guessing a resolution. */
  unresolved: boolean;
};

/** A stop counts as "unresolved" if `resolveStopDisplay` had to fall back to its own stored
 * title -- pulled out as its own constant so the Mark Ready checklist and the display resolver
 * can never silently drift apart on what "unresolved" means. */
const UNRESOLVED_CATEGORY_LABEL = "غير معروف بقاعدة البيانات الحالية";

function resolveStopPlace(stop: CustomPlanDraftStop): ResolvedPlace | undefined {
  if (stop.kind === "nightlife") return resolvePlace(stop.placeId, "nightlife", barcelonaGuide);
  if (stop.kind === "lunch" || stop.kind === "dinner") return resolvePlace(stop.placeId, "food", barcelonaGuide);
  return resolvePlannerPlace(stop.placeId, barcelonaGuide);
}

function areaForResolvedPlace(resolved: ResolvedPlace): string | undefined {
  if (resolved.type === "attraction") return resolved.areaName || undefined;
  if (resolved.type === "experience") return resolved.place.area;
  return undefined;
}

/** Falls back to the stop's own stored `title` (never invents a name) when the placeId no
 * longer resolves -- e.g. a guide entry was removed after this draft was generated/edited. */
export function resolveStopDisplay(stop: CustomPlanDraftStop): ResolvedStopDisplay {
  const resolved = resolveStopPlace(stop);
  if (!resolved) {
    return { placeId: stop.placeId, name: stop.title, categoryLabel: UNRESOLVED_CATEGORY_LABEL, unresolved: true };
  }
  const summary = summarizeResolvedPlace(resolved);
  const placeWithMaps = resolved.place as { mapsUrl?: string; appleMapsUrl?: string };
  return {
    placeId: stop.placeId,
    name: summary.name,
    categoryLabel: summary.categoryLabel,
    address: summary.address,
    image: summary.image,
    mapsUrl: placeWithMaps.mapsUrl,
    appleMapsUrl: placeWithMaps.appleMapsUrl,
    area: areaForResolvedPlace(resolved),
    unresolved: false,
  };
}

export type KnownPlaceOption = { placeId: string; name: string; kind: CustomPlanDraftStopKind };

/** Every real Barcelona Guide place an admin can add to a draft via "add a known place" --
 * plain public guide data (id + name), safe to pass straight to the client editor. `kind` is
 * a resolution hint only (which guide array a placeId belongs to); an admin can still label a
 * food-place stop as "lunch" or "dinner" freely in the editor. */
export function getKnownPlaceOptions(): KnownPlaceOption[] {
  const visits: KnownPlaceOption[] = [
    ...barcelonaGuide.attractions.map((place) => ({ placeId: place.id, name: place.name, kind: "visit" as const })),
    ...barcelonaGuide.beaches.map((place) => ({ placeId: place.id, name: place.name, kind: "visit" as const })),
    ...barcelonaGuide.shoppingAreas.map((place) => ({ placeId: place.id, name: place.name, kind: "visit" as const })),
    ...barcelonaGuide.experiences.map((place) => ({ placeId: place.id, name: place.name, kind: "visit" as const })),
  ];
  const foodOptions: KnownPlaceOption[] = barcelonaGuide.foodPlaces.map((place) => ({ placeId: place.id, name: place.name, kind: "lunch" as const }));
  const nightlifeOptions: KnownPlaceOption[] = barcelonaGuide.nightlifeVenues.map((place) => ({ placeId: place.id, name: place.name, kind: "nightlife" as const }));

  // De-duplicated by placeId, first occurrence wins (visits > food > nightlife) -- a handful of
  // guide entries legitimately exist in more than one array (e.g. barceloneta-beach is both a
  // real Attraction and a Beach, see readyPlan.ts's own MAIN_STOP_RESOLUTION_ORDER comment for
  // why). Without this, React rendered two <option> elements with the same key in the admin
  // editor's "add a known place" dropdown -- found live during Fulfillment V1 QA.
  const seen = new Set<string>();
  const deduped: KnownPlaceOption[] = [];
  for (const option of [...visits, ...foodOptions, ...nightlifeOptions]) {
    if (seen.has(option.placeId)) continue;
    seen.add(option.placeId);
    deduped.push(option);
  }

  return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Mark Ready checklist support ───────────────────────────────────────────────────────────

/** Every placeId across a draft that no longer resolves against the current Barcelona Guide --
 * computed here (the only module that ever touches barcelonaGuide for this purpose) and handed
 * to customPlanDraft.ts's validateCustomPlanDraftForReady, which has no guide dependency of its
 * own on purpose (see that file's header). */
export function getUnresolvedPlaceIds(days: { stops: CustomPlanDraftStop[] }[]): Set<string> {
  const unresolved = new Set<string>();
  for (const day of days) {
    for (const stop of day.stops) {
      if (resolveStopDisplay(stop).unresolved) unresolved.add(stop.placeId);
    }
  }
  return unresolved;
}

// ── Customer-facing final plan display resolution ──────────────────────────────────────────
// Resolves a FROZEN CustomPlanFinalPlanData (customPlanFinalPlan.ts) into a plain,
// already-resolved structure for rendering -- the shared component both the admin preview page
// and the real customer delivery page use (CustomPlanFinalPlanView) receives ONLY this output,
// never the raw Barcelona Guide dataset or a live draft/generator import, per the task's own
// "customer page receives only frozen final-plan payload" requirement.

export type CustomPlanFinalDisplayStop = {
  placeId: string;
  name: string;
  categoryLabel: string;
  address?: string;
  image?: string;
  mapsUrl?: string;
  appleMapsUrl?: string;
  area?: string;
  kind: CustomPlanDraftStopKind;
  startTime?: string | null;
  durationMinutes?: number | null;
  customerNote?: string | null;
};

export type CustomPlanFinalDisplayDay = {
  dayNumber: number;
  date: string | null;
  title: string;
  summary: string;
  stops: CustomPlanFinalDisplayStop[];
};

export function resolveFinalPlanDisplay(planData: CustomPlanFinalPlanData): CustomPlanFinalDisplayDay[] {
  return planData.days.map((day: CustomPlanFinalPlanDay) => ({
    dayNumber: day.dayNumber,
    date: day.date,
    title: day.title,
    summary: day.summary,
    stops: day.stops.map((stop) => {
      const display = resolveStopDisplay({ placeId: stop.placeId, title: stop.title, kind: stop.kind });
      return {
        placeId: stop.placeId,
        name: display.name,
        categoryLabel: display.categoryLabel,
        address: display.address,
        image: display.image,
        mapsUrl: display.mapsUrl,
        appleMapsUrl: display.appleMapsUrl,
        area: display.area,
        kind: stop.kind,
        startTime: stop.startTime,
        durationMinutes: stop.durationMinutes,
        customerNote: stop.customerNote,
      };
    }),
  }));
}
