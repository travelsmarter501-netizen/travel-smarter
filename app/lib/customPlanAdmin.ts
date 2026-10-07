import "server-only";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { getAdminUser } from "./admin";
import { generateCustomPlanDraft, type CustomPlanGenerationInput } from "./planner/customPlanGenerator";
import {
  validateCustomPlanDraftPlanData,
  validateCustomPlanDraftForReady,
  normalizeDraftPlanData,
  type CustomPlanDraft,
  type CustomPlanDraftPlanData,
} from "./customPlanDraft";
import { getUnresolvedPlaceIds } from "./customPlanAdminDisplay";
import { buildFinalPlanDataFromDraft, type CustomPlanFinalPlan, type CustomPlanFinalPlanData } from "./customPlanFinalPlan";
import type {
  CustomPlanRequestStatus,
  TravelerType,
  FoodPreference,
  NightlifeType,
  TripPace,
  BudgetStyle,
  CustomPlanAccommodationStatus,
} from "./customPlanRequest";

/**
 * Custom Plan Admin Builder V1 -- the ONLY code path allowed to read/write
 * public.custom_plan_drafts, and the ONLY code path allowed to read OTHER users'
 * public.custom_plan_requests rows (their own RLS only ever lets a customer see their own).
 *
 * Every exported function independently calls getAdminUser() and returns a clear
 * "unauthorized" result if it's null -- never trusts a caller to have already checked this
 * (the "admin authorization rechecked on every write action, and every read" requirement).
 * Only after that check passes does this file ever touch the service-role client -- the same
 * verified-identity-then-privileged-operation trust model used throughout this project, just
 * extended from "writes" to "any access at all", since admin access has no RLS-expressible
 * shape (there's no `auth.uid() = admin` policy possible for a plain email allowlist).
 */

// pace/budgetStyle are stored in the DB using different string values than the client enum
// (see app/lib/customPlanRequests.ts's PACE_DB_VALUES/BUDGET_STYLE_DB_VALUES for the forward
// direction) -- these are the exact inverse maps, used only when reading a row back for admin
// display/generation input.
const PACE_FROM_DB: Record<string, TripPace> = { relaxed: "relaxed", balanced: "balanced", active: "packed" };
const BUDGET_STYLE_FROM_DB: Record<string, BudgetStyle> = { budget: "budget", midrange: "mid", premium: "premium", no_preference: "noPreference" };

export type AdminActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type AdminCustomPlanRequestFilter = "default" | "paid" | "in_progress" | "ready" | "delivered" | "all";

export type AdminCustomPlanRequestListItem = {
  id: string;
  customerName: string;
  destination: string;
  durationDays: number;
  status: CustomPlanRequestStatus;
  createdAt: string;
  orderId: string | null;
};

export type AdminCustomPlanRequestDetail = {
  id: string;
  userId: string | null;
  destination: string;
  durationDays: number;
  priceILS: number;
  status: CustomPlanRequestStatus;
  arrivalDate: string | null;
  departureDate: string | null;
  accommodation: string | null;
  /** Structured V2 accommodation status -- null for every pre-V2 historical row (which only
   * ever populated the free-text `accommodation` field above). */
  accommodationType: CustomPlanAccommodationStatus | null;
  travelerType: TravelerType | null;
  /** Nullable since Simple Intake V2 -- the current form no longer asks this. */
  travelersCount: number | null;
  hasChildren: boolean | null;
  childrenCount: number | null;
  /** Legacy 10-key values on a pre-V2 row, current 8-key V2PlannerInterest values on a new
   * one -- see customPlanRequest.ts's own header comment. Loosely typed as string[] on purpose
   * since a single column now legitimately holds either model's keys. */
  interests: string[];
  mustVisit: string | null;
  foodPreferences: FoodPreference[];
  nightlifeTypes: NightlifeType[];
  pace: TripPace | null;
  budgetStyle: BudgetStyle | null;
  specialRequests: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  orderId: string | null;
  createdAt: string;
};

type CustomPlanRequestRow = {
  id: string;
  user_id: string | null;
  destination: string;
  duration_days: number;
  price_ils: number;
  status: CustomPlanRequestStatus;
  arrival_date: string | null;
  departure_date: string | null;
  accommodation: string | null;
  accommodation_type: CustomPlanAccommodationStatus | null;
  traveler_type: TravelerType | null;
  travelers_count: number | null;
  has_children: boolean | null;
  children_count: number | null;
  interests: string[] | null;
  must_visit: string | null;
  food_preferences: FoodPreference[] | null;
  nightlife_types: NightlifeType[] | null;
  pace: string | null;
  budget_style: string | null;
  special_requests: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  order_id: string | null;
  created_at: string;
};

type CustomPlanDraftRow = {
  id: string;
  request_id: string;
  status: "draft" | "approved";
  plan_data: CustomPlanDraftPlanData;
  created_at: string;
  updated_at: string;
};

type CustomPlanFinalPlanRow = {
  id: string;
  request_id: string;
  plan_data: CustomPlanFinalPlanData;
  delivered_at: string;
  created_at: string;
};

function mapRequestDetail(row: CustomPlanRequestRow): AdminCustomPlanRequestDetail {
  return {
    id: row.id,
    userId: row.user_id,
    destination: row.destination,
    durationDays: row.duration_days,
    priceILS: row.price_ils,
    status: row.status,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    accommodation: row.accommodation,
    accommodationType: row.accommodation_type,
    travelerType: row.traveler_type,
    travelersCount: row.travelers_count,
    hasChildren: row.has_children,
    childrenCount: row.children_count,
    interests: row.interests ?? [],
    mustVisit: row.must_visit,
    foodPreferences: row.food_preferences ?? [],
    nightlifeTypes: row.nightlife_types ?? [],
    pace: row.pace ? (PACE_FROM_DB[row.pace] ?? null) : null,
    budgetStyle: row.budget_style ? (BUDGET_STYLE_FROM_DB[row.budget_style] ?? null) : null,
    specialRequests: row.special_requests,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    orderId: row.order_id,
    createdAt: row.created_at,
  };
}

function mapDraftRow(row: CustomPlanDraftRow): CustomPlanDraft {
  return {
    id: row.id,
    requestId: row.request_id,
    status: row.status,
    // Normalizes a pre-Fulfillment-V1 draft's plan_data (missing day summary/date, legacy
    // single `notes` field) into the current shape -- see customPlanDraft.ts's own comment.
    planData: normalizeDraftPlanData(row.plan_data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFinalPlanRow(row: CustomPlanFinalPlanRow): CustomPlanFinalPlan {
  return {
    id: row.id,
    requestId: row.request_id,
    planData: row.plan_data,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

/** Filters map to a single query: "default" (no explicit filter picked yet) shows paid +
 * in_progress together -- the two states an admin actually needs to act on day to day. */
export async function listCustomPlanRequestsForAdmin(filter: AdminCustomPlanRequestFilter): Promise<AdminCustomPlanRequestListItem[] | null> {
  const admin = await getAdminUser();
  if (!admin) return null;

  const svc = createServiceRoleClient();
  let query = svc
    .from("custom_plan_requests")
    .select("id, customer_name, destination, duration_days, status, created_at, order_id")
    .order("created_at", { ascending: false });

  if (filter === "default") {
    query = query.in("status", ["paid", "in_progress"]);
  } else if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query.returns<Pick<CustomPlanRequestRow, "id" | "customer_name" | "destination" | "duration_days" | "status" | "created_at" | "order_id">[]>();
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    destination: row.destination,
    durationDays: row.duration_days,
    status: row.status,
    createdAt: row.created_at,
    orderId: row.order_id,
  }));
}

export async function getCustomPlanRequestForAdmin(requestId: string): Promise<AdminCustomPlanRequestDetail | null> {
  const admin = await getAdminUser();
  if (!admin) return null;

  const svc = createServiceRoleClient();
  const { data, error } = await svc.from("custom_plan_requests").select("*").eq("id", requestId).maybeSingle<CustomPlanRequestRow>();
  if (error || !data) return null;
  return mapRequestDetail(data);
}

export async function getCustomPlanDraftForAdmin(requestId: string): Promise<CustomPlanDraft | null> {
  const admin = await getAdminUser();
  if (!admin) return null;

  const svc = createServiceRoleClient();
  const { data, error } = await svc.from("custom_plan_drafts").select("*").eq("request_id", requestId).maybeSingle<CustomPlanDraftRow>();
  if (error || !data) return null;
  return mapDraftRow(data);
}

/** Dev/testing-only override of the "paid or in_progress" eligibility gate for draft
 * generation. Fail-CLOSED: it is OFF unless TEMP_ADMIN_ALLOW_UNPAID_DRAFT is exactly "true", and
 * it can never be on in the Vercel Production environment, whatever the variable says. Never
 * changes any *other* rule (price authority, ownership, RLS) -- it only widens which request
 * statuses are generation-eligible. */
export function isTempUnpaidDraftAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.TEMP_ADMIN_ALLOW_UNPAID_DRAFT === "true";
}

export function isDraftGenerationEligible(status: CustomPlanRequestStatus): boolean {
  return status === "paid" || status === "in_progress" || isTempUnpaidDraftAllowed();
}

/**
 * Idempotent: "إنشاء مسودة" creates a draft only if one doesn't already exist for this
 * request -- a second click (or a second admin opening the same request) returns the existing
 * row unchanged rather than silently overwriting any edits already made. Regeneration is
 * deliberately not offered in V1 (an admin who wants a fresh start can be given that feature
 * later; overwriting a hand-edited draft by accident is worse than not offering the shortcut).
 */
export async function generateOrGetCustomPlanDraftForAdmin(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();

  const { data: existing } = await svc.from("custom_plan_drafts").select("*").eq("request_id", requestId).maybeSingle<CustomPlanDraftRow>();
  if (existing) return { ok: true, data: mapDraftRow(existing) };

  const { data: requestRow, error: requestError } = await svc
    .from("custom_plan_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<CustomPlanRequestRow>();
  if (requestError || !requestRow) return { ok: false, error: "الطلب غير موجود." };

  if (!isDraftGenerationEligible(requestRow.status)) {
    return { ok: false, error: "لازم يكون الطلب مدفوعًا أو قيد التجهيز لإنشاء مسودة." };
  }

  if (!requestRow.user_id) {
    return { ok: false, error: "الطلب غير مرتبط بحساب مستخدم." };
  }

  const input: CustomPlanGenerationInput = {
    requestId: requestRow.id,
    durationDays: requestRow.duration_days,
    arrivalDate: requestRow.arrival_date,
    accommodation: requestRow.accommodation,
    travelerType: requestRow.traveler_type,
    hasChildren: requestRow.has_children,
    interests: requestRow.interests ?? [],
    mustVisit: requestRow.must_visit,
    foodPreferences: requestRow.food_preferences ?? [],
    nightlifeTypes: requestRow.nightlife_types ?? [],
    pace: requestRow.pace ? (PACE_FROM_DB[requestRow.pace] ?? null) : null,
    budgetStyle: requestRow.budget_style ? (BUDGET_STYLE_FROM_DB[requestRow.budget_style] ?? null) : null,
  };

  const planData = generateCustomPlanDraft(input);
  const validationError = validateCustomPlanDraftPlanData(planData);
  if (validationError) return { ok: false, error: `فشل إنشاء المسودة: ${validationError}` };

  const { data: inserted, error: insertError } = await svc
    .from("custom_plan_drafts")
    .insert({
      request_id: requestRow.id,
      user_id: requestRow.user_id,
      destination: requestRow.destination,
      status: "draft",
      plan_data: planData,
    })
    .select("*")
    .single<CustomPlanDraftRow>();

  if (insertError || !inserted) return { ok: false, error: "تعذّر حفظ المسودة." };
  return { ok: true, data: mapDraftRow(inserted) };
}

export async function saveCustomPlanDraftForAdmin(requestId: string, planData: CustomPlanDraftPlanData): Promise<AdminActionResult<CustomPlanDraft>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const validationError = validateCustomPlanDraftPlanData(planData);
  if (validationError) return { ok: false, error: validationError };

  const svc = createServiceRoleClient();
  const { data, error } = await svc
    .from("custom_plan_drafts")
    .update({ plan_data: planData })
    .eq("request_id", requestId)
    .select("*")
    .single<CustomPlanDraftRow>();

  if (error || !data) return { ok: false, error: "تعذّر حفظ التعديلات." };
  return { ok: true, data: mapDraftRow(data) };
}

export async function approveCustomPlanDraftForAdmin(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();
  const { data, error } = await svc
    .from("custom_plan_drafts")
    .update({ status: "approved" })
    .eq("request_id", requestId)
    .select("*")
    .single<CustomPlanDraftRow>();

  if (error || !data) return { ok: false, error: "تعذّر اعتماد الخطة." };
  return { ok: true, data: mapDraftRow(data) };
}

/**
 * "إعادة إنشاء المسودة": the only path that OVERWRITES an existing draft's plan_data --
 * generateOrGetCustomPlanDraftForAdmin above is deliberately idempotent and never does this.
 * Reachable only via an explicit admin confirmation in the UI (see RegenerateDraftButton.tsx's
 * window.confirm()), and blocked server-side once a draft has been approved -- an approved
 * draft represents reviewed, signed-off content; regenerating it would silently discard that
 * review, so this refuses and tells the admin to edit manually instead.
 */
export async function regenerateCustomPlanDraftForAdmin(requestId: string): Promise<AdminActionResult<CustomPlanDraft>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();

  const { data: existing } = await svc.from("custom_plan_drafts").select("*").eq("request_id", requestId).maybeSingle<CustomPlanDraftRow>();
  if (!existing) return { ok: false, error: "ما فيه مسودة لإعادة إنشائها -- استخدم \"إنشاء مسودة\"." };
  if (existing.status === "approved") {
    return { ok: false, error: "المسودة معتمدة بالفعل. عدّلها يدويًا بدل إعادة إنشائها، حتى ما تنضيع المراجعة." };
  }

  const { data: requestRow, error: requestError } = await svc
    .from("custom_plan_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<CustomPlanRequestRow>();
  if (requestError || !requestRow) return { ok: false, error: "الطلب غير موجود." };

  const input: CustomPlanGenerationInput = {
    requestId: requestRow.id,
    durationDays: requestRow.duration_days,
    arrivalDate: requestRow.arrival_date,
    accommodation: requestRow.accommodation,
    travelerType: requestRow.traveler_type,
    hasChildren: requestRow.has_children,
    interests: requestRow.interests ?? [],
    mustVisit: requestRow.must_visit,
    foodPreferences: requestRow.food_preferences ?? [],
    nightlifeTypes: requestRow.nightlife_types ?? [],
    pace: requestRow.pace ? (PACE_FROM_DB[requestRow.pace] ?? null) : null,
    budgetStyle: requestRow.budget_style ? (BUDGET_STYLE_FROM_DB[requestRow.budget_style] ?? null) : null,
  };

  const planData = generateCustomPlanDraft(input);
  const validationError = validateCustomPlanDraftPlanData(planData);
  if (validationError) return { ok: false, error: `فشل إنشاء المسودة: ${validationError}` };

  const { data: updated, error: updateError } = await svc
    .from("custom_plan_drafts")
    .update({ plan_data: planData })
    .eq("request_id", requestId)
    .select("*")
    .single<CustomPlanDraftRow>();

  if (updateError || !updated) return { ok: false, error: "تعذّر إعادة إنشاء المسودة." };
  return { ok: true, data: mapDraftRow(updated) };
}

/**
 * "بدء التجهيز": paid -> in_progress on custom_plan_requests only. Never touches
 * custom_plan_drafts.status, never creates/modifies orders/entitlements. Re-verifies the
 * request is currently `paid` server-side -- never trusts the client's view of its status. */
export async function startCustomPlanPreparationForAdmin(requestId: string): Promise<AdminActionResult<{ status: CustomPlanRequestStatus }>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();
  const { data: current, error: currentError } = await svc
    .from("custom_plan_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle<{ status: CustomPlanRequestStatus }>();

  if (currentError || !current) return { ok: false, error: "الطلب غير موجود." };
  if (current.status !== "paid") return { ok: false, error: "بدء التجهيز متاح فقط للطلبات المدفوعة." };

  const { data, error } = await svc
    .from("custom_plan_requests")
    .update({ status: "in_progress" })
    .eq("id", requestId)
    .select("status")
    .single<{ status: CustomPlanRequestStatus }>();

  if (error || !data) return { ok: false, error: "تعذّر تحديث حالة الطلب." };
  return { ok: true, data: { status: data.status } };
}

/**
 * "وضع الخطة كجاهزة": in_progress -> ready on custom_plan_requests. Requires an APPROVED draft
 * that passes the full Mark Ready checklist (see customPlanDraft.ts's validateCustomPlanDraftForReady
 * -- day count, per-day stop count, duration/date match, no unresolved placeId). Never trusts
 * the client's own view of status or draft content -- everything is re-read from the DB inside
 * this call. Returns every failing rule at once so the admin sees the complete list, not just
 * the first.
 */
export async function markCustomPlanReadyForAdmin(requestId: string): Promise<AdminActionResult<{ status: CustomPlanRequestStatus }>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();

  const { data: requestRow, error: requestError } = await svc
    .from("custom_plan_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<CustomPlanRequestRow>();
  if (requestError || !requestRow) return { ok: false, error: "الطلب غير موجود." };
  if (requestRow.status !== "in_progress") {
    return { ok: false, error: "الطلب لازم يكون \"قيد التجهيز\" قبل ما ينوضع كجاهز." };
  }

  const { data: draftRow, error: draftError } = await svc
    .from("custom_plan_drafts")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<CustomPlanDraftRow>();
  if (draftError || !draftRow) return { ok: false, error: "ما فيه مسودة لهذا الطلب بعد." };
  if (draftRow.status !== "approved") {
    return { ok: false, error: "لازم تعتمد المسودة (\"اعتماد الخطة\") قبل ما تنوضع كجاهزة." };
  }

  const planData = normalizeDraftPlanData(draftRow.plan_data);
  const unresolvedPlaceIds = getUnresolvedPlaceIds(planData.days);
  const errors = validateCustomPlanDraftForReady(
    planData,
    { durationDays: requestRow.duration_days, arrivalDate: requestRow.arrival_date },
    unresolvedPlaceIds
  );
  if (errors.length > 0) {
    return { ok: false, error: errors.join(" | ") };
  }

  const { data, error } = await svc
    .from("custom_plan_requests")
    .update({ status: "ready" })
    .eq("id", requestId)
    .select("status")
    .single<{ status: CustomPlanRequestStatus }>();

  if (error || !data) return { ok: false, error: "تعذّر تحديث حالة الطلب." };
  return { ok: true, data: { status: data.status } };
}

/**
 * "تسليم الخطة": ready -> delivered. Publishes the ALREADY-REVIEWED draft as a frozen
 * custom_plan_final_plans snapshot -- never rebuilds/regenerates at delivery time. Idempotent:
 * a repeat call (double click, retried request) reuses the existing final-plan row instead of
 * inserting a second one or re-freezing a possibly-since-edited draft, and returns the exact
 * same frozen artifact every time.
 */
export async function deliverCustomPlanForAdmin(requestId: string): Promise<AdminActionResult<CustomPlanFinalPlan>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();

  const { data: requestRow, error: requestError } = await svc
    .from("custom_plan_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<CustomPlanRequestRow>();
  if (requestError || !requestRow) return { ok: false, error: "الطلب غير موجود." };

  const { data: existingFinal } = await svc
    .from("custom_plan_final_plans")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<CustomPlanFinalPlanRow>();

  if (existingFinal) {
    if (requestRow.status !== "delivered") {
      await svc.from("custom_plan_requests").update({ status: "delivered" }).eq("id", requestId);
    }
    return { ok: true, data: mapFinalPlanRow(existingFinal) };
  }

  if (requestRow.status !== "ready") {
    return { ok: false, error: "الطلب لازم يكون \"جاهز\" قبل التسليم." };
  }
  if (!requestRow.user_id) {
    return { ok: false, error: "الطلب غير مرتبط بحساب مستخدم." };
  }

  const { data: draftRow, error: draftError } = await svc
    .from("custom_plan_drafts")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<CustomPlanDraftRow>();
  if (draftError || !draftRow) return { ok: false, error: "ما فيه مسودة لهذا الطلب." };

  const finalPlanData = buildFinalPlanDataFromDraft(normalizeDraftPlanData(draftRow.plan_data), new Date().toISOString());

  const { data: inserted, error: insertError } = await svc
    .from("custom_plan_final_plans")
    .insert({
      request_id: requestId,
      user_id: requestRow.user_id,
      destination: requestRow.destination,
      duration_days: requestRow.duration_days,
      plan_data: finalPlanData,
      delivered_at: finalPlanData.deliveredAt,
    })
    .select("*")
    .single<CustomPlanFinalPlanRow>();

  if (insertError || !inserted) return { ok: false, error: "تعذّر نشر الخطة النهائية." };

  const { error: statusError } = await svc.from("custom_plan_requests").update({ status: "delivered" }).eq("id", requestId);
  if (statusError) return { ok: false, error: "اتنشرت الخطة بس تعذّر تحديث حالة الطلب -- حاول مرة ثانية." };

  return { ok: true, data: mapFinalPlanRow(inserted) };
}

/**
 * "معاينة خطة الزبون": renders with the exact same shared component the customer eventually
 * sees (CustomPlanFinalPlanView), BEFORE delivery. Before a real final-plan row exists this
 * builds a LIVE (not persisted) preview straight from the current approved-or-not draft, so the
 * admin can check the content without it ever reaching customPlanFinalPlans/being customer-
 * visible; once delivered, returns the actual frozen row instead (never rebuilds it).
 */
export async function getFinalPlanPreviewForAdmin(requestId: string): Promise<AdminActionResult<{ planData: CustomPlanFinalPlanData; isLive: boolean }>> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "غير مصرح لك." };

  const svc = createServiceRoleClient();

  const { data: existingFinal } = await svc
    .from("custom_plan_final_plans")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<CustomPlanFinalPlanRow>();
  if (existingFinal) return { ok: true, data: { planData: existingFinal.plan_data, isLive: false } };

  const { data: draftRow, error: draftError } = await svc
    .from("custom_plan_drafts")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle<CustomPlanDraftRow>();
  if (draftError || !draftRow) return { ok: false, error: "ما فيه مسودة لهذا الطلب بعد." };

  const planData = buildFinalPlanDataFromDraft(normalizeDraftPlanData(draftRow.plan_data), new Date().toISOString());
  return { ok: true, data: { planData, isLive: true } };
}
