"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../Button";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { personalizedTripDetails, type TripDetailsInput } from "../../lib/planner/personalizedSummary";
import { deleteSavedPlanAction } from "../../planner/actions";

export type PlanCardData = {
  id: string;
  destinationId: string;
  days: number | null;
  /** The questionnaire answers the plan was built from (interests / accommodation), shown as trip details. */
  details?: TripDetailsInput | null;
  /** For an older plan whose interests are not in the current format: a ready-made interests line. */
  interestsLine?: string | null;
  href: string;
  /** Where "Edit plan" goes (the owner's pre-filled questionnaire). Absent for plans that cannot be regenerated (older planner versions). */
  editHref?: string;
};

const DESTINATION_NAMES = { ar: { barcelona: "برشلونة" }, en: { barcelona: "Barcelona" } } as const;

const copy = {
  ar: {
    planTitle: "خطة {destination}",
    daysCount: "{n} أيام",
    dayOne: "يوم",
    open: "افتح الخطة",
    edit: "تعديل الخطة",
    delete: "حذف",
    deleting: "جاري الحذف...",
    confirm: "هل تريد حذف هذه الخطة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    confirmYes: "نعم، احذف نهائيًا",
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
    edit: "Edit plan",
    delete: "Delete",
    deleting: "Deleting...",
    confirm: "Delete this plan permanently? This action cannot be undone.",
    confirmYes: "Yes, delete permanently",
    cancel: "Cancel",
    failed: "We couldn't complete that. Please try again.",
    loginAgain: "Your session ended. Sign in again and try once more.",
    notFound: "We couldn't find this plan in your account. Refresh the page and try again.",
  },
} as const;

/**
 * One saved plan as a card: destination, days, the trip details it was built from, "Open plan", "Edit plan" and "Delete".
 *
 * Delete is PERMANENT for that one plan (planner/actions.ts -> delete_saved_plan, owner-checked on the server) and says so in an in-page
 * confirmation (not the browser's native dialog, which can be silently blocked). It never touches the customer's order, payment or
 * ownership of the Personalized Plan, so they can still create plans afterwards. On success the card leaves the list at once and the page
 * refreshes from the server; on failure the card says why.
 */
export default function PlanCard({ plan }: { plan: PlanCardData }) {
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

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteSavedPlanAction(plan.id);
      if (!result.ok) {
        console.error("[plans] delete failed:", result.code);
        setError(result.code === "login_required" ? c.loginAgain : result.code === "not_found" ? c.notFound : c.failed);
        setBusy(false);
        return;
      }
    } catch {
      console.error("[plans] delete request failed");
      setError(c.failed);
      setBusy(false);
      return;
    }
    setGone(true);
    router.refresh();
  }

  if (gone) return null;

  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      <div>
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button href={plan.href} size="md">
          {c.open}
        </Button>
        {plan.editHref && (
          <Button href={plan.editHref} variant="secondary" size="md">
            {c.edit}
          </Button>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy || confirming}
          className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
        >
          {c.delete}
        </button>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label={c.confirm} className="mt-3 rounded-xl bg-rose-50 px-3.5 py-3">
          <p dir="auto" className="text-sm font-semibold leading-6 text-slate-900">
            {c.confirm}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? c.deleting : c.confirmYes}
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
