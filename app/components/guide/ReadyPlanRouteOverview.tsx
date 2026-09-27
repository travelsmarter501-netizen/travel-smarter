import { IconChevronDown } from "../icons";
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

/**
 * Compact, non-geographic route summary — just the selected day's stops in order,
 * e.g. "1 Sagrada Família › 2 Sant Pau › 3 Park Güell". This is NOT a map and must
 * never imply real geographic positioning; it's a secondary scan aid above the
 * primary vertical itinerary.
 */
export default function ReadyPlanRouteOverview({ day, guide }: { day: ReadyPlanDay; guide: GuideData }) {
  const stops = day.stops
    .map((stop) => resolvePlace(stop.placeId, stop.placeType, guide))
    .filter((resolved) => !!resolved)
    .map((resolved) => summarizeResolvedPlace(resolved));

  if (stops.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stops.map((stop, index) => (
          <div key={stop.id} className="flex shrink-0 items-center gap-1.5">
            {index > 0 && <IconChevronDown className="h-3 w-3 shrink-0 -rotate-90 text-slate-300" aria-hidden="true" />}
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span dir="auto" className="max-w-28 truncate text-xs font-semibold text-slate-700">
                {stop.name}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
