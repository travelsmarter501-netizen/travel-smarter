"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SmartPlannerResult from "./SmartPlannerResult";
import type { SmartPlannerSavedPreferences, SmartPlannerGeneratedPlanJson } from "../../lib/planner/smartPlannerSavedPlans";
import type { Area, Attraction, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "../../lib/guideTypes";

type GuideData = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  nightlifeVenues: NightlifeVenue[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
};

/**
 * Reopens an already-saved Smart Planner plan using the exact stored generated output --
 * never regenerates (no call to generateBarcelonaSmartPlan here at all). Reuses
 * SmartPlannerResult unchanged, just without the "احفظ خطتي" action (already saved).
 */
export default function SmartPlannerSavedPlanView({
  preferences,
  generatedPlan,
  guide,
  guideSlug,
}: {
  preferences: SmartPlannerSavedPreferences;
  generatedPlan: SmartPlannerGeneratedPlanJson;
  guide: GuideData;
  guideSlug: string;
}) {
  const router = useRouter();
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  return (
    <SmartPlannerResult
      smartPlan={generatedPlan.smartPlan}
      presentedPlan={generatedPlan.presentedPlan}
      guide={guide}
      guideSlug={guideSlug}
      selectedInterests={preferences.interests}
      accommodation={preferences.accommodation}
      activeDayIndex={activeDayIndex}
      onChangeDay={setActiveDayIndex}
      // Smart Planner V2 Production Launch: V1's own questionnaire now lives at the internal
      // rollback route /smart-planner/barcelona-v1 (production /smart-planner/barcelona now
      // serves V2) -- "edit preferences" on a reopened V1 plan must return to V1, not V2.
      onEditPreferences={() => router.push("/smart-planner/barcelona-v1")}
    />
  );
}
