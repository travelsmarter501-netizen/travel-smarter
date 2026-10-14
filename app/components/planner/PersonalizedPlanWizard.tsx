"use client";

import { useState } from "react";
import V2InterestSelector from "../smart-planner-v2/V2InterestSelector";
import Price from "../Price";
import { startPersonalizedPlanCheckout } from "../../planner/actions";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { inclusiveDayCount } from "../../lib/planner/dateOnly";
import { V2_INTEREST_DISPLAY_GROUPS, isV2DisplayGroupActive } from "../../lib/planner/v2PlannerTypes";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";
import { PLANNER_DESTINATIONS, DEFAULT_PLANNER_DESTINATION_ID, isAvailablePlannerDestinationId } from "../../lib/planner/plannerDestinations";
import { MAX_ACCOMMODATION_TEXT_LENGTH, MAX_PERSONALIZED_PLAN_DAYS, destinationIncludesGuide } from "../../lib/planner/personalizedPlanAnswers";
import type { CheckoutErrorCode } from "../../lib/commerce/checkoutErrors";

type Phase = "form" | "review";
type DateMode = "flexible" | "specific";
type AccommodationStatus = "hotel" | "apartment" | "not_booked";

const DAY_OPTIONS = Array.from({ length: MAX_PERSONALIZED_PLAN_DAYS }, (_, i) => i + 1);
type Step = 1 | 2 | 3 | 4;

const choiceClass = (active: boolean) =>
  active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300";

/**
 * Personalized Plan -- the questionnaire AND the pre-payment review, in one client component.
 *
 * Nothing is generated here, nothing paid-for is shown, and no plan engine / guide data is imported: the four
 * questions only collect answers (the same four the planner always asked: destination, when, interests,
 * accommodation). The last step opens a REVIEW of the order -- destination, days, interests, product, price and
 * what is included -- and only its "Continue to payment" button calls startPersonalizedPlanCheckout, a Server
 * Action that re-validates the answers, stores them against a new pending order and sends the customer to Allpay.
 *
 * Everything the customer sees is bilingual through the site's language system (t.planner).
 */
export default function PersonalizedPlanWizard({
  initialDestinationId,
  priceIls,
  signedIn,
}: {
  initialDestinationId?: string;
  /** Display only -- the amount actually charged is computed in the database from the same products row. */
  priceIls: number | null;
  signedIn: boolean;
}) {
  const { t, language } = useLanguage();
  const copy = t.planner;
  const wizard = copy.wizard;
  const review = copy.review;

  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState<Step>(1);
  const [destinationId, setDestinationId] = useState<string>(
    isAvailablePlannerDestinationId(initialDestinationId) ? (initialDestinationId as string) : DEFAULT_PLANNER_DESTINATION_ID
  );
  const [dateMode, setDateMode] = useState<DateMode>("flexible");
  const [durationDays, setDurationDays] = useState(3);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [interests, setInterests] = useState<V2PlannerInterest[]>([]);
  const [surpriseMe, setSurpriseMe] = useState(false);
  const [accommodationStatus, setAccommodationStatus] = useState<AccommodationStatus | null>(null);
  const [accommodationText, setAccommodationText] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<{ code?: CheckoutErrorCode; message: string } | null>(null);

  const inputDir = language === "ar" ? "rtl" : "ltr";
  const destinationName = wizard.destinationNames[destinationId] ?? destinationId;

  // Client-side preview only; the server recomputes and re-validates everything.
  const previewDays = dateMode === "specific" && arrivalDate && departureDate ? inclusiveDayCount(arrivalDate, departureDate) : null;
  const dateRangeError =
    dateMode === "specific" && arrivalDate && departureDate
      ? previewDays === null
        ? wizard.errDepartureBeforeArrival
        : previewDays > MAX_PERSONALIZED_PLAN_DAYS
          ? wizard.errMaxDays
          : null
      : null;

  const accommodationTextRequired = accommodationStatus === "hotel" || accommodationStatus === "apartment";
  const stepValid: Record<Step, boolean> = {
    1: !!destinationId,
    2: dateMode === "flexible" ? true : !!arrivalDate && !!departureDate && !dateRangeError,
    3: interests.length >= 1 || surpriseMe,
    4: accommodationStatus !== null && (!accommodationTextRequired || accommodationText.trim().length > 0),
  };
  const canReview = stepValid[1] && stepValid[2] && stepValid[3] && stepValid[4];
  const tripDays = dateMode === "flexible" ? durationDays : previewDays;

  function buildAnswers() {
    return {
      dateMode,
      ...(dateMode === "flexible" ? { durationDays } : { arrivalDate, departureDate }),
      interests: surpriseMe ? [] : interests,
      surpriseMe,
      accommodation: accommodationTextRequired ? { booked: true, text: accommodationText.trim() } : { booked: false },
    };
  }

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const result = await startPersonalizedPlanCheckout({ destinationId, answers: buildAnswers(), email: signedIn ? undefined : email });
      if (!result.ok) {
        setPaying(false);
        setError({ code: result.code, message: result.error });
        return;
      }
      window.location.href = result.paymentUrl;
    } catch {
      setPaying(false);
      setError({ message: copy.generateErrors.unexpected });
    }
  }

  const interestsLabel = surpriseMe
    ? wizard.surpriseMe
    : V2_INTEREST_DISPLAY_GROUPS.filter((group) => isV2DisplayGroupActive(interests, group))
        .map((group) => wizard.interestGroups[group.id] ?? group.label)
        .join(" + ");

  // ───────────────────────────── review ─────────────────────────────
  if (phase === "review") {
    const rows: { label: string; value: string }[] = [
      { label: review.destination, value: destinationName },
      { label: review.days, value: String(tripDays ?? "") },
      ...(dateMode === "specific" ? [{ label: review.dates, value: `${arrivalDate} → ${departureDate}` }] : []),
      { label: review.interests, value: interestsLabel },
      { label: review.accommodation, value: accommodationTextRequired ? accommodationText.trim() : review.accommodationNotBooked },
      { label: review.productType, value: review.productTypeValue },
    ];

    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900">{fillCopy(review.title, { destination: destinationName })}</h2>

        <section aria-label={review.summaryHeading} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="space-y-2.5 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <dt className="shrink-0 font-semibold text-slate-500">{row.label}</dt>
                <dd dir="auto" className="text-end font-semibold text-slate-900">
                  {row.value}
                </dd>
              </div>
            ))}
            {priceIls !== null && (
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                <dt className="font-semibold text-slate-500">{review.price}</dt>
                <dd className="text-lg font-bold text-slate-900">
                  <Price ils={priceIls} />
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-3xl border border-teal-200 bg-teal-50/70 p-5">
          <h3 className="text-sm font-bold text-teal-800">{review.includedHeading}</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            {review.includedItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
            {destinationIncludesGuide(destinationId) && (
              <li className="flex gap-2">
                <span aria-hidden="true">✓</span>
                <span>
                  {fillCopy(review.includedGuide, { destination: destinationName })}
                  <span className="ms-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-teal-700">🎁 {review.guideFreeNote}</span>
                </span>
              </li>
            )}
          </ul>
        </section>

        {!signedIn && (
          <div>
            <label htmlFor="planner-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
              {review.emailLabel}
            </label>
            <input
              id="planner-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">{review.emailHint}</p>
          </div>
        )}

        <p className="text-xs leading-5 text-slate-500">{review.oneTripNote}</p>

        {error && (
          <p role="alert" className="text-sm font-semibold text-rose-600">
            {error.code ? t.checkout.errors[error.code] : error.message}
          </p>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPhase("form");
              setError(null);
            }}
            disabled={paying}
            className="rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 disabled:opacity-60"
          >
            {review.editAnswers}
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={paying || (!signedIn && email.trim().length === 0)}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {paying ? review.payRedirecting : review.payCta}
          </button>
        </div>
      </div>
    );
  }

  // ───────────────────────────── questionnaire ─────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5" role="list" aria-label={wizard.progressAria}>
          {([1, 2, 3, 4] as const).map((n) => (
            <span
              key={n}
              role="listitem"
              aria-current={step === n ? "step" : undefined}
              className={`h-1.5 flex-1 rounded-full transition-colors ${n <= step ? "bg-teal-700" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-bold text-slate-500">
          {fillCopy(wizard.stepOf, { step, total: 4, label: wizard.stepLabels[step - 1] })}
        </p>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">{wizard.destinationTitle}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PLANNER_DESTINATIONS.map((destination) => {
              const name = wizard.destinationNames[destination.id] ?? destination.name;
              if (!destination.available) {
                return (
                  <div
                    key={destination.id}
                    aria-disabled="true"
                    className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center opacity-60"
                  >
                    <span className="text-sm font-bold text-slate-500">
                      {destination.flag} {name}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">{wizard.comingSoon}</span>
                  </div>
                );
              }
              return (
                <button
                  key={destination.id}
                  type="button"
                  aria-pressed={destination.id === destinationId}
                  onClick={() => setDestinationId(destination.id)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${choiceClass(destination.id === destinationId)}`}
                >
                  {destination.flag} {name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">{wizard.availableNote}</p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">{wizard.whenTitle}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {(
              [
                { key: "flexible" as const, label: wizard.flexible },
                { key: "specific" as const, label: wizard.specificDates },
              ]
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={option.key === dateMode}
                onClick={() => setDateMode(option.key)}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${choiceClass(option.key === dateMode)}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {dateMode === "flexible" ? (
            <div className="mt-3">
              <span className="mb-1 block text-xs font-semibold text-slate-600">{wizard.howManyDays}</span>
              <div className="grid grid-cols-5 gap-2">
                {DAY_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={count === durationDays}
                    onClick={() => setDurationDays(count)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${choiceClass(count === durationDays)}`}
                  >
                    {count} {count === 1 ? wizard.dayOne : wizard.dayMany}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{wizard.arrivalDate}</span>
                  <input
                    type="date"
                    lang={language}
                    dir={inputDir}
                    aria-label={wizard.arrivalDate}
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{wizard.departureDate}</span>
                  <input
                    type="date"
                    lang={language}
                    dir={inputDir}
                    aria-label={wizard.departureDate}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400">{wizard.dateFormatHint}</p>
              {dateRangeError ? (
                <p className="text-xs font-semibold text-rose-600">{dateRangeError}</p>
              ) : (
                previewDays !== null && <p className="text-xs font-semibold text-teal-700">{fillCopy(wizard.tripLength, { n: previewDays })}</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <V2InterestSelector
          selected={interests}
          onChange={(next) => {
            setInterests(next);
            setSurpriseMe(false);
          }}
          surpriseMeActive={surpriseMe}
          onSurpriseMe={() => {
            setSurpriseMe(true);
            setInterests([]);
          }}
        />
      )}

      {step === 4 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">{wizard.accommodationTitle}</h2>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {(
              [
                { value: "hotel" as const, label: wizard.hotel },
                { value: "apartment" as const, label: wizard.apartment },
                { value: "not_booked" as const, label: wizard.notBooked },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={option.value === accommodationStatus}
                onClick={() => {
                  setAccommodationStatus(option.value);
                  if (option.value === "not_booked") setAccommodationText("");
                }}
                className={`rounded-2xl border px-2 py-4 text-sm font-bold transition-colors ${choiceClass(option.value === accommodationStatus)}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {accommodationTextRequired && (
            <label className="mt-3 block">
              <span className="sr-only">{wizard.accommodationTextLabel}</span>
              <input
                type="text"
                dir="auto"
                maxLength={MAX_ACCOMMODATION_TEXT_LENGTH}
                aria-label={wizard.accommodationTextLabel}
                value={accommodationText}
                onChange={(e) => setAccommodationText(e.target.value)}
                placeholder={wizard.accommodationTextLabel}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              />
            </label>
          )}
          {!stepValid[4] && <p className="mt-2 text-xs text-slate-400">{wizard.accommodationHint}</p>}
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300"
          >
            {wizard.back}
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!stepValid[step]}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {wizard.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPhase("review")}
            disabled={!canReview}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {wizard.reviewOrder}
          </button>
        )}
      </div>
    </div>
  );
}
