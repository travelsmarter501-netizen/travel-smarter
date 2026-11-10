"use client";

import { Fragment, useRef, useState } from "react";
import SmartPlannerStopCardBody from "../smart-planner/SmartPlannerStopCardBody";
import SmartPlannerTransportConnector from "../smart-planner/SmartPlannerTransportConnector";
import SmartPlannerNearbyCard from "../smart-planner/SmartPlannerNearbyCard";
import PlaceDetailsSheet from "../guide/PlaceDetailsSheet";
import BottomSheet from "../guide/BottomSheet";
import { buildUnifiedTimelineEntries, type UnifiedTimelineEntry } from "../../lib/planner/v2TimelineItems";
import { PLAN_TEXT, formatDayHeader, formatMealCount, formatMinutes, formatPlaceCount, storedTextDir, type PlanLanguage } from "../../lib/i18n/planText";
import type { PlanChange } from "../../lib/planner/planCustomizations";
import { formatTimelineClock } from "../../lib/planner/barcelonaV2Timeline";
import { dayTickets, formatTicketAmount } from "../../lib/planner/planTickets";
import type { ResolvedPlace, ResolvedPlaceSummary } from "../../lib/readyPlan";
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
/** Nearby suggestions that are places (not food or evening venues) can be added to the day. */
/** Day start choices: 06:00-13:00, every 30 minutes. */
const START_TIMES = Array.from({ length: 15 }, (_, i) => 6 * 60 + i * 30);
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
  editing,
}: {
  day: V2Day;
  guideSlug: string;
  /** Optional -- absent on an old saved plan frozen before this field existed. Undefined is
   * treated identically to an empty map, never crashes (see this file's own header comment). */
  placeDetails?: Record<string, ResolvedPlace>;
  /** Display language. The day passed in is already the translated display copy (localizePlan). */
  lang?: PlanLanguage;
  /** Saved-plan page: edit this day with buttons (start time, duration, order, remove, add a nearby place, reset). */
  editing?: { onChange: (change: PlanChange) => void; saving: boolean; edited: boolean; addOptions: ResolvedPlaceSummary[] };
}) {
  const ui = PLAN_TEXT[lang];
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const change = (c: PlanChange) => editing?.onChange(c);
  const busy = !!editing?.saving;

  // Drag and drop (edit mode): a long press (350 ms, finger still) on a stop picks it up, moving the finger moves it, letting
  // go puts it where the line shows. Moving the finger before that is a normal scroll.
  const [drag, setDrag] = useState<{ placeId: string; from: number; dy: number; to: number } | null>(null);
  const suppressClick = useRef(false);
  const startDrag = (event: React.PointerEvent<HTMLDivElement>, placeId: string, from: number) => {
    if (!editing || !editMode || (event.pointerType === "mouse" && event.button !== 0)) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const container = event.currentTarget.closest("[data-day-stops]");
    let active = false;
    let to = from;
    const targetIndex = (y: number) =>
      [...(container?.querySelectorAll<HTMLElement>("[data-stop-index]") ?? [])]
        .filter((el) => Number(el.dataset.stopIndex) !== from)
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return y > r.top + r.height / 2;
        }).length;
    const onMove = (e: PointerEvent) => {
      if (!active) {
        if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) cleanup();
        return;
      }
      to = targetIndex(e.clientY);
      setDrag({ placeId, from, dy: e.clientY - startY, to });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (active) e.preventDefault();
    };
    const onUp = () => {
      const wasActive = active;
      cleanup();
      if (!wasActive) return;
      setDrag(null);
      if (to !== from) change({ kind: "reorder", dayNumber: day.dayNumber, placeId, toIndex: to });
    };
    const onCancel = () => {
      cleanup();
      setDrag(null);
    };
    const timer = window.setTimeout(() => {
      active = true;
      suppressClick.current = true;
      setDrag({ placeId, from, dy: 0, to: from });
    }, 350);
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", onTouchMove);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
  };
  // Where the dragged stop would land: a line above the stop that will follow it (or below the last one).
  const dropLine = (stopIndex: number): "above" | "below" | null => {
    if (!drag || stopIndex === drag.from) return null;
    const rank = stopIndex < drag.from ? stopIndex : stopIndex - 1;
    if (rank === drag.to) return "above";
    if (drag.to === day.stops.length - 1 && rank === day.stops.length - 2) return "below";
    return null;
  };
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
      {/* Short, Rhyme-style header: day, date, title; no sentences. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">
            {ui.dayTab(day.dayNumber)}
            {day.actualDate && day.weekday && <span className="text-sm font-semibold text-slate-500"> · {formatDayHeader(lang, day.actualDate, day.weekday)}</span>}
          </h2>
          <p dir={storedTextDir(day.title, lang)} className="mt-0.5 text-sm font-semibold text-slate-700">{day.title}</p>
        </div>
        {editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            {editing.edited && (
              <button type="button" onClick={() => change({ kind: "reset", dayNumber: day.dayNumber })} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50">
                {ui.resetDay}
              </button>
            )}
            <button type="button" aria-pressed={editMode} onClick={() => setEditMode((v) => !v)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${editMode ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-teal-700 hover:border-slate-300"}`}>
              {editMode ? ui.doneEditing : ui.editDay}
            </button>
          </div>
        )}
      </div>
      {day.highlight && <span dir={storedTextDir(day.highlight, lang)} className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">{day.highlight}</span>}
      {busy && <p className="mt-2 text-xs font-semibold text-slate-400">{ui.saving}</p>}

      {/* Day summary -- start/finish clock, place/meal counts, a transport-mode summary ONLY
          when every leg on this day is actually resolved (never a fake total when some legs are
          unresolved). Omitted entirely on an old saved plan with no `timeline` field. */}
      {day.timeline && day.stops.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          {editing ? (
            <button type="button" onClick={() => setStartSheetOpen(true)} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-300 disabled:opacity-50">
              ⏰ {ui.dayStart} <bdi dir="ltr" className="font-bold text-slate-900">{formatTimelineClock(day.timeline.dayStartMinutes)}</bdi> <span aria-hidden="true">▾</span>
            </button>
          ) : (
            <span>
              ⏰ {ui.dayStart} <bdi dir="ltr">{formatTimelineClock(day.timeline.dayStartMinutes)}</bdi>
            </span>
          )}
          <span>
            {ui.dayEnd} <bdi dir="ltr">{formatTimelineClock(day.timeline.activityEndMinutes ?? day.timeline.dayEndMinutes)}</bdi>
            {day.timeline.approximate && <span className="text-slate-400"> · {ui.approximate}</span>}
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
          {(() => {
            // Estimated entry tickets of the day (cities with ticket estimates; old saved plans show nothing).
            const t = dayTickets(day);
            if (!t) return null;
            return (
              <span>
                {ui.ticketsDay(formatTicketAmount(t.included, t.currency))}
                {t.unknown > 0 && <span className="text-slate-400"> {ui.ticketsUnknown(t.unknown)}</span>}
                {t.optional > 0 && <span className="text-slate-400"> · {ui.ticketsOptional(formatTicketAmount(t.optional, t.currency))}</span>}
              </span>
            );
          })()}
          {day.timeline.activityEndMinutes !== undefined && day.timeline.activityEndMinutes <= 17 * 60 && <span className="text-teal-700">{ui.freeAfter(formatTimelineClock(day.timeline.activityEndMinutes))}</span>}
        </div>
      )}

      {editing && editMode && day.stops.length > 1 && <p className="mt-3 text-xs text-slate-500">{ui.dragHint}</p>}

      <div className="mt-4" data-day-stops>
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
                    <div
                      className={`mb-3 flex-1 ${entry.kind === "place" && editing && editMode ? "relative touch-pan-y select-none [-webkit-touch-callout:none] [&_img]:pointer-events-none" : ""} ${entry.kind === "place" && dropLine(entry.stopIndex) === "above" ? "border-t-4 border-teal-500 pt-1" : ""} ${entry.kind === "place" && dropLine(entry.stopIndex) === "below" ? "border-b-4 border-teal-500 pb-1" : ""}`}
                      {...(entry.kind === "place" && editing && editMode
                        ? {
                            "data-stop-index": entry.stopIndex,
                            onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => startDrag(e, entry.place.id, entry.stopIndex),
                            onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                            style: drag?.placeId === entry.place.id ? { transform: `translateY(${drag.dy}px) scale(1.02)`, zIndex: 20, boxShadow: "0 12px 28px rgba(15,23,42,0.18)", borderRadius: 16 } : undefined,
                          }
                        : {})}
                    >
                      {entry.kind === "place" ? (
                        <SmartPlannerStopCardBody
                          summary={entry.place}
                          visitDurationMinutes={entry.place.visitDurationMinutes}
                          outsideOnly={entry.place.visitMode === "outside"}
                          warnings={entry.place.warnings}
                          onClick={() => {
                            if (suppressClick.current) {
                              suppressClick.current = false;
                              return;
                            }
                            setActivePlaceId(entry.place.id);
                          }}
                          priority={entry.number <= 2}
                          lang={lang}
                        />
                      ) : entry.meal.flexible ? (
                        // A lunch break with no set restaurant: nothing to open, just the time and the note.
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
                          <p dir={storedTextDir(entry.meal.name, lang)} className="text-sm font-bold text-slate-800">
                            {MEAL_TYPE_ICON.lunch} {entry.meal.name}
                          </p>
                          <p dir={storedTextDir(entry.meal.reason, lang)} className="mt-1 text-xs leading-5 text-slate-500">
                            {entry.meal.reason}
                          </p>
                        </div>
                      ) : (
                        <SmartPlannerStopCardBody
                          summary={entry.meal}
                          onClick={() => setActivePlaceId(entry.meal.id)}
                          lang={lang}
                          foodMeta={{
                            mealTypeIcon: MEAL_TYPE_ICON[entry.meal.mealType],
                            mealTypeLabel: entry.meal.optional ? `${ui.mealType[entry.meal.mealType]} · ${ui.optionalTag}` : ui.mealType[entry.meal.mealType],
                            // Not repeated when the category says the same as the meal (e.g. "فطور" twice).
                            cuisineLabel: entry.meal.categoryLabel === ui.mealType[entry.meal.mealType] ? "" : `${entry.meal.categoryIcon} ${entry.meal.categoryLabel}`,
                            priceLevel: entry.meal.priceLevel,
                            rating: entry.meal.rating,
                          }}
                        />
                      )}
                      {editing && editMode && entry.kind === "place" && (
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-slate-200 bg-white">
                            <button type="button" aria-label={ui.shorter} disabled={entry.place.visitDurationMinutes <= 15} onClick={() => change({ kind: "duration", dayNumber: day.dayNumber, placeId: entry.place.id, minutes: Math.max(15, Math.ceil(entry.place.visitDurationMinutes / 15) * 15 - 15) })} className="h-9 w-9 text-base font-bold text-slate-700 disabled:opacity-30">
                              −
                            </button>
                            <span className="min-w-14 text-center text-xs font-bold text-teal-700">{formatMinutes(lang, entry.place.visitDurationMinutes)}</span>
                            <button type="button" aria-label={ui.longer} disabled={entry.place.visitDurationMinutes >= 360} onClick={() => change({ kind: "duration", dayNumber: day.dayNumber, placeId: entry.place.id, minutes: Math.min(360, Math.floor(entry.place.visitDurationMinutes / 15) * 15 + 15) })} className="h-9 w-9 text-base font-bold text-slate-700 disabled:opacity-30">
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" aria-label={ui.removeStop} disabled={day.stops.length <= 1} onClick={() => change({ kind: "remove", dayNumber: day.dayNumber, placeId: entry.place.id })} className="h-9 rounded-full border border-rose-200 bg-white px-3 text-xs font-bold text-rose-600 disabled:opacity-30">
                              {ui.removeStop}
                            </button>
                          </div>
                        </div>
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
              <div key={nearby.id} className="flex shrink-0 flex-col gap-1.5">
                <SmartPlannerNearbyCard summary={nearby} typeLabel={ui.suggestionType[nearby.type as SuggestionType]} reason={nearby.reason} onClick={() => setActivePlaceId(nearby.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && editMode && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">{ui.addPlaces}</p>
          {editing.addOptions.length > 0 ? (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {editing.addOptions.map((option) => (
                <div key={option.id} className="flex shrink-0 flex-col gap-1.5">
                  <SmartPlannerNearbyCard summary={option} typeLabel={ui.addPlaceType} onClick={() => setActivePlaceId(option.id)} />
                  <button type="button" onClick={() => change({ kind: "add", dayNumber: day.dayNumber, placeId: option.id })} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 disabled:opacity-50">
                    {ui.addToDay}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{ui.noAddPlaces}</p>
          )}
        </div>
      )}

      {editing && (
        <BottomSheet open={startSheetOpen} onClose={() => setStartSheetOpen(false)} title={ui.chooseStart} closeLabel={ui.doneEditing}>
          <div className="grid grid-cols-4 gap-2 pb-2">
            {START_TIMES.map((minutes) => {
              const active = day.timeline?.dayStartMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                 
                  onClick={() => {
                    setStartSheetOpen(false);
                    change({ kind: "start", dayNumber: day.dayNumber, minutes });
                  }}
                  className={`rounded-xl border py-2.5 text-sm font-bold ${active ? "border-teal-700 bg-teal-50 text-slate-900 shadow-[inset_0_0_0_1px_var(--color-teal-700)]" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  <bdi dir="ltr">{formatTimelineClock(minutes)}</bdi>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}

      <PlaceDetailsSheet guideSlug={guideSlug} resolved={activeResolved} open={!!activePlaceId} onClose={() => setActivePlaceId(null)} plannedWeekday={day.weekday} lang={lang} />
    </div>
  );
}
