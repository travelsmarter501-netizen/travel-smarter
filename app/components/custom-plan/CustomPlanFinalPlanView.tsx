import { V2_INTEREST_OPTIONS } from "../../lib/planner/v2PlannerTypes";
import { CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS } from "../../lib/customPlanRequest";
import { CUSTOM_PLAN_DRAFT_STOP_KIND_LABELS } from "../../lib/customPlanDraft";
import { READY_PLAN_TRANSPORT_DISCLAIMER } from "../../lib/readyPlan";
import { formatArabicDayMonth } from "../../lib/planner/dateOnly";
import type { CustomPlanFinalDisplayDay } from "../../lib/customPlanAdminDisplay";
import type { CustomPlanDeliveryOverview } from "../../lib/customPlanDelivery";

/**
 * The single customer-facing render of a delivered Custom Plan -- used by BOTH the real
 * customer route (app/account/custom-plans/[requestId]/page.tsx) and the admin "معاينة خطة
 * الزبون" preview (app/admin/custom-plans/[requestId]/preview/page.tsx), so there is exactly
 * one rendering system for this content (per the task's own "avoid two different rendering
 * systems" instruction). Receives only already-resolved, already-frozen plain data -- never
 * imports the Barcelona Guide dataset, a draft type, or any planner/generator code itself.
 *
 * Deliberately shows NO admin notes, no database ids, no scoring/planner internals, and no
 * invented transport minutes/distances -- only a single generic disclaimer pointing at the
 * per-stop Maps links for real routing, exactly like Ready Plan/Smart Planner's own transport
 * honesty posture (see readyPlan.ts's READY_PLAN_TRANSPORT_DISCLAIMER, reused here rather than
 * a second copy).
 */
export default function CustomPlanFinalPlanView({
  overview,
  days,
  isAdminPreview = false,
}: {
  overview: CustomPlanDeliveryOverview;
  days: CustomPlanFinalDisplayDay[];
  isAdminPreview?: boolean;
}) {
  const interestLabels = overview.interests
    .map((key) => V2_INTEREST_OPTIONS.find((option) => option.key === key))
    .filter((option): option is (typeof V2_INTEREST_OPTIONS)[number] => Boolean(option));

  const accommodationLabel = overview.accommodationType
    ? CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS.find((option) => option.value === overview.accommodationType)?.label
    : null;

  const dateRangeLabel =
    overview.arrivalDate && overview.departureDate
      ? `${formatArabicDayMonth(overview.arrivalDate) ?? overview.arrivalDate} – ${formatArabicDayMonth(overview.departureDate) ?? overview.departureDate}`
      : null;

  return (
    <div className="space-y-6">
      {isAdminPreview && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          معاينة إدارية — هذا بالضبط الشكل يلي رح يشوفه الزبون.
        </div>
      )}

      <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-600">خطتك المخصصة</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">خطتك المخصصة لبرشلونة</h1>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">مدة الرحلة</dt>
            <dd className="font-semibold text-slate-900">{overview.durationDays} أيام</dd>
          </div>
          {dateRangeLabel && (
            <div>
              <dt className="text-slate-400">التواريخ</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {dateRangeLabel}
              </dd>
            </div>
          )}
          {interestLabels.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">اهتماماتك</dt>
              <dd className="font-semibold text-slate-900">{interestLabels.map((option) => `${option.emoji} ${option.label}`).join("، ")}</dd>
            </div>
          )}
          {accommodationLabel && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">السكن</dt>
              <dd className="font-semibold text-slate-900">
                {accommodationLabel}
                {overview.accommodationText ? ` — ${overview.accommodationText}` : ""}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {days.map((day) => (
        <section key={day.dayNumber} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              اليوم {day.dayNumber} — {day.title}
            </h2>
            {day.date && (
              <span dir="ltr" className="text-xs font-semibold text-slate-400">
                {formatArabicDayMonth(day.date) ?? day.date}
              </span>
            )}
          </div>
          {day.summary && <p className="mt-1.5 text-sm text-slate-600">{day.summary}</p>}

          <ul className="mt-4 space-y-3">
            {day.stops.map((stop) => (
              <li key={stop.placeId} className="rounded-2xl border border-slate-100 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{stop.name}</span>
                  {stop.kind !== "visit" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{CUSTOM_PLAN_DRAFT_STOP_KIND_LABELS[stop.kind]}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {stop.categoryLabel}
                  {stop.area ? ` · ${stop.area}` : ""}
                </p>
                {stop.address && <p className="mt-1 text-xs text-slate-500">{stop.address}</p>}
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                  {stop.startTime && <span dir="ltr">🕐 {stop.startTime}</span>}
                  {typeof stop.durationMinutes === "number" && <span>⏱️ {stop.durationMinutes} دقيقة</span>}
                </div>
                {stop.customerNote && <p className="mt-2 rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm text-teal-800">{stop.customerNote}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                  {stop.mapsUrl && (
                    <a href={stop.mapsUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                      خرائط Google
                    </a>
                  )}
                  {stop.appleMapsUrl && (
                    <a href={stop.appleMapsUrl} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                      خرائط Apple
                    </a>
                  )}
                </div>
              </li>
            ))}
            {day.stops.length === 0 && <li className="text-sm text-slate-400">لا يوجد محطات مجدولة بهذا اليوم.</li>}
          </ul>
        </section>
      ))}

      <p className="text-center text-xs text-slate-400">{READY_PLAN_TRANSPORT_DISCLAIMER} افتح روابط الخرائط أعلاه للمسار الأدق بين المحطات.</p>
    </div>
  );
}
