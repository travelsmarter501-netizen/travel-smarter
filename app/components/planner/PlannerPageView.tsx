"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import PersonalizedPlanWizard from "./PersonalizedPlanWizard";
import MyPersonalizedPlans from "./MyPersonalizedPlans";
import ScrollToTop from "../ScrollToTop";
import { useLanguage } from "../../lib/language";
import { readPlannerDraft } from "../../lib/planner/plannerDraft";
import type { PlannerPlanSummary, PlannerRequestSummary } from "../../lib/commerce/personalizedPlan";

const noopSubscribe = () => () => {};

/**
 * The questionnaire. Normally it renders straight away; when restoring a draft it waits until the page has hydrated
 * (session storage does not exist on the server), so the pre-filled first render can never disagree with the server's.
 */
function WizardSlot({ initialDestinationId, restoreDraft, signedIn, hasPlans }: { initialDestinationId?: string; restoreDraft: boolean; signedIn: boolean; hasPlans: boolean }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (restoreDraft && !mounted) return null;
  return <PersonalizedPlanWizard initialDestinationId={initialDestinationId} initialDraft={restoreDraft ? readPlannerDraft() : null} signedIn={signedIn} hasPlans={hasPlans} />;
}

/**
 * The /planner page body (the server page decides WHICH view and loads the data; this component only renders it,
 * in the visitor's language):
 *   - "wizard": the free questionnaire -> checkout, for visitors, first-time buyers and anyone who chose
 *     "Create a new plan";
 *   - "mine": "My Personalized Plans" for a signed-in customer who already has plans/requests.
 */
export default function PlannerPageView({
  view,
  initialDestinationId,
  restoreDraft = false,
  signedIn,
  hasPlans,
  legacyOwnerNotice = false,
  plans,
  archivedPlans = [],
  requests,
}: {
  view: "wizard" | "mine";
  initialDestinationId?: string;
  /** Came back from checkout via "Edit answers": pre-fill the questionnaire from this tab's saved draft. */
  restoreDraft?: boolean;
  signedIn: boolean;
  /** The signed-in customer already has plans/requests, so the wizard offers a way back to them. */
  hasPlans: boolean;
  /** The customer owns the product from before the questionnaire-first model but has no plan or request. */
  legacyOwnerNotice?: boolean;
  plans: PlannerPlanSummary[];
  /** Plans the customer removed from My Plans (still stored, restorable). */
  archivedPlans?: PlannerPlanSummary[];
  requests: PlannerRequestSummary[];
}) {
  const { t } = useLanguage();
  const copy = t.planner;

  return (
    <main className="pb-10">
      <ScrollToTop />
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
          {copy.page.backHome}
        </Link>

        {view === "mine" ? (
          <div className="mt-4">
            <MyPersonalizedPlans plans={plans} archivedPlans={archivedPlans} requests={requests} />
          </div>
        ) : (
          <>
            {hasPlans && (
              <p className="mt-3">
                <Link href="/planner" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                  {copy.mine.title}
                </Link>
              </p>
            )}
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{copy.page.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{copy.page.subtitle}</p>
            </div>
            <p className="mt-4 text-center text-sm font-semibold text-teal-700">{copy.page.tagline}</p>

            {legacyOwnerNotice && (
              <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                <h2 className="text-base font-bold text-slate-900">{copy.page.legacyTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{copy.page.legacyBody}</p>
                <a
                  href={`mailto:travelsmarter501@gmail.com?subject=${encodeURIComponent("Personalized Plan purchase before the update")}`}
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                >
                  {copy.page.legacyContact}
                </a>
              </section>
            )}

            <div className="mt-6">
              <WizardSlot initialDestinationId={initialDestinationId} restoreDraft={restoreDraft} signedIn={signedIn} hasPlans={hasPlans} />
            </div>

            {!signedIn && (
              <p className="mt-6 text-center">
                <Link href="/login?next=%2Fplanner%3Fnew%3D1" className="text-sm font-semibold text-teal-700 hover:underline">
                  {copy.page.alreadyBought}
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
