import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "../../../components/Container";
import { getCustomPlanDeliveryForUser } from "../../../lib/customPlanDelivery";
import { CUSTOM_PLAN_REQUEST_STATUS_LABELS } from "../../../lib/customPlanRequest";
import { resolveFinalPlanDisplay } from "../../../lib/customPlanAdminDisplay";
import CustomPlanFinalPlanView from "../../../components/custom-plan/CustomPlanFinalPlanView";

/**
 * The real customer-facing delivery route: only ever shows a plan once
 * getCustomPlanDeliveryForUser confirms (via RLS-scoped queries, not an app-level check) both
 * that this request belongs to the signed-in user AND that it's actually "delivered" -- before
 * that, only a status message is shown, never the admin's in-progress draft (see the task's own
 * "Customers: NO direct access yet" to draft content).
 */
export default async function AccountCustomPlanDeliveryPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const view = await getCustomPlanDeliveryForUser(requestId);

  if (view.kind === "not_found") notFound();

  return (
    <main className="py-10">
      <Container className="max-w-3xl">
        <Link href="/account" className="text-sm font-semibold text-teal-700">
          ← رجوع لحسابي
        </Link>

        <div className="mt-4">
          {view.kind === "pending" ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <h1 className="text-xl font-bold text-slate-900">الخطة قيد التجهيز</h1>
              <p className="mt-2 text-sm text-slate-500">
                فريقنا يراجع ويجهّز خطتك المخصصة بنفسه. رح توصلك إشعار فور ما تكون جاهزة.
              </p>
              <span className="mt-4 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-700">
                {CUSTOM_PLAN_REQUEST_STATUS_LABELS[view.status]}
              </span>
            </div>
          ) : (
            <CustomPlanFinalPlanView overview={view.overview} days={resolveFinalPlanDisplay(view.planData)} />
          )}
        </div>
      </Container>
    </main>
  );
}
