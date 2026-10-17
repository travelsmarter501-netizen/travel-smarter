"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../Button";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { personalizedTripDetails, type TripDetailsInput } from "../../lib/planner/personalizedSummary";
import { setPlanArchivedAction } from "../../planner/archiveActions";

export type PlanCardData = {
  id: string;
  destinationId: string;
  days: number | null;
  /** The questionnaire answers the plan was built from (interests / accommodation), shown as trip details. */
  details?: TripDetailsInput | null;
  /** For an older plan whose interests are not in the current format: a ready-made interests line. */
  interestsLine?: string | null;
  href: string;
};

const DESTINATION_NAMES = { ar: { barcelona: "برشلونة" }, en: { barcelona: "Barcelona" } } as const;

const copy = {
  ar: {
    planTitle: "خطة {destination}",
    daysCount: "{n} أيام",
    dayOne: "يوم",
    open: "افتح الخطة",
    remove: "حذف",
    restore: "استعادة",
    removing: "جاري الحذف...",
    restoring: "جاري الاستعادة...",
    confirm: "هل تريد إزالة هذه الخطة من قائمة خططي؟",
    confirmNote: "هذا لا يلغي عملية الشراء ولا يسترد المبلغ، ويمكنك استعادة الخطة لاحقًا.",
    failed: "تعذّر تنفيذ الطلب. حاول مرة أخرى.",
  },
  en: {
    planTitle: "{destination} plan",
    daysCount: "{n} days",
    dayOne: "day",
    open: "Open plan",
    remove: "Remove",
    restore: "Restore",
    removing: "Removing...",
    restoring: "Restoring...",
    confirm: "Remove this plan from My Plans?",
    confirmNote: "This doesn't cancel or refund your purchase, and you can restore the plan later.",
    failed: "We couldn't complete that. Please try again.",
  },
} as const;

/**
 * One saved plan as a card: destination, days, the trip details it was built from, "Open plan" and "Remove" (or "Restore" for a plan
 * that was removed). Remove only HIDES the plan -- it is stored in the database and so are its request, order and entitlements (see
 * planner/archiveActions.ts); the card says so in the confirmation. Nothing here can change what a plan contains.
 */
export default function PlanCard({ plan, archived = false }: { plan: PlanCardData; archived?: boolean }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const c = copy[lang];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const destination = (DESTINATION_NAMES[lang] as Record<string, string>)[plan.destinationId] ?? plan.destinationId;
  const days = plan.days === null ? null : plan.days === 1 ? `1 ${c.dayOne}` : fillCopy(c.daysCount, { n: plan.days });
  const trip = personalizedTripDetails(plan.details, lang);
  const interests = plan.interestsLine ?? trip.interests;

  async function setArchived(next: boolean) {
    if (next && !window.confirm(`${c.confirm}\n\n${c.confirmNote}`)) return;
    setBusy(true);
    setFailed(false);
    try {
      const result = await setPlanArchivedAction(plan.id, next);
      if (!result.ok) {
        setFailed(true);
        setBusy(false);
        return;
      }
    } catch {
      setFailed(true);
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p dir="auto" className="font-semibold text-slate-900">
            {fillCopy(c.planTitle, { destination })}
            {days && ` · ${days}`}
          </p>
          {interests && (
            <p dir="auto" className="mt-0.5 text-xs text-slate-600">
              {interests}
            </p>
          )}
          {trip.accommodation && (
            <p dir="auto" className="text-xs text-slate-600">
              {trip.accommodation}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button href={plan.href} size="md">
            {c.open}
          </Button>
          <button
            type="button"
            onClick={() => setArchived(!archived)}
            disabled={busy}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? (archived ? c.restoring : c.removing) : archived ? c.restore : c.remove}
          </button>
        </div>
      </div>
      {failed && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {c.failed}
        </p>
      )}
    </li>
  );
}
