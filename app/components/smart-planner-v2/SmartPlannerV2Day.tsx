"use client";

import { Fragment, useState } from "react";
import SmartPlannerStopCardBody from "../smart-planner/SmartPlannerStopCardBody";
import SmartPlannerTransportConnector from "../smart-planner/SmartPlannerTransportConnector";
import SmartPlannerNearbyCard from "../smart-planner/SmartPlannerNearbyCard";
import PlaceDetailsSheet from "../guide/PlaceDetailsSheet";
import { buildUnifiedTimelineEntries, type UnifiedTimelineEntry } from "../../lib/planner/v2TimelineItems";
import { PLAN_TEXT, formatDayHeader, formatMealCount, formatPlaceCount, storedTextDir, type PlanLanguage } from "../../lib/i18n/planText";
import { formatTimelineClock } from "../../lib/planner/barcelonaV2Timeline";
import type { ResolvedPlace } from "../../lib/readyPlan";
import type { V2Day } from "../../lib/planner/barcelonaV2Resolve";
import type { V2MealStop } from "../../lib/planner/barcelonaV2MealStops";
import type { V2FoodSuggestion } from "../../lib/planner/barcelonaV2Supplementary";
import type { PlannerRouteLeg } from "../../lib/planner/plannerTransportTypes";
import type { PlannerOptionalSuggestion } from "../../lib/planner/plannerPresentationTypes";

/**
 * Smart Planner V2 -- renders one already-fully-resolved day as ONE unified, numbered, vertical
 * timeline (Redesign Food Stops + Timeline UI): every real scheduled stop -- attraction OR food
 * place -- gets the SAME card body (SmartPlannerStopCardBody) and the SAME sequential number, in
 * a rail running down the right side (RTL) carrying the time label + numbered dot + connecting
 * line. A restaurant is no longer a separate, unnumbered, dashed "Meal Stop" card floating below
 * the itinerary -- it visually belongs to the route, exactly like Sagrada Família or Camp Nou.
 *
 * `buildUnifiedTimelineEntries` (v2TimelineItems.ts) does the merge -- `day.stops`/`day.mealStops`
 * stay exactly as separate internally as before (Day Builder, Natural Reclaim, Cross-Day, density
 * are all untouched); this is presentation normalization computed at render time from already-
 * frozen data, so an OLD saved plan (no `mealStops`/`timeline`) renders the exact same numbered
 * main-stop-only sequence it always did.
 *
 * Fix Place Details Opening From Generated Plans: every card's "تفاصيل المكان" tap opens the SAME
 * `PlaceDetailsSheet` used throughout the Guide -- attractions and food stops alike, never a
 * second details UI.
 */

// Restore Previous Place Card Layout, Keep Side Timeline Time: kept as narrow as the time label
// can fit (two stacked lines, e.g. "08:00" / "08:45") so the card next to it keeps as much width
// as possible on a 375px screen -- was "w-16 sm:w-20" (a single-line "08:00–08:45" label), which
// squeezed the card enough to truncate long place names.
const RAIL_WIDTH = "w-11 sm:w-12";

// Labels for the optional-suggestion types and meal types come from PLAN_TEXT[lang] (lib/i18n/planText.ts).
const MEAL_TYPE_ICON: Record<V2MealStop["mealType"], string> = {
  breakfast: "🍳",
  lunch: "🍽️",
  tapas: "🍢",
  dinner: "🌙",
};
type SuggestionType = PlannerOptionalSuggestion["type"];
type FoodMeal = V2FoodSuggestion["mealType"];

/** A numbered stop's own rail segment: time label + numbered dot + connecting line stub. The
 * line is a `flex-1` element so it stretches to fill this row's full height, matching the
 * card's height beside it -- same proven pattern as the transport connector's own rail. */
function TimelineRail({ number, timeRange }: { number: number; timeRange?: string }) {
  // Stacked start/end (rather than one "08:00–08:45" line) so the column stays narrow -- both
  // halves of a timeRange are always 5 characters ("HH:MM"), easily fitting RAIL_WIDTH two-line.
  const [startLabel, endLabel] = timeRange ? timeRange.split("–") : [undefined, undefined];
  return (
    <div className={`flex ${RAIL_WIDTH} flex-shrink-0 flex-col items-center`}>
      {timeRange && (
        <div dir="ltr" className="flex flex-col items-center text-center text-[10px] font-bold leading-tight text-slate-500">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
      <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">{number}</span>
      <span className="mt-1 w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
    </div>
  );
}

export default function SmartPlannerV2Day({
  day,
  guideSlug,
  placeDetails,
  lang = "ar",
}: {
  day: V2Day;
  guideSlug: string;
  /** Optional -- absent on an old saved plan frozen before this field existed. Undefined is
   * treated identically to an empty map, never crashes (see this file's own header comment). */
  placeDetails?: Record<string, ResolvedPlace>;
  /** Display language. The day passed in is already the translated display copy (localizePlan). */
  lang?: PlanLanguage;
}) {
  const ui = PLAN_TEXT[lang];
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const activeResolved = activePlaceId ? placeDetails?.[activePlaceId] : undefined;

  const fallbackLeg = (fromPlaceId: string, toPlaceId: string): PlannerRouteLeg => ({
    fromPlaceId,
    toPlaceId,
    recommendedMode: null,
    options: [],
    sourceStatus: "unresolved",
  });

  const entries = buildUnifiedTimelineEntries(day);
  const idOf = (entry: UnifiedTimelineEntry): string | null => (entry.kind === "place" ? entry.place.id : entry.kind === "meal" ? entry.meal.id : null);

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">
        {ui.dayTab(day.dayNumber)}
        {day.actualDate && day.weekday && <span className="font-semibold text-slate-500"> — {formatDayHeader(lang, day.actualDate, day.weekday)}</span>}
      </h2>
      <p dir={storedTextDir(day.title, lang)} className="mt-1 text-base font-semibold text-slate-800">{day.title}</p>
      <p dir={storedTextDir(day.summary, lang)} className="mt-1 text-sm text-slate-600">{day.summary}</p>
      {day.highlight && <p dir={storedTextDir(day.highlight, lang)} className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">{day.highlight}</p>}

      {/* Day summary -- start/finish clock, place/meal counts, a transport-mode summary ONLY
          when every leg on this day is actually resolved (never a fake total when some legs are
          unresolved). Omitted entirely on an old saved plan with no `timeline` field. */}
      {day.timeline && day.stops.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <span>
            {ui.dayStart} <bdi dir="ltr">{formatTimelineClock(day.timeline.dayStartMinutes)}</bdi> · {ui.dayEnd} <bdi dir="ltr">{formatTimelineClock(day.timeline.dayEndMinutes)}</bdi>
            {day.timeline.approximate && <span className="text-slate-400"> {ui.approximate}</span>}
          </span>
          <span>📍 {formatPlaceCount(lang, day.stops.length)}</span>
          {(day.mealStops?.length ?? 0) > 0 && <span>🍽️ {formatMealCount(lang, day.mealStops!.length)}</span>}
          {(() => {
            const resolvedLegs = day.legs.filter((leg) => leg.sourceStatus !== "unresolved" && leg.recommendedMode);
            if (day.legs.length === 0 || resolvedLegs.length !== day.legs.length) return null;
            const totalMinutes = resolvedLegs.reduce((sum, leg) => {
              const option = leg.options.find((o) => o.mode === leg.recommendedMode);
              return option ? sum + Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : sum;
            }, 0);
            const walkingCount = resolvedLegs.filter((l) => l.recommendedMode === "walking").length;
            const dominantIcon = walkingCount >= resolvedLegs.length / 2 ? "🚶" : "🚇";
            return (
              <span>
                {dominantIcon} {ui.totalTransit(totalMinutes)}
              </span>
            );
          })()}
        </div>
      )}

      <div className="mt-4">
        {entries.map((entry, i) => {
          const next = entries[i + 1];
          const needsConnector = !!next && entry.kind !== "freeTime" && next.kind !== "freeTime";
          const leg =
            needsConnector && next
              ? entry.kind === "place" && next.kind === "place" && next.stopIndex === entry.stopIndex + 1
                ? (day.legs[entry.stopIndex] ?? fallbackLeg(entry.place.id, next.place.id))
                : (() => {
                    // Fix Meal-Adjacent Transport Connectors: any pair touching a meal stop on
                    // either side falls here (never a consecutive place->place pair, handled
                    // above via day.legs). day.mealLegs holds the SAME verified-table lookup
                    // (see barcelonaV2Resolve.ts's buildMealAdjacentLegs) precomputed server-side
                    // for every such pair; only truly unresolved pairs fall through to fallbackLeg.
                    const fromId = idOf(entry);
                    const toId = idOf(next);
                    if (!fromId || !toId) return null;
                    return day.mealLegs?.[`${fromId}::${toId}`] ?? fallbackLeg(fromId, toId);
                  })()
              : null;
          const fromSummary = entry.kind === "place" ? entry.place : entry.kind === "meal" ? entry.meal : null;
          const toSummary = next && next.kind === "place" ? next.place : next && next.kind === "meal" ? next.meal : null;
          const key = entry.kind === "freeTime" ? `free-${entry.block.startMinutes}` : `${entry.kind}-${idOf(entry)}-${entry.number}`;

          return (
            <Fragment key={key}>
              <div className="flex items-stretch gap-2">
                {entry.kind === "freeTime" ? (
                  <>
                    <div className={`flex ${RAIL_WIDTH} flex-shrink-0 flex-col items-center`}>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-base" aria-hidden="true">
                        🕒
                      </span>
                      <span className="mt-1 w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
                    </div>
                    <div className="mb-3 flex-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-start">
                      <p dir="ltr" className="text-xs font-bold text-slate-500">
                        {formatTimelineClock(entry.block.startMinutes)}–{formatTimelineClock(entry.block.endMinutes)}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-600">{ui.freeTime}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{ui.freeTimeNote}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <TimelineRail number={entry.number} timeRange={entry.timeRange} />
                    <div className="mb-3 flex-1">
                      {entry.kind === "place" ? (
                        <SmartPlannerStopCardBody
                          summary={entry.place}
                          visitDurationMinutes={entry.place.visitDurationMinutes}
                          warnings={entry.place.warnings}
                          onClick={() => setActivePlaceId(entry.place.id)}
                          priority={entry.number <= 2}
                          lang={lang}
                        />
                      ) : (
                        <SmartPlannerStopCardBody
                          summary={entry.meal}
                          onClick={() => setActivePlaceId(entry.meal.id)}
                          lang={lang}
                          foodMeta={{
                            mealTypeIcon: MEAL_TYPE_ICON[entry.meal.mealType],
                            mealTypeLabel: ui.mealType[entry.meal.mealType],
                            cuisineLabel: `${entry.meal.categoryIcon} ${entry.meal.categoryLabel}`,
                            priceLevel: entry.meal.priceLevel,
                            rating: entry.meal.rating,
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
              {needsConnector && leg && fromSummary && toSummary && <SmartPlannerTransportConnector leg={leg} from={fromSummary} to={toSummary} railWidth={RAIL_WIDTH} lang={lang} />}
            </Fragment>
          );
        })}
      </div>

      {day.foodSuggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{ui.foodSuggestions}</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {day.foodSuggestions.map((food) => (
              <SmartPlannerNearbyCard key={food.id} summary={food} typeLabel={ui.foodMeal[food.mealType as FoodMeal]} onClick={() => setActivePlaceId(food.id)} />
            ))}
          </div>
        </div>
      )}

      {day.shoppingSuggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{ui.shopping}</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {day.shoppingSuggestions.map((shop) => (
              <SmartPlannerNearbyCard key={shop.id} summary={shop} typeLabel={ui.shopping} reason={shop.bestFor} onClick={() => setActivePlaceId(shop.id)} />
            ))}
          </div>
        </div>
      )}

      {day.nightlifeSuggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{ui.nightlife}</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {day.nightlifeSuggestions.map((venue) => (
              <SmartPlannerNearbyCard key={venue.id} summary={venue} typeLabel={ui.nightlife} reason={ui.nightlifeReason} onClick={() => setActivePlaceId(venue.id)} />
            ))}
          </div>
        </div>
      )}

      {day.optionalNearby.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{ui.nearby}</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {day.optionalNearby.map((nearby) => (
              <SmartPlannerNearbyCard key={nearby.id} summary={nearby} typeLabel={ui.suggestionType[nearby.type as SuggestionType]} reason={nearby.reason} onClick={() => setActivePlaceId(nearby.id)} />
            ))}
          </div>
        </div>
      )}

      <PlaceDetailsSheet guideSlug={guideSlug} resolved={activeResolved} open={!!activePlaceId} onClose={() => setActivePlaceId(null)} plannedWeekday={day.weekday} lang={lang} />
    </div>
  );
}
