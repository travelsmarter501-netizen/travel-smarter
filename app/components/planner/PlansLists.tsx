"use client";

import PlanCard, { type PlanCardData } from "./PlanCard";

/**
 * A customer's saved plans as cards (Open plan / Edit plan / Delete), or `emptyText` when there are none. There is no "removed plans" section:
 * Delete is permanent, and each card removes itself the moment the server confirms it.
 */
export default function PlansLists({ plans, emptyText = null }: { plans: PlanCardData[]; emptyText?: string | null }) {
  if (plans.length === 0) {
    return emptyText ? (
      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm text-slate-500">{emptyText}</p>
      </div>
    ) : null;
  }
  return (
    <ul className="mt-3 space-y-3">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </ul>
  );
}
