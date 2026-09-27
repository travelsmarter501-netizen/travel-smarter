"use client";

import { useLanguage } from "../lib/language";

/**
 * Small "Barcelona Guide included" pill for product entry pages whose purchase bundles Guide
 * access -- the 5-day Ready Plan and the Smart Planner. Deliberately NOT used on the 1-day
 * Ready Plan page (that product stays standalone). Kept as its own tiny client component
 * (rather than a prop on the shared BarcelonaReadyPlan component, which the 1-day plan also
 * renders) so it can be dropped into exactly the pages that need it without touching the
 * pages/components that don't.
 */
export default function GuideIncludedNote() {
  const { t } = useLanguage();

  return (
    <p
      dir="auto"
      className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-800"
    >
      ✓ {t.productPage.guideIncluded}
    </p>
  );
}
