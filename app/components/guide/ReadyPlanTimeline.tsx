"use client";

import { useState } from "react";
import ReadyPlanPlaceCard from "./ReadyPlanPlaceCard";
import RouteLegConnector from "./RouteLegConnector";
import PlaceDetailsSheet from "./PlaceDetailsSheet";
import { resolvePlace, summarizeResolvedPlace } from "../../lib/readyPlan";
import type { ReadyPlanDay } from "../../lib/readyPlanTypes";
import type { Area, Attraction, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "../../lib/guideTypes";

type GuideData = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
  nightlifeVenues?: NightlifeVenue[];
};

export default function ReadyPlanTimeline({ day, guide, guideSlug }: { day: ReadyPlanDay; guide: GuideData; guideSlug: string }) {
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);

  const resolvedStops = day.stops.map((stop) => ({ stop, resolved: resolvePlace(stop.placeId, stop.placeType, guide) }));
  const resolvedNearby = (day.optionalNearby ?? []).map((nearby) => resolvePlace(nearby.placeId, nearby.placeType, guide));
  const activeResolved = activePlaceId
    ? (resolvedStops.find(({ resolved }) => resolved?.place.id === activePlaceId)?.resolved ??
      resolvedNearby.find((resolved) => resolved?.place.id === activePlaceId))
    : undefined;

  return (
    <div>
      <div className="flex flex-col">
        {resolvedStops.map(({ stop, resolved }, index) => {
          if (!resolved) return null;
          const summary = summarizeResolvedPlace(resolved);
          const leg = day.legs[index - 1];
          const previousResolved = index > 0 ? resolvedStops[index - 1].resolved : undefined;

          return (
            <div key={stop.placeId}>
              {leg && previousResolved && (
                <RouteLegConnector
                  leg={leg}
                  from={summarizeResolvedPlace(previousResolved)}
                  to={summary}
                />
              )}
              <ReadyPlanPlaceCard
                routeNumber={index + 1}
                summary={summary}
                stop={stop}
                onClick={() => setActivePlaceId(summary.id)}
              />
            </div>
          );
        })}
      </div>

      {day.optionalNearby && day.optionalNearby.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-slate-500">اختياري قريب منك</p>
          <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {resolvedNearby.map((resolved) => {
              if (!resolved) return null;
              const summary = summarizeResolvedPlace(resolved);
              return (
                <button
                  key={summary.id}
                  type="button"
                  onClick={() => setActivePlaceId(summary.id)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-teal-300"
                >
                  <span dir="auto">{summary.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{summary.categoryLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PlaceDetailsSheet guideSlug={guideSlug} resolved={activeResolved} open={!!activePlaceId} onClose={() => setActivePlaceId(null)} />
    </div>
  );
}
