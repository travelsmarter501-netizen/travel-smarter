import { normalizePersonalizedAnswers, type PersonalizedPlanAnswers } from "./personalizedPlanAnswers";

/**
 * The hand-off from the planner questionnaire to /checkout.
 *
 * The questionnaire's last button saves the customer's raw answers in THIS tab's session storage (never in the URL,
 * never sent anywhere yet) and opens /checkout?plan=personalized. The checkout page reads them back only to SHOW a
 * summary and to send them to startPersonalizedPlanCheckout when the customer presses pay -- that server action
 * re-validates and re-builds the answers from an allow-list and stores them with the order before Allpay. The draft is
 * therefore display input only: it is never trusted, never an authorization, and nothing is stored on the server until
 * the customer pays (or at least presses the pay button).
 *
 * Session storage (not local storage) so it dies with the tab; it is cleared once a purchase is confirmed.
 */

const STORAGE_KEY = "travelSmarter:plannerDraft:v1";

export type PlannerAccommodationStatus = "hotel" | "apartment" | "not_booked";

/** What the wizard writes: the exact raw payload it will send to the server, plus its own UI-only accommodation choice. */
export type PlannerDraftInput = {
  destinationId: string;
  answers: Record<string, unknown>;
  accommodationStatus: PlannerAccommodationStatus;
};

/** What readers get back: the raw payload (to send on pay) and a validated copy (for display / restoring the wizard). */
export type PlannerDraft = {
  destinationId: string;
  rawAnswers: Record<string, unknown>;
  answers: PersonalizedPlanAnswers;
  accommodationStatus: PlannerAccommodationStatus;
};

const STATUSES: readonly string[] = ["hotel", "apartment", "not_booked"];

/** Pure: turns a stored string into a draft, or null if it is missing, malformed or fails the answer validation. */
export function parsePlannerDraft(raw: string | null): PlannerDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { destinationId, answers, accommodationStatus } = parsed as Record<string, unknown>;
    if (typeof destinationId !== "string" || !answers || typeof answers !== "object" || Array.isArray(answers)) return null;
    const normalized = normalizePersonalizedAnswers(answers, destinationId);
    if (!normalized.ok) return null;
    const status = typeof accommodationStatus === "string" && STATUSES.includes(accommodationStatus) ? (accommodationStatus as PlannerAccommodationStatus) : null;
    return {
      destinationId: normalized.destinationId,
      rawAnswers: answers as Record<string, unknown>,
      answers: normalized.answers,
      accommodationStatus: status ?? (normalized.answers.accommodation.booked ? "hotel" : "not_booked"),
    };
  } catch {
    return null;
  }
}

export function readPlannerDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readPlannerDraft(): PlannerDraft | null {
  return parsePlannerDraft(readPlannerDraftRaw());
}

export function writePlannerDraft(draft: PlannerDraftInput): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false; // blocked/full storage: the caller shows an error instead of navigating to an empty checkout
  }
}

export function clearPlannerDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
