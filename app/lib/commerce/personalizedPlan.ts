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
import { randomUUID } from "crypto";
import { normalizePersonalizedAnswers } from "../planner/personalizedPlanAnswers";
import type { TripDetailsInput } from "../planner/personalizedSummary";

/**
 * Personalized Plan -- server-side purchase + generation logic.
 *
 * The Personalized Plan is an UNLOCK: paying once makes the customer an OWNER of the personalized planner, and an owner creates, edits and
 * deletes personalized plans freely, with no further payment (see generateOwnerPersonalizedPlan).
 *
 * Buying it:
 *   questionnaire -> createPersonalizedPlanOrder (order + stored answers, atomically, price from the DB)
 *                 -> Allpay -> verified webhook / guest claim (unchanged) -> the order is PAID and OWNED, the entitlement is granted
 *                 -> the first plan is built from the answers typed before paying (generatePersonalizedPlanForRequest, kept as it was:
 *                    lease + once-only completion protect that ONE request from being built twice)
 *
 * Using it afterwards: authorization is ownership (user_owns_personalized_plan) and nothing else -- no order, no payment, no request.
 * Everything below runs with the service-role client, but only AFTER the user id has been read from the verified session -- never
 * from an argument.
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

// ── ownership: the Personalized Plan is an UNLOCK ─────────────────────────────────────────────────────────────
/**
 * True when this customer owns the Personalized Plan: an active entitlement from ANY earlier model, or a PAID order of theirs that contains
 * the product (decided by the database function user_owns_personalized_plan). Pending / unpaid orders never count. Guests are never owners
 * until their paid purchase is claimed into an account.
 */
export async function ownsPersonalizedPlan(userId: string): Promise<boolean> {
  const { data, error } = await createServiceRoleClient().rpc("user_owns_personalized_plan", { p_user_id: userId });
  if (error) {
    console.error("[planner] user_owns_personalized_plan failed:", error.code ?? "no-code");
    return false;
  }
  return data === true;
}

export type OwnerPlanErrorCode = "login_required" | "not_owner" | "invalid_answers" | "limit" | "in_progress" | "not_found" | "unsupported_destination" | "generation_failed" | "save_failed";
export type OwnerPlanResult = { ok: true; planId: string } | { ok: false; code: OwnerPlanErrorCode };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates (or, with `replacePlanId`, regenerates in place) one personalized plan for an OWNER, from the answers the browser sends -- which are
 * re-validated and rebuilt from the allow-list exactly like a purchase's answers. No order, order item, payment, request or entitlement is
 * created: the only authority is begin_owner_plan_generation, which says 'granted' only to a verified owner, one generation at a time, and
 * within the 30-plan cap. A non-owner gets not_owner and nothing is generated.
 *
 * "Edit plan" rewrites that plan's content in place (it keeps its id, so there is no duplicate clutter); a new plan is a new saved plan.
 */
export async function generateOwnerPersonalizedPlan(input: { destinationId?: unknown; answers?: unknown; replacePlanId?: unknown }): Promise<OwnerPlanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "login_required" };

  const normalized = normalizePersonalizedAnswers(input.answers, input.destinationId);
  if (!normalized.ok) return { ok: false, code: "invalid_answers" };

  let replaceId: string | null = null;
  if (input.replacePlanId !== undefined && input.replacePlanId !== null) {
    if (typeof input.replacePlanId !== "string" || !UUID_PATTERN.test(input.replacePlanId)) return { ok: false, code: "not_found" };
    replaceId = input.replacePlanId;
  }

  const serviceRole = createServiceRoleClient();
  const { data: gate, error: gateError } = await serviceRole.rpc("begin_owner_plan_generation", { p_user_id: user.id, p_replace_plan_id: replaceId });
  if (gateError || typeof gate !== "string") {
    console.error("[planner] begin_owner_plan_generation failed:", gateError?.code ?? "no-code");
    return { ok: false, code: "generation_failed" };
  }
  if (gate === "denied") return { ok: false, code: "not_owner" };
  if (gate === "limit") return { ok: false, code: "limit" };
  if (gate === "in_progress") return { ok: false, code: "in_progress" };
  if (gate === "not_found") return { ok: false, code: "not_found" };
  if (gate !== "granted") return { ok: false, code: "generation_failed" };

  // From here on this call holds the generation lease: it is released on every path out.
  try {
    if (normalized.destinationId !== "barcelona") return { ok: false, code: "unsupported_destination" };

    const answers = normalized.answers;
    const generated = await generateBarcelonaPlanV2({
      destinationId: normalized.destinationId,
      dateMode: answers.dateMode,
      durationDays: answers.durationDays,
      arrivalDate: answers.arrivalDate,
      departureDate: answers.departureDate,
      interests: answers.interests,
      surpriseMe: answers.surpriseMe,
      accommodation: answers.accommodation,
    });
    if (!generated.ok) {
      console.error("[planner] owner plan generation failed");
      return { ok: false, code: "generation_failed" };
    }

    const preferences = normalizeSmartPlannerV2Preferences(buildSavedPreferences(answers));

    if (replaceId) {
      const { data: replaced, error: replaceError } = await serviceRole.rpc("replace_owned_plan_content", {
        p_plan_id: replaceId,
        p_user_id: user.id,
        p_preferences: preferences,
        p_generated: { plan: generated.data },
      });
      if (replaceError) {
        console.error("[planner] replace_owned_plan_content failed:", replaceError.code ?? "no-code");
        return { ok: false, code: "save_failed" };
      }
      return replaced === true ? { ok: true, planId: replaceId } : { ok: false, code: "not_found" };
    }

    const { data: inserted, error: insertError } = await serviceRole
      .from("smart_planner_saved_plans")
      .insert({
        user_id: user.id,
        product_slug: V2_SAVED_PLAN_PRODUCT_SLUG,
        destination_slug: "barcelona",
        // planGeneration makes every owner-created plan distinct, so the table's identical-preferences rule never rejects a repeat.
        preferences_json: { ...preferences, planGeneration: randomUUID() },
        generated_plan_json: { plan: generated.data },
      })
      .select("id")
      .single<{ id: string }>();
    if (insertError || !inserted?.id) {
      console.error("[planner] saving an owner plan failed:", insertError?.code ?? "no-code");
      return { ok: false, code: "save_failed" };
    }
    return { ok: true, planId: inserted.id };
  } finally {
    await serviceRole.rpc("end_owner_plan_generation", { p_user_id: user.id });
  }
}

export type DeleteSavedPlanResult = { ok: true } | { ok: false; code: "login_required" | "not_found" | "failed" };

/** Permanently deletes ONE of the signed-in customer's own saved plans. The order, payment, entitlements and ownership are never touched. */
export async function deleteOwnSavedPlan(planId: unknown): Promise<DeleteSavedPlanResult> {
  if (typeof planId !== "string" || !UUID_PATTERN.test(planId)) return { ok: false, code: "not_found" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "login_required" };
  const { data, error } = await createServiceRoleClient().rpc("delete_saved_plan", { p_plan_id: planId, p_user_id: user.id });
  if (error) {
    console.error("[planner] delete_saved_plan failed:", error.code ?? "no-code");
    return { ok: false, code: "failed" };
  }
  return data === true ? { ok: true } : { ok: false, code: "not_found" };
}

/** The stored answers of one of the signed-in customer's own plans, to pre-fill "Edit plan". Read with their OWN session (row-level security). */
export type EditablePlan = { id: string; destinationId: string; rawAnswers: Record<string, unknown> };

export async function loadEditablePlan(planId: unknown): Promise<EditablePlan | null> {
  if (typeof planId !== "string" || !UUID_PATTERN.test(planId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("smart_planner_saved_plans")
    .select("id, destination_slug, preferences_json")
    .eq("id", planId)
    .eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG)
    .maybeSingle<{ id: string; destination_slug: string; preferences_json: Record<string, unknown> | null }>();
  const p = data?.preferences_json;
  if (!data || !p) return null;
  const accommodation = p.accommodation as { booked?: unknown; text?: unknown } | null | undefined;
  return {
    id: data.id,
    destinationId: data.destination_slug,
    rawAnswers: {
      dateMode: p.dateMode,
      ...(p.dateMode === "specific" ? { arrivalDate: p.arrivalDate, departureDate: p.departureDate } : { durationDays: p.durationDays }),
      interests: Array.isArray(p.interests) ? p.interests : [],
      surpriseMe: p.surpriseMe === true,
      accommodation: accommodation?.booked === true ? { booked: true, text: typeof accommodation.text === "string" ? accommodation.text : "" } : { booked: false },
    },
  };
}

// ── what /planner shows a signed-in customer ─────────────────────────────────────────────────────────────
export type PlannerPlanSummary = {
  id: string;
  destinationId: string;
  days: number | null;
  createdAt: string;
  /** The trip the plan was built for (interests / accommodation), for the card. */
  details: TripDetailsInput;
  /** Built from the answers typed before paying (a purchase request). */
  linkedToPurchase: boolean;
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
  /** The customer's saved personalized plans ("My Plans"). */
  plans: PlannerPlanSummary[];
  /** Paid (or complimentary) requests still waiting to be built from their stored answers, and -- only when explicitly resumed -- a pending order. */
  requests: PlannerRequestSummary[];
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
      .select("id, destination_slug, created_at, preferences_json")
      .eq("user_id", userId)
      .eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG)
      .order("created_at", { ascending: false })
      .returns<PlanRow[]>(),
  ]);

  const requests: PlannerRequestSummary[] = [];
  for (const row of requestRows ?? []) {
    if (row.generated_at) continue;
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
    };
  });

  return { plans: allPlans, requests };
}
