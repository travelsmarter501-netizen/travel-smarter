"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import PersonalizedPlanWizard from "./PersonalizedPlanWizard";
import MyPersonalizedPlans from "./MyPersonalizedPlans";
import ScrollToTop from "../ScrollToTop";
import ClearPlannerDraft from "./ClearPlannerDraft";
import { useLanguage } from "../../lib/language";
import { readPlannerDraft, type PlannerDraft } from "../../lib/planner/plannerDraft";
import type { PlannerPlanSummary, PlannerRequestSummary } from "../../lib/commerce/personalizedPlan";

const noopSubscribe = () => () => {};

/**
 * The questionnaire. Normally it renders straight away; when restoring a draft it waits until the page has hydrated
 * (session storage does not exist on the server), so the pre-filled first render can never disagree with the server's.
 */
function WizardSlot({
  initialDestinationId,
  restoreDraft,
  serverDraft,
  owner,
  editPlanId,
}: {
  initialDestinationId?: string;
  restoreDraft: boolean;
  /** An owner editing a plan: its answers, read on the server. Wins over anything this tab remembers. */
  serverDraft: PlannerDraft | null;
  owner: boolean;
  editPlanId: string | null;
}) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (restoreDraft && !serverDraft && !mounted) return null;
  return (
    <PersonalizedPlanWizard
      initialDestinationId={initialDestinationId}
      initialDraft={serverDraft ?? (restoreDraft ? readPlannerDraft() : null)}
      owner={owner}
      editPlanId={editPlanId}
    />
  );
}

/**
 * The /planner page body (the server page decides WHICH view and loads the data; this component only renders it,
 * in the visitor's language):
 *   - "wizard": the questionnaire. For someone who has not bought the Personalized Plan it ends in checkout; for an OWNER (new plan or
 *     "Edit plan") it ends in "Create my plan" / "Update my plan" with no payment;
 *   - "mine": "My Personalized Plans" -- an owner's plans (Open / Edit / Delete) and the free "Create a new plan".
 */
export default function PlannerPageView({
  view,
  initialDestinationId,
  restoreDraft = false,
  signedIn,
  owner = false,
  editPlan = null,
  plans,
  requests,
}: {
  view: "wizard" | "mine";
  initialDestinationId?: string;
  /** Came back from checkout via "Edit answers": pre-fill the questionnaire from this tab's saved draft. */
  restoreDraft?: boolean;
  signedIn: boolean;
  /** The signed-in customer owns the Personalized Plan (decided on the server). */
  owner?: boolean;
  /** An owner editing one of their own plans: its id and its stored answers. */
  editPlan?: { id: string; draft: PlannerDraft } | null;
  plans: PlannerPlanSummary[];
  requests: PlannerRequestSummary[];
}) {
  const { t } = useLanguage();
  const copy = t.planner;

  return (
    <main className="pb-10">
      <ScrollToTop />
      {/* Whatever this tab remembers from an earlier questionnaire is stale on a fresh visit: only "Edit answers" (?edit=1) restores it. */}
      {!restoreDraft && <ClearPlannerDraft />}
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
          {copy.page.backHome}
        </Link>

        {view === "mine" ? (
          <div className="mt-4">
            <MyPersonalizedPlans plans={plans} requests={requests} owner={owner} />
          </div>
        ) : (
          <>
            {owner && (
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
            <p className="mt-4 text-center text-sm font-semibold text-teal-700">{owner ? copy.page.ownerTagline : copy.page.tagline}</p>

            <div className="mt-6">
              <WizardSlot
                initialDestinationId={initialDestinationId}
                restoreDraft={restoreDraft}
                serverDraft={editPlan?.draft ?? null}
                owner={owner}
                editPlanId={editPlan?.id ?? null}
              />
            </div>

            {!signedIn && (
              <p className="mt-6 text-center">
                <Link href="/login?next=%2Fplanner" className="text-sm font-semibold text-teal-700 hover:underline">
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
