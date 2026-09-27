"use client";

import { useState } from "react";
import SmartPlannerPlaceCard from "./SmartPlannerPlaceCard";
import SmartPlannerNearbyCard from "./SmartPlannerNearbyCard";
import SmartPlannerTransportConnector from "./SmartPlannerTransportConnector";
import PlaceDetailsSheet from "../guide/PlaceDetailsSheet";
import ExternalLink from "../guide/ExternalLink";
import { IconExternalLink } from "../icons";
import { buildAppleMapsDirectionsUrl, buildDirectionsUrl, resolvePlace, resolvePlannerPlace, summarizeResolvedPlace } from "../../lib/readyPlan";
import type { ResolvedPlace, ResolvedPlaceSummary } from "../../lib/readyPlan";
import { getBarcelonaPlannerMetadata } from "../../lib/planner/barcelona-planner-metadata";
import { getBarcelonaPlannerOperationalWarnings } from "../../lib/planner/barcelonaPlannerOperationalWarnings";
import type { PlannerDay } from "../../lib/planner/plannerDayBuilder";
import type { PlannerAccommodation } from "../../lib/planner/plannerTypes";
import type { PlannerRouteLeg } from "../../lib/planner/plannerTransportTypes";
import type { PlannerDayPresentation, PlannerOptionalSuggestionType } from "../../lib/planner/plannerPresentationTypes";
import type { Area, Attraction, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "../../lib/guideTypes";

type GuideData = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  nightlifeVenues: NightlifeVenue[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
};
type ResolvedStop = { placeId: string; resolved: ResolvedPlace };

const SUGGESTION_TYPE_LABEL: Record<PlannerOptionalSuggestionType, string> = {
  food: "🍴 أكل قريب",
  cafe: "☕ قهوة قريبة",
  nightlife: "🌙 سهرة قريبة",
  experience: "🎟️ تجربة قريبة",
  photo: "📸 زاوية تصوير",
  local: "🧭 مكان محلي",
};

/** placeId is unique across attractions/foodPlaces/experiences/nightlifeVenues — trying all 4 is a safe, side-effect-free lookup (resolvePlace just returns undefined on a miss). */
function resolveOptionalSuggestion(placeId: string, guide: GuideData): ResolvedPlace | undefined {
  return (
    resolvePlace(placeId, "attraction", guide) ??
    resolvePlace(placeId, "food", guide) ??
    resolvePlace(placeId, "experience", guide) ??
    resolvePlace(placeId, "nightlife", guide)
  );
}

/**
 * A synthetic `ResolvedPlaceSummary` for the customer's own accommodation text -- never a
 * real guide place, so no placeId/image/hours exist for it. `coordinates` and `address` are
 * intentionally omitted: `buildDirectionsUrl`/`buildAppleMapsDirectionsUrl` already fall back
 * to `"{name}, Barcelona, Spain"` for a summary with neither (see readyPlan.ts), which is
 * exactly the free-text-only resolution this V1 feature is designed around -- no geocoding,
 * no coordinates, ever invented here.
 */
function accommodationPlaceSummary(text: string): ResolvedPlaceSummary {
  return { id: "accommodation", name: text, categoryLabel: "مكان إقامتك" };
}

/**
 * Accommodation <-> stop dynamic map-link row. Never shows a duration (accommodation is
 * dynamic free text, never pre-verified against any transport pair) -- just two outbound
 * links built from the exact same URL builders the rest of the Ready Plan/Smart Planner
 * already use. "transit" is used as the link's mode param only (which tab Google/Apple Maps
 * opens to) -- a neutral default reasonable at any distance, never a claimed travel time.
 */
function AccommodationRouteRow({ label, from, to }: { label: string; from: ResolvedPlaceSummary; to: ResolvedPlaceSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3">
      <span className="text-xs font-bold text-teal-800">🏨 {label}</span>
      <div className="flex items-center gap-2">
        <ExternalLink
          href={buildDirectionsUrl(from, to, "transit")}
          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:border-teal-300"
        >
          خرائط جوجل
          <IconExternalLink className="h-3 w-3" />
        </ExternalLink>
        <ExternalLink
          href={buildAppleMapsDirectionsUrl(from, to, "transit")}
          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:border-teal-300"
        >
          خرائط أبل
          <IconExternalLink className="h-3 w-3" />
        </ExternalLink>
      </div>
    </div>
  );
}

/** Renders one Smart Planner day: presentation header, optional area summary, stop cards + transport connectors, optional nearby row. */
export default function SmartPlannerDay({
  day,
  legs,
  guide,
  guideSlug,
  presentation,
  accommodation,
}: {
  day: PlannerDay;
  legs: PlannerRouteLeg[];
  guide: GuideData;
  guideSlug: string;
  presentation: PlannerDayPresentation;
  /** Optional -- omitted when the customer didn't provide accommodation. Only ever used to
   * render the "من مكان إقامتك"/"رجوع لمكان إقامتك" dynamic map-link rows below; never
   * affects which stops are shown or their order (that's already fully decided upstream). */
  accommodation?: PlannerAccommodation;
}) {
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  // resolvePlannerPlace tries every guide-place type a main stop can actually be (attraction,
  // beach, shopping — see its own doc comment in readyPlan.ts), not just "attraction". Every
  // real planner placeId is expected to resolve; a miss is logged loudly rather than silently
  // dropped, so a future metadata/guide-data gap is caught in dev, not hidden from the user the
  // way this exact bug was before this fix (see this task's report for the root cause).
  const resolvedStops: ResolvedStop[] = day.stops
    .map((stop) => ({ placeId: stop.placeId, resolved: resolvePlannerPlace(stop.placeId, guide) }))
    .filter((entry): entry is ResolvedStop => {
      if (entry.resolved) return true;
      if (typeof console !== "undefined") {
        console.error(`Smart Planner: main stop "${entry.placeId}" did not resolve against any known guide collection (attraction/beach/shopping).`);
      }
      return false;
    });

  // Real, existing guide area names only — never the planner's internal cluster ids
  // (e.g. "eixample-north"). Attractions resolve a curated Area name; beaches carry their own
  // free-text `area` field; shopping areas have no comparable area field in the guide data, so
  // they simply don't contribute one here rather than inventing one. Omitted entirely if no
  // stop resolves to a named area.
  const areaNames = [
    ...new Set(
      resolvedStops
        .map(({ resolved }) => (resolved.type === "attraction" ? resolved.areaName : resolved.type === "beach" ? resolved.place.area : ""))
        .filter(Boolean)
    ),
  ];

  const resolvedNearby = presentation.optionalNearby
    .map((suggestion) => ({ suggestion, resolved: resolveOptionalSuggestion(suggestion.placeId, guide) }))
    .filter((entry): entry is { suggestion: (typeof presentation.optionalNearby)[number]; resolved: ResolvedPlace } => !!entry.resolved);

  const activeResolved = activePlaceId
    ? (resolvedStops.find((entry) => entry.placeId === activePlaceId)?.resolved ??
      resolvedNearby.find((entry) => entry.suggestion.placeId === activePlaceId)?.resolved)
    : undefined;

  return (
    <div>
      <p className="text-xs font-bold text-slate-400">اليوم {day.dayNumber}</p>
      <h2 dir="auto" className="mt-0.5 text-lg font-bold text-slate-900">
        {presentation.title}
      </h2>
      <p dir="auto" className="mt-1 text-sm text-slate-600">
        {presentation.summary}
      </p>
      {presentation.highlight && (
        <span className="mt-2 inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{presentation.highlight}</span>
      )}
      {areaNames.length > 0 && (
        <p dir="auto" className="mt-2 text-xs font-semibold text-slate-500">
          أهم المناطق: {areaNames.join(" · ")}
        </p>
      )}

      {accommodation && resolvedStops.length > 0 && (
        <div className="mt-4">
          <AccommodationRouteRow
            label="من مكان إقامتك"
            from={accommodationPlaceSummary(accommodation.text)}
            to={summarizeResolvedPlace(resolvedStops[0].resolved)}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col">
        {resolvedStops.map(({ placeId, resolved }, index) => {
          const summary = summarizeResolvedPlace(resolved);
          const metadata = getBarcelonaPlannerMetadata(placeId);
          const leg = legs[index - 1];
          const previousResolved = index > 0 ? resolvedStops[index - 1].resolved : undefined;

          return (
            <div key={placeId}>
              {leg && previousResolved && (
                <SmartPlannerTransportConnector leg={leg} from={summarizeResolvedPlace(previousResolved)} to={summary} />
              )}
              <SmartPlannerPlaceCard
                routeNumber={index + 1}
                summary={summary}
                areaName={resolved.type === "attraction" ? resolved.areaName : resolved.type === "beach" ? resolved.place.area : undefined}
                description={resolved.type === "attraction" || resolved.type === "shopping" ? resolved.place.description : resolved.type === "beach" ? resolved.place.vibe : undefined}
                visitDurationMinutes={metadata?.visitDurationMinutes}
                warnings={getBarcelonaPlannerOperationalWarnings(placeId)}
                onClick={() => setActivePlaceId(placeId)}
              />
            </div>
          );
        })}
      </div>

      {accommodation && resolvedStops.length > 0 && (
        <div className="mt-4">
          <AccommodationRouteRow
            label="رجوع لمكان إقامتك"
            from={summarizeResolvedPlace(resolvedStops[resolvedStops.length - 1].resolved)}
            to={accommodationPlaceSummary(accommodation.text)}
          />
        </div>
      )}

      {resolvedNearby.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-slate-500">اختياري قريب منك</p>
          <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {resolvedNearby.map(({ suggestion, resolved }) => (
              <SmartPlannerNearbyCard
                key={suggestion.placeId}
                summary={summarizeResolvedPlace(resolved)}
                typeLabel={SUGGESTION_TYPE_LABEL[suggestion.type]}
                reason={suggestion.reason}
                onClick={() => setActivePlaceId(suggestion.placeId)}
              />
            ))}
          </div>
        </div>
      )}

      <PlaceDetailsSheet guideSlug={guideSlug} resolved={activeResolved} open={!!activePlaceId} onClose={() => setActivePlaceId(null)} />
    </div>
  );
}
