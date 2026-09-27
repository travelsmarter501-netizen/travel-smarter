import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";
import { BARCELONA_V2_EXTRA_PLANNER_METADATA } from "./barcelona-planner-v2-extra-metadata";
import type { PlannerPlaceMetadata } from "./plannerTypes";

/**
 * Smart Planner V2 Phase 4 (+ Phase 5 Long-Trip Content Expansion) -- composes V2's expanded
 * candidate pool: the original 29 legacy entries (getBarcelonaPlannerPlaces(), completely
 * unread/unmodified in content -- corrected count, see barcelona-planner-v2-extra-metadata.ts's
 * own note on the earlier "~30" miscount) PLUS the 7 V2-only entries
 * (barcelona-planner-v2-extra-metadata.ts) = 36 total.
 *
 * V1 (generateBarcelonaSmartPlan.ts, via barcelonaDestinationConfig.ts's
 * BARCELONA_DESTINATION_CONFIG) never imports this file and continues using
 * getBarcelonaPlannerPlaces() directly, unchanged -- exactly the 29-entry pool it always had.
 * Only barcelonaV2DestinationConfig.ts (the V2-only destination config) uses this composed
 * pool, and only the V2 Server Action ever reaches that config.
 *
 * No new DayBuilderConfig was needed: every V2-only entry maps onto EXISTING cluster ids
 * (old-city, montjuic, seafront-east), so BARCELONA_CLUSTER_COMPATIBILITY / BARCELONA_SIMILARITY_
 * GROUPS / the iconic-tier and coverage-goal constants from barcelona-planner-day-builder.ts
 * are all reused completely unchanged for V2 too (see barcelonaV2DestinationConfig.ts).
 */
export function getBarcelonaV2PlannerPlaces(): PlannerPlaceMetadata[] {
  return [...getBarcelonaPlannerPlaces(), ...BARCELONA_V2_EXTRA_PLANNER_METADATA];
}

const V2_METADATA_BY_ID = new Map<string, PlannerPlaceMetadata>(getBarcelonaV2PlannerPlaces().map((place) => [place.placeId, place]));

/** Looks up a place's metadata (visitDurationMinutes, etc.) across the FULL V2 pool -- unlike
 * barcelona-planner-metadata.ts's own getBarcelonaPlannerMetadata (legacy 30 only), this also
 * finds the 5 new V2-only candidates. Used by barcelonaV2Resolve.ts so a promoted candidate's
 * real visit duration renders correctly instead of silently falling back to 0. */
export function getBarcelonaV2PlannerMetadataById(placeId: string): PlannerPlaceMetadata | undefined {
  return V2_METADATA_BY_ID.get(placeId);
}
