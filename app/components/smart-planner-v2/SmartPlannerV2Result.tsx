"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { customizeSavedPlan } from "../../smart-planner/barcelona-v2/saved/[id]/actions";
import type { PlanAddOptions, PlanChange } from "../../lib/planner/planCustomizations";
import { interestGroupLabelForDestination, plannerDestinationName } from "../../lib/planner/plannerDestinations";
import SmartPlannerV2Day from "./SmartPlannerV2Day";
import { v2DisplayInterestsLabel } from "../../lib/planner/v2PlannerTypes";
import { formatArabicDayMonth } from "../../lib/planner/dateOnly";
import { useLanguage } from "../../lib/language";
import { usePlannerCopy } from "../../lib/usePlannerCopy";
import type { localizePlan as LocalizePlanFn } from "../../lib/i18n/localizePlan";
import { PLAN_TEXT, formatDayMonth, formatDays, storedTextDir } from "../../lib/i18n/planText";
import type { ReactNode } from "react";
import type { V2Day, V2Plan } from "../../lib/planner/barcelonaV2Resolve";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";
import { formatTicketAmount, planTickets } from "../../lib/planner/planTickets";

/** The change as the customer sees it right away (the server then sends the exact day: times, legs, meals). */
function applyLocally(plan: V2Plan, change: PlanChange): V2Plan {
  const days = plan.days.map((day): V2Day => {
    if (day.dayNumber !== change.dayNumber) return day;
    const stops = [...day.stops];
    const i = "placeId" in change ? stops.findIndex((s) => s.id === change.placeId) : -1;
    switch (change.kind) {
      case "duration":
        if (i >= 0) stops[i] = { ...stops[i], visitDurationMinutes: change.minutes };
        return { ...day, stops };
      case "move": {
        const j = i + change.direction;
        if (i < 0 || j < 0 || j >= stops.length) return day;
        [stops[i], stops[j]] = [stops[j], stops[i]];
        return { ...day, stops };
      }
      case "reorder": {
        if (i < 0) return day;
        const [moved] = stops.splice(i, 1);
        stops.splice(Math.min(change.toIndex, stops.length), 0, moved);
        return { ...day, stops };
      }
      case "remove": {
        if (i < 0 || stops.length <= 1) return day;
        stops.splice(i, 1);
        const last = stops.length - 1;
        return { ...day, stops, mealStops: day.mealStops?.map((m) => (m.afterStopIndex > last ? { ...m, afterStopIndex: last } : m)) };
      }
      case "start":
        return day.timeline ? { ...day, timeline: { ...day.timeline, dayStartMinutes: change.minutes } } : day;
      default:
        return day;
    }
  });
  return { ...plan, days };
}

/**
 * Smart Planner V2 Phase 5 -- polished result view. Adds a compact plan-overview line (item 6:
 * duration/dates/interests/accommodation, never internal cluster/scoring/debug data), optional
 * "تعديل الاختيارات"/"إعادة بناء الخطة" controls (item 7, both optional so the saved-plan
 * reopen page can render the exact same component without them -- a reopened plan is already
 * saved and frozen, editing/regenerating it belongs to a fresh session, not this view), and an
 * optional `saveAction` slot (mirrors V1's SmartPlannerResult pattern exactly).
 *
 * Interests UI Simplification: the overview line now shows the new 6-group labels
 * (v2DisplayInterestsLabel, v2PlannerTypes.ts) instead of raw per-key labels, so a combined
 * group (e.g. natureViews+beachRelax) is named once ("طبيعة وشواطئ"), never as two old names --
 * this also makes an old saved plan's single split key display under its new group name.
 *
 * Planner Intelligence Upgrade: `plan.surpriseMe` (set server-side, never inferred) shows
 * "فاجئني ✨" instead of the underlying interest labels; `plan.routeFirstApplied` (also
 * server-side, true only when this specific plan actually has real resolved route data
 * between at least two main stops) shows a subtle, factual note about reduced travel time --
 * never a "shortest route" claim.
 *
 * Languages: the stored plan is shown through localizePlan (a display-only translated copy; Arabic = the stored object
 * itself), so switching language never regenerates, re-saves or changes stops, order, times or prices.
 */

export default function SmartPlannerV2Result({
  plan: storedPlan,
  interests,
  accommodation,
  onEditSelections,
  onRegenerate,
  regenerating,
  saveAction,
  editablePlanId,
  editedDays,
  addOptions,
}: {
  plan: V2Plan;
  /** Saved-plan page only: the plan id, which turns on editing with buttons (start time, durations, order, add / remove). */
  editablePlanId?: string;
  /** Day numbers that already carry the customer's edits (shows "reset to original"). */
  editedDays?: number[];
  /** Saved plans: per day, the places the customer may add (computed on the server). */
  addOptions?: PlanAddOptions;
  interests: V2PlannerInterest[];
  accommodation?: { booked: boolean; text?: string };
  onEditSelections?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  saveAction?: ReactNode;
}) {
  const { language } = useLanguage();
  const plannerCopy = usePlannerCopy();
  const ui = PLAN_TEXT[language];
  // Edits come back from the server as the whole updated plan (times, legs and warnings recomputed there).
  const [livePlan, setLivePlan] = useState(storedPlan);
  const [edited, setEdited] = useState<Set<number>>(() => new Set(editedDays ?? []));
  const [liveAddOptions, setLiveAddOptions] = useState(addOptions);
  // A fresh copy from the server (router.refresh after a failed save) replaces what is shown.
  const [shownStored, setShownStored] = useState(storedPlan);
  if (shownStored !== storedPlan) {
    setShownStored(storedPlan);
    setLivePlan(storedPlan);
    setLiveAddOptions(addOptions);
  }
  const [saveFailed, setSaveFailed] = useState(false);
  const router = useRouter();
  // The translation catalog (every city's texts, ~88 KB) is loaded only when the plan is shown in English or Hebrew;
  // Arabic shows the stored plan as it is.
  const [localize, setLocalize] = useState<typeof LocalizePlanFn | null>(null);
  useEffect(() => {
    if (language === "ar" || localize) return;
    let alive = true;
    import("../../lib/i18n/localizePlan").then((m) => {
      if (alive) setLocalize(() => m.localizePlan);
    });
    return () => {
      alive = false;
    };
  }, [language, localize]);
  const translate = (p: V2Plan) => (language === "ar" || !localize ? p : localize(p, language));
  const view = useMemo(() => translate(livePlan), [livePlan, language, localize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Edits feel instant: the change is shown at once (order, removal, duration), saves run one after the other in the
  // background, and only the last reply (the server's recomputed day: times, legs, meals) replaces the shown day.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const [pending, setPending] = useState(0);
  const saving = pending > 0;
  const applyChange = (change: PlanChange) => {
    if (!editablePlanId) return;
    setSaveFailed(false);
    setLivePlan((current) => applyLocally(current, change));
    setEdited((current) => {
      const next = new Set(current);
      if (change.kind === "reset") next.delete(change.dayNumber);
      else next.add(change.dayNumber);
      return next;
    });
    pendingRef.current += 1;
    setPending(pendingRef.current);
    queue.current = queue.current.then(async () => {
      const result = await customizeSavedPlan(editablePlanId, change).catch(() => ({ ok: false as const, code: "save_failed" as const }));
      pendingRef.current -= 1;
      setPending(pendingRef.current);
      if (!result.ok) {
        // "invalid" can follow a change the screen already showed (e.g. two quick moves): reload the saved plan.
        setSaveFailed(result.code !== "invalid");
        router.refresh();
        return;
      }
      setLiveAddOptions(result.addOptions);
      if (pendingRef.current > 0 || !result.day) return; // a later change is still on its way: keep the instant view
      const day = result.day;
      setLivePlan((current) => ({
        ...current,
        days: current.days.map((d) => (d.dayNumber === result.dayNumber ? day : d)),
        placeDetails: { ...(current.placeDetails ?? {}), ...result.placeDetails },
      }));
    });
  };
  const plan = view;
  // The add candidates' details too, so their cards open the same sheet and their photos are credited.
  const allDetails = useMemo(() => {
    const addDetails = liveAddOptions ? translate({ ...livePlan, days: [], placeDetails: liveAddOptions.details }).placeDetails : undefined;
    return { ...(addDetails ?? {}), ...(plan.placeDetails ?? {}) };
  }, [liveAddOptions, livePlan, language, localize, plan.placeDetails]); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = plan.days[activeDayIndex];
  const dayMonth = (iso: string) => (language === "ar" ? formatArabicDayMonth(iso) : formatDayMonth(language, iso));
  const cityName = plannerDestinationName(plan.destination, language);
  const groupLabel = (groupId: string) =>
    interestGroupLabelForDestination(plan.destination, groupId, language) ?? (language === "ar" ? undefined : plannerCopy.wizard.interestGroups[groupId]);

  const firstDate = plan.days.find((day) => day.actualDate)?.actualDate;
  const lastDate = [...plan.days].reverse().find((day) => day.actualDate)?.actualDate;
  const dateRangeLabel =
    firstDate && lastDate
      ? firstDate === lastDate
        ? dayMonth(firstDate)
        : `${dayMonth(firstDate)} – ${dayMonth(lastDate)}`
      : null;

  // English / Hebrew: wait for the translation catalog instead of flashing the Arabic plan.
  if (language !== "ar" && !localize) return <p aria-busy="true" className="py-16 text-center text-sm text-slate-400">…</p>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">{ui.title(cityName)}</h1>

      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">
          {ui.daysIn(formatDays(language, plan.daysGenerated), cityName)}
        </p>
        {dateRangeLabel && <p className="mt-0.5 text-xs text-slate-500">{dateRangeLabel}</p>}
        {plan.surpriseMe ? (
          <p className="mt-1 text-xs text-slate-600">{ui.surpriseMe}</p>
        ) : (
          interests.length > 0 && <p className="mt-1 text-xs text-slate-600">{v2DisplayInterestsLabel(interests, groupLabel)}</p>
        )}
        {accommodation?.booked && accommodation.text && <p className="mt-1 text-xs text-slate-500">{ui.accommodation(accommodation.text)}</p>}
        {plan.accommodationOrderedTrip && <p className="mt-1 text-xs font-medium text-teal-700">{ui.orderedByStay}</p>}
        {plan.accommodationResolutionFailed && (
          <p className="mt-1 text-xs text-slate-500">{ui.stayUnresolved}</p>
        )}
        {plan.routeFirstApplied && <p className="mt-1 text-xs font-medium text-teal-700">{ui.routeFirst}</p>}
        {(() => {
          // Estimated entry tickets of the whole plan (cities with ticket estimates; old saved plans show nothing).
          const t = planTickets(plan.days);
          if (!t) return null;
          return (
            <div className="mt-2 border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-700">
                {ui.ticketsPlan(formatTicketAmount(t.included, t.currency))}
                {t.unknown > 0 && <span className="font-medium text-slate-400"> {ui.ticketsUnknown(t.unknown)}</span>}
                {t.optional > 0 && <span className="font-medium text-slate-400"> · {ui.ticketsOptional(formatTicketAmount(t.optional, t.currency))}</span>}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{ui.ticketsNote}</p>
            </div>
          );
        })()}
      </div>

      {plan.capacityWarning && (
        <p dir={storedTextDir(plan.capacityWarning, language)} className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
          {plan.capacityWarning}
        </p>
      )}

      {plan.densityWarning && (
        <p dir={storedTextDir(plan.densityWarning, language)} className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-600">
          {plan.densityWarning}
        </p>
      )}

      {(onEditSelections || onRegenerate) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEditSelections && (
            <button
              type="button"
              onClick={onEditSelections}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300"
            >
              {ui.editSelections}
            </button>
          )}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 disabled:opacity-60"
            >
              {regenerating ? ui.regenerating : ui.regenerate}
            </button>
          )}
        </div>
      )}

      {saveAction}

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {plan.days.map((day, index) => (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => setActiveDayIndex(index)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              index === activeDayIndex ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {ui.dayTab(day.dayNumber)}
          </button>
        ))}
      </div>

      {saveFailed && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {ui.saveFailed}
        </p>
      )}

      <div className="mt-4">
        {activeDay && (
          <SmartPlannerV2Day
            day={activeDay}
            guideSlug={plan.destination}
            placeDetails={allDetails}
            lang={language}
            editing={editablePlanId ? { onChange: applyChange, saving, edited: edited.has(activeDay.dayNumber), addOptions: liveAddOptions?.byDay[String(activeDay.dayNumber)] ?? [] } : undefined}
          />
        )}
      </div>

    </div>
  );
}
