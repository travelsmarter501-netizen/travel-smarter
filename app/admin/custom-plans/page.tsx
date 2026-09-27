import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "../../components/Container";
import { getAdminUser } from "../../lib/admin";
import { listCustomPlanRequestsForAdmin, type AdminCustomPlanRequestFilter } from "../../lib/customPlanAdmin";
import { CUSTOM_PLAN_REQUEST_STATUS_LABELS } from "../../lib/customPlanRequest";

/**
 * Internal admin-only route -- see app/lib/admin.ts for the ADMIN_EMAILS allowlist check.
 * Not linked from anywhere in the public site; a non-admin (including a normal signed-in
 * customer) gets a plain 404, same as a route that doesn't exist.
 */

const FILTER_TABS: { value: AdminCustomPlanRequestFilter; label: string }[] = [
  { value: "default", label: "الافتراضي (مدفوع + قيد التجهيز)" },
  { value: "paid", label: "مدفوع" },
  { value: "in_progress", label: "قيد التجهيز" },
  { value: "ready", label: "جاهزة" },
  { value: "delivered", label: "تم التسليم" },
  { value: "all", label: "الكل" },
];

const VALID_FILTERS = new Set(FILTER_TABS.map((tab) => tab.value));

function isValidFilter(value: string | undefined): value is AdminCustomPlanRequestFilter {
  return !!value && VALID_FILTERS.has(value as AdminCustomPlanRequestFilter);
}

export default async function AdminCustomPlansPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const { status } = await searchParams;
  const filter: AdminCustomPlanRequestFilter = isValidFilter(status) ? status : "default";

  const requests = await listCustomPlanRequestsForAdmin(filter);
  if (requests === null) notFound();

  return (
    <main className="py-10">
      <Container className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">طلبات الخطط المخصصة (إدارة)</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === "default" ? "/admin/custom-plans" : `/admin/custom-plans?status=${tab.value}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === tab.value ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-right text-xs font-bold text-slate-500">
                <th className="px-4 py-3">رقم الطلب</th>
                <th className="px-4 py-3">العميل</th>
                <th className="px-4 py-3">الوجهة</th>
                <th className="px-4 py-3">المدة</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">تاريخ الإنشاء</th>
                <th className="px-4 py-3">رقم الطلب التجاري</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    لا يوجد طلبات ضمن هذا الفلتر.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/custom-plans/${request.id}`} className="font-semibold text-teal-700" dir="ltr">
                        {request.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{request.customerName}</td>
                    <td className="px-4 py-3">{request.destination}</td>
                    <td className="px-4 py-3">{request.durationDays} أيام</td>
                    <td className="px-4 py-3">{CUSTOM_PLAN_REQUEST_STATUS_LABELS[request.status]}</td>
                    <td className="px-4 py-3">{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(request.createdAt))}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {request.orderId ? request.orderId.slice(0, 8).toUpperCase() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}
