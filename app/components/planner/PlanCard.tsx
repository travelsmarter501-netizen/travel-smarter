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
    confirmYes: "نعم، احذف",
    cancel: "إلغاء",
    failed: "تعذّر تنفيذ الطلب. حاول مرة أخرى.",
    loginAgain: "انتهت جلستك. سجّل دخولك مرة أخرى ثم حاول من جديد.",
    notFound: "ما لقينا هذه الخطة ضمن حسابك. حدّث الصفحة وحاول مرة أخرى.",
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
    confirmYes: "Yes, remove",
    cancel: "Cancel",
    failed: "We couldn't complete that. Please try again.",
    loginAgain: "Your session ended. Sign in again and try once more.",
    notFound: "We couldn't find this plan in your account. Refresh the page and try again.",
  },
} as const;

/**
 * One saved plan as a card: destination, days, the trip details it was built from, "Open plan" and "Remove" (or "Restore" for a plan
 * that was removed). Remove only HIDES the plan -- it is stored in the database and so are its request, order and entitlements (see
 * planner/archiveActions.ts).
 *
 * The confirmation is part of the page, not the browser's native dialog: a native browser dialog can be silently suppressed (in-app browsers,
 * blocked dialogs) which made "Remove" look like it did nothing. On success the card leaves the list at once and the page refreshes from the
 * server; on failure the card says why. The list that holds the card (PlansLists) moves it between "My plans" and "Removed plans" through
 * `onChanged`; used on its own the card simply hides itself.
 */
export default function PlanCard({ plan, archived = false, onChanged }: { plan: PlanCardData; archived?: boolean; /** Called after the server confirmed the change, so the list can move the card at once. */ onChanged?: (archived: boolean) => void }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const c = copy[lang];
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = (DESTINATION_NAMES[lang] as Record<string, string>)[plan.destinationId] ?? plan.destinationId;
  const days = plan.days === null ? null : plan.days === 1 ? `1 ${c.dayOne}` : fillCopy(c.daysCount, { n: plan.days });
  const trip = personalizedTripDetails(plan.details, lang);
  const interests = plan.interestsLine ?? trip.interests;

  async function setArchived(next: boolean) {
    setBusy(true);
    setError(null);
    try {
      const result = await setPlanArchivedAction(plan.id, next);
      if (!result.ok) {
        console.error("[plans] archive failed:", result.code);
        setError(result.code === "login_required" ? c.loginAgain : result.code === "not_found" ? c.notFound : c.failed);
        setBusy(false);
        return;
      }
    } catch {
      console.error("[plans] archive request failed");
      setError(c.failed);
      setBusy(false);
      return;
    }
    // Done on the server: leave the list immediately, then let the server re-render the page (so the other list and the account agree).
    setConfirming(false);
    setBusy(false);
    if (onChanged) onChanged(next);
    else setGone(true);
    router.refresh();
  }

  if (gone) return null;

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
            onClick={() => (archived ? setArchived(false) : setConfirming(true))}
            disabled={busy || confirming}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy && archived ? c.restoring : archived ? c.restore : c.remove}
          </button>
        </div>
      </div>

      {confirming && !archived && (
        <div role="alertdialog" aria-label={c.confirm} className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3">
          <p dir="auto" className="text-sm font-semibold text-slate-900">
            {c.confirm}
          </p>
          <p dir="auto" className="mt-1 text-xs leading-5 text-slate-600">
            {c.confirmNote}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setArchived(true)}
              disabled={busy}
              className="inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? c.removing : c.confirmYes}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={busy}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {c.cancel}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </li>
  );
}
