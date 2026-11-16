"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import V2InterestSelector from "../smart-planner-v2/V2InterestSelector";
import { useLanguage } from "../../lib/language";
import { usePlannerCopy } from "../../lib/usePlannerCopy";
import { fillCopy, type PlannerGenerateErrorCode } from "../../lib/plannerCopy";
import { inclusiveDayCount } from "../../lib/planner/dateOnly";
import { writePlannerDraft, type PlannerAccommodationStatus, type PlannerDraft } from "../../lib/planner/plannerDraft";
import { CHECKOUT_PERSONALIZED } from "../../lib/planner/planLinks";
import { generateOwnerPlanAction } from "../../planner/actions";
import PlanGeneratingScreen from "./PlanGeneratingScreen";
import TextWithPrice from "../home/TextWithPrice";
import { QUIZ_CHOICE_BASE, QUIZ_PRESS, quizChoiceClass, quizHaptic } from "./quizFeedback";
import { PLAN_PRICE_ILS } from "../home/homeOffer";
import type { V2PlannerInterest } from "../../lib/planner/v2PlannerTypes";
import { PLANNER_DESTINATIONS, DEFAULT_PLANNER_DESTINATION_ID, interestGroupLabelForDestination, isAvailablePlannerDestinationId, isPreviewPlannerDestinationId, plannerDestinationName } from "../../lib/planner/plannerDestinations";
import { MAX_ACCOMMODATION_TEXT_LENGTH, MAX_PERSONALIZED_PLAN_DAYS } from "../../lib/planner/personalizedPlanAnswers";
import { tripDateMessages, tripLengthLimit, unavailableTripDates } from "../../lib/planner/tripLengthLimits";

type DateMode = "flexible" | "specific";

const DAY_OPTIONS = Array.from({ length: MAX_PERSONALIZED_PLAN_DAYS }, (_, i) => i + 1);
type Step = 1 | 2 | 3 | 4;

/** Selected / unselected look of every choice in the questionnaire (Rhyme-like: light fill, dark text, thin blue frame). */
const choiceClass = (active: boolean) => `${QUIZ_CHOICE_BASE} ${quizChoiceClass(active)}`;

/**
 * Personalized Plan -- the free questionnaire.
 *
 * Nothing is generated here, nothing paid-for is shown, and no plan engine / guide data is imported: the four
 * questions only collect answers (destination, when, interests, accommodation). The last button saves them in this
 * tab's session storage (see lib/planner/plannerDraft.ts) and opens /checkout?plan=personalized, where a compact summary
 * and the Allpay button live. The server validates and stores the answers only when the customer presses pay there.
 *
 * `initialDraft` (only when the customer came back via "Edit answers") pre-fills every answer and opens the last step.
 * Everything the customer sees is bilingual through the site's language system (t.planner).
 */
export default function PersonalizedPlanWizard({
  initialDestinationId,
  initialDraft = null,
  owner = false,
  editPlanId = null,
}: {
  initialDestinationId?: string;
  initialDraft?: PlannerDraft | null;
  /**
   * The signed-in customer OWNS the Personalized Plan (decided on the server). The last step then creates the plan straight away -- no
   * checkout, no payment. The server re-checks ownership on the action itself, so this flag only chooses the button.
   */
  owner?: boolean;
  /** An owner editing one of their plans: the same questionnaire, pre-filled, whose last step regenerates THAT plan in place. */
  editPlanId?: string | null;
}) {
  const { language } = useLanguage();
  const router = useRouter();
  const plannerCopy = usePlannerCopy();
  const wizard = plannerCopy.wizard;
  const generateErrors = plannerCopy.generateErrors;

  const [step, setStep] = useState<Step>(initialDraft ? 4 : 1);
  const [destinationId, setDestinationId] = useState<string>(
    initialDraft?.destinationId ?? (isAvailablePlannerDestinationId(initialDestinationId) ? (initialDestinationId as string) : DEFAULT_PLANNER_DESTINATION_ID)
  );
  const [dateMode, setDateMode] = useState<DateMode>(initialDraft?.answers.dateMode ?? "flexible");
  const [durationDays, setDurationDays] = useState(initialDraft?.answers.durationDays ?? 3);
  const [arrivalDate, setArrivalDate] = useState(initialDraft?.answers.arrivalDate ?? "");
  const [departureDate, setDepartureDate] = useState(initialDraft?.answers.departureDate ?? "");
  const [interests, setInterests] = useState<V2PlannerInterest[]>(initialDraft?.answers.interests ?? []);
  const [surpriseMe, setSurpriseMe] = useState(initialDraft?.answers.surpriseMe ?? false);
  const [accommodationStatus, setAccommodationStatus] = useState<PlannerAccommodationStatus | null>(initialDraft?.accommodationStatus ?? null);
  const [accommodationText, setAccommodationText] = useState(initialDraft?.answers.accommodation.text ?? "");
  const [saveFailed, setSaveFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<PlannerGenerateErrorCode | null>(null);

  const inputDir = language === "en" ? "ltr" : "rtl";

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

  // Per-destination trip length (lib/planner/tripLengthLimits.ts, Budapest only today): the same rule the server applies. It is never
  // applied silently: an answer over the limit blocks "next" with the reason and the visitor's options (fewer days / other dates / another
  // interest), and only the visitor's own click changes the length.
  const lengthLimit = tripLengthLimit(destinationId, surpriseMe ? [] : interests, surpriseMe);
  const tripDays = dateMode === "flexible" ? durationDays : previewDays;
  const overLimit = !!lengthLimit && tripDays !== null && tripDays > lengthLimit.maxDays && !dateRangeError;
  const daysPhrase = (n: number) => (n === 1 ? wizard.daysPhraseOne : n === 2 ? wizard.daysPhraseTwo : fillCopy(wizard.daysPhraseMany, { n }));
  const lengthLimitText = (() => {
    if (!lengthLimit) return null;
    const city = wizard.destinationNames[destinationId] ?? plannerDestinationName(destinationId, language);
    const days = daysPhrase(lengthLimit.maxDays);
    if (lengthLimit.reason === "destination") return fillCopy(wizard.limitDestination, { city, days });
    const groups = lengthLimit.groupIds.map((id) => interestGroupLabelForDestination(destinationId, id, language) ?? wizard.interestGroups[id] ?? id).join(" + ");
    return fillCopy(wizard.limitInterests, { interests: groups, city, days });
  })();
  const lengthFixText = (() => {
    if (!lengthLimit) return null;
    const orInterest = lengthLimit.reason === "interests";
    // One day: no "or fewer"; with dates, arrival and departure on the same day.
    if (lengthLimit.maxDays === 1) {
      if (dateMode === "flexible") return orInterest ? wizard.limitFixOneDayOrInterest : wizard.limitFixOneDay;
      return orInterest ? wizard.limitFixOneDateOrInterest : wizard.limitFixOneDate;
    }
    const template = dateMode === "flexible" ? (orInterest ? wizard.limitFixDaysOrInterest : wizard.limitFixDays) : orInterest ? wizard.limitFixDatesOrInterest : wizard.limitFixDates;
    return fillCopy(template, { days: daysPhrase(lengthLimit.maxDays) });
  })();

  // Temporary launch scope by date (same function as the server): dated trips touching those dates are refused with the message; the
  // dates are never changed for the visitor. Undated plans get a short note instead.
  const dateMessages = tripDateMessages(destinationId, language);
  const datesUnavailable = dateMode === "specific" && !!arrivalDate && !!departureDate && !dateRangeError && !!unavailableTripDates(destinationId, arrivalDate, departureDate);

  const accommodationTextRequired = accommodationStatus === "hotel" || accommodationStatus === "apartment";
  const stepValid: Record<Step, boolean> = {
    1: !!destinationId,
    2: (dateMode === "flexible" ? true : !!arrivalDate && !!departureDate && !dateRangeError) && !overLimit && !datesUnavailable,
    3: (interests.length >= 1 || surpriseMe) && !overLimit,
    4: accommodationStatus !== null && (!accommodationTextRequired || accommodationText.trim().length > 0),
  };
  const canContinue = stepValid[1] && stepValid[2] && stepValid[3] && stepValid[4];

  const buildAnswers = () => ({
    dateMode,
    ...(dateMode === "flexible" ? { durationDays } : { arrivalDate, departureDate }),
    interests: surpriseMe ? [] : interests,
    surpriseMe,
    accommodation: accommodationTextRequired ? { booked: true, text: accommodationText.trim() } : { booked: false },
  });

  // Someone who has not bought the Personalized Plan yet: save the answers in this tab and go to the normal checkout.
  function handleContinue() {
    if (!canContinue || accommodationStatus === null) return;
    const saved = writePlannerDraft({ destinationId, answers: buildAnswers(), accommodationStatus });
    if (!saved) {
      setSaveFailed(true);
      return;
    }
    router.push(CHECKOUT_PERSONALIZED);
  }

  // An owner: create (or, when editing, regenerate in place) the plan with no payment. Ownership is verified on the server.
  async function handleCreate() {
    if (!canContinue) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await generateOwnerPlanAction({ destinationId, answers: buildAnswers(), replacePlanId: editPlanId });
      if (result.ok) {
        router.push(`/smart-planner/barcelona-v2/saved/${result.planId}`);
        return;
      }
      setCreateError(result.code);
    } catch {
      setCreateError("unexpected");
    }
    setCreating(false);
  }

  if (creating) return <PlanGeneratingScreen />;

  // Dates this destination does not offer: the message, and (after the dates step, e.g. an edited plan) a way back to the dates.
  const datesUnavailableBlock =
    datesUnavailable && dateMessages ? (
      <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-900">
        <p>{dateMessages.unavailable}</p>
        {step !== 2 && (
          <button
            type="button"
            onClick={() => {
              quizHaptic();
              setStep(2);
            }}
            className={`mt-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${QUIZ_PRESS}`}
          >
            {wizard.limitChangeDates}
          </button>
        )}
      </div>
    ) : null;

  // The reason and the options, on the step where the answer stopped fitting (dates, interests) and on the last step (an edited plan).
  const lengthLimitBlock =
    overLimit && lengthLimit ? (
      <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
        <p className="font-semibold">{lengthLimitText}</p>
        <p>{lengthFixText}</p>
        {(dateMode === "flexible" || step !== 2) && (
          <button
            type="button"
            onClick={() => {
              quizHaptic();
              if (dateMode === "flexible") setDurationDays(lengthLimit.maxDays);
              else setStep(2);
            }}
            className={`mt-2 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${QUIZ_PRESS}`}
          >
            {dateMode === "flexible" ? fillCopy(wizard.limitUseMax, { days: daysPhrase(lengthLimit.maxDays) }) : wizard.limitChangeDates}
          </button>
        )}
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      {owner && (editPlanId ? wizard.editingNote : wizard.ownerIntro) && (
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-xs font-semibold leading-5 text-teal-800">{editPlanId ? wizard.editingNote : wizard.ownerIntro}</p>
      )}
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
        <p className="mt-2 text-xs font-bold text-slate-500">{fillCopy(wizard.stepOf, { step, total: 4, label: wizard.stepLabels[step - 1] })}</p>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-bold text-slate-900">{wizard.destinationTitle}</h2>
          <div className="mt-2 grid grid-cols-1 gap-2.5">
            {/* Selectable: publicly available cities (+ a local-preview city when that switch is on). Editing a plan keeps its city. */}
            {PLANNER_DESTINATIONS.filter((destination) => isAvailablePlannerDestinationId(destination.id) && (!editPlanId || destination.id === destinationId)).map((destination) => {
              const name = wizard.destinationNames[destination.id] ?? destination.name;
              const selected = destination.id === destinationId;
              return (
                <button
                  key={destination.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    if (destination.id !== destinationId) quizHaptic();
                    setDestinationId(destination.id);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-base font-bold ${choiceClass(selected)}`}
                >
                  <span>
                    {destination.flag} {name}
                    {isPreviewPlannerDestinationId(destination.id) && <span className="ms-2 text-xs font-semibold text-amber-700">(معاينة)</span>}
                  </span>
                  {selected && <span aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{wizard.availableNote}</p>
          {/* The other target cities stay unavailable (nothing here can be selected): shown as small chips so they do not push the questions down. */}
          <div aria-disabled="true" className="mt-4">
            <p className="text-xs font-semibold text-slate-500">{wizard.comingSoon}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {PLANNER_DESTINATIONS.filter((destination) => !isAvailablePlannerDestinationId(destination.id)).map((destination) => (
                <li key={destination.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {destination.flag} {wizard.destinationNames[destination.id] ?? destination.name}
                </li>
              ))}
            </ul>
          </div>
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
                onClick={() => {
                  if (option.key !== dateMode) quizHaptic();
                  setDateMode(option.key);
                }}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold ${choiceClass(option.key === dateMode)}`}
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
                    // Over this destination's limit: not selectable; the reason is shown under the buttons.
                    disabled={!!lengthLimit && count > lengthLimit.maxDays}
                    onClick={() => {
                      if (count !== durationDays) quizHaptic();
                      setDurationDays(count);
                    }}
                    className={`rounded-xl border px-2 py-2.5 pointer-coarse:min-h-11 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${choiceClass(count === durationDays)}`}
                  >
                    {count} {count === 1 ? wizard.dayOne : wizard.dayMany}
                  </button>
                ))}
              </div>
              {lengthLimit && !overLimit && <p className="mt-2 text-xs text-slate-500">{lengthLimitText}</p>}
              {lengthLimitBlock}
              {dateMessages && <p className="mt-2 text-xs leading-5 text-slate-500">{dateMessages.undatedNote}</p>}
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
              {lengthLimit && !overLimit && <p className="text-xs text-slate-500">{lengthLimitText}</p>}
              {lengthLimitBlock}
              {datesUnavailableBlock}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
        <V2InterestSelector
          destinationId={destinationId}
          selected={interests}
          onChange={(next) => {
            // Toggling an interest always changes the selection (adds or removes it, and ends "Surprise me").
            if (surpriseMe || next.length !== interests.length || next.some((key) => !interests.includes(key))) quizHaptic();
            setInterests(next);
            setSurpriseMe(false);
          }}
          surpriseMeActive={surpriseMe}
          onSurpriseMe={() => {
            if (!surpriseMe) quizHaptic();
            setSurpriseMe(true);
            setInterests([]);
          }}
        />
        {lengthLimitBlock}
        {datesUnavailableBlock}
        </div>
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
                  if (option.value !== accommodationStatus) quizHaptic();
                  setAccommodationStatus(option.value);
                  if (option.value === "not_booked") setAccommodationText("");
                }}
                className={`rounded-2xl border px-2 py-4 text-sm font-bold ${choiceClass(option.value === accommodationStatus)}`}
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
          {lengthLimitBlock}
          {datesUnavailableBlock}
        </div>
      )}

      {saveFailed && (
        <p role="alert" className="text-center text-sm font-semibold text-rose-600">
          {wizard.draftSaveFailed}
        </p>
      )}

      {createError && (
        <p role="alert" className="text-center text-sm font-semibold text-rose-600">
          {generateErrors[createError]}
        </p>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className={`rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${QUIZ_PRESS}`}
          >
            {wizard.back}
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!stepValid[step]}
            className={`flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60 disabled:active:scale-100 ${QUIZ_PRESS}`}
          >
            {wizard.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={owner ? handleCreate : handleContinue}
            disabled={!canContinue}
            className="flex flex-1 items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {owner ? (editPlanId ? wizard.updateMyPlan : wizard.createMyPlan) : wizard.continueToCheckout}
          </button>
        )}
      </div>
      {step === 4 && !owner && (
        <p className="text-center text-xs leading-5 text-slate-500">
          <TextWithPrice text={wizard.priceNote} ils={PLAN_PRICE_ILS} priceClassName="font-semibold text-slate-700" />
        </p>
      )}
    </div>
  );
}
