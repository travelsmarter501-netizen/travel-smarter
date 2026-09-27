import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "../../../../components/Container";
import { getAdminUser } from "../../../../lib/admin";
import { getCustomPlanRequestForAdmin, getFinalPlanPreviewForAdmin } from "../../../../lib/customPlanAdmin";
import { resolveFinalPlanDisplay } from "../../../../lib/customPlanAdminDisplay";
import CustomPlanFinalPlanView from "../../../../components/custom-plan/CustomPlanFinalPlanView";
import type { CustomPlanDeliveryOverview } from "../../../../lib/customPlanDelivery";

export default async function AdminCustomPlanPreviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const { requestId } = await params;
  const request = await getCustomPlanRequestForAdmin(requestId);
  if (!request) notFound();

  const previewResult = await getFinalPlanPreviewForAdmin(requestId);
  if (!previewResult.ok) {
    return (
      <main className="py-10">
        <Container className="max-w-3xl">
          <Link href={`/admin/custom-plans/${requestId}`} className="text-sm font-semibold text-teal-700">
            ← رجوع للطلب
          </Link>
          <p className="mt-4 text-sm font-semibold text-rose-600">{previewResult.error}</p>
        </Container>
      </main>
    );
  }

  const overview: CustomPlanDeliveryOverview = {
    destination: request.destination,
    durationDays: request.durationDays,
    arrivalDate: request.arrivalDate,
    departureDate: request.departureDate,
    interests: request.interests,
    accommodationType: request.accommodationType,
    accommodationText: request.accommodation,
  };

  const days = resolveFinalPlanDisplay(previewResult.data.planData);

  return (
    <main className="py-10">
      <Container className="max-w-3xl">
        <div className="flex items-center justify-between">
          <Link href={`/admin/custom-plans/${requestId}`} className="text-sm font-semibold text-teal-700">
            ← رجوع للطلب
          </Link>
          {previewResult.data.isLive && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">معاينة حية من المسودة الحالية (لسا ما اتسلّمت)</span>
          )}
        </div>
        <div className="mt-4">
          <CustomPlanFinalPlanView overview={overview} days={days} isAdminPreview />
        </div>
      </Container>
    </main>
  );
}
