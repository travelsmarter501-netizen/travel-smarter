import { notFound } from "next/navigation";
import Container from "../../../components/Container";
import { getAdminUser } from "../../../lib/admin";
import {
  getCustomPlanRequestForAdmin,
  getCustomPlanDraftForAdmin,
  isDraftGenerationEligible,
  isTempUnpaidDraftAllowed,
} from "../../../lib/customPlanAdmin";
import { getKnownPlaceOptions, resolveStopDisplay, type ResolvedStopDisplay } from "../../../lib/customPlanAdminDisplay";
import {
  CUSTOM_PLAN_REQUEST_STATUS_LABELS,
  TRAVELER_TYPE_OPTIONS,
  INTEREST_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  NIGHTLIFE_TYPE_OPTIONS,
  PACE_OPTIONS,
  BUDGET_STYLE_OPTIONS,
  CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS,
} from "../../../lib/customPlanRequest";
import { CUSTOM_PLAN_DRAFT_STATUS_LABELS } from "../../../lib/customPlanDraft";
import GenerateDraftButton from "../../../components/admin/GenerateDraftButton";
import RegenerateDraftButton from "../../../components/admin/RegenerateDraftButton";
import StartPreparationButton from "../../../components/admin/StartPreparationButton";
import MarkReadyButton from "../../../components/admin/MarkReadyButton";
import DeliverButton from "../../../components/admin/DeliverButton";
import CustomPlanDraftEditor from "../../../components/admin/CustomPlanDraftEditor";
import Link from "next/link";

function labelFor<T extends string>(options: { value: T; label: string }[], value: T | null): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}

export default async function AdminCustomPlanDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const { requestId } = await params;
  const request = await getCustomPlanRequestForAdmin(requestId);
  if (!request) notFound();

  const draft = await getCustomPlanDraftForAdmin(requestId);
  const knownPlaces = draft ? getKnownPlaceOptions() : [];

  const resolvedStops: Record<string, ResolvedStopDisplay> = {};
  if (draft) {
    for (const day of draft.planData.days) {
      for (const stop of day.stops) {
        resolvedStops[stop.placeId] = resolveStopDisplay(stop);
      }
    }
  }

  const showTempUnpaidNotice = isTempUnpaidDraftAllowed() && request.status !== "paid" && request.status !== "in_progress";

  return (
    <main className="py-10">
      <Container className="max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">طلب خطة مخصصة</h1>
        <p dir="ltr" className="mt-1 text-sm text-slate-400">
          {request.id}
        </p>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">{request.customerName}</h2>
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
              {CUSTOM_PLAN_REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">الوجهة والمدة</dt>
              <dd className="font-semibold text-slate-900">
                {request.destination} · {request.durationDays} أيام
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">السعر</dt>
              <dd className="font-semibold text-slate-900">{request.priceILS} ₪</dd>
            </div>
            <div>
              <dt className="text-slate-400">تاريخ الوصول</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {request.arrivalDate ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">تاريخ المغادرة</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {request.departureDate ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">مكان الإقامة</dt>
              <dd className="font-semibold text-slate-900">
                {request.accommodationType ? `${labelFor(CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS, request.accommodationType)} — ` : ""}
                {request.accommodation || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">نوع المسافرين</dt>
              <dd className="font-semibold text-slate-900">
                {labelFor(TRAVELER_TYPE_OPTIONS, request.travelerType)} · {request.travelersCount ?? "—"}
              </dd>
            </div>
            {request.travelerType === "family" && (
              <div>
                <dt className="text-slate-400">أطفال</dt>
                <dd className="font-semibold text-slate-900">
                  {request.hasChildren === true
                    ? `نعم (${request.childrenCount ?? "—"})`
                    : request.hasChildren === false
                      ? "لا"
                      : "—"}
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-slate-400">الاهتمامات</dt>
              <dd className="font-semibold text-slate-900">
                {request.interests.map((interest) => labelFor(INTEREST_OPTIONS, interest)).join("، ") || "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">أماكن مطلوبة (نص حر)</dt>
              <dd className="whitespace-pre-wrap font-semibold text-slate-900">{request.mustVisit || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">تفضيلات الأكل</dt>
              <dd className="font-semibold text-slate-900">
                {request.foodPreferences.map((preference) => labelFor(FOOD_PREFERENCE_OPTIONS, preference)).join("، ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">الحياة الليلية</dt>
              <dd className="font-semibold text-slate-900">
                {request.nightlifeTypes.map((type) => labelFor(NIGHTLIFE_TYPE_OPTIONS, type)).join("، ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">إيقاع الرحلة</dt>
              <dd className="font-semibold text-slate-900">{labelFor(PACE_OPTIONS, request.pace)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">أسلوب الميزانية</dt>
              <dd className="font-semibold text-slate-900">{labelFor(BUDGET_STYLE_OPTIONS, request.budgetStyle)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">طلبات خاصة</dt>
              <dd className="whitespace-pre-wrap font-semibold text-slate-900">{request.specialRequests || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">البريد الإلكتروني</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {request.customerEmail}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">الهاتف</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {request.customerPhone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">رقم الطلب التجاري المرتبط</dt>
              <dd dir="ltr" className="font-semibold text-slate-900">
                {request.orderId ? request.orderId.slice(0, 8).toUpperCase() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">تاريخ الإنشاء</dt>
              <dd className="font-semibold text-slate-900">
                {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(request.createdAt))}
              </dd>
            </div>
          </dl>

        </div>

        {/* ── Fulfillment ─────────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">التجهيز والتسليم</h2>
            {draft && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                مسودة: {CUSTOM_PLAN_DRAFT_STATUS_LABELS[draft.status]}
                {" · آخر تحديث "}
                {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.updatedAt))}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {request.status === "paid" && <StartPreparationButton requestId={request.id} />}
            {request.status === "in_progress" && draft?.status === "approved" && <MarkReadyButton requestId={request.id} />}
            {request.status === "ready" && <DeliverButton requestId={request.id} />}
            {request.status === "delivered" && (
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">تم التسليم للزبون ✓</span>
            )}
            {draft && (
              <Link
                href={`/admin/custom-plans/${request.id}/preview`}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300"
              >
                معاينة خطة الزبون
              </Link>
            )}
          </div>

          {request.status === "in_progress" && draft?.status !== "approved" && (
            <p className="mt-3 text-xs font-semibold text-amber-600">لازم تعتمد المسودة (زر &quot;اعتماد الخطة&quot; بالأسفل) قبل ما تقدر توضعها كجاهزة.</p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-base font-bold text-slate-900">مسودة الخطة</h3>

            {!draft ? (
              isDraftGenerationEligible(request.status) ? (
                <div className="mt-4">
                  {showTempUnpaidNotice && (
                    <p className="mb-3 text-xs font-semibold text-amber-600">
                      وضع تجريبي: مسموح إنشاء مسودة رغم إن الطلب مو مدفوع بعد (TEMP_ADMIN_ALLOW_UNPAID_DRAFT).
                    </p>
                  )}
                  <GenerateDraftButton requestId={request.id} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">لازم يكون الطلب مدفوعًا أو قيد التجهيز لإنشاء مسودة.</p>
              )
            ) : (
              <>
                {draft.status === "draft" && (
                  <div className="mt-4">
                    <RegenerateDraftButton requestId={request.id} />
                  </div>
                )}
                <CustomPlanDraftEditor requestId={request.id} initialDraft={draft} knownPlaces={knownPlaces} resolvedStops={resolvedStops} />
              </>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
