import type { Metadata } from "next";
import Link from "next/link";
import SmartPlannerV2App from "../components/smart-planner-v2/SmartPlannerV2App";
import { isAvailablePlannerDestinationId, DEFAULT_PLANNER_DESTINATION_ID } from "../lib/planner/plannerDestinations";

/**
 * Unified Personalized Plan -- "خطة مخصصة إلك ✨", the ONE customer-facing product route,
 * replacing the old separate /smart-planner/barcelona and /custom-plan/barcelona products (both
 * now redirect here with Barcelona preselected -- see their own page.tsx files). Destination-
 * driven by design (`?destination=` query param) even though Barcelona is the only real,
 * generation-capable destination today -- see plannerDestinations.ts's own header comment on
 * why that alone doesn't "add" a destination to the actual engine.
 *
 * No auth/entitlement gate -- matches the pre-merge Smart Planner V2 behavior exactly (this
 * merge is product positioning only, not an access-gate change).
 */
export const metadata: Metadata = {
  title: "خطة مخصصة إلك ✨ | Travel Smarter",
  description:
    "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك. خطة بتتجهز فورًا حسب أيامك، اهتماماتك ومكان سكنك. برشلونة متاحة الآن — وجهات جديدة قريبًا.",
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ destination?: string }> }) {
  const { destination } = await searchParams;
  const initialDestinationId = isAvailablePlannerDestinationId(destination) ? (destination as string) : DEFAULT_PLANNER_DESTINATION_ID;

  return (
    <main className="pb-10">
      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
          ← الرئيسية
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">خطة مخصصة إلك ✨</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك.</p>
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-teal-700">خطة بتتجهز فورًا حسب أيامك، اهتماماتك ومكان سكنك.</p>

        <div className="mt-6">
          <SmartPlannerV2App initialDestinationId={initialDestinationId} />
        </div>
      </div>
    </main>
  );
}
