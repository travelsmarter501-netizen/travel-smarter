"use client";

import { useState } from "react";
import SmartPlannerV2Day from "./SmartPlannerV2Day";
import { v2DisplayInterestsLabel } from "../../lib/planner/v2PlannerTypes";
import { formatArabicDayMonth } from "../../lib/planner/dateOnly";
import type { ReactNode } from "react";
import type { V2Plan } from "../../lib/planner/barcelonaV2Resolve";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";

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
 */

export default function SmartPlannerV2Result({
  plan,
  interests,
  accommodation,
  onEditSelections,
  onRegenerate,
  regenerating,
  saveAction,
}: {
  plan: V2Plan;
  interests: V2PlannerInterest[];
  accommodation?: { booked: boolean; text?: string };
  onEditSelections?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  saveAction?: ReactNode;
}) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = plan.days[activeDayIndex];

  const firstDate = plan.days.find((day) => day.actualDate)?.actualDate;
  const lastDate = [...plan.days].reverse().find((day) => day.actualDate)?.actualDate;
  const dateRangeLabel =
    firstDate && lastDate
      ? firstDate === lastDate
        ? formatArabicDayMonth(firstDate)
        : `${formatArabicDayMonth(firstDate)} – ${formatArabicDayMonth(lastDate)}`
      : null;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">خطتك المخصصة لبرشلونة ✨</h1>

      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">
          {plan.daysGenerated} {plan.daysGenerated === 1 ? "يوم" : "أيام"} في برشلونة
        </p>
        {dateRangeLabel && <p className="mt-0.5 text-xs text-slate-500">{dateRangeLabel}</p>}
        {plan.surpriseMe ? (
          <p className="mt-1 text-xs text-slate-600">فاجئني ✨</p>
        ) : (
          interests.length > 0 && <p className="mt-1 text-xs text-slate-600">{v2DisplayInterestsLabel(interests)}</p>
        )}
        {accommodation?.booked && accommodation.text && <p className="mt-1 text-xs text-slate-500">السكن: {accommodation.text}</p>}
        {plan.accommodationOrderedTrip && <p className="mt-1 text-xs font-medium text-teal-700">رتبنا بداية رحلتك حسب مكان سكنك 📍</p>}
        {plan.accommodationResolutionFailed && (
          <p className="mt-1 text-xs text-slate-500">ما قدرنا نتعرف على موقع سكنك من النص المدخل، فخططنا رحلتك بدون هالمعلومة.</p>
        )}
        {plan.routeFirstApplied && <p className="mt-1 text-xs font-medium text-teal-700">رتبنا يومك حتى تقلّل وقت التنقل بين الأماكن 📍</p>}
      </div>

      {plan.capacityWarning && (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
          {plan.capacityWarning}
        </p>
      )}

      {plan.densityWarning && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-600">
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
              تعديل الاختيارات
            </button>
          )}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 disabled:opacity-60"
            >
              {regenerating ? "عم نعيد البناء..." : "إعادة بناء الخطة"}
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
            اليوم {day.dayNumber}
          </button>
        ))}
      </div>

      <div className="mt-4">{activeDay && <SmartPlannerV2Day day={activeDay} guideSlug={plan.destination} placeDetails={plan.placeDetails} />}</div>
    </div>
  );
}
