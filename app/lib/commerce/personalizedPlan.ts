import "server-only";
import { createClient } from "../../../utils/supabase/server";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";
import { generateBarcelonaPlanV2 } from "../../smart-planner/barcelona-v2/actions";
import { normalizeSmartPlannerV2Preferences, V2_SAVED_PLAN_PRODUCT_SLUG } from "../planner/smartPlannerV2SavedPlans";
import type { SmartPlannerV2SavedPreferences } from "../planner/smartPlannerV2SavedPlans";
import { PRODUCT_SLUGS } from "./catalog";
import type { CheckoutErrorCode } from "./checkoutErrors";
import type { PersonalizedPlanAnswers } from "../planner/personalizedPlanAnswers";
import { inclusiveDayCount } from "../planner/dateOnly";
import { isComplimentaryUser } from "./complimentary";
import type { TripDetailsInput } from "../planner/personalizedSummary";

/**
 * Personalized Plan -- server-side order + generation logic for "one purchase = one plan".
 *
 *   questionnaire -> createPersonalizedPlanOrder (order + stored answers, atomically, price from the DB)
 *                 -> Allpay -> verified webhook / guest claim (unchanged) -> the request's order is PAID and OWNED
 *                 -> generatePersonalizedPlanForRequest (the ONLY way a plan gets generated)
 *
 * Generation is authorized by exactly one thing: begin_personalized_plan_generation returning 'granted' for
 * (request, verified session user) -- i.e. a request linked to a PAID order owned by that user that has not
 * already produced its plan. Owning the product entitlement does not matter here, and neither do the
 * questionnaire answers (they are only the stored input). Everything below runs with the service-role client,
 * but only AFTER the user id has been read from the verified session -- never from an argument.
 */

type ServiceRole = ReturnType<typeof createServiceRoleClient>;

// ── price (display only; the charge itself is computed in SQL from the same table) ─────────────────────────
export async function getPersonalizedPlanPriceIls(): Promise<number | null> {
  const { data, error } = await createServiceRoleClient()
    .from("products")
    .select("price_ils")
    .eq("slug", PRODUCT_SLUGS.personalizedPlan)
    .eq("active", true)
    .maybeSingle<{ price_ils: number | string }>();
  if (error || !data) return null;
  const price = Number(data.price_ils);
  return Number.isFinite(price) ? price : null;
}

// ── order creation ────────────────────────────────────────────────────────────────────────────────────────
export type CreatePersonalizedPlanOrderResult = { ok: true; orderId: string } | { ok: false; code: CheckoutErrorCode; error: string };

/**
 * Creates the pending order AND its request in one SQL transaction (create_personalized_plan_order).
 * There is deliberately no "already owned" check: buying the plan again for another trip is allowed.
 * `answers`/`destinationId` must already be the output of normalizePersonalizedAnswers.
 */
export async function createPersonalizedPlanOrder(params: {
  userId: string | null;
  destinationId: string;
  answers: PersonalizedPlanAnswers;
  claimTokenHash?: string | null;
  guestEmail?: string | null;
}): Promise<CreatePersonalizedPlanOrderResult> {
  const { data, error } = await createServiceRoleClient()
    .rpc("create_personalized_plan_order", {
      p_user_id: params.userId,
      p_destination_id: params.destinationId,
      p_answers: params.answers,
      p_claim_token_hash: params.claimTokenHash ?? null,
      p_guest_email: params.guestEmail ?? null,
    })
    .single<{ id: string }>();

  if (error || !data?.id) {
    console.error("[planner] create_personalized_plan_order failed:", error?.code ?? "no-code");
    return { ok: false, code: "order_create_failed", error: "تعذّر إنشاء الطلب. حاول مرة أخرى." };
  }
  return { ok: true, orderId: data.id };
}

// ── complimentary (demo) requests ────────────────────────────────────────────────────────────────────────
export type ComplimentaryErrorCode = "login_required" | "not_available" | "invalid_planner_answers" | "create_failed";
export type CreateComplimentaryRequestResult = { ok: true; requestId: string } | { ok: false; code: ComplimentaryErrorCode };

/**
 * Creates a complimentary request for the VERIFIED session user: no order, no payment, no entitlement. The allowlist check
 * (COMPLIMENTARY_USER_IDS, server-side) happens here against the session user id; a non-allowlisted user gets the same
 * generic "not_available" as a deployment with no allowlist at all, so nothing is revealed about who is on it.
 * `answers`/`destinationId` must already be the output of normalizePersonalizedAnswers.
 */
export async function createComplimentaryPlanRequest(params: { destinationId: string; answers: PersonalizedPlanAnswers }): Promise<CreateComplimentaryRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "login_required" };
  if (!isComplimentaryUser(user.id)) return { ok: false, code: "not_available" };

  const { data, error } = await createServiceRoleClient().rpc("create_complimentary_personalized_plan_request", {
    p_user_id: user.id,
    p_destination_id: params.destinationId,
    p_answers: params.answers,
  });
  if (error || typeof data !== "string") {
    console.error("[planner] create_complimentary_personalized_plan_request failed:", error?.code ?? "no-code");
    return { ok: false, code: "create_failed" };
  }
  return { ok: true, requestId: data };
}

// ── generation ────────────────────────────────────────────────────────────────────────────────────────────
export type GeneratePersonalizedPlanResult =
  | { ok: true; planId: string }
  | {
      ok: false;
      code: "login_required" | "not_found" | "not_paid" | "in_progress" | "plan_deleted" | "unsupported_destination" | "generation_failed" | "save_failed";
    };

type BeginRow = { state: string; request_destination: string | null; request_answers: PersonalizedPlanAnswers | null };

function buildSavedPreferences(answers: PersonalizedPlanAnswers): SmartPlannerV2SavedPreferences {
  const accommodation = answers.accommodation.booked ? { booked: true, text: answers.accommodation.text } : { booked: false };
  if (answers.dateMode === "flexible") {
    return { plannerVersion: "v2", destinationId: "barcelona", dateMode: "flexible", durationDays: answers.durationDays, interests: answers.interests, surpriseMe: answers.surpriseMe, accommodation };
  }
  return {
    plannerVersion: "v2",
    destinationId: "barcelona",
    dateMode: "specific",
    arrivalDate: answers.arrivalDate,
    departureDate: answers.departureDate,
    interests: answers.interests,
    surpriseMe: answers.surpriseMe,
    accommodation,
  };
}

async function releaseLease(serviceRole: ServiceRole, requestId: string) {
  // Only ever clears the lease of a request that has not generated; harmless otherwise.
  await serviceRole.from("personalized_plan_requests").update({ generating_started_at: null }).eq("id", requestId).is("generated_at", null);
}

/**
 * Generates THE plan for one paid request, from the answers stored on the server, and saves it.
 * `requestId` is untrusted input: it only selects which of THIS user's requests to work on.
 */
export async function generatePersonalizedPlanForRequest(requestId: unknown): Promise<GeneratePersonalizedPlanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "login_required" };
  if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, code: "not_found" };

  const serviceRole = createServiceRoleClient();

  // Defense in depth for complimentary requests: the database already ties them to their owner, and the server re-checks the
  // allowlist here, so removing someone from COMPLIMENTARY_USER_IDS also stops their unbuilt demo requests.
  const { data: origin } = await serviceRole.from("personalized_plan_requests").select("source").eq("id", requestId).maybeSingle<{ source: string }>();
  if (origin?.source === "complimentary" && !isComplimentaryUser(user.id)) return { ok: false, code: "not_found" };

  const { data: begin, error: beginError } = await serviceRole
    .rpc("begin_personalized_plan_generation", { p_request_id: requestId, p_user_id: user.id })
    .single<BeginRow>();

  if (beginError || !begin) {
    console.error("[planner] begin_personalized_plan_generation failed:", beginError?.code ?? "no-code");
    return { ok: false, code: "generation_failed" };
  }

  if (begin.state === "already_generated") {
    // One request = one plan: hand back the plan that already exists, never make a second one.
    const { data: existing } = await serviceRole
      .from("personalized_plan_requests")
      .select("saved_plan_id")
      .eq("id", requestId)
      .maybeSingle<{ saved_plan_id: string | null }>();
    return existing?.saved_plan_id ? { ok: true, planId: existing.saved_plan_id } : { ok: false, code: "plan_deleted" };
  }
  if (begin.state === "not_paid") return { ok: false, code: "not_paid" };
  if (begin.state === "in_progress") return { ok: false, code: "in_progress" };
  if (begin.state !== "granted" || !begin.request_answers || !begin.request_destination) return { ok: false, code: "not_found" };

  // From here on this call holds the generation lease: release it on every failure path.
  if (begin.request_destination !== "barcelona") {
    await releaseLease(serviceRole, requestId);
    return { ok: false, code: "unsupported_destination" };
  }

  const answers = begin.request_answers;
  const generated = await generateBarcelonaPlanV2({
    destinationId: begin.request_destination,
    dateMode: answers.dateMode,
    durationDays: answers.durationDays,
    arrivalDate: answers.arrivalDate,
    departureDate: answers.departureDate,
    interests: answers.interests,
    surpriseMe: answers.surpriseMe,
    accommodation: answers.accommodation,
  });
  if (!generated.ok) {
    console.error("[planner] plan generation failed for a paid request");
    await releaseLease(serviceRole, requestId);
    return { ok: false, code: "generation_failed" };
  }

  // Save the plan under the verified user. The request id inside preferences_json is backed by a partial unique
  // index, so a request can never own two saved plans -- a lost race simply finds the winner's row.
  const preferences = { ...normalizeSmartPlannerV2Preferences(buildSavedPreferences(answers)), personalizedPlanRequestId: requestId };
  const { data: inserted, error: insertError } = await serviceRole
    .from("smart_planner_saved_plans")
    .insert({
      user_id: user.id,
      product_slug: V2_SAVED_PLAN_PRODUCT_SLUG,
      destination_slug: "barcelona",
      preferences_json: preferences,
      generated_plan_json: { plan: generated.data },
    })
    .select("id")
    .single<{ id: string }>();

  let planId = inserted?.id ?? null;
  if (!planId) {
    if (insertError?.code === "23505") {
      const { data: winner } = await serviceRole
        .from("smart_planner_saved_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("preferences_json->>personalizedPlanRequestId", requestId)
        .maybeSingle<{ id: string }>();
      planId = winner?.id ?? null;
    }
    if (!planId) {
      console.error("[planner] saving the generated plan failed:", insertError?.code ?? "no-code");
      await releaseLease(serviceRole, requestId);
      return { ok: false, code: "save_failed" };
    }
  }

  const { data: completed, error: completeError } = await serviceRole.rpc("complete_personalized_plan_generation", {
    p_request_id: requestId,
    p_user_id: user.id,
    p_saved_plan_id: planId,
  });
  if (completeError) {
    console.error("[planner] complete_personalized_plan_generation failed:", completeError.code ?? "no-code");
    await releaseLease(serviceRole, requestId);
    return { ok: false, code: "save_failed" };
  }
  if (completed !== true) {
    // Another call finished first. The unique index guarantees it saved the same (only) plan.
    const { data: done } = await serviceRole
      .from("personalized_plan_requests")
      .select("saved_plan_id")
      .eq("id", requestId)
      .maybeSingle<{ saved_plan_id: string | null }>();
    return done?.saved_plan_id ? { ok: true, planId: done.saved_plan_id } : { ok: false, code: "save_failed" };
  }
  return { ok: true, planId };
}

// ── "paid but not built yet" ──────────────────────────────────────────────────────────────────────────────────
/**
 * True when this customer owns a PAID Personalized Plan request that has not produced its plan yet. Such a customer builds
 * that plan (free, one click) -- they are never sent back to payment, and /planner and the purchase action both use this.
 * It is decided on the server from the database (the verified session user id, the order status and generated_at), never from
 * anything the browser keeps (session storage drafts, an old tab, a back button).
 *
 * Only paid orders count: an unpaid (pending) request is not "paid", and a request whose plan was built (even if that plan was
 * later deleted) has generated_at set, so it is not "unbuilt" and a new purchase stays possible.
 */
export async function hasPaidUnbuiltRequest(userId: string): Promise<boolean> {
  const serviceRole = createServiceRoleClient();
  const { data: orders, error } = await serviceRole.from("orders").select("id").eq("user_id", userId).eq("status", "paid").returns<{ id: string }[]>();
  if (error || !orders || orders.length === 0) return false;
  const { data: requests, error: requestError } = await serviceRole
    .from("personalized_plan_requests")
    .select("id")
    .in(
      "order_id",
      orders.map((order) => order.id)
    )
    .is("generated_at", null)
    .limit(1)
    .returns<{ id: string }[]>();
  return !requestError && !!requests && requests.length > 0;
}

/**
 * Where this customer stands with the Personalized Plan, decided on the server from the database:
 *   "unbuilt"   a PAID request is waiting to be built       -> "Build my plan", never payment;
 *   "generated" they have at least one plan built from a paid / complimentary request (or a saved personalized plan) -> "Open my plan";
 *   "none"      nothing yet                                  -> the normal questionnaire and checkout.
 * A plan the customer removed from My Plans still counts as generated (it is only hidden). Unpaid attempts never count.
 */
export type PersonalizedPlanState = "none" | "unbuilt" | "generated";

export async function getPersonalizedPlanState(userId: string): Promise<PersonalizedPlanState> {
  if (await hasPaidUnbuiltRequest(userId)) return "unbuilt";

  const serviceRole = createServiceRoleClient();
  const { data: orders } = await serviceRole.from("orders").select("id").eq("user_id", userId).eq("status", "paid").returns<{ id: string }[]>();
  if (orders && orders.length > 0) {
    const { data: paid } = await serviceRole
      .from("personalized_plan_requests")
      .select("id")
      .in(
        "order_id",
        orders.map((order) => order.id)
      )
      .not("generated_at", "is", null)
      .limit(1)
      .returns<{ id: string }[]>();
    if (paid && paid.length > 0) return "generated";
  }

  const { data: complimentary } = await serviceRole
    .from("personalized_plan_requests")
    .select("id")
    .eq("complimentary_user_id", userId)
    .not("generated_at", "is", null)
    .limit(1)
    .returns<{ id: string }[]>();
  if (complimentary && complimentary.length > 0) return "generated";

  const { data: plans } = await serviceRole
    .from("smart_planner_saved_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG)
    .limit(1)
    .returns<{ id: string }[]>();
  return plans && plans.length > 0 ? "generated" : "none";
}

/** Stable JSON (sorted keys) so two answer objects compare equal whatever order their keys were written in. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return "{" + entries.map(([k, v]) => JSON.stringify(k) + ":" + stableStringify(v)).join(",") + "}";
  }
  return JSON.stringify(value);
}

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * True when this customer already has a PAID request for exactly these destination + answers from the last 24 hours. That is what a
 * stale tab, an old draft or a double tap produces: the same questionnaire submitted again right after it was bought. A genuine
 * second trip has different answers, so it is not caught. Paid requests only (an abandoned unpaid attempt can be retried freely).
 */
export async function hasRecentPaidRequestWithSameAnswers(userId: string, destinationId: string, answers: PersonalizedPlanAnswers): Promise<boolean> {
  const serviceRole = createServiceRoleClient();
  const { data: orders, error } = await serviceRole.from("orders").select("id").eq("user_id", userId).eq("status", "paid").returns<{ id: string }[]>();
  if (error || !orders || orders.length === 0) return false;
  const { data: requests, error: requestError } = await serviceRole
    .from("personalized_plan_requests")
    .select("destination_id, answers, created_at")
    .in(
      "order_id",
      orders.map((order) => order.id)
    )
    .returns<{ destination_id: string; answers: unknown; created_at: string }[]>();
  if (requestError || !requests) return false;
  const wanted = stableStringify(answers);
  const since = Date.now() - DUPLICATE_WINDOW_MS;
  return requests.some((row) => row.destination_id === destinationId && new Date(row.created_at).getTime() >= since && stableStringify(row.answers) === wanted);
}

// ── what /planner shows a signed-in customer ─────────────────────────────────────────────────────────────
export type PlannerPlanSummary = {
  id: string;
  destinationId: string;
  days: number | null;
  createdAt: string;
  /** The trip the plan was built for (interests / accommodation), for the card. */
  details: TripDetailsInput;
  /** Built from a paid (or complimentary) request: the plan is that purchase's product. */
  linkedToPurchase: boolean;
  archivedAt: string | null;
};
export type PlannerRequestSummary = {
  id: string;
  destinationId: string;
  days: number | null;
  createdAt: string;
  /** 'ready' = paid (or complimentary), waiting for the customer to build it; 'pending' = payment not confirmed yet. */
  state: "ready" | "pending";
  /** A complimentary/demo request (no order, no payment). */
  complimentary: boolean;
};
export type MyPersonalizedPlans = {
  /** Plans shown in "My Plans" (not removed). */
  plans: PlannerPlanSummary[];
  /** Plans the customer removed from the list; they still exist and can be restored. */
  archivedPlans: PlannerPlanSummary[];
  requests: PlannerRequestSummary[];
  /** How many of the customer's personalized requests (paid or complimentary) have produced their plan -- removed plans still count. */
  generatedCount: number;
  /** True if the customer has a paid (or complimentary) request under the one-purchase-one-plan model, built or not. Unpaid attempts never count. */
  hasAnyRequest: boolean;
};

type RequestRow = {
  id: string;
  order_id: string | null;
  destination_id: string;
  answers: { days?: unknown } | null;
  generated_at: string | null;
  created_at: string;
  source: string;
  orders: { status: string; created_at: string } | { status: string; created_at: string }[] | null;
};
type PlanRow = {
  id: string;
  destination_slug: string;
  created_at: string;
  archived_at: string | null;
  preferences_json: {
    durationDays?: unknown;
    arrivalDate?: unknown;
    departureDate?: unknown;
    surpriseMe?: unknown;
    interests?: unknown;
    accommodation?: { booked?: unknown; text?: unknown } | null;
    personalizedPlanRequestId?: unknown;
  } | null;
};


/**
 * What /planner shows a signed-in customer.
 *
 * A PENDING (unpaid) personalized order is NOT part of the normal picture: it may be an abandoned checkout, a cancelled payment or an
 * old duplicate, and none of that may make My Plans look like a payment is outstanding. It is shown as "awaiting payment confirmation"
 * only when the visitor is resuming THAT specific order (`pendingOrderId`, from the ?order= link) and it still belongs to them and is still
 * pending. Every other unpaid request is ignored here: it unlocks nothing, blocks nothing, and does not count as having a plan.
 *
 * Read with the customer's OWN session client, so row-level security (not this code) decides what is visible:
 * only requests whose order they own, and only their own saved plans.
 */
export async function loadMyPersonalizedPlans(userId: string, options: { pendingOrderId?: string | null } = {}): Promise<MyPersonalizedPlans> {
  const supabase = await createClient();

  const [{ data: requestRows }, { data: planRows }] = await Promise.all([
    supabase
      .from("personalized_plan_requests")
      .select("id, order_id, destination_id, answers, generated_at, created_at, source, orders(status, created_at)")
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
    supabase
      .from("smart_planner_saved_plans")
      .select("id, destination_slug, created_at, archived_at, preferences_json")
      .eq("user_id", userId)
      .eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG)
      .order("created_at", { ascending: false })
      .returns<PlanRow[]>(),
  ]);

  const requests: PlannerRequestSummary[] = [];
  let generatedCount = 0;
  for (const row of requestRows ?? []) {
    if (row.generated_at) {
      const generatedOrder = Array.isArray(row.orders) ? row.orders[0] : row.orders;
      if (row.source === "complimentary" || generatedOrder?.status === "paid") generatedCount += 1;
      continue;
    }
    const days = typeof row.answers?.days === "number" ? row.answers.days : null;
    const base = { id: row.id, destinationId: row.destination_id, days, createdAt: row.created_at };
    if (row.source === "complimentary") {
      // No order and no payment: ready to build as soon as it exists (row-level security already limits this to the owner).
      requests.push({ ...base, state: "ready", complimentary: true });
      continue;
    }
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    if (!order) continue;
    if (order.status === "paid") requests.push({ ...base, state: "ready", complimentary: false });
    else if (order.status === "pending" && !!options.pendingOrderId && row.order_id === options.pendingOrderId)
      requests.push({ ...base, state: "pending", complimentary: false });
  }

  const allPlans: PlannerPlanSummary[] = (planRows ?? []).map((row) => {
    const p = row.preferences_json ?? {};
    const days =
      typeof p.durationDays === "number"
        ? p.durationDays
        : typeof p.arrivalDate === "string" && typeof p.departureDate === "string"
          ? inclusiveDayCount(p.arrivalDate, p.departureDate)
          : null;
    return {
      id: row.id,
      destinationId: row.destination_slug,
      days,
      createdAt: row.created_at,
      details: {
        surpriseMe: p.surpriseMe === true,
        interests: Array.isArray(p.interests) ? (p.interests as TripDetailsInput["interests"]) : [],
        accommodation: p.accommodation ? { booked: p.accommodation.booked === true, text: typeof p.accommodation.text === "string" ? p.accommodation.text : undefined } : null,
      },
      linkedToPurchase: typeof p.personalizedPlanRequestId === "string",
      archivedAt: row.archived_at ?? null,
    };
  });

  return {
    plans: allPlans.filter((plan) => !plan.archivedAt),
    archivedPlans: allPlans.filter((plan) => !!plan.archivedAt),
    requests,
    generatedCount,
    // Purchase-backed requests only (paid, or complimentary): an unpaid attempt does not make someone a customer of the new model.
    hasAnyRequest: generatedCount > 0 || requests.some((request) => request.state === "ready"),
  };
}
