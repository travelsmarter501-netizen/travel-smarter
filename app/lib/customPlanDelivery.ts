import "server-only";
import { createClient } from "../../utils/supabase/server";
import type { CustomPlanFinalPlanData } from "./customPlanFinalPlan";
import type { CustomPlanAccommodationStatus, CustomPlanRequestStatus } from "./customPlanRequest";

/**
 * Custom Plan Fulfillment V1 -- the ONLY code path a signed-in customer's own final plan comes
 * through. Uses the normal session-bound client (never the service-role client) so
 * public.custom_plan_requests/public.custom_plan_final_plans' own RLS policies
 * (`user_id = auth.uid()`) are the real enforcement -- a foreign request id or an anonymous
 * caller simply gets nothing back from Postgres itself, not just a check in this file. Before
 * "delivered", the real draft/plan content is never touched here at all (this file doesn't even
 * import customPlanAdmin.ts) -- only the request's own status is read, matching "Customer: NO
 * direct access yet" to anything admin-authored.
 */

export type CustomPlanDeliveryOverview = {
  destination: string;
  durationDays: number;
  arrivalDate: string | null;
  departureDate: string | null;
  interests: string[];
  accommodationType: CustomPlanAccommodationStatus | null;
  accommodationText: string | null;
};

export type CustomPlanDeliveryView =
  | { kind: "not_found" }
  | { kind: "pending"; status: CustomPlanRequestStatus; overview: CustomPlanDeliveryOverview }
  | { kind: "delivered"; overview: CustomPlanDeliveryOverview; planData: CustomPlanFinalPlanData };

type RequestRow = {
  destination: string;
  duration_days: number;
  status: CustomPlanRequestStatus;
  arrival_date: string | null;
  departure_date: string | null;
  interests: string[] | null;
  accommodation_type: CustomPlanAccommodationStatus | null;
  accommodation: string | null;
};

export async function getCustomPlanDeliveryForUser(requestId: string): Promise<CustomPlanDeliveryView> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "not_found" };

  const { data: request, error } = await supabase
    .from("custom_plan_requests")
    .select("destination, duration_days, status, arrival_date, departure_date, interests, accommodation_type, accommodation")
    .eq("id", requestId)
    .maybeSingle<RequestRow>();
  if (error || !request) return { kind: "not_found" };

  const overview: CustomPlanDeliveryOverview = {
    destination: request.destination,
    durationDays: request.duration_days,
    arrivalDate: request.arrival_date,
    departureDate: request.departure_date,
    interests: request.interests ?? [],
    accommodationType: request.accommodation_type,
    accommodationText: request.accommodation,
  };

  if (request.status !== "delivered") {
    return { kind: "pending", status: request.status, overview };
  }

  const { data: finalPlan, error: finalError } = await supabase
    .from("custom_plan_final_plans")
    .select("plan_data")
    .eq("request_id", requestId)
    .maybeSingle<{ plan_data: CustomPlanFinalPlanData }>();

  // Defensive only -- status says "delivered" but the frozen row is somehow missing. Never
  // fabricate a plan; fall back to the pending view rather than crash.
  if (finalError || !finalPlan) return { kind: "pending", status: request.status, overview };

  return { kind: "delivered", overview, planData: finalPlan.plan_data };
}
