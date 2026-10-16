"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../Button";
import { generatePersonalizedPlanAction } from "../../planner/actions";
import { useLanguage } from "../../lib/language";
import { fillCopy, type PlannerGenerateErrorCode } from "../../lib/plannerCopy";
import { formatPurchaseDate } from "../../lib/accountView";
import type { PlannerPlanSummary, PlannerRequestSummary } from "../../lib/commerce/personalizedPlan";

const REFRESH_EVERY_MS = 5000;
const REFRESH_FOR_MS = 3 * 60 * 1000;
const PHRASE_EVERY_MS = 1400;

/**
 * "My Personalized Plans" -- what /planner shows a customer who has already bought. Three things, all
 * driven by rows the server read with the customer's own session (row-level security decides what is visible):
 *   - requests whose payment is confirmed but whose plan has not been built yet -> "Build my plan"
 *     (one request = one plan; the button only sends the request id, the answers come from the database);
 *   - requests still waiting for the payment confirmation (the page refreshes itself);
 *   - the plans they already have, each with an "Open plan" button.
 * Plus the one way to get another plan: "Create a new plan" -> a fresh questionnaire -> a new purchase.
 */
export default function MyPersonalizedPlans({ plans, requests }: { plans: PlannerPlanSummary[]; requests: PlannerRequestSummary[] }) {
  const { t } = useLanguage();
  const copy = t.planner;
  const router = useRouter();

  const hasPending = requests.some((request) => request.state === "pending");
  // A paid plan is waiting to be built: it is built first, so no second purchase is offered meanwhile.
  const mustBuildFirst = requests.some((request) => request.state === "ready" && !request.complimentary);
  useEffect(() => {
    if (!hasPending) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > REFRESH_FOR_MS) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [hasPending, router]);

  // dd/mm/yyyy, the same format as the account page's purchases
  const formatDate = formatPurchaseDate;
  const destinationName = (id: string) => copy.wizard.destinationNames[id] ?? id;
  const daysLabel = (days: number | null) => (days === null ? "" : days === 1 ? `1 ${copy.wizard.dayOne}` : fillCopy(copy.mine.daysCount, { n: days }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{copy.mine.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{copy.mine.subtitle}</p>
        <div className="mt-4">
          {mustBuildFirst ? (
            <p className="text-sm font-semibold leading-6 text-teal-800">{copy.mine.buildFirstNote}</p>
          ) : (
            <>
              <Button href="/planner?new=1" size="lg" className="w-full sm:w-auto">
                ＋ {copy.mine.createNew}
              </Button>
              <p className="mt-2 text-xs text-slate-400">{copy.mine.newPlanNote}</p>
            </>
          )}
        </div>
      </div>

      {requests.map((request) =>
        request.state === "ready" ? (
          <ReadyRequestCard key={request.id} request={request} destinationLabel={destinationName(request.destinationId)} />
        ) : (
          <section key={request.id} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-sm font-bold text-amber-800">{copy.mine.pendingBadge}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{copy.mine.pendingTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{copy.mine.pendingBody}</p>
          </section>
        )
      )}

      {plans.length > 0 && (
        <section aria-label={copy.mine.plansHeading}>
          <h2 className="text-lg font-bold text-slate-900">{copy.mine.plansHeading}</h2>
          <ul className="mt-3 space-y-3">
            {plans.map((plan) => (
              <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div>
                  <p className="font-semibold text-slate-900">{fillCopy(copy.mine.planTitle, { destination: destinationName(plan.destinationId) })}</p>
                  <p className="text-xs text-slate-500">
                    {[daysLabel(plan.days), fillCopy(copy.mine.createdOn, { date: formatDate(plan.createdAt) })].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button href={`/smart-planner/barcelona-v2/saved/${plan.id}`} size="md">
                  {copy.mine.openPlan}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReadyRequestCard({ request, destinationLabel }: { request: PlannerRequestSummary; destinationLabel: string }) {
  const { t } = useLanguage();
  const copy = t.planner;
  const router = useRouter();
  const [building, setBuilding] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [errorCode, setErrorCode] = useState<PlannerGenerateErrorCode | null>(null);

  useEffect(() => {
    if (!building) return;
    const timer = setInterval(() => setPhraseIndex((i) => (i + 1) % copy.mine.buildingPhrases.length), PHRASE_EVERY_MS);
    return () => clearInterval(timer);
  }, [building, copy.mine.buildingPhrases.length]);

  async function handleBuild() {
    setBuilding(true);
    setErrorCode(null);
    try {
      const result = await generatePersonalizedPlanAction(request.id);
      if (result.ok) {
        router.push(`/smart-planner/barcelona-v2/saved/${result.planId}`);
        return;
      }
      setErrorCode(result.code);
    } catch {
      setErrorCode("unexpected");
    }
    setBuilding(false);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-teal-200 bg-teal-50/70 p-5 sm:p-6">
      <p className="text-sm font-bold text-teal-800">{request.complimentary ? copy.mine.complimentaryBadge : copy.mine.readyBadge}</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">{copy.mine.readyTitle}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {fillCopy(request.complimentary ? copy.mine.complimentaryBody : copy.mine.readyBody, { destination: destinationLabel, days: request.days ?? "" })}
      </p>
      {errorCode && (
        <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">
          {copy.generateErrors[errorCode]}
        </p>
      )}
      <button
        type="button"
        onClick={handleBuild}
        disabled={building}
        className="mt-4 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
      >
        {building ? copy.mine.buildingPhrases[phraseIndex] : copy.mine.buildPlan}
      </button>
    </section>
  );
}
