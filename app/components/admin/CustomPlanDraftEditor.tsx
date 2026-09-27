"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveCustomPlanDraftAction, approveCustomPlanDraftAction } from "../../admin/custom-plans/actions";
import {
  CUSTOM_PLAN_DRAFT_STOP_KIND_LABELS,
  type CustomPlanDraft,
  type CustomPlanDraftDay,
  type CustomPlanDraftStop,
} from "../../lib/customPlanDraft";
import type { ResolvedStopDisplay, KnownPlaceOption } from "../../lib/customPlanAdminDisplay";

/**
 * Custom Plan Admin Builder V1 -- lightweight itinerary editor (no drag-and-drop dependency,
 * per the task's own instruction). All edits are local state until "حفظ المسودة" is clicked,
 * which sends the full day/stop structure to a trusted Server Action (saveCustomPlanDraftAction
 * -> app/lib/customPlanAdmin.ts's saveCustomPlanDraftForAdmin) that re-checks admin
 * authorization and re-validates the structure server-side -- this component never writes to
 * Supabase directly.
 */
export default function CustomPlanDraftEditor({
  requestId,
  initialDraft,
  knownPlaces,
  resolvedStops,
}: {
  requestId: string;
  initialDraft: CustomPlanDraft;
  knownPlaces: KnownPlaceOption[];
  resolvedStops: Record<string, ResolvedStopDisplay>;
}) {
  const router = useRouter();
  const [days, setDays] = useState<CustomPlanDraftDay[]>(initialDraft.planData.days);
  const [status, setStatus] = useState(initialDraft.status);
  const [addedNames, setAddedNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const isApproved = status === "approved";

  function displayNameFor(stop: CustomPlanDraftStop): string {
    return resolvedStops[stop.placeId]?.name ?? addedNames[stop.placeId] ?? stop.title;
  }

  function updateDay(dayIndex: number, updater: (day: CustomPlanDraftDay) => CustomPlanDraftDay) {
    setDays((prev) => prev.map((day, i) => (i === dayIndex ? updater(day) : day)));
  }

  function moveStop(dayIndex: number, stopIndex: number, direction: -1 | 1) {
    updateDay(dayIndex, (day) => {
      const target = stopIndex + direction;
      if (target < 0 || target >= day.stops.length) return day;
      const stops = [...day.stops];
      [stops[stopIndex], stops[target]] = [stops[target], stops[stopIndex]];
      return { ...day, stops };
    });
  }

  function removeStop(dayIndex: number, stopIndex: number) {
    updateDay(dayIndex, (day) => ({ ...day, stops: day.stops.filter((_, i) => i !== stopIndex) }));
  }

  function updateStopStartTime(dayIndex: number, stopIndex: number, value: string) {
    updateDay(dayIndex, (day) => ({
      ...day,
      stops: day.stops.map((stop, i) => (i === stopIndex ? { ...stop, startTime: value || null } : stop)),
    }));
  }

  function updateStopAdminNote(dayIndex: number, stopIndex: number, value: string) {
    updateDay(dayIndex, (day) => ({
      ...day,
      stops: day.stops.map((stop, i) => (i === stopIndex ? { ...stop, adminNote: value || null } : stop)),
    }));
  }

  function updateStopCustomerNote(dayIndex: number, stopIndex: number, value: string) {
    updateDay(dayIndex, (day) => ({
      ...day,
      stops: day.stops.map((stop, i) => (i === stopIndex ? { ...stop, customerNote: value || null } : stop)),
    }));
  }

  function updateDayTitle(dayIndex: number, title: string) {
    updateDay(dayIndex, (day) => ({ ...day, title }));
  }

  function updateDaySummary(dayIndex: number, summary: string) {
    updateDay(dayIndex, (day) => ({ ...day, summary }));
  }

  function addPlace(dayIndex: number, placeId: string) {
    setError(null);
    if (!placeId) return;

    const alreadyUsed = days.some((day) => day.stops.some((stop) => stop.placeId === placeId));
    if (alreadyUsed) {
      setError("هذا المكان موجود بالفعل ضمن الخطة.");
      return;
    }

    const known = knownPlaces.find((place) => place.placeId === placeId);
    if (!known) return;

    const newStop: CustomPlanDraftStop = {
      placeId,
      title: known.name,
      kind: known.kind,
      startTime: null,
      durationMinutes: null,
      adminNote: null,
      customerNote: null,
    };

    setAddedNames((prev) => ({ ...prev, [placeId]: known.name }));
    updateDay(dayIndex, (day) => ({ ...day, stops: [...day.stops, newStop] }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedOk(false);

    const planData = { ...initialDraft.planData, days };
    const result = await saveCustomPlanDraftAction(requestId, planData);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSavedOk(true);
    router.refresh();
  }

  async function handleApprove() {
    setApproving(true);
    setError(null);

    const result = await approveCustomPlanDraftAction(requestId);
    setApproving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setStatus(result.data.status);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      {initialDraft.planData.unmatchedMustVisits.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700">أماكن مطلوبة لم تُطابق تلقائيًا:</p>
          <ul className="mt-1 space-y-1 text-sm text-amber-800">
            {initialDraft.planData.unmatchedMustVisits.map((text, i) => (
              <li key={i}>&quot;{text}&quot; — طلب غير مطابق تلقائيًا</li>
            ))}
          </ul>
        </div>
      )}

      {days.map((day, dayIndex) => (
        <div key={day.dayNumber} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <input
              value={day.title}
              onChange={(e) => updateDayTitle(dayIndex, e.target.value)}
              disabled={isApproved}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-teal-400 disabled:bg-slate-50"
            />
            {day.date && (
              <span dir="ltr" className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {day.date}
              </span>
            )}
          </div>

          <textarea
            value={day.summary}
            onChange={(e) => updateDaySummary(dayIndex, e.target.value)}
            disabled={isApproved}
            rows={2}
            placeholder="ملخص اليوم (يظهر للزبون)"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 disabled:bg-slate-50"
          />

          <ul className="mt-3 space-y-2">
            {day.stops.map((stop, stopIndex) => (
              <li key={`${stop.placeId}-${stopIndex}`} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{displayNameFor(stop)}</span>
                    {stop.kind !== "visit" && (
                      <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {CUSTOM_PLAN_DRAFT_STOP_KIND_LABELS[stop.kind]}
                      </span>
                    )}
                  </div>
                  {!isApproved && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveStop(dayIndex, stopIndex, -1)}
                        disabled={stopIndex === 0}
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(dayIndex, stopIndex, 1)}
                        disabled={stopIndex === day.stops.length - 1}
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(dayIndex, stopIndex)}
                        className="rounded-full border border-rose-200 px-2 py-1 text-xs text-rose-600"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>

                {stop.kind === "visit" && (
                  <label className="mt-2 block text-xs text-slate-500">
                    وقت البداية
                    <input
                      type="time"
                      value={stop.startTime ?? ""}
                      onChange={(e) => updateStopStartTime(dayIndex, stopIndex, e.target.value)}
                      disabled={isApproved}
                      className="mt-1 block w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-50"
                    />
                  </label>
                )}

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="block text-xs text-slate-500">
                    ملاحظة داخلية (للإدارة فقط)
                    <textarea
                      value={stop.adminNote ?? ""}
                      onChange={(e) => updateStopAdminNote(dayIndex, stopIndex, e.target.value)}
                      disabled={isApproved}
                      rows={2}
                      className="mt-1 block w-full resize-none rounded-lg border border-amber-200 bg-amber-50/40 px-2 py-1 text-sm disabled:bg-slate-50"
                    />
                  </label>
                  <label className="block text-xs text-slate-500">
                    ملاحظة للزبون (تظهر بالخطة النهائية)
                    <textarea
                      value={stop.customerNote ?? ""}
                      onChange={(e) => updateStopCustomerNote(dayIndex, stopIndex, e.target.value)}
                      disabled={isApproved}
                      rows={2}
                      className="mt-1 block w-full resize-none rounded-lg border border-teal-200 bg-teal-50/40 px-2 py-1 text-sm disabled:bg-slate-50"
                    />
                  </label>
                </div>
              </li>
            ))}
            {day.stops.length === 0 && <li className="text-sm text-slate-400">لا يوجد محطات بهذا اليوم بعد.</li>}
          </ul>

          {!isApproved && (
            <div className="mt-3">
              <select
                onChange={(e) => {
                  addPlace(dayIndex, e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  + أضف مكان معروف
                </option>
                {knownPlaces.map((place) => (
                  <option key={place.placeId} value={place.placeId}>
                    {place.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      {savedOk && !error && <p className="text-sm font-semibold text-teal-700">تم الحفظ.</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isApproved}
          className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? "جاري الحفظ..." : "حفظ المسودة"}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={approving || isApproved}
          className="rounded-full border border-teal-700 px-5 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-60"
        >
          {isApproved ? "معتمدة ✓" : approving ? "جاري الاعتماد..." : "اعتماد الخطة"}
        </button>
        <Link
          href={`/admin/custom-plans/${requestId}/preview`}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300"
        >
          معاينة خطة الزبون
        </Link>
      </div>
    </div>
  );
}
