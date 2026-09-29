"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Price from "../Price";
import PillSelect from "./PillSelect";
import { V2_INTEREST_OPTIONS } from "../../lib/planner/v2PlannerTypes";
import { CUSTOM_PLAN_PRICE_ILS, CUSTOM_PLAN_DEFAULT_DURATION_DAYS } from "../../lib/customPlan";
import {
  validateCustomPlanRequest,
  CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS,
  CUSTOM_PLAN_SURPRISE_ME_PRESET,
  type CustomPlanRequest,
  type CustomPlanRequestErrors,
  type CustomPlanAccommodationStatus,
} from "../../lib/customPlanRequest";
import { inclusiveDayCount } from "../../lib/planner/dateOnly";
import { readPendingCustomPlanRequest, writePendingCustomPlanRequest, clearPendingCustomPlanRequest } from "../../lib/customPlanRequestDraft";
import { submitCustomPlanRequest } from "../../custom-plan/barcelona/actions";
import { startCustomPlanAllpayCheckout } from "../../checkout/actions";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";

/**
 * Custom Plan Simple Intake V2 -- the ONLY 4 questions this form now asks: trip duration/dates,
 * interests (the same final 8 V2 keys Smart Planner uses), accommodation, and contact info.
 * Everything the old long questionnaire asked (traveler type/count, children, must-visit,
 * detailed food/nightlife preferences, pace, budget style, special requests) is gone from this
 * form entirely -- new requests simply never populate those DB columns (see
 * customPlanRequests.ts / the fixed-price migration).
 *
 * CRITICAL product distinction (never blur this): submitting here NEVER generates an
 * itinerary. It saves a request; a human reviews/builds the actual itinerary later. Smart
 * Planner (a completely separate product/flow) is the one that generates instantly.
 *
 * Price is fixed at CUSTOM_PLAN_PRICE_ILS (99) for every supported duration (1-10 days) --
 * changing the selected duration never changes the displayed price anywhere in this form.
 */

const MAX_DAYS = 10;
const DAY_OPTIONS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1);

type Step = 1 | 2 | 3 | 4;
const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: "مدة الرحلة" },
  { step: 2, label: "شو بتحب؟" },
  { step: 3, label: "السكن" },
  { step: 4, label: "التواصل" },
];

type SaveStatus = "idle" | "submitting" | "saved";

export default function CustomPlanRequestForm({ initialEmail = "", isLoggedIn }: { initialEmail?: string; isLoggedIn: boolean }) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  const [dateMode, setDateMode] = useState<"days" | "specific">("days");
  const [durationDays, setDurationDays] = useState(CUSTOM_PLAN_DEFAULT_DURATION_DAYS);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [interests, setInterests] = useState<V2PlannerInterest[]>([]);

  const [accommodationStatus, setAccommodationStatus] = useState<CustomPlanAccommodationStatus | null>(null);
  const [accommodationText, setAccommodationText] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<CustomPlanRequestErrors>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [savedDurationDays, setSavedDurationDays] = useState<number | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);

  // Restore a draft preserved before a logged-out redirect to /login -- same pattern as V1's
  // own pending-request draft (see customPlanRequestDraft.ts).
  useEffect(() => {
    const draft = readPendingCustomPlanRequest();
    if (!draft) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setDateMode(draft.dateMode);
    setDurationDays(draft.durationDays);
    setArrivalDate(draft.arrivalDate ?? "");
    setDepartureDate(draft.departureDate ?? "");
    setInterests(draft.interests);
    setAccommodationStatus(draft.accommodationStatus);
    setAccommodationText(draft.accommodationText);
    setName(draft.name);
    setEmail(draft.email || initialEmail);
    setPhone(draft.phone);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (isLoggedIn) clearPendingCustomPlanRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAccommodationStatusChange(next: CustomPlanAccommodationStatus) {
    setAccommodationStatus(next);
    // Clears stale text when switching away from hotel/apartment -- a leftover hotel name
    // shouldn't silently survive into a "لسا ما حجزت" selection.
    if (next === "not_booked") setAccommodationText("");
  }

  // Optimistic, client-only preview -- never sent to the server as authoritative (see
  // customPlanRequests.ts, which independently re-derives the real day count from the dates).
  const previewDayCount = dateMode === "specific" && arrivalDate && departureDate ? inclusiveDayCount(arrivalDate, departureDate) : null;
  const dateRangeError =
    dateMode === "specific" && arrivalDate && departureDate
      ? previewDayCount === null
        ? "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول."
        : previewDayCount > MAX_DAYS
          ? "أقصى مدة للخطة المخصصة حاليًا 10 أيام."
          : null
      : null;

  const accommodationTextRequired = accommodationStatus === "hotel" || accommodationStatus === "apartment";

  const stepValid: Record<Step, boolean> = {
    1: dateMode === "days" ? true : !!arrivalDate && !!departureDate && !dateRangeError,
    2: interests.length >= 1,
    3: !accommodationTextRequired || accommodationText.trim().length > 0,
    4: true,
  };

  function buildPayload(): CustomPlanRequest {
    return {
      destination: "barcelona",
      dateMode,
      durationDays: dateMode === "days" ? durationDays : (previewDayCount ?? durationDays),
      arrivalDate: dateMode === "specific" ? arrivalDate || null : null,
      departureDate: dateMode === "specific" ? departureDate || null : null,
      interests,
      accommodationStatus,
      accommodationText: accommodationTextRequired ? accommodationText.trim() : "",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
  }

  async function handleSubmit() {
    setSubmitError(null);

    const payload = buildPayload();
    const validationErrors = validateCustomPlanRequest(payload);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!isLoggedIn) {
      writePendingCustomPlanRequest(payload);
      router.push("/login?next=/custom-plan/barcelona");
      return;
    }

    setSaveStatus("submitting");
    const result = await submitCustomPlanRequest(payload);

    if (!result.ok) {
      setSaveStatus("idle");
      setSubmitError(result.error);
      return;
    }

    clearPendingCustomPlanRequest();
    setSavedRequestId(result.data.id);
    setSavedDurationDays(result.data.durationDays);
    setSaveStatus("saved");
  }

  async function handleCheckout() {
    if (!savedRequestId) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    const result = await startCustomPlanAllpayCheckout(savedRequestId);
    setCheckoutLoading(false);

    if (!result.ok) {
      setCheckoutError(result.error);
      return;
    }

    setCheckoutOrderId(result.orderId);
    window.location.href = result.paymentUrl;
  }

  if (savedRequestId) {
    return (
      <div className="rounded-3xl border border-teal-700 bg-gradient-to-b from-teal-50 to-white p-6 text-center shadow-sm ring-1 ring-teal-700 sm:p-8">
        <p className="text-2xl">✅</p>
        <h2 className="mt-3 text-xl font-bold text-slate-900">تم حفظ طلبك بنجاح.</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">رح نراجع تفاصيل رحلتك ونجهزلك خطة مخصصة.</p>

        <div className="mt-6 rounded-2xl border border-teal-100 bg-white p-4 text-right">
          <p className="text-xs font-bold text-slate-500">ملخص طلبك</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>
              Barcelona · {savedDurationDays ?? durationDays} {(savedDurationDays ?? durationDays) === 1 ? "يوم" : "أيام"}
            </li>
            <li>
              السعر: <Price ils={CUSTOM_PLAN_PRICE_ILS} className="font-semibold" />
            </li>
            <li>عدد الاهتمامات المختارة: {interests.length}</li>
          </ul>
        </div>

        {checkoutOrderId ? (
          <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
            <p className="text-base font-bold text-slate-900">طلب الدفع جاهز.</p>
            <p dir="ltr" className="mt-2 text-xs font-semibold text-slate-500">
              رقم الطلب: {checkoutOrderId.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">رح نربط صفحة الدفع الآمنة بالخطوة الجاية.</p>
          </div>
        ) : (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {checkoutLoading ? "جاري التجهيز..." : "متابعة للدفع"}
            </button>
            {checkoutError && <p className="mt-2 text-center text-sm font-semibold text-rose-600">{checkoutError}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div>
        <div className="flex items-center gap-1.5" role="list" aria-label="خطوات طلب الخطة المخصصة">
          {STEPS.map((s) => (
            <span
              key={s.step}
              role="listitem"
              aria-current={step === s.step ? "step" : undefined}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s.step <= step ? "bg-teal-700" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-bold text-slate-500">
          الخطوة {step} من {STEPS.length} · {STEPS[step - 1].label}
        </p>
      </div>

      {step === 1 && (
        <div className="rounded-3xl border border-teal-700 bg-gradient-to-b from-teal-50 to-white p-6 shadow-sm ring-1 ring-teal-700 sm:p-8">
          <h2 className="text-base font-bold text-slate-900">قديش مدة رحلتك؟</h2>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(
              [
                { key: "days" as const, label: "عدد الأيام" },
                { key: "specific" as const, label: "تواريخ محددة" },
              ]
            ).map((option) => {
              const active = option.key === dateMode;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDateMode(option.key)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
                    active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {dateMode === "days" ? (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {DAY_OPTIONS.map((count) => {
                const active = count === durationDays;
                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDurationDays(count)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${
                      active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {count} {count === 1 ? "يوم" : "أيام"}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">تاريخ الوصول</span>
                  <input
                    type="date"
                    aria-label="تاريخ الوصول"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">تاريخ المغادرة</span>
                  <input
                    type="date"
                    aria-label="تاريخ المغادرة"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
              </div>
              {dateRangeError ? (
                <p className="text-xs font-semibold text-rose-600">{dateRangeError}</p>
              ) : (
                previewDayCount !== null && <p className="text-xs font-semibold text-teal-700">مدة الرحلة: {previewDayCount} أيام</p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-baseline justify-between border-t border-teal-100 pt-5">
            <span className="text-sm font-semibold text-slate-600">السعر</span>
            <Price ils={CUSTOM_PLAN_PRICE_ILS} className="text-3xl font-extrabold text-slate-900" />
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">السعر ثابت لأي رحلة من 1 إلى 10 أيام.</p>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">شو بتحب بالرحلة؟</h2>
            {interests.length > 0 && <span className="shrink-0 text-xs font-bold text-teal-700">{interests.length} مختارة</span>}
          </div>
          <div className="mt-3">
            <PillSelect
              options={V2_INTEREST_OPTIONS.map((option) => ({ value: option.key, label: `${option.emoji} ${option.label}` }))}
              value={interests}
              onChange={(next) => setInterests(next as V2PlannerInterest[])}
              multiple
              columns={2}
            />
          </div>
          <button
            type="button"
            onClick={() => setInterests(CUSTOM_PLAN_SURPRISE_ME_PRESET)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-300 bg-teal-50/60 px-4 py-3 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50"
          >
            فاجئني بخطة متوازنة ✨
          </button>
          {errors.interests && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.interests}</p>}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">هل حجزت سكن؟</h2>
          <div className="mt-3">
            <PillSelect
              options={CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS}
              value={accommodationStatus ? [accommodationStatus] : []}
              onChange={(next) => {
                const nextValue = next[next.length - 1];
                if (nextValue) handleAccommodationStatusChange(nextValue);
              }}
              columns={3}
            />
          </div>

          {accommodationTextRequired && (
            <label className="mt-3 block">
              <span className="sr-only">{accommodationStatus === "hotel" ? "اسم الفندق أو العنوان" : "اسم الشقة أو العنوان"}</span>
              <input
                type="text"
                dir="auto"
                aria-label={accommodationStatus === "hotel" ? "اسم الفندق أو العنوان" : "اسم الشقة أو العنوان"}
                value={accommodationText}
                onChange={(e) => setAccommodationText(e.target.value)}
                placeholder={accommodationStatus === "hotel" ? "اسم الفندق أو العنوان" : "اسم الشقة أو العنوان"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              />
              {errors.accommodation && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.accommodation}</p>}
            </label>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">كيف نتواصل معك؟</h2>
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">الاسم</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
              />
              {errors.name && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.name}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">البريد الإلكتروني</span>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
              />
              {errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">الهاتف / واتساب (اختياري)</span>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
            <p className="text-sm font-bold text-slate-900">ملخص طلبك</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>
                Barcelona · {dateMode === "days" ? durationDays : (previewDayCount ?? "—")} أيام
              </li>
              <li>
                السعر: <Price ils={CUSTOM_PLAN_PRICE_ILS} className="font-semibold" />
              </li>
              <li>عدد الاهتمامات المختارة: {interests.length}</li>
            </ul>
          </div>
        </div>
      )}

      {submitError && <p className="text-center text-sm font-semibold text-rose-600">{submitError}</p>}

      <div className="flex items-center gap-2.5 pt-1">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300"
          >
            رجوع
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!stepValid[step]}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            التالي
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveStatus === "submitting"}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {saveStatus === "submitting" ? "جاري الإرسال..." : "اطلب خطتي المخصصة"}
          </button>
        )}
      </div>
    </div>
  );
}
