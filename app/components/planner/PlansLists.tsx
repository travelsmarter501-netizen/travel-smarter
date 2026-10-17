"use client";

import { useState } from "react";
import PlanCard, { type PlanCardData } from "./PlanCard";
import { useLanguage } from "../../lib/language";

/**
 * A customer's plan cards in two lists: the normal list, and -- only while there is something in it -- a clearly marked secondary section
 * "الخطط المحذوفة / Removed plans" where every plan has a visible "استعادة / Restore" button.
 *
 * Removing or restoring moves the card between the two lists at once (the server has already confirmed it; the page then refreshes from the
 * server so every other view agrees). The state here is only the move the customer just made: the lists come from the server, so a reload
 * always shows the truth. Nothing here creates a plan, order, payment, request or entitlement -- "Remove" and "Restore" only set or clear
 * archived_at on the signed-in owner's own plan (see planner/archiveActions.ts).
 */
export default function PlansLists({
  plans,
  archivedPlans,
  emptyText = null,
}: {
  plans: PlanCardData[];
  archivedPlans: PlanCardData[];
  /** Shown when there are no active plans (the account page says so; the plans page just shows the buttons). */
  emptyText?: string | null;
}) {
  const { t } = useLanguage();
  const mine = t.planner.mine;
  // id -> archived? : only what the customer just changed in this view. Everything else follows the server's lists.
  const [moves, setMoves] = useState<Record<string, boolean>>({});

  const all = [...plans.map((plan) => ({ plan, archived: false })), ...archivedPlans.map((plan) => ({ plan, archived: true }))].map((entry) => ({
    plan: entry.plan,
    archived: moves[entry.plan.id] ?? entry.archived,
  }));
  const active = all.filter((entry) => !entry.archived);
  const removed = all.filter((entry) => entry.archived);

  const record = (planId: string, archived: boolean) => setMoves((current) => ({ ...current, [planId]: archived }));

  return (
    <>
      {active.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {active.map(({ plan }) => (
            <PlanCard key={plan.id} plan={plan} onChanged={(archived) => record(plan.id, archived)} />
          ))}
        </ul>
      ) : (
        emptyText && (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">{emptyText}</p>
          </div>
        )
      )}

      {removed.length > 0 && (
        <section aria-label={mine.archivedHeading} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
          <h3 className="text-sm font-bold text-slate-800">
            {mine.archivedHeading} ({removed.length})
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{mine.archivedNote}</p>
          <ul className="mt-3 space-y-3">
            {removed.map(({ plan }) => (
              <PlanCard key={plan.id} plan={plan} archived onChanged={(archived) => record(plan.id, archived)} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
