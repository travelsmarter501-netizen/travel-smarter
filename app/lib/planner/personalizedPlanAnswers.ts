import { V2_PLANNER_INTERESTS } from "./v2PlannerTypes";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import { parseIsoDate, inclusiveDayCount } from "./dateOnly";
import { isAvailablePlannerDestinationId } from "./plannerDestinations";
import { PRODUCT_SLUGS } from "../commerce/catalog";

/**
 * Personalized Plan -- the questionnaire answers a customer submits BEFORE paying.
 *
 * Plain module (no "server-only", no "use client"): the browser uses the TYPE and the destination helper
 * to render the review step; the server uses `normalizePersonalizedAnswers` as the one authority on what is
 * allowed to be stored. The browser's payload is never stored as-is: it is rebuilt field by field from this
 * allow-list (unknown keys are dropped, every value is range/enum checked), so what ends up in
 * personalized_plan_requests.answers is exactly this shape and nothing else.
 *
 * Answers are DATA ONLY. They never authorize anything -- generation is authorized by a paid request owned
 * by the signed-in user (begin_personalized_plan_generation), not by what the answers say.
 */

export const PERSONALIZED_ANSWERS_VERSION = 1;
export const MAX_PERSONALIZED_PLAN_DAYS = 10;
export const MAX_ACCOMMODATION_TEXT_LENGTH = 150;

export type PersonalizedPlanAnswers = {
  v: typeof PERSONALIZED_ANSWERS_VERSION;
  dateMode: "flexible" | "specific";
  /** flexible mode only */
  durationDays?: number;
  /** specific mode only (YYYY-MM-DD) */
  arrivalDate?: string;
  departureDate?: string;
  /** Authoritative trip length (1..10), derived on the server from the fields above. */
  days: number;
  /** [] when surpriseMe is true. */
  interests: V2PlannerInterest[];
  surpriseMe: boolean;
  accommodation: { booked: boolean; text?: string };
};

export type NormalizedPersonalizedAnswers = { destinationId: string; answers: PersonalizedPlanAnswers };

export type NormalizePersonalizedAnswersResult = ({ ok: true } & NormalizedPersonalizedAnswers) | { ok: false };

/**
 * Which destinations include a destination guide at no extra charge. Data-driven on purpose: Barcelona's
 * "barcelona-guide" is granted for a Barcelona plan only, and a destination that is not listed here grants
 * no guide. (Today Barcelona is the only purchasable destination anyway.)
 */
export const DESTINATION_INCLUDED_GUIDE_SLUG: Record<string, string> = {
  barcelona: PRODUCT_SLUGS.guide,
};

export function destinationIncludesGuide(destinationId: string | null | undefined): boolean {
  return !!destinationId && Object.prototype.hasOwnProperty.call(DESTINATION_INCLUDED_GUIDE_SLUG, destinationId);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cleanAccommodationText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_ACCOMMODATION_TEXT_LENGTH);
}

export function normalizePersonalizedAnswers(rawAnswers: unknown, rawDestinationId: unknown): NormalizePersonalizedAnswersResult {
  const fail = { ok: false } as const;

  if (typeof rawDestinationId !== "string" || !isAvailablePlannerDestinationId(rawDestinationId)) return fail;
  if (!isPlainObject(rawAnswers)) return fail;

  const dateMode = rawAnswers.dateMode;
  let days: number;
  const dates: Pick<PersonalizedPlanAnswers, "durationDays" | "arrivalDate" | "departureDate"> = {};

  if (dateMode === "flexible") {
    const duration = rawAnswers.durationDays;
    if (typeof duration !== "number" || !Number.isInteger(duration) || duration < 1 || duration > MAX_PERSONALIZED_PLAN_DAYS) return fail;
    days = duration;
    dates.durationDays = duration;
  } else if (dateMode === "specific") {
    const { arrivalDate, departureDate } = rawAnswers;
    if (typeof arrivalDate !== "string" || typeof departureDate !== "string") return fail;
    if (!parseIsoDate(arrivalDate) || !parseIsoDate(departureDate)) return fail;
    const count = inclusiveDayCount(arrivalDate, departureDate);
    if (count === null || count < 1 || count > MAX_PERSONALIZED_PLAN_DAYS) return fail;
    days = count;
    dates.arrivalDate = arrivalDate;
    dates.departureDate = departureDate;
  } else {
    return fail;
  }

  const surpriseMe = rawAnswers.surpriseMe === true;
  let interests: V2PlannerInterest[] = [];
  if (!surpriseMe) {
    const rawInterests = rawAnswers.interests;
    if (!Array.isArray(rawInterests) || rawInterests.length < 1 || rawInterests.length > V2_PLANNER_INTERESTS.length) return fail;
    if (!rawInterests.every((interest) => typeof interest === "string" && (V2_PLANNER_INTERESTS as readonly string[]).includes(interest))) return fail;
    if (new Set(rawInterests).size !== rawInterests.length) return fail;
    interests = [...(rawInterests as V2PlannerInterest[])].sort();
  }

  const rawAccommodation = rawAnswers.accommodation;
  if (!isPlainObject(rawAccommodation) || typeof rawAccommodation.booked !== "boolean") return fail;
  let accommodation: PersonalizedPlanAnswers["accommodation"];
  if (rawAccommodation.booked) {
    const text = cleanAccommodationText(rawAccommodation.text);
    if (!text) return fail;
    accommodation = { booked: true, text };
  } else {
    accommodation = { booked: false };
  }

  return {
    ok: true,
    destinationId: rawDestinationId,
    answers: {
      v: PERSONALIZED_ANSWERS_VERSION,
      dateMode,
      ...dates,
      days,
      interests,
      surpriseMe,
      accommodation,
    },
  };
}
