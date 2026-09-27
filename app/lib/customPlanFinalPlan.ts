import type { CustomPlanDraftPlanData, CustomPlanDraftStopKind } from "./customPlanDraft";

/**
 * Custom Plan Fulfillment V1 -- the FROZEN, customer-facing itinerary snapshot delivered once
 * an admin marks a request "ready" and clicks "تسليم الخطة". Mirrors
 * public.custom_plan_final_plans.plan_data exactly.
 *
 * Deliberately a SEPARATE shape from CustomPlanDraftPlanData (customPlanDraft.ts), not a type
 * alias of it -- structurally impossible to leak `adminNote` or generation-internal fields
 * (unmatchedMustVisits, generatedAt) into what a customer sees, since this type has no field to
 * put them in. Built once, at delivery time, via buildFinalPlanDataFromDraft below -- never
 * regenerated, never re-derived from the draft again after that (see customPlanAdmin.ts's
 * deliverCustomPlanForAdmin, which persists this exact snapshot and never rebuilds it on a
 * repeat call).
 */

export type CustomPlanFinalPlanStop = {
  placeId: string;
  title: string;
  kind: CustomPlanDraftStopKind;
  startTime?: string | null;
  durationMinutes?: number | null;
  /** The ONLY note field on a final-plan stop -- there is no adminNote here at all. */
  customerNote?: string | null;
};

export type CustomPlanFinalPlanDay = {
  dayNumber: number;
  date: string | null;
  title: string;
  summary: string;
  stops: CustomPlanFinalPlanStop[];
};

export type CustomPlanFinalPlanData = {
  requestId: string;
  destination: "barcelona";
  durationDays: number;
  days: CustomPlanFinalPlanDay[];
  deliveredAt: string;
};

export type CustomPlanFinalPlan = {
  id: string;
  requestId: string;
  planData: CustomPlanFinalPlanData;
  deliveredAt: string;
  createdAt: string;
};

/**
 * Freezes an approved draft into its customer-facing final form -- strips `adminNote` field by
 * field (never by filtering a blob), drops `unmatchedMustVisits`/`generatedAt` (admin-only
 * generation artifacts), keeps everything else. Called exactly once per request, at delivery
 * time (see customPlanAdmin.ts) -- the result is persisted and never recomputed from the draft
 * again, so a later draft edit can never retroactively change an already-delivered plan.
 */
export function buildFinalPlanDataFromDraft(draft: CustomPlanDraftPlanData, deliveredAt: string): CustomPlanFinalPlanData {
  return {
    requestId: draft.requestId,
    destination: draft.destination,
    durationDays: draft.durationDays,
    deliveredAt,
    days: draft.days.map((day) => ({
      dayNumber: day.dayNumber,
      date: day.date,
      title: day.title,
      summary: day.summary,
      stops: day.stops.map((stop) => ({
        placeId: stop.placeId,
        title: stop.title,
        kind: stop.kind,
        startTime: stop.startTime,
        durationMinutes: stop.durationMinutes,
        customerNote: stop.customerNote,
      })),
    })),
  };
}
