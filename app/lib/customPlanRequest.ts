import type { V2PlannerInterest } from "./planner/v2PlannerTypes";
import { V2_PLANNER_INTERESTS, V2_SURPRISE_ME_PRESET } from "./planner/v2PlannerTypes";

/**
 * Custom Plan V2 — request-form domain (types, option labels, validation).
 *
 * This is a REQUEST: persisted as a 'draft' row via a trusted server path once the customer is
 * authenticated (see app/lib/customPlanRequests.ts) -- never a real order, payment, or
 * entitlement. Kept separate from customPlan.ts (which only owns duration/pricing).
 *
 * Simple Intake V2: the customer-facing shape below (`CustomPlanRequest`) replaced the old,
 * much longer questionnaire (traveler type/count, children, must-visit, food preferences,
 * nightlife types, pace, budget style, special requests -- all removed from the form). Those
 * legacy types/option lists are kept further down, UNCHANGED, purely so the admin review page
 * can still render historical pre-V2 request rows correctly (see
 * app/admin/custom-plans/[requestId]/page.tsx) -- new rows never populate them.
 */

// ── Current customer-facing model (V2 simple intake) ────────────────────────────────────────

export type CustomPlanAccommodationStatus = "hotel" | "apartment" | "not_booked";

export const CUSTOM_PLAN_ACCOMMODATION_STATUS_OPTIONS: { value: CustomPlanAccommodationStatus; label: string }[] = [
  { value: "hotel", label: "فندق" },
  { value: "apartment", label: "شقة" },
  { value: "not_booked", label: "لسا ما حجزت" },
];

/**
 * Mirrors custom_plan_requests.status exactly (see the Custom Plan Requests migration, extended
 * additively by the Custom Plan Fulfillment V1 migration to add "ready"/"delivered") --
 * server/DB-owned, never set by the client form. "completed" is a legacy pre-Fulfillment value:
 * still a valid historical status (old rows must keep reading correctly), but no code path
 * writes it anymore -- new fulfillment flows use "ready" then "delivered" instead. */
export type CustomPlanRequestStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "in_progress"
  | "completed"
  | "ready"
  | "delivered"
  | "cancelled";

export const CUSTOM_PLAN_REQUEST_STATUS_LABELS: Record<CustomPlanRequestStatus, string> = {
  draft: "محفوظ",
  pending_payment: "بانتظار الدفع",
  paid: "مدفوع",
  in_progress: "قيد التجهيز",
  completed: "جاهز",
  ready: "جاهزة",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

/**
 * The current Custom Plan request payload: duration/dates, the same final 8 V2 interest keys
 * Smart Planner V2 uses (see v2PlannerTypes.ts -- imported, never redefined here, so the two
 * products can never silently drift apart), accommodation, and contact info only. Nothing here
 * generates an itinerary -- this is a REQUEST, saved for later manual review.
 */
export type CustomPlanRequest = {
  destination: "barcelona";
  dateMode: "days" | "specific";
  /** Authoritative in "days" mode. In "specific" mode this is a CLIENT-SIDE PREVIEW only,
   * derived from arrival/departureDate for instant UI feedback -- the server independently
   * re-derives the real duration from the dates themselves (see customPlanRequests.ts) rather
   * than trusting this field when dateMode === "specific". */
  durationDays: number;
  /** ISO "yyyy-mm-dd", set only in "specific" mode. */
  arrivalDate: string | null;
  departureDate: string | null;
  interests: V2PlannerInterest[];
  accommodationStatus: CustomPlanAccommodationStatus | null;
  /** Required only when accommodationStatus is "hotel" or "apartment"; ignored otherwise. */
  accommodationText: string;
  name: string;
  email: string;
  /** Optional. */
  phone: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CustomPlanRequestErrors = Partial<Record<"name" | "email" | "duration" | "dates" | "accommodation" | "interests", string>>;

/**
 * Shared validation -- run client-side for instant feedback AND again server-side
 * (customPlanRequests.ts) right before persisting, since client-side checks can never be
 * trusted as the real gate.
 */
export function validateCustomPlanRequest(request: CustomPlanRequest): CustomPlanRequestErrors {
  const errors: CustomPlanRequestErrors = {};

  if (!request.name.trim()) {
    errors.name = "الاسم مطلوب.";
  }

  if (!request.email.trim()) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_PATTERN.test(request.email.trim())) {
    errors.email = "بريد إلكتروني غير صحيح.";
  }

  if (request.interests.length === 0) {
    errors.interests = "اختر اهتمامًا واحدًا على الأقل، أو استخدم \"فاجئني بخطة متوازنة\".";
  } else if (!request.interests.every((interest) => (V2_PLANNER_INTERESTS as readonly string[]).includes(interest))) {
    errors.interests = "في اهتمام غير معروف بالطلب.";
  }

  if (request.dateMode === "days") {
    if (!Number.isInteger(request.durationDays) || request.durationDays < 1 || request.durationDays > 10) {
      errors.duration = "عدد الأيام لازم يكون رقم صحيح بين 1 و10.";
    }
  } else {
    if (!request.arrivalDate || !request.departureDate) {
      errors.dates = "تاريخ الوصول والمغادرة مطلوبان.";
    } else if (request.departureDate < request.arrivalDate) {
      errors.dates = "تاريخ المغادرة لازم يكون بعد أو بنفس تاريخ الوصول.";
    } else {
      const days = inclusiveDayCountLocal(request.arrivalDate, request.departureDate);
      if (days !== null && days > 10) {
        errors.dates = "أقصى مدة للخطة المخصصة حاليًا 10 أيام.";
      }
    }
  }

  if (
    (request.accommodationStatus === "hotel" || request.accommodationStatus === "apartment") &&
    !request.accommodationText.trim()
  ) {
    errors.accommodation = request.accommodationStatus === "hotel" ? "اسم الفندق أو العنوان مطلوب." : "اسم الشقة أو العنوان مطلوب.";
  }

  return errors;
}

/** Tiny local copy of dateOnly.ts's inclusiveDayCount -- kept local (not imported) so this
 * file has zero dependency on the planner lib; duplicated logic is a handful of lines and this
 * is a pure, stable calendar calculation unlikely to drift. Server-side validation
 * (customPlanRequests.ts) uses the real planner dateOnly.ts as the actual authority. */
function inclusiveDayCountLocal(arrivalIso: string, departureIso: string): number | null {
  const arrival = new Date(`${arrivalIso}T00:00:00Z`);
  const departure = new Date(`${departureIso}T00:00:00Z`);
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return null;
  const diffDays = Math.round((departure.getTime() - arrival.getTime()) / 86_400_000);
  return diffDays < 0 ? null : diffDays + 1;
}

/** Deterministic "balanced" preference profile for Custom Plan's own "فاجئني بخطة متوازنة ✨"
 * -- the EXACT same concept and interest set as Smart Planner V2's own Surprise Me preset
 * (imported, not redefined), never randomized. Stores real preferences, never generates
 * anything -- Custom Plan is a request model, not the scoring engine. */
export const CUSTOM_PLAN_SURPRISE_ME_PRESET: V2PlannerInterest[] = V2_SURPRISE_ME_PRESET;

// ── Legacy pre-V2 model (kept ONLY for rendering historical admin request rows) ─────────────
// None of the types/options below are used by the current customer-facing form or
// createCustomPlanRequest -- new rows never populate traveler_type/travelers_count/
// has_children/children_count/must_visit/food_preferences/nightlife_types/pace/budget_style at
// all (they stay NULL/empty). Only app/admin/custom-plans/[requestId]/page.tsx (via
// customPlanAdmin.ts) still imports these, to correctly label a request saved before this
// change. Do not use these in any new customer-facing code.

export type TravelerType = "solo" | "couple" | "friends" | "family";

/** Legacy 10-key interest model -- superseded by V2PlannerInterest (8 keys) for every new
 * request. Kept only so INTEREST_OPTIONS below can still label old rows; two entries
 * (cultureHistory/footballExperiences) were added on top of the original 10 so the SAME label
 * list also covers every current V2PlannerInterest key -- see the option list's own comment. */
export type CustomPlanInterest =
  | "popular"
  | "cultureLocal"
  | "natureViews"
  | "beachRelax"
  | "footballSports"
  | "food"
  | "shopping"
  | "nightlife"
  | "photography"
  | "uniqueExperiences";

export type FoodPreference =
  | "local"
  | "halal"
  | "porkFree"
  | "vegetarian"
  | "fineDining"
  | "budgetFriendly"
  | "breakfastCafes"
  | "noPreference";

export type NightlifeType = "bars" | "rooftops" | "clubs";
export type TripPace = "relaxed" | "balanced" | "packed";
export type BudgetStyle = "budget" | "mid" | "premium" | "noPreference";

export const TRAVELER_TYPE_OPTIONS: { value: TravelerType; label: string }[] = [
  { value: "solo", label: "لحالي" },
  { value: "couple", label: "زوج / زوجة" },
  { value: "friends", label: "أصدقاء" },
  { value: "family", label: "عائلة" },
];

/** Label lookup for ANY interest key ever stored in custom_plan_requests.interests -- the
 * original 10 legacy keys, PLUS the 2 current V2 keys that don't already coincide with a
 * legacy name (popular/natureViews/food/shopping/beachRelax/nightlife are identical strings in
 * both models, so those 6 already work without duplication). Values stored are always the
 * real, exact key from whichever model saved the row (see the file header) -- this list only
 * adds display labels, it never rewrites what was actually saved. */
export const INTEREST_OPTIONS: { value: string; label: string }[] = [
  { value: "popular", label: "أشهر الأماكن" },
  { value: "cultureLocal", label: "ثقافة وأحياء محلية" },
  { value: "cultureHistory", label: "ثقافة وتاريخ" },
  { value: "natureViews", label: "طبيعة وإطلالات" },
  { value: "beachRelax", label: "شواطئ وراحة" },
  { value: "footballSports", label: "كرة قدم وتجارب رياضية" },
  { value: "footballExperiences", label: "كرة قدم وتجارب" },
  { value: "food", label: "أكل ومطاعم" },
  { value: "shopping", label: "تسوق" },
  { value: "nightlife", label: "حياة ليلية" },
  { value: "photography", label: "تصوير" },
  { value: "uniqueExperiences", label: "تجارب مميزة" },
];

export const FOOD_PREFERENCE_OPTIONS: { value: FoodPreference; label: string }[] = [
  { value: "local", label: "أكل محلي" },
  { value: "halal", label: "حلال" },
  { value: "porkFree", label: "بدون خنزير" },
  { value: "vegetarian", label: "نباتي" },
  { value: "fineDining", label: "مطاعم راقية" },
  { value: "budgetFriendly", label: "مطاعم اقتصادية" },
  { value: "breakfastCafes", label: "فطور وكافيهات" },
  { value: "noPreference", label: "بدون تفضيل" },
];

export const NIGHTLIFE_TYPE_OPTIONS: { value: NightlifeType; label: string }[] = [
  { value: "bars", label: "بارات" },
  { value: "rooftops", label: "روفتوب" },
  { value: "clubs", label: "نوادي ليلية" },
];

export const PACE_OPTIONS: { value: TripPace; label: string }[] = [
  { value: "relaxed", label: "هادي" },
  { value: "balanced", label: "متوازن" },
  { value: "packed", label: "مليان نشاط" },
];

export const BUDGET_STYLE_OPTIONS: { value: BudgetStyle; label: string }[] = [
  { value: "budget", label: "اقتصادي" },
  { value: "mid", label: "متوسط" },
  { value: "premium", label: "مريح / Premium" },
  { value: "noPreference", label: "بدون تفضيل" },
];
