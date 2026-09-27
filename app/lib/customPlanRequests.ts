import "server-only";
import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { validateCustomPlanRequest, type CustomPlanRequest, type CustomPlanRequestStatus } from "./customPlanRequest";
import { inclusiveDayCount, parseIsoDate } from "./planner/dateOnly";
import { V2_PLANNER_INTERESTS } from "./planner/v2PlannerTypes";

/**
 * Custom Plan V2 — server-only request persistence.
 *
 * The ONLY code path allowed to write to public.custom_plan_requests. Mirrors
 * app/lib/orders.ts's createPendingOrder trust model exactly: this file independently verifies
 * the caller's identity via the session-bound client BEFORE ever touching the service-role
 * client, and the service-role-only RPC it calls is unreachable from the browser (see the
 * migration's own comment for the full writeup).
 *
 * Login is required before persistence (by product decision, not by database constraint --
 * user_id is nullable at the schema level for a possible future guest flow, but this function
 * never calls the RPC without a real signed-in user). A logged-out call returns
 * `{ ok: false, requiresLogin: true }` so the caller (the Custom Plan submit action) can send
 * the visitor to /login?next=/custom-plan/barcelona without ever reaching the RPC.
 *
 * Simple Intake V2: re-derives the AUTHORITATIVE duration server-side rather than trusting the
 * client's own preview value -- in "days" mode the client's durationDays is re-validated as an
 * integer 1-10; in "specific" mode the real day count is recomputed from arrival/departureDate
 * using the same UTC-anchored date-only arithmetic the planner itself uses (dateOnly.ts), never
 * the client's own (possibly stale/tampered/timezone-drifted) preview number.
 */

/** Empty/whitespace-only text becomes null -- matches the column's own nullable intent. */
function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type CreatedCustomPlanRequest = {
  id: string;
  status: CustomPlanRequestStatus;
  durationDays: number;
  priceILS: number;
  createdAt: string;
};

export type CreateCustomPlanRequestResult =
  | { ok: true; data: CreatedCustomPlanRequest }
  | { ok: false; error: string; requiresLogin?: boolean };

type CustomPlanRequestRow = {
  id: string;
  status: CustomPlanRequestStatus;
  duration_days: number;
  price_ils: number;
  created_at: string;
};

/**
 * Validates again server-side (never trust the client's own validation pass), derives the
 * AUTHORITATIVE duration_days (see file header), and persists via the service-role-only RPC.
 * The RPC itself hardcodes price_ils = 99 for every valid duration -- this function never
 * sends any price to it at all, so a tampered client-side price can never reach the database.
 */
export async function createCustomPlanRequest(request: CustomPlanRequest): Promise<CreateCustomPlanRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "لازم تسجل الدخول لحفظ طلبك.", requiresLogin: true };
  }

  const clientValidationErrors = validateCustomPlanRequest(request);
  if (Object.keys(clientValidationErrors).length > 0) {
    return { ok: false, error: "في بيانات ناقصة أو غير صحيحة بالطلب." };
  }

  // ── Authoritative duration + dates (never trust the client's own number) ──────────────────
  let durationDays: number;
  let arrivalDate: string | null = null;
  let departureDate: string | null = null;

  if (request.dateMode === "days") {
    durationDays = request.durationDays;
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 10) {
      return { ok: false, error: "عدد الأيام لازم يكون رقم صحيح بين 1 و10." };
    }
  } else {
    if (!request.arrivalDate || !request.departureDate) {
      return { ok: false, error: "تاريخ الوصول والمغادرة مطلوبان." };
    }
    if (!parseIsoDate(request.arrivalDate) || !parseIsoDate(request.departureDate)) {
      return { ok: false, error: "صيغة التاريخ غير صحيحة." };
    }
    const days = inclusiveDayCount(request.arrivalDate, request.departureDate);
    if (days === null) {
      return { ok: false, error: "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول." };
    }
    if (days > 10) {
      return { ok: false, error: "أقصى مدة للخطة المخصصة حاليًا 10 أيام." };
    }
    durationDays = days;
    arrivalDate = request.arrivalDate;
    departureDate = request.departureDate;
  }

  // ── Interests: at least one, and only real V2 keys ─────────────────────────────────────────
  if (request.interests.length === 0 || !request.interests.every((interest) => (V2_PLANNER_INTERESTS as readonly string[]).includes(interest))) {
    return { ok: false, error: "اختيارات الاهتمامات غير صحيحة." };
  }

  // ── Accommodation ───────────────────────────────────────────────────────────────────────
  if (
    request.accommodationStatus !== null &&
    request.accommodationStatus !== "hotel" &&
    request.accommodationStatus !== "apartment" &&
    request.accommodationStatus !== "not_booked"
  ) {
    return { ok: false, error: "بيانات السكن غير صحيحة." };
  }
  const accommodationTextRequired = request.accommodationStatus === "hotel" || request.accommodationStatus === "apartment";
  const accommodationText = accommodationTextRequired ? nullableText(request.accommodationText) : null;
  if (accommodationTextRequired && !accommodationText) {
    return { ok: false, error: request.accommodationStatus === "hotel" ? "اسم الفندق أو العنوان مطلوب." : "اسم الشقة أو العنوان مطلوب." };
  }

  // ── Contact ─────────────────────────────────────────────────────────────────────────────
  const name = request.name.trim();
  const email = request.email.trim();
  if (!name) {
    return { ok: false, error: "الاسم مطلوب." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "بريد إلكتروني غير صحيح." };
  }

  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole
    .rpc("create_custom_plan_request", {
      p_user_id: user.id,
      p_destination: request.destination,
      p_duration_days: durationDays,
      p_arrival_date: arrivalDate,
      p_departure_date: departureDate,
      p_accommodation_type: request.accommodationStatus,
      p_accommodation_text: accommodationText,
      p_interests: request.interests,
      p_customer_name: name,
      p_customer_email: email,
      p_customer_phone: nullableText(request.phone),
    })
    .single<CustomPlanRequestRow>();

  if (error || !data) {
    return { ok: false, error: "تعذّر حفظ طلبك. حاول مرة أخرى." };
  }

  return {
    ok: true,
    data: {
      id: data.id,
      status: data.status,
      durationDays: data.duration_days,
      priceILS: data.price_ils,
      createdAt: data.created_at,
    },
  };
}

export type CustomPlanRequestSummary = {
  id: string;
  destination: string;
  durationDays: number;
  status: CustomPlanRequestStatus;
  createdAt: string;
  /** Set once the Custom Plan -> Commerce Bridge has created/linked a pending (or later paid)
   * order for this request (see app/lib/customPlanCommerce.ts); null until then. */
  orderId: string | null;
};

/** Every custom plan request belonging to the current user, newest first. Empty array if logged out. Read-only -- RLS (user_id = auth.uid()) is the real enforcement, this just mirrors the same pattern used for orders/saved plans. Renders any duration 1-10 -- never assumes 3/5/7. */
export async function getUserCustomPlanRequests(): Promise<CustomPlanRequestSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("custom_plan_requests")
    .select("id, destination, duration_days, status, created_at, order_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<
      { id: string; destination: string; duration_days: number; status: CustomPlanRequestStatus; created_at: string; order_id: string | null }[]
    >();

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    destination: row.destination,
    durationDays: row.duration_days,
    status: row.status,
    createdAt: row.created_at,
    orderId: row.order_id,
  }));
}
