import { redirect } from "next/navigation";
import Container from "../components/Container";
import Button from "../components/Button";
import SignOutButton from "../components/auth/SignOutButton";
import DeleteSavedPlanButton from "../components/account/DeleteSavedPlanButton";
import CustomPlanCheckoutButton from "../components/account/CustomPlanCheckoutButton";
import { INTEREST_OPTIONS } from "../components/smart-planner/InterestSelector";
import { v2DisplayInterestsLabel } from "../lib/planner/v2PlannerTypes";
import { createClient } from "../../utils/supabase/server";
import { getUserEntitlements, GUIDE_BUNDLE_PRODUCT_SLUGS } from "../lib/entitlements";
import { getUserCustomPlanRequests } from "../lib/customPlanRequests";
import { CUSTOM_PLAN_REQUEST_STATUS_LABELS } from "../lib/customPlanRequest";
import { inclusiveDayCount } from "../lib/planner/dateOnly";
import { isValidSmartPlannerV2SavedPlanRow } from "../lib/planner/smartPlannerV2SavedPlans";
import { isValidSmartPlannerSavedPlanRow } from "../lib/planner/smartPlannerSavedPlans";

// Maps an owned product's slug to the page it unlocks. Only Barcelona exists today;
// a product without a known route still shows in the list but without an "open" button.
const PRODUCT_ROUTES: Record<string, string> = {
  "barcelona-guide": "/guides/barcelona",
  "barcelona-smart-planner": "/smart-planner/barcelona",
  "barcelona-ready-plan-1day": "/ready-plans/barcelona/1-day",
  "barcelona-ready-plan-3day": "/ready-plans/barcelona/3-days",
  "barcelona-ready-plan": "/ready-plans/barcelona",
};

const DESTINATION_LABELS: Record<string, string> = {
  barcelona: "Barcelona",
};

function interestsLabel(interests: string[]): string {
  return INTEREST_OPTIONS.filter((option) => interests.includes(option.key))
    .map((option) => option.label)
    .join(" + ");
}

/** How many days a V2 saved plan's own preferences describe -- read straight from what was
 * saved, never from the (also-saved) generated plan's day count, so this stays meaningful even
 * for an edge case where the two ever disagreed. Flexible mode already stores durationDays
 * directly; specific mode recomputes it from the stored arrival/departure pair, the same pure
 * calendar-date arithmetic the planner itself uses. */
function v2SavedPlanDayCount(preferences: { dateMode: "flexible" | "specific"; durationDays?: number; arrivalDate?: string; departureDate?: string }): number | null {
  if (preferences.dateMode === "flexible") return preferences.durationDays ?? null;
  if (!preferences.arrivalDate || !preferences.departureDate) return null;
  return inclusiveDayCount(preferences.arrivalDate, preferences.departureDate);
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const ownedProducts = await getUserEntitlements();

  // A qualifying bundle product (5-day Ready Plan, Smart Planner) also grants Guide access
  // (see lib/entitlements.ts GUIDE_BUNDLE_PRODUCT_SLUGS) -- this is never a fake/duplicate
  // purchase row, just a small note pointing at the real bundle product that grants it.
  const ownsGuideDirectly = ownedProducts.some((product) => product.productSlug === "barcelona-guide");
  const inheritedGuideFrom = ownedProducts.find((product) =>
    (GUIDE_BUNDLE_PRODUCT_SLUGS as readonly string[]).includes(product.productSlug)
  );
  const hasInheritedGuideAccess = !ownsGuideDirectly && !!inheritedGuideFrom;

  // RLS (user_id = auth.uid()) already scopes this to the current user alone -- the
  // .eq("user_id", ...) below is redundant with it, kept only for query clarity.
  //
  // Fetched loosely (not pre-typed as one row shape) because this table now holds BOTH V1 rows
  // (SmartPlannerSavedPlanRow: preferences_json.tripLength etc.) and V2 rows
  // (SmartPlannerV2SavedPlanRow: preferences_json.plannerVersion === "v2", a fully different
  // shape) -- see smartPlannerV2SavedPlans.ts. Each row is branched at render time via
  // isValidSmartPlannerV2SavedPlanRow; anything that isn't a valid V2 row is rendered as V1
  // (matching this table's only other real shape).
  const { data: savedPlansRaw } = await supabase.from("smart_planner_saved_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const savedPlans = savedPlansRaw ?? [];

  const customPlanRequests = await getUserCustomPlanRequests();

  return (
    <main className="py-10">
      <Container className="max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">حسابي</h1>

          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">
              {(name ?? user.email ?? "؟").charAt(0).toUpperCase()}
            </span>
            <div>
              {name && <p className="font-semibold text-slate-900">{name}</p>}
              <p dir="ltr" className="text-sm text-slate-600">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">مشترياتي</h2>

            {ownedProducts.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">لسا ما عندك منتجات مشتراة.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {ownedProducts.map((product) => (
                  <li
                    key={product.productSlug}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{product.productName}</p>
                      <p className="text-xs text-slate-500">
                        تم الشراء بتاريخ{" "}
                        {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(product.grantedAt))}
                      </p>
                    </div>
                    {PRODUCT_ROUTES[product.productSlug] && (
                      <Button href={PRODUCT_ROUTES[product.productSlug]} size="md">
                        افتح الدليل
                      </Button>
                    )}
                  </li>
                ))}
                {hasInheritedGuideAccess && (
                  <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-slate-900">دليل برشلونة</p>
                      <p className="text-xs text-teal-700">متضمن مع {inheritedGuideFrom?.productName} — بدون شراء منفصل</p>
                    </div>
                    <Button href="/guides/barcelona" size="md">
                      افتح الدليل
                    </Button>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">خططي المحفوظة</h2>

            {!savedPlans || savedPlans.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm text-slate-500">لسا ما حفظت أي خطة.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {savedPlans.map((row) => {
                  if (isValidSmartPlannerV2SavedPlanRow(row)) {
                    const days = v2SavedPlanDayCount(row.preferences_json);
                    return (
                      <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {DESTINATION_LABELS[row.destination_slug] ?? row.destination_slug}
                            {days !== null && ` · ${days} أيام`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.preferences_json.surpriseMe ? "فاجئني ✨" : v2DisplayInterestsLabel(row.preferences_json.interests)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(row.created_at))}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button href={`/smart-planner/barcelona-v2/saved/${row.id}`} size="md">
                            افتح الخطة
                          </Button>
                          <DeleteSavedPlanButton id={row.id} />
                        </div>
                      </li>
                    );
                  }

                  // Final Pre-Payment Master QA: this table is shared with V2 (distinguished
                  // only by shape, not by a separate table) -- a row that fails BOTH the V2
                  // check above and this V1 check is neither cleanly V1- nor V2-shaped (e.g. a
                  // future interest-key rename could make an old V2 row fail its own validator),
                  // so it must never be blindly cast and rendered as V1 -- skip it silently
                  // instead of showing a broken/garbled saved-plan card.
                  if (!isValidSmartPlannerSavedPlanRow(row)) return null;
                  const plan = row;
                  return (
                    <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {DESTINATION_LABELS[plan.destination_slug] ?? plan.destination_slug} · {plan.preferences_json.tripLength} أيام
                        </p>
                        <p className="text-xs text-slate-500">{interestsLabel(plan.preferences_json.interests)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(plan.created_at))}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button href={`/smart-planner/barcelona/saved/${plan.id}`} size="md">
                          افتح الخطة
                        </Button>
                        <DeleteSavedPlanButton id={plan.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Unified Personalized Plan merge: this section is now historical/legacy only -- the
              new unified planner (/planner) never creates a custom_plan_requests row, it saves
              directly to smart_planner_saved_plans instead (see "خططي المحفوظة" above). Shown
              only when a user actually has old Custom Plan requests, so a brand-new customer
              never sees an empty section nudging them toward a product that no longer exists. */}
          {customPlanRequests.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">طلبات الخطط المخصصة</h2>

              <ul className="mt-3 space-y-3">
                {customPlanRequests.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {DESTINATION_LABELS[request.destination] ?? request.destination} · {request.durationDays} أيام
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(request.createdAt))} · رقم الطلب:{" "}
                        <span dir="ltr">{request.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                      {request.status === "pending_payment" && request.orderId && (
                        <p dir="ltr" className="mt-0.5 text-xs text-slate-400">
                          رقم طلب الدفع: {request.orderId.slice(0, 8).toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                        {CUSTOM_PLAN_REQUEST_STATUS_LABELS[request.status]}
                      </span>
                      {request.status === "draft" && <CustomPlanCheckoutButton requestId={request.id} />}
                      {request.status === "delivered" && (
                        <Button href={`/account/custom-plans/${request.id}`} size="md">
                          افتح خطتك
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <SignOutButton />
          </div>
        </div>
      </Container>
    </main>
  );
}
