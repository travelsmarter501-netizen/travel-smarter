"use client";

import { useEffect, useState } from "react";
import { usePlannerCopy } from "../../lib/usePlannerCopy";

const PHRASE_EVERY_MS = 1400;

/**
 * The "we're building your plan" screen: a spinner, the headline and the rotating progress phrases the plan builder
 * already uses. Shown while the plan is generated; it is tied to the real server call, never a fake timer.
 */
export default function PlanGeneratingScreen() {
  const copy = usePlannerCopy();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % copy.mine.buildingPhrases.length), PHRASE_EVERY_MS);
    return () => clearInterval(timer);
  }, [copy.mine.buildingPhrases.length]);

  return (
    <div role="status" aria-live="polite" className="flex min-h-[55vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" aria-hidden="true" />
      <h1 className="text-lg font-bold text-slate-900">{copy.checkoutSummary.generatingTitle}</h1>
      <p className="text-sm font-semibold text-slate-500">{copy.mine.buildingPhrases[index]}</p>
    </div>
  );
}
