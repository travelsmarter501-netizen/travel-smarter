import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SmartPlannerV2App from "../components/smart-planner-v2/SmartPlannerV2App";
import ProductAccessDenied from "../components/guide/ProductAccessDenied";
import { isAvailablePlannerDestinationId, DEFAULT_PLANNER_DESTINATION_ID } from "../lib/planner/plannerDestinations";
import { hasProductAccess } from "../lib/entitlements";
import { PRODUCT_SLUGS } from "../lib/commerce/catalog";
import { createClient } from "../../utils/supabase/server";

/**
 * Unified Personalized Plan -- "خطة مخصصة إلك ✨", the ONE customer-facing product route,
 * replacing the old separate /smart-planner/barcelona and /custom-plan/barcelona products (both
 * now redirect here with Barcelona preselected -- see their own page.tsx files). Destination-
 * driven by design (`?destination=` query param) even though Barcelona is the only real,
 * generation-capable destination today -- see plannerDestinations.ts's own header comment on
 * why that alone doesn't "add" a destination to the actual engine.
 *
 * Paid product: requires a signed-in user who owns "travel-smarter-personalized-plan" (the same
 * slug the checkout sells -- see PRODUCT_SLUGS in lib/commerce/catalog.ts). The plan-generation
 * Server Action (barcelona-v2/actions.ts) enforces the same entitlement on its own, because a
 * Server Action can be called without ever loading this page.
 */
export const metadata: Metadata = {
  title: "خطة مخصصة إلك ✨ | Travel Smarter",
  description:
    "اختار وجهتك واهتماماتك، وإحنا بنبني لك خطة ذكية حسب رحلتك. خطة بتتجهز فورًا حسب أيامك، اهتماماتك ومكان سكنك. برشلونة متاحة الآن — وجهات جديدة قريبًا.",
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ destination?: string }> }) {
  const { destination } = await searchParams;

  // Server-side entitlement gate -- runs before anything else is rendered.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = destination ? `/planner?destination=${encodeURIComponent(destination)}` : "/planner";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const hasAccess = await hasProductAccess(PRODUCT_SLUGS.personalizedPlan, user.id);
  if (!hasAccess) {
    return (
      <ProductAccessDenied
        productName="خطة مخصصة إلك"
        mailSubject="استفسار عن الخطة المخصصة"
        productSlug={PRODUCT_SLUGS.personalizedPlan}
      />
    );
  }

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
