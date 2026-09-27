"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import V2InterestSelector from "./V2InterestSelector";
import SmartPlannerV2Result from "./SmartPlannerV2Result";
import SaveSmartPlanButton, { type SaveSmartPlanStatus } from "../smart-planner/SaveSmartPlanButton";
import { generateBarcelonaPlanV2Action } from "../../smart-planner/barcelona-v2/actions";
import { inclusiveDayCount } from "../../lib/planner/dateOnly";
import { createClient } from "../../../utils/supabase/client";
import {
  clearPendingSmartPlannerV2Save,
  normalizeSmartPlannerV2Preferences,
  readPendingSmartPlannerV2Save,
  writePendingSmartPlannerV2Save,
  V2_SAVED_PLAN_PRODUCT_SLUG,
  type SmartPlannerV2SavedPreferences,
} from "../../lib/planner/smartPlannerV2SavedPlans";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";
import type { V2Plan } from "../../lib/planner/barcelonaV2Resolve";
import { PLANNER_DESTINATIONS, DEFAULT_PLANNER_DESTINATION_ID, isAvailablePlannerDestinationId } from "../../lib/planner/plannerDestinations";
import { CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS } from "../../lib/customPlanRequest";
import type { CustomPlanAccommodationStatus } from "../../lib/customPlanRequest";

type Phase = "form" | "loading" | "result";
type DateMode = "flexible" | "specific";
type Accommodation = { booked: boolean; text?: string };

const MAX_DAYS = 10;
const DAY_OPTIONS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1);
// Unified Personalized Plan: this component now lives at the single unified product route
// /planner (the legacy /smart-planner/barcelona and /custom-plan/barcelona routes both redirect
// here with Barcelona preselected) -- the pending-save login "next" target points here too, so
// a logged-out save correctly returns the visitor to the real, current product page.
const V2_SMART_PLANNER_PATH = "/planner";

const STEPS = [
  { step: 1, label: "وين مسافر؟" },
  { step: 2, label: "متى؟" },
  { step: 3, label: "شو بتحب؟" },
  { step: 4, label: "السكن" },
] as const;
type Step = (typeof STEPS)[number]["step"];

const LOADING_PHRASES = ["عم نبني رحلتك...", "عم نرتّب الأماكن حسب الأيام والمناطق...", "عم نراجع مواعيد الأماكن..."];
const LOADING_PHRASE_INTERVAL_MS = 1400;

/**
 * Unified Personalized Plan -- the ONE customer-facing automated trip-planning product ("خطة
 * مخصصة إلك ✨"), replacing the old separate "Smart Planner" / "Custom Plan" positioning. Fully
 * automated, no human review, no request/draft/delivery status -- generation happens
 * immediately after the 4-step questionnaire via generateBarcelonaPlanV2Action, a Server Action.
 * This is a customer-facing/product-positioning merge only: the underlying engine call, saved-
 * plan table, and generation logic are the exact same Smart Planner V2 architecture as before,
 * completely unmodified (see barcelona-v2/actions.ts) -- only the questionnaire (destination
 * step now a real picker, accommodation step now the 3-way hotel/apartment/not_booked model,
 * Surprise Me added) and copy changed.
 *
 * 4-step wizard: destination / when / interests / accommodation, with a lightweight progress
 * indicator, no wizard dependency, real (non-fake) loading state tied to the actual Server
 * Action await, and save/pending-save-through-login support mirroring V1's own established
 * pattern exactly (SmartPlannerApp.tsx's handleSave/resumedRef) but for V2's own table shape.
 *
 * Still asks ONLY these 4 questions -- no budget/pace/traveler-type/transport/primaryInterest/
 * must-visit. Still imports NOTHING from barcelona-guide.ts, barcelona-planner-metadata.ts, or
 * any planner-engine internals.
 */
export default function SmartPlannerV2App({ initialDestinationId }: { initialDestinationId?: string } = {}) {
  const router = useRouter();

  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    isAvailablePlannerDestinationId(initialDestinationId) ? (initialDestinationId as string) : DEFAULT_PLANNER_DESTINATION_ID
  );
  const [step, setStep] = useState<Step>(1);
  const [dateMode, setDateMode] = useState<DateMode>("flexible");
  const [durationDays, setDurationDays] = useState(3);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [selectedInterests, setSelectedInterests] = useState<V2PlannerInterest[]>([]);
  // Planner Intelligence Upgrade: Surprise Me is a real independent mode now, tracked
  // separately from selectedInterests (which stays [] while it's active) -- see
  // V2InterestSelector.tsx's own doc comment.
  const [isSurpriseMe, setIsSurpriseMe] = useState(false);

  const [accommodationStatus, setAccommodationStatus] = useState<CustomPlanAccommodationStatus | null>(null);
  const [accommodationText, setAccommodationText] = useState("");

  const [phase, setPhase] = useState<Phase>("form");
  const [plan, setPlan] = useState<V2Plan | null>(null);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveSmartPlanStatus>("idle");
  const [regenerating, setRegenerating] = useState(false);
  const resumedRef = useRef(false);

  // Optimistic, client-only preview -- never sent to the server as authoritative.
  const previewDayCount = dateMode === "specific" && arrivalDate && departureDate ? inclusiveDayCount(arrivalDate, departureDate) : null;
  const dateRangeError =
    dateMode === "specific" && arrivalDate && departureDate
      ? previewDayCount === null
        ? "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول."
        : previewDayCount > MAX_DAYS
          ? "أقصى مدة مدعومة حاليًا 10 أيام. اختار تواريخ أقرب."
          : null
      : null;

  const accommodationTextRequired = accommodationStatus === "hotel" || accommodationStatus === "apartment";

  const stepValid: Record<Step, boolean> = {
    1: !!selectedDestinationId,
    2: dateMode === "flexible" ? true : !!arrivalDate && !!departureDate && !dateRangeError,
    3: selectedInterests.length >= 1 || isSurpriseMe,
    4: accommodationStatus !== null && (!accommodationTextRequired || accommodationText.trim().length > 0),
  };
  const canGenerate = stepValid[1] && stepValid[2] && stepValid[3] && stepValid[4];

  function currentAccommodation(): Accommodation {
    return { booked: accommodationStatus !== null && accommodationStatus !== "not_booked", text: accommodationText };
  }

  function currentPreferences(): SmartPlannerV2SavedPreferences {
    const accommodation = currentAccommodation();
    if (dateMode === "flexible") {
      return {
        plannerVersion: "v2",
        destinationId: "barcelona",
        dateMode: "flexible",
        durationDays,
        interests: selectedInterests,
        surpriseMe: isSurpriseMe,
        accommodation,
      };
    }
    return {
      plannerVersion: "v2",
      destinationId: "barcelona",
      dateMode: "specific",
      arrivalDate,
      departureDate,
      interests: selectedInterests,
      surpriseMe: isSurpriseMe,
      accommodation,
    };
  }

  async function handleGenerate() {
    setError(null);
    setPhase("loading");

    const result = await generateBarcelonaPlanV2Action({
      destinationId: "barcelona",
      dateMode,
      durationDays: dateMode === "flexible" ? durationDays : undefined,
      arrivalDate: dateMode === "specific" ? arrivalDate : undefined,
      departureDate: dateMode === "specific" ? departureDate : undefined,
      interests: selectedInterests,
      surpriseMe: isSurpriseMe,
      accommodation: currentAccommodation(),
    });

    if (!result.ok) {
      setError(result.error);
      setPhase("form");
      return;
    }

    setSaveStatus("idle");
    setPlan(result.data);
    setPhase("result");
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    const result = await generateBarcelonaPlanV2Action({
      destinationId: "barcelona",
      dateMode,
      durationDays: dateMode === "flexible" ? durationDays : undefined,
      arrivalDate: dateMode === "specific" ? arrivalDate : undefined,
      departureDate: dateMode === "specific" ? departureDate : undefined,
      interests: selectedInterests,
      surpriseMe: isSurpriseMe,
      accommodation: currentAccommodation(),
    });
    setRegenerating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaveStatus("idle");
    setPlan(result.data);
  }

  async function handleSave(preferences: SmartPlannerV2SavedPreferences, planToSave: V2Plan) {
    setSaveStatus("checking");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      writePendingSmartPlannerV2Save({ preferences, plan: planToSave });
      router.push(`/login?next=${encodeURIComponent(V2_SMART_PLANNER_PATH)}`);
      return;
    }

    setSaveStatus("saving");
    const { error: saveError } = await supabase.from("smart_planner_saved_plans").insert({
      product_slug: V2_SAVED_PLAN_PRODUCT_SLUG,
      destination_slug: "barcelona",
      preferences_json: normalizeSmartPlannerV2Preferences(preferences),
      generated_plan_json: { plan: planToSave },
    });

    if (saveError) {
      setSaveStatus(saveError.code === "23505" ? "duplicate" : "error");
      return;
    }

    clearPendingSmartPlannerV2Save();
    setSaveStatus("saved");
  }

  // Resume-after-login -- exact same rationale as V1's SmartPlannerApp.tsx: restore the frozen
  // plan (never regenerate), then finish the save automatically once a session actually exists.
  //
  // Deliberately has NO "cancelled" abort flag on the async work (unlike a naive effect-cleanup
  // pattern): React's dev-only Strict Mode double-invokes this effect once on mount, and a
  // cleanup-sets-cancelled flag closes over the FIRST invocation's own promise chain -- so by
  // the time getUser() resolves, that first pass's "cancelled" is already true and the resume
  // silently no-ops, even though the user genuinely IS logged in (confirmed live: getUser()
  // correctly returned the right user id, but the stale cancelled flag threw the result away).
  // resumedRef alone is the correct, sufficient guard here -- it's a ref, so it survives
  // Strict Mode's synthetic remount and prevents a second real save attempt; there is no actual
  // unmount race to protect against on a page whose entire job is running this one resume.
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    const pending = readPendingSmartPlannerV2Save();
    if (!pending) return;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setDateMode(pending.preferences.dateMode);
      if (pending.preferences.dateMode === "flexible") {
        setDurationDays(pending.preferences.durationDays ?? 3);
      } else {
        setArrivalDate(pending.preferences.arrivalDate ?? "");
        setDepartureDate(pending.preferences.departureDate ?? "");
      }
      setSelectedInterests(pending.preferences.interests);
      setIsSurpriseMe(!!pending.preferences.surpriseMe);
      // The frozen pending payload only ever stored the boolean {booked,text} shape (never
      // regenerated regardless) -- "hotel" is a reasonable default redisplay for a resumed
      // booked=true form; it cannot affect the already-generated plan being restored below.
      setAccommodationStatus(pending.preferences.accommodation.booked ? "hotel" : "not_booked");
      setAccommodationText(pending.preferences.accommodation.text ?? "");
      setPlan(pending.plan);
      setPhase("result");
      await handleSave(pending.preferences, pending.plan);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setLoadingPhraseIndex((index) => (index + 1) % LOADING_PHRASES.length);
    }, LOADING_PHRASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">{LOADING_PHRASES[loadingPhraseIndex]}</p>
      </div>
    );
  }

  if (phase === "result" && plan) {
    return (
      <SmartPlannerV2Result
        plan={plan}
        interests={selectedInterests}
        accommodation={currentAccommodation()}
        onEditSelections={() => setPhase("form")}
        onRegenerate={handleRegenerate}
        regenerating={regenerating}
        saveAction={<SaveSmartPlanButton status={saveStatus} onSave={() => void handleSave(currentPreferences(), plan)} />}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Production Launch: the "نسخة تطوير داخلية" internal-QA disclaimer banner was removed
          here -- this component now renders at the real production route
          (/smart-planner/barcelona), not an internal-only QA route, so an "internal dev
          version, not for public use" notice would actively contradict the product's own
          positioning to real customers. Purely a JSX removal -- no generation/scoring/state
          logic touched. */}

      {/* Progress indicator */}
      <div>
        <div className="flex items-center gap-1.5" role="list" aria-label="خطوات إنشاء الرحلة">
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
        <div>
          <h2 className="text-base font-bold text-slate-900">وين مسافر؟</h2>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PLANNER_DESTINATIONS.map((destination) => {
              const active = destination.id === selectedDestinationId;
              if (!destination.available) {
                return (
                  <div
                    key={destination.id}
                    aria-disabled="true"
                    className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center opacity-60"
                  >
                    <span className="text-sm font-bold text-slate-500">
                      {destination.flag} {destination.name}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">قريبًا</span>
                  </div>
                );
              }
              return (
                <button
                  key={destination.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedDestinationId(destination.id)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
                    active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {destination.flag} {destination.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">برشلونة متاحة الآن — وجهات جديدة قريبًا.</p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">متى؟</h2>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {(
              [
                { key: "flexible" as const, label: "مرن" },
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

          {dateMode === "flexible" ? (
            <div className="mt-3">
              <span className="mb-1 block text-xs font-semibold text-slate-600">كم يوم رحلتك؟</span>
              <div className="grid grid-cols-5 gap-2">
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
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">تاريخ الوصول</span>
                  <input
                    type="date"
                    lang="ar"
                    dir="rtl"
                    aria-label="تاريخ الوصول"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">تاريخ المغادرة</span>
                  <input
                    type="date"
                    lang="ar"
                    dir="rtl"
                    aria-label="تاريخ المغادرة"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
              </div>
              {/* Localize Exact-Date Inputs for Arabic/RTL: `lang`/`dir` on the inputs above don't
                  reliably change the native date picker's placeholder/segment order in every
                  browser (a documented browser-native limitation -- the widget largely follows
                  the browser/OS UI locale, not the page's own lang attribute). This static hint
                  names the ACTUAL segment order Chromium renders today ("mm/dd/yyyy" -- month,
                  then day, then year) rather than guessing a generic day/month/year order that
                  would silently mismatch the real widget and confuse the customer more, not less. */}
              <p className="text-[11px] text-slate-400">صيغة التاريخ في الحقل: الشهر / اليوم / السنة</p>
              {dateRangeError ? (
                <p className="text-xs font-semibold text-rose-600">{dateRangeError}</p>
              ) : (
                previewDayCount !== null && <p className="text-xs font-semibold text-teal-700">مدة الرحلة: {previewDayCount} أيام</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* V2InterestSelector already has its own built-in "فاجئني ✨" toggle -- Surprise Me is
          now a real independent mode (isSurpriseMe), not a preset that fills selectedInterests. */}
      {step === 3 && (
        <V2InterestSelector
          selected={selectedInterests}
          onChange={(next) => {
            setSelectedInterests(next);
            setIsSurpriseMe(false);
          }}
          surpriseMeActive={isSurpriseMe}
          onSurpriseMe={() => {
            setIsSurpriseMe(true);
            setSelectedInterests([]);
          }}
        />
      )}

      {step === 4 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">السكن</h2>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS.map((option) => {
              const active = option.value === accommodationStatus;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setAccommodationStatus(option.value);
                    if (option.value === "not_booked") setAccommodationText("");
                  }}
                  className={`rounded-2xl border px-2 py-4 text-sm font-bold transition-colors ${
                    active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {accommodationTextRequired && (
            <label className="mt-3 block">
              <span className="sr-only">اسم الفندق، الشقة أو العنوان</span>
              <input
                type="text"
                dir="auto"
                aria-label="اسم الفندق، الشقة أو العنوان"
                value={accommodationText}
                onChange={(e) => setAccommodationText(e.target.value)}
                placeholder="اسم الفندق، الشقة أو العنوان"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              />
            </label>
          )}
        </div>
      )}

      {error && <p className="text-center text-sm font-semibold text-rose-600">{error}</p>}

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
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            ابنِ خطتي ✨
          </button>
        )}
      </div>
    </div>
  );
}
