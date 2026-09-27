import "server-only";
import { barcelonaGuide } from "../barcelona-guide";
import { resolvePlace, summarizeResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";
import { isPlaceClosedOnWeekday } from "./barcelonaV2DateEligibility";
import type { FoodPlace, NightlifeVenue, ShoppingArea } from "../guideTypes";
import type { HoursInfo, Weekday } from "../hours";
import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * Smart Planner V2 Phase 3B -- Layer B of the two-layer interest strategy: real,
 * category-driven differentiation of food/shopping/nightlife, using the actual Guide arrays
 * (foodPlaces/shoppingAreas/nightlifeVenues) rather than the legacy scoring engine's single
 * combined `foodShoppingNightlife` weight (see v2InterestAdapter.ts's own comment for why that
 * weight alone can never distinguish the three). No weight value on any of the 30 planner-
 * metadata entries is read or touched here -- this is an entirely separate, additive
 * suggestion layer, never mixed into the main visit-stop Day Builder pool (see the Phase 3B
 * task's own "do not treat a restaurant exactly like Sagrada Família" instruction).
 *
 * Only ever produces suggestions when the caller explicitly selected the corresponding V2
 * interest -- "food" suggestions only exist if the visitor selected "food", etc. Cardinality
 * caps (max 2 food/day, max 1 shopping/day, max 1 nightlife/day) match the task's own spec.
 *
 * Hours: applies the exact same conservative weekday-closure rule as main-stop eligibility
 * (fixed+closed -> exclude, temporarily-closed -> exclude, variable/event -> never hard-
 * exclude, missing -> never assume closed) -- reused from barcelonaV2DateEligibility.ts, not
 * reimplemented. In flexible mode (no real weekday known), no hours-based exclusion applies
 * at all -- exactly like main-stop eligibility.
 */

export type V2FoodSuggestion = ResolvedPlaceSummary & { kind: "food"; mealType: "lunch" | "dinner" };
export type V2ShoppingSuggestion = ResolvedPlaceSummary & { kind: "shopping"; bestFor?: string };
export type V2NightlifeSuggestion = ResolvedPlaceSummary & { kind: "nightlife" };

const MAX_FOOD_PER_DAY = 2;

function isEligibleNow(hours: HoursInfo | undefined, weekday: Weekday | null): boolean {
  if (!weekday) return true; // flexible mode: no real calendar date, never hours-exclude
  return !isPlaceClosedOnWeekday(hours, weekday);
}

function pickBestEligible<T extends { id: string; hours?: HoursInfo }>(
  candidates: readonly T[],
  usedPlaceIds: ReadonlySet<string>,
  weekday: Weekday | null,
  scoreFn: (item: T) => number
): T | null {
  const eligible = candidates.filter((item) => !usedPlaceIds.has(item.id) && isEligibleNow(item.hours, weekday));
  if (eligible.length === 0) return null;

  const scored = eligible.map((item) => ({ item, score: scoreFn(item) }));
  scored.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  return scored[0].item;
}

function foodScore(place: FoodPlace): number {
  let score = typeof place.rating === "number" ? place.rating : 0;
  if (place.badges?.includes("best-overall")) score += 3;
  if (place.badges?.includes("popular")) score += 2;
  if (place.badges?.includes("great-value")) score += 1;
  return score;
}

function nightlifeScore(venue: NightlifeVenue): number {
  return typeof venue.rating === "number" ? venue.rating : 0;
}

function shoppingScore(area: ShoppingArea): number {
  return typeof area.rating === "number" ? area.rating : 0;
}

function toSummary(placeId: string, type: "food" | "shopping" | "nightlife"): ResolvedPlaceSummary | null {
  const resolved = resolvePlace(placeId, type, barcelonaGuide);
  return resolved ? summarizeResolvedPlace(resolved) : null;
}

export type DaySupplementaryResult = {
  food: V2FoodSuggestion[];
  shopping: V2ShoppingSuggestion[];
  nightlife: V2NightlifeSuggestion[];
};

/**
 * Builds one day's supplementary items. `usedPlaceIds` is a SHARED set spanning the whole
 * plan (main stops + optionalNearby + every previously-picked supplementary item across every
 * day) -- callers must seed it before the first day and keep reusing the same instance across
 * days, so no place ID is ever suggested twice anywhere in the plan. `weekday` is null for
 * flexible-mode plans (no hours-based exclusion applies).
 */
export function buildBarcelonaSupplementaryForDay(
  weekday: Weekday | null,
  v2Interests: V2PlannerInterest[],
  usedPlaceIds: Set<string>
): DaySupplementaryResult {
  const food: V2FoodSuggestion[] = [];
  const shopping: V2ShoppingSuggestion[] = [];
  const nightlife: V2NightlifeSuggestion[] = [];

  if (v2Interests.includes("food")) {
    const mealTypes: ("lunch" | "dinner")[] = ["lunch", "dinner"];
    for (const mealType of mealTypes) {
      if (food.length >= MAX_FOOD_PER_DAY) break;
      const picked = pickBestEligible(barcelonaGuide.foodPlaces, usedPlaceIds, weekday, foodScore);
      if (!picked) continue;
      const summary = toSummary(picked.id, "food");
      if (!summary) continue;
      usedPlaceIds.add(picked.id);
      food.push({ ...summary, kind: "food", mealType });
    }
  }

  if (v2Interests.includes("shopping")) {
    const picked = pickBestEligible(barcelonaGuide.shoppingAreas, usedPlaceIds, weekday, shoppingScore);
    if (picked) {
      const summary = toSummary(picked.id, "shopping");
      if (summary) {
        usedPlaceIds.add(picked.id);
        shopping.push({ ...summary, kind: "shopping", bestFor: picked.bestFor });
      }
    }
  }

  if (v2Interests.includes("nightlife")) {
    const picked = pickBestEligible(barcelonaGuide.nightlifeVenues, usedPlaceIds, weekday, nightlifeScore);
    if (picked) {
      const summary = toSummary(picked.id, "nightlife");
      if (summary) {
        usedPlaceIds.add(picked.id);
        nightlife.push({ ...summary, kind: "nightlife" });
      }
    }
  }

  return { food, shopping, nightlife };
}
