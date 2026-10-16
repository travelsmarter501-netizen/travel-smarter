"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Price from "../Price";
import { startComplimentaryPlan, startPersonalizedPlanCheckout } from "../../planner/actions";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { clearPlannerDraft, parsePlannerDraft, readPlannerDraftRaw } from "../../lib/planner/plannerDraft";
import { destinationIncludesGuide } from "../../lib/planner/personalizedPlanAnswers";
import { V2_INTEREST_DISPLAY_GROUPS, isV2DisplayGroupActive } from "../../lib/planner/v2PlannerTypes";
import type { CheckoutErrorCode } from "../../lib/commerce/checkoutErrors";
import type { ComplimentaryErrorCode } from "../../lib/commerce/personalizedPlan";

const noopSubscribe = () => () => {};

/**
 * /checkout for a Personalized Plan (/checkout?plan=personalized): a compact summary of what is being bought, the
 * guest email field, and the existing Allpay button.
 *
 * The summary is built from the draft the questionnaire left in this tab's session storage -- display only. Pressing
 * pay sends those answers to startPersonalizedPlanCheckout, which validates and re-builds them on the server, stores
 * them with the new order (one transaction, price from the database) and only then hands the customer to Allpay.
 * Nothing here decides the price, the destination that gets stored, or what is granted afterwards.
 */
export default function PersonalizedPlanCheckout({
  testMode = false,
  signedIn = false,
  priceIls,
  complimentary = false,
}: {
  testMode?: boolean;
  signedIn?: boolean;
  /**
   * True only for an allowlisted account (decided on the server). Replaces the Allpay button with "create my complimentary
   * plan": the same questionnaire, no payment. It is a UI switch only -- the server action re-checks the allowlist itself.
   */
  complimentary?: boolean;
  /** Display only -- the amount charged is computed in the database from the same products row. */
  priceIls: number | null;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const copy = t.planner;
  const summary = copy.checkoutSummary;

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const rawDraft = useSyncExternalStore(noopSubscribe, readPlannerDraftRaw, () => null);
  const draft = useMemo(() => parsePlannerDraft(rawDraft), [rawDraft]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code?: CheckoutErrorCode; message: string } | null>(null);
  const [complimentaryError, setComplimentaryError] = useState<ComplimentaryErrorCode | null>(null);

  async function handlePay() {
    if (!draft) return;
    setLoading(true);
    setError(null);
    try {
      const result = await startPersonalizedPlanCheckout({ destinationId: draft.destinationId, answers: draft.rawAnswers, email: signedIn ? undefined : email });
      if (!result.ok) {
        setLoading(false);
        setError({ code: result.code, message: result.error });
        return;
      }
      window.location.href = result.paymentUrl;
    } catch {
      setLoading(false);
      setError({ message: copy.generateErrors.unexpected });
    }
  }

  async function handleComplimentary() {
    if (!draft) return;
    setLoading(true);
    setComplimentaryError(null);
    try {
      const result = await startComplimentaryPlan({ destinationId: draft.destinationId, answers: draft.rawAnswers });
      if (!result.ok) {
        setLoading(false);
        setComplimentaryError(result.code);
        return;
      }
      clearPlannerDraft();
      router.push("/planner");
    } catch {
      setLoading(false);
      setComplimentaryError("create_failed");
    }
  }

  const destinationName = draft ? (copy.wizard.destinationNames[draft.destinationId] ?? draft.destinationId) : "";
  const days = draft?.answers.days ?? 0;
  const daysText = days === 1 ? `1 ${copy.wizard.dayOne}` : fillCopy(copy.mine.daysCount, { n: days });
  const interestsText = !draft
    ? ""
    : draft.answers.surpriseMe
      ? copy.wizard.surpriseMe
      : V2_INTEREST_DISPLAY_GROUPS.filter((group) => isV2DisplayGroupActive(draft.answers.interests, group))
          .map((group) => copy.wizard.interestGroups[group.id] ?? group.label)
          .join(language === "ar" ? "، " : ", ");
  const accommodationText = draft?.answers.accommodation.booked ? (draft.answers.accommodation.text ?? "") : summary.accommodationNotBooked;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {testMode && <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{t.checkout.testBadge}</p>}
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t.checkout.title}</h1>

      {!mounted ? null : !draft ? (
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-slate-900">{summary.missingTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{summary.missingBody}</p>
          <Link
            href="/planner"
            className="mt-5 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            {summary.backToPlanner}
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border border-slate-200 p-4">
            <h2 dir="auto" className="text-base font-bold text-slate-900">
              {fillCopy(summary.title, { destination: destinationName })}
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              <li>{daysText}</li>
              <li dir="auto">{fillCopy(summary.interests, { interests: interestsText })}</li>
              <li dir="auto">{fillCopy(summary.accommodation, { accommodation: accommodationText })}</li>
            </ul>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-sm font-bold text-teal-800">{summary.includesHeading}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
                <li className="flex gap-2">
                  <span aria-hidden="true">✓</span>
                  <span>{summary.includedPlan}</span>
                </li>
                {destinationIncludesGuide(draft.destinationId) && (
                  <li className="flex gap-2">
                    <span aria-hidden="true">✓</span>
                    <span>{fillCopy(summary.includedGuide, { destination: destinationName })}</span>
                  </li>
                )}
              </ul>
            </div>

            {complimentary ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="font-semibold text-slate-600">{summary.price}</span>
                <span className="text-lg font-bold text-teal-700">{summary.complimentaryPrice}</span>
              </div>
            ) : (
              priceIls !== null && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="font-semibold text-slate-600">{summary.price}</span>
                  <span className="text-lg font-bold text-slate-900">
                    <Price ils={priceIls} />
                  </span>
                </div>
              )
            )}
          </section>

          {complimentary ? (
            <>
              <p className="mt-6 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold leading-6 text-teal-800">{summary.complimentaryNotice}</p>
              {complimentaryError && (
                <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
                  {copy.complimentaryErrors[complimentaryError]}
                </p>
              )}
              <button
                type="button"
                onClick={handleComplimentary}
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
              >
                {loading ? summary.complimentaryCreating : summary.complimentaryCta}
              </button>
            </>
          ) : (
            <>
            {!signedIn && (
              <div className="mt-6">
                <label htmlFor="checkout-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  {summary.emailLabel}
                </label>
                <input
                  id="checkout-email"
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
                <p className="mt-2 text-xs leading-5 text-slate-500">{summary.emailHint}</p>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
                {error.code ? t.checkout.errors[error.code] : error.message}
              </p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading || (!signedIn && email.trim().length === 0)}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? t.checkout.redirecting : testMode ? t.checkout.payButtonTest : t.checkout.payButton}
            </button>

            </>
          )}

          <p className="mt-4 text-center">
            <Link href="/planner?edit=1" className="text-sm font-semibold text-teal-700 hover:underline">
              {summary.editAnswers}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
