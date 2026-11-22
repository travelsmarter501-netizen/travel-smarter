import "server-only";
import { barcelonaGuide } from "../barcelona-guide";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { BARCELONA_CLUSTER_CENTROIDS } from "./barcelonaClusterCentroids";
import { BARCELONA_ACCOMMODATION_RULES } from "./accommodationLocationProvider";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { buildBarcelonaV2PlaceSelectionBonus, buildBarcelonaV2ShoppingCoverageGoals } from "./barcelonaV2PersonalizationScoring";
import { getBarcelonaRouteLeg } from "./barcelona-planner-route-legs";
import { getBarcelonaPlannerOperationalWarnings } from "./barcelonaPlannerOperationalWarnings";
import { BARCELONA_MEAL_STOP_RULES } from "./barcelonaV2MealStops";
import { applyBeachTimingGuard } from "./plannerBeachTimingGuard";
import { V2_PLANNER_INTERESTS } from "./v2PlannerTypes";
import type { CityPlannerModule } from "./cityPlannerModule";
import { balanceCityDays, OWNER_MIN_VISITS } from "./cityDayBalance";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";

/** Minutes of a Barcelona leg on its recommended mode (middle of its range); null when the leg has no time. */
function barcelonaLegMinutes(fromPlaceId: string, toPlaceId: string): number | null {
  const leg = getBarcelonaRouteLeg(fromPlaceId, toPlaceId);
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

/**
 * Barcelona as a CityPlannerModule (multi-city foundation). Pure wiring: every value below is the exact data / rule the
 * Barcelona V2 pipeline used before the refactor, so Barcelona plans are unchanged (proven by the before/after snapshot of
 * 87 generated plans, see docs/PROJECT_PLAN.md).
 */
export const BARCELONA_CITY_MODULE: CityPlannerModule = {
  id: "barcelona",
  nameAr: "برشلونة",
  nameEn: "Barcelona",
  places: barcelonaGuide,
  destinationConfig: BARCELONA_V2_DESTINATION_CONFIG,
  metadataById: getBarcelonaV2PlannerMetadataById,
  clusterCentroids: BARCELONA_CLUSTER_CENTROIDS,
  accommodation: BARCELONA_ACCOMMODATION_RULES,
  supportedInterests: V2_PLANNER_INTERESTS,
  // The "🎟️ تجارب وترفيه" gate: Montjuïc cable car only when experiences / nightlife were chosen (see the pipeline).
  experiencesGatedPlaceIds: new Set(["teleferic-montjuic"]),
  flagshipCoverageGoals: getBarcelonaFlagshipCoverageGoals,
  placeSelectionBonus: (interests) => buildBarcelonaV2PlaceSelectionBonus([...interests]),
  secondaryCoverageGoals: (interests, days) => buildBarcelonaV2ShoppingCoverageGoals([...interests], days),
  routeLeg: getBarcelonaRouteLeg,
  operationalWarnings: getBarcelonaPlannerOperationalWarnings,
  mealStops: BARCELONA_MEAL_STOP_RULES,
  // Opening hours as a hard constraint on the final plan: a day whose visit or meal would run past closing is repaired (re-ordered, or
  // the closed restaurant is swapped). Days without a violation are generated exactly as before (no strict restaurant selection).
  timingGuard: true,
  strictMealSelection: false,
  // The trip to and from each restaurant counts on the clock (checked, routed or estimated leg), not a flat 15-minute margin.
  mealTransfersInTimeline: true,
  // Beach Timing Guard (dated plans only): keeps Barceloneta Beach out of a late-evening slot on limited-hours days.
  postProcessDatedPlan: ({ plan, legsByDay, config, resolveHoursForPlace, weekdayForDayNumber }) =>
    applyBeachTimingGuard(plan, legsByDay, config.plannerMetadata, weekdayForDayNumber, resolveHoursForPlace, config.buildPlanRouteLegs),
  capacityWarning: (daysGenerated) =>
    `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لبرشلونة. عم نوسّع المحتوى للأيام الأطول.`,
  // The owner's minimum of visits a day (2026-11-22, all cities). For Barcelona only step 6f of the balance runs (heavyMinutes Infinity
  // and lightMinutes 0 leave the other steps off), with a day budget of 7 hours (visits + travel + lunch). A plan whose days all meet
  // the minimum is returned unchanged.
  repairDayGeography: (context) =>
    balanceCityDays(context, {
      compatibility: BARCELONA_CLUSTER_COMPATIBILITY,
      metadataById: getBarcelonaV2PlannerMetadataById,
      travelMinutes: barcelonaLegMinutes,
      protectedPlaceIds: new Set<string>(),
      gatedPlaceIds: new Set(["teleferic-montjuic"]),
      heavyMinutes: Infinity,
      lightMinutes: 0,
      minPriorityToAdd: 6,
      minVisits: { ...OWNER_MIN_VISITS, maxDayMinutes: 420 },
    }),
};
