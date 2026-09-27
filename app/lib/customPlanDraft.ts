/**
 * Custom Plan Admin Builder V1 -- the itinerary draft an admin reviews/edits for one Custom
 * Plan request. Mirrors public.custom_plan_drafts.plan_data exactly (see the migration's own
 * comment). This is admin-authoring data only -- never shown to the customer in this task.
 *
 * Deliberately stores place IDs and planning-specific fields only, never full place metadata
 * (name/hours/image/address) -- that is always re-resolved from the Barcelona Guide dataset at
 * render time (see app/lib/customPlanAdmin.ts's resolveDraftStopDisplay). `title` on a stop is
 * a small display-label snapshot captured at generation/edit time (so the admin list/editor
 * can render instantly without an async guide lookup per keystroke) -- it is never the
 * authoritative source for a place's real name; that's always placeId + a guide re-resolution.
 */

import { addDaysToIsoDate } from "./planner/dateOnly";

export type CustomPlanDraftStatus = "draft" | "approved";

/** Distinguishes a real scheduled visit from a loose food/nightlife suggestion (see the
 * "Custom Plan Admin Builder V1" task's food/nightlife section) -- only "visit" stops get a
 * meaningful `startTime`; suggestion stops are intentionally not time-boxed. */
export type CustomPlanDraftStopKind = "visit" | "lunch" | "dinner" | "nightlife";

export type CustomPlanDraftStop = {
  placeId: string;
  title: string;
  kind: CustomPlanDraftStopKind;
  /** "HH:MM", only meaningful for kind "visit". Null/omitted for suggestion stops. */
  startTime?: string | null;
  durationMinutes?: number | null;
  /** Internal-only -- for the admin/preparer, NEVER sent to the customer final plan. See
   * customPlanFinalPlan.ts's buildFinalPlanDataFromDraft, which structurally drops this field
   * rather than filtering it by convention. */
  adminNote?: string | null;
  /** Shown on the customer-facing final plan as-is once delivered -- write customer-appropriate
   * text here, never internal admin shorthand. */
  customerNote?: string | null;
};

export type CustomPlanDraftDay = {
  dayNumber: number;
  /** ISO "yyyy-mm-dd", set only when the request used specific dates (arrivalDate present at
   * generation time) -- null for duration-only requests, never guessed. */
  date: string | null;
  title: string;
  /** Short customer-facing day summary (e.g. "صباح بالحي القوطي، عصر عالشاطئ"). Empty string
   * until an admin writes one -- always a string, never null, to keep the editor's textarea
   * binding simple. */
  summary: string;
  stops: CustomPlanDraftStop[];
};

export type CustomPlanDraftPlanData = {
  requestId: string;
  destination: "barcelona";
  durationDays: number;
  days: CustomPlanDraftDay[];
  /** Raw mustVisit tokens that could not be deterministically matched to a known Barcelona
   * place -- surfaced separately for the admin to handle manually, never guessed/invented. */
  unmatchedMustVisits: string[];
  /** ISO timestamp of the last (re)generation -- for the admin's own reference only. */
  generatedAt: string;
};

export type CustomPlanDraft = {
  id: string;
  requestId: string;
  status: CustomPlanDraftStatus;
  planData: CustomPlanDraftPlanData;
  createdAt: string;
  updatedAt: string;
};

export const CUSTOM_PLAN_DRAFT_STATUS_LABELS: Record<CustomPlanDraftStatus, string> = {
  draft: "مسودة",
  approved: "معتمدة",
};

export const CUSTOM_PLAN_DRAFT_STOP_KIND_LABELS: Record<CustomPlanDraftStopKind, string> = {
  visit: "زيارة",
  lunch: "اقتراح غداء",
  dinner: "اقتراح عشاء",
  nightlife: "اقتراح ليلي",
};

/**
 * Light structural validation run server-side before every save (never trust the client's own
 * edits as-is) -- day numbers sequential from 1, no duplicate placeId across the WHOLE plan
 * (not just within a day), every stop has a non-empty placeId/title. Does not re-validate
 * guide-place existence (an admin removing/renaming a guide entry after a draft was saved is
 * an edge case handled at render/resolve time, not here) or business rules like time budgets --
 * those are generation heuristics, not hard constraints an admin edit must obey. Deliberately
 * permissive about empty days/stops -- an admin mid-edit can legitimately pass through an empty
 * day; the stricter "ready for delivery" checklist (customPlanAdmin.ts's
 * validateDraftReadyForDelivery) is a separate, later gate.
 */
export function validateCustomPlanDraftPlanData(planData: CustomPlanDraftPlanData): string | null {
  if (!Array.isArray(planData.days) || planData.days.length === 0) {
    return "الخطة لازم تحتوي على يوم واحد على الأقل.";
  }

  const seenPlaceIds = new Set<string>();
  for (let i = 0; i < planData.days.length; i++) {
    const day = planData.days[i];
    if (day.dayNumber !== i + 1) {
      return "ترقيم الأيام لازم يكون متسلسل من 1.";
    }
    if (typeof day.title !== "string" || day.title.trim().length === 0) {
      return `اليوم ${day.dayNumber} لازم يكون له عنوان.`;
    }
    for (const stop of day.stops) {
      if (!stop.placeId || typeof stop.placeId !== "string") {
        return `في محطة بدون مكان محدد باليوم ${day.dayNumber}.`;
      }
      if (seenPlaceIds.has(stop.placeId)) {
        return `المكان "${stop.placeId}" مكرر أكثر من مرة بالخطة.`;
      }
      seenPlaceIds.add(stop.placeId);
    }
  }

  return null;
}

/**
 * Normalizes a raw `plan_data` JSON blob read back from the database into the CURRENT
 * `CustomPlanDraftPlanData` shape -- a draft row created before the Custom Plan Fulfillment V1
 * change has days with no `summary`/`date` and stops with a single legacy `notes` field instead
 * of `adminNote`/`customerNote`. Applied once, at the DB-read boundary (customPlanAdmin.ts's
 * mapDraftRow), so every other file can assume the current shape unconditionally. A legacy
 * `notes` value is treated as an admin-only note (that was always its effective meaning -- drafts
 * were never customer-visible before this change) -- never invented as a customerNote.
 */
export function normalizeDraftPlanData(raw: CustomPlanDraftPlanData): CustomPlanDraftPlanData {
  return {
    ...raw,
    days: (raw.days ?? []).map((day) => {
      const legacyDay = day as CustomPlanDraftDay & { summary?: string | null; date?: string | null };
      return {
        ...day,
        date: legacyDay.date ?? null,
        summary: typeof legacyDay.summary === "string" ? legacyDay.summary : "",
        stops: (day.stops ?? []).map((stop) => {
          const legacyStop = stop as CustomPlanDraftStop & { notes?: string | null };
          const hasCurrentNoteFields = "adminNote" in stop || "customerNote" in stop;
          return {
            ...stop,
            adminNote: hasCurrentNoteFields ? (stop.adminNote ?? null) : (legacyStop.notes ?? null),
            customerNote: hasCurrentNoteFields ? (stop.customerNote ?? null) : null,
          };
        }),
      };
    }),
  };
}

/**
 * Stricter checklist a draft must pass before a request can move to "ready" (see the Custom
 * Plan Fulfillment V1 task's own Mark Ready validation list) -- layered on top of the base
 * structural validator above. Returns every failing rule (not just the first) so the admin sees
 * the exact, complete list of what still needs fixing. Never checks guide-place resolution here
 * (that needs the Barcelona Guide dataset, which this module deliberately never imports -- see
 * the file header -- so the caller passes in an `unresolvedPlaceIds` set computed server-side).
 */
export function validateCustomPlanDraftForReady(
  planData: CustomPlanDraftPlanData,
  expected: { durationDays: number; arrivalDate: string | null },
  unresolvedPlaceIds: Set<string>
): string[] {
  const errors: string[] = [];

  const baseError = validateCustomPlanDraftPlanData(planData);
  if (baseError) errors.push(baseError);

  if (planData.days.length !== expected.durationDays) {
    errors.push(`عدد أيام المسودة (${planData.days.length}) لا يطابق مدة الطلب (${expected.durationDays} أيام).`);
  }

  for (const day of planData.days) {
    if (day.stops.length === 0) {
      errors.push(`اليوم ${day.dayNumber} ما فيه ولا محطة.`);
    }
    if (expected.arrivalDate) {
      const expectedDate = addDaysToIsoDate(expected.arrivalDate, day.dayNumber - 1);
      if (day.date !== expectedDate) {
        errors.push(`تاريخ اليوم ${day.dayNumber} (${day.date ?? "—"}) لا يطابق تواريخ الطلب (المتوقع ${expectedDate ?? "—"}).`);
      }
    }
    for (const stop of day.stops) {
      if (unresolvedPlaceIds.has(stop.placeId)) {
        errors.push(`المكان "${stop.title}" (${stop.placeId}) باليوم ${day.dayNumber} ما عاد موجود بقاعدة البيانات.`);
      }
    }
  }

  return errors;
}
