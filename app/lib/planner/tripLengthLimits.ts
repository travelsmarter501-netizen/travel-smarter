import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * Per-destination trip-length limits for the Personalized Plan questionnaire (browser) and its server check
 * (normalizePersonalizedAnswers). Plain module: the same function decides in both places.
 *
 * A destination with no entry here keeps the general limit (MAX_PERSONALIZED_PLAN_DAYS). Prague and Barcelona have none.
 *
 * Budapest (owner decision 2026-11-16, from the 108-plan launch table docs/budapest/data/quality-r5/launch/table-B1.csv; 5+ days were
 * never measured):
 *   - at most 4 days;
 *   - culture only, or popular only: at most 3 days (4 days missed the thresholds: thin days / weak interest match);
 *   - nature and relaxation only (the "nature" group): 1 day (2-4 days: thin days, few places).
 * An interest rule applies only when EVERY chosen interest is inside its list. "Surprise me" has no interest rule.
 */
export type TripLengthLimit =
  | { maxDays: number; reason: "destination" }
  /** `groupIds`: the questionnaire's interest groups the rule is about (V2_INTEREST_DISPLAY_GROUPS ids), for the message. */
  | { maxDays: number; reason: "interests"; groupIds: string[] };

type TripLengthRule = { maxDays: number; onlyInterests?: readonly V2PlannerInterest[]; groupIds?: string[] };

const TRIP_LENGTH_RULES: Record<string, TripLengthRule[]> = {
  budapest: [
    { maxDays: 4 },
    { maxDays: 3, onlyInterests: ["cultureHistory"], groupIds: ["cultureHistory"] },
    { maxDays: 3, onlyInterests: ["popular"], groupIds: ["popular"] },
    { maxDays: 1, onlyInterests: ["natureViews", "beachRelax"], groupIds: ["natureBeaches"] },
  ],
};

/** The tightest limit that applies to this destination and these interests, or null when only the general limit applies. */
export function tripLengthLimit(destinationId: string | null | undefined, interests: readonly V2PlannerInterest[], surpriseMe: boolean): TripLengthLimit | null {
  const rules = destinationId ? TRIP_LENGTH_RULES[destinationId] : undefined;
  if (!rules) return null;
  let best: TripLengthRule | null = null;
  for (const rule of rules) {
    if (rule.onlyInterests) {
      const only = rule.onlyInterests;
      if (surpriseMe || interests.length === 0 || !interests.every((interest) => only.includes(interest))) continue;
    }
    if (!best || rule.maxDays < best.maxDays) best = rule;
  }
  if (!best) return null;
  return best.onlyInterests ? { maxDays: best.maxDays, reason: "interests", groupIds: best.groupIds ?? [] } : { maxDays: best.maxDays, reason: "destination" };
}
