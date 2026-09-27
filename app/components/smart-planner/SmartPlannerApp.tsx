"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SmartPlannerIntro from "./SmartPlannerIntro";
import TripLengthSelector from "./TripLengthSelector";
import InterestSelector, { SURPRISE_ME_PRESET } from "./InterestSelector";
import MustSeeSelector from "./MustSeeSelector";
import PrimaryInterestSelector from "./PrimaryInterestSelector";
import AccommodationSelector, { type AccommodationChoice } from "./AccommodationSelector";
import SmartPlannerGenerateButton from "./SmartPlannerGenerateButton";
import SmartPlannerResult from "./SmartPlannerResult";
import SaveSmartPlanButton, { type SaveSmartPlanStatus } from "./SaveSmartPlanButton";
import { generateBarcelonaSmartPlan } from "../../lib/planner/generateBarcelonaSmartPlan";
import { presentBarcelonaSmartPlan } from "../../lib/planner/barcelona-planner-presentation";
import { resolveBarcelonaAccommodationCluster } from "../../lib/planner/barcelonaAccommodationClusters";
import { createClient } from "../../../utils/supabase/client";
import {
  clearPendingSmartPlanSave,
  normalizeSmartPlannerPreferences,
  readPendingSmartPlanSave,
  writePendingSmartPlanSave,
  type SmartPlannerSavedPreferences,
} from "../../lib/planner/smartPlannerSavedPlans";
import type { SmartPlannerPlan } from "../../lib/planner/generateBarcelonaSmartPlan";
import type { PresentedPlannerPlan } from "../../lib/planner/plannerPresentationTypes";
import type { PlannerAccommodation, PlannerInterest } from "../../lib/planner/plannerTypes";
import type { Area, Attraction, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "../../lib/guideTypes";

// Smart Planner V2 Production Launch: this V1 component now lives at the internal rollback
// route /smart-planner/barcelona-v1 (production /smart-planner/barcelona now serves V2) -- the
// pending-save login "next" target is updated to match, so a logged-out V1 save correctly
// returns the visitor to V1 (not to the now-unrelated V2 experience at the old path).
const SMART_PLANNER_PATH = "/smart-planner/barcelona-v1";

type GuideData = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  nightlifeVenues: NightlifeVenue[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
};
type Phase = "form" | "loading" | "result";

const LOADING_PHRASES = ["بنختار أنسب الأماكن إلك...", "بنرتب المناطق...", "بنظبط ترتيب اليوم...", "بنجهزلك طرق التنقل..."];

// Brief UX-only delay purely for a polished loading transition — generation itself is
// instant (pure, synchronous, deterministic), so this is never masking real work.
const LOADING_DURATION_MS = 750;
const LOADING_PHRASE_INTERVAL_MS = 220;

export default function SmartPlannerApp({ guide, guideSlug }: { guide: GuideData; guideSlug: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [selectedDays, setSelectedDays] = useState<1 | 3 | 5>(3);
  const [selectedInterests, setSelectedInterests] = useState<PlannerInterest[]>([]);
  const [primaryInterest, setPrimaryInterest] = useState<PlannerInterest | null>(null);
  const [selectedMustSee, setSelectedMustSee] = useState<string[]>([]);
  const [accommodationChoice, setAccommodationChoice] = useState<AccommodationChoice | null>(null);
  const [accommodationText, setAccommodationText] = useState("");
  const [useAsDailyAnchor, setUseAsDailyAnchor] = useState(true);
  const [smartPlan, setSmartPlan] = useState<SmartPlannerPlan | null>(null);
  const [presentedPlan, setPresentedPlan] = useState<PresentedPlannerPlan | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveSmartPlanStatus>("idle");
  const resumedRef = useRef(false);

  /**
   * V1.5: the single source of truth for interest selection AND its knock-on effect on
   * primaryInterest -- every interest-selection change (normal toggling, or the "فاجئني"
   * preset) goes through here rather than calling setSelectedInterests directly, so
   * primaryInterest can never end up pointing at an interest that isn't (or is no longer)
   * selected. Rules, in order:
   *   - exactly 1 interest selected -> that interest implicitly becomes primary, no question
   *     asked (matches PrimaryInterestSelector only rendering for 2+)
   *   - 0 interests selected -> no primary
   *   - the Surprise Me preset was just applied -> default primary to "popular" (still
   *     changeable via the normal 2+-interest question, since 3 interests are now selected)
   *   - the CURRENT primary was just deselected -> clear it outright and require a fresh
   *     explicit choice, rather than silently guessing a replacement
   *   - otherwise (2+ interests, current primary -- if any -- still valid) -> leave it as-is
   */
  function handleInterestsChange(nextInterests: PlannerInterest[]) {
    setSelectedInterests(nextInterests);

    if (nextInterests.length === 1) {
      setPrimaryInterest(nextInterests[0]);
      return;
    }
    if (nextInterests.length === 0) {
      setPrimaryInterest(null);
      return;
    }
    const isSurpriseMePreset =
      nextInterests.length === SURPRISE_ME_PRESET.length &&
      SURPRISE_ME_PRESET.every((interest) => nextInterests.includes(interest));
    if (isSurpriseMePreset) {
      setPrimaryInterest("popular");
      return;
    }
    if (primaryInterest && !nextInterests.includes(primaryInterest)) {
      setPrimaryInterest(null);
    }
    // else: 2+ interests, existing primaryInterest (if any) is still one of them -- keep it.
  }

  /**
   * Derives the current accommodation preference from local state, or undefined when the
   * customer hasn't provided one (chose "لسا ما حجزت", left the question unanswered, or typed
   * only whitespace). Cluster resolution happens here, deterministically, from the exact text
   * the customer typed -- never a live geocoding call. Called fresh at each usage site (same
   * style already used for the `preferences` object below) rather than memoized.
   */
  function currentAccommodation(): PlannerAccommodation | undefined {
    if (accommodationChoice !== "has") return undefined;
    const trimmedText = accommodationText.trim();
    if (!trimmedText) return undefined;
    return {
      text: trimmedText,
      useAsDailyAnchor,
      cluster: resolveBarcelonaAccommodationCluster(trimmedText),
    };
  }

  async function handleSave(preferences: SmartPlannerSavedPreferences, plan: SmartPlannerPlan, presented: PresentedPlannerPlan) {
    setSaveStatus("checking");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      writePendingSmartPlanSave({ preferences, smartPlan: plan, presentedPlan: presented });
      router.push(`/login?next=${encodeURIComponent(SMART_PLANNER_PATH)}`);
      return;
    }

    setSaveStatus("saving");
    const { error } = await supabase.from("smart_planner_saved_plans").insert({
      product_slug: "barcelona-smart-planner",
      destination_slug: "barcelona",
      preferences_json: normalizeSmartPlannerPreferences(preferences),
      generated_plan_json: { smartPlan: plan, presentedPlan: presented },
    });

    if (error) {
      setSaveStatus(error.code === "23505" ? "duplicate" : "error");
      return;
    }

    clearPendingSmartPlanSave();
    setSaveStatus("saved");
  }

  // Resume-after-login: if the visitor was redirected to /login mid-save, restore the exact
  // plan they generated (never regenerated) once they're back and actually authenticated, then
  // finish the save automatically -- so clicking "احفظ خطتي" once is enough even across the
  // auth round trip. Does nothing if there's no pending save, or if they're still logged out
  // (e.g. a stale localStorage entry from a visit that never completed login).
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;

    const pending = readPendingSmartPlanSave();
    if (!pending) return;

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      setSelectedDays(pending.preferences.tripLength);
      setSelectedInterests(pending.preferences.interests);
      setPrimaryInterest(pending.preferences.primaryInterest ?? null);
      setSelectedMustSee(pending.preferences.mustVisit);
      if (pending.preferences.accommodation) {
        setAccommodationChoice("has");
        setAccommodationText(pending.preferences.accommodation.text);
        setUseAsDailyAnchor(pending.preferences.accommodation.useAsDailyAnchor);
      }
      setSmartPlan(pending.smartPlan);
      setPresentedPlan(pending.presentedPlan);
      setActiveDayIndex(0);
      setPhase("result");
      await handleSave(pending.preferences, pending.smartPlan, pending.presentedPlan);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;

    const phraseInterval = setInterval(() => {
      setLoadingPhraseIndex((index) => (index + 1) % LOADING_PHRASES.length);
    }, LOADING_PHRASE_INTERVAL_MS);

    const timeout = setTimeout(() => {
      // Inlined (not calling currentAccommodation()) so this effect's dependency array can
      // list the actual primitive state it reads, rather than a function recreated every
      // render -- same accommodation-derivation logic as currentAccommodation() below.
      const trimmedAccommodationText = accommodationText.trim();
      const accommodation: PlannerAccommodation | undefined =
        accommodationChoice === "has" && trimmedAccommodationText
          ? { text: trimmedAccommodationText, useAsDailyAnchor, cluster: resolveBarcelonaAccommodationCluster(trimmedAccommodationText) }
          : undefined;
      const preferences = {
        interests: selectedInterests,
        mustVisit: selectedMustSee,
        accommodation,
        primaryInterest: primaryInterest ?? undefined,
      };
      const result = generateBarcelonaSmartPlan(preferences);
      if (result.ok) {
        setGenerationError(null);
        setSmartPlan(result.data);
        // Presentation-only: never influences which places/order/legs generateBarcelonaSmartPlan
        // already decided -- purely describes the same, already-finished plan.
        setPresentedPlan(presentBarcelonaSmartPlan(result.data.plan, preferences));
        setActiveDayIndex(0);
        setSaveStatus("idle");
        setPhase("result");
      } else {
        // A real, possible outcome now — e.g. mustVisit places that can't all fit within the
        // 420-minute/day cap. Surface it to the user instead of silently pretending success.
        setGenerationError(result.error);
        setPhase("form");
      }
    }, LOADING_DURATION_MS);

    return () => {
      clearInterval(phraseInterval);
      clearTimeout(timeout);
    };
  }, [phase, selectedInterests, primaryInterest, selectedMustSee, accommodationChoice, accommodationText, useAsDailyAnchor]);

  const canGenerate = selectedDays === 3 && selectedInterests.length >= 1 && primaryInterest !== null;

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">{LOADING_PHRASES[loadingPhraseIndex]}</p>
      </div>
    );
  }

  if (phase === "result" && smartPlan && presentedPlan) {
    return (
      <SmartPlannerResult
        smartPlan={smartPlan}
        presentedPlan={presentedPlan}
        guide={guide}
        guideSlug={guideSlug}
        selectedInterests={selectedInterests}
        accommodation={currentAccommodation()}
        activeDayIndex={activeDayIndex}
        onChangeDay={setActiveDayIndex}
        onEditPreferences={() => setPhase("form")}
        saveAction={
          <SaveSmartPlanButton
            status={saveStatus}
            onSave={() => {
              void handleSave(
                {
                  tripLength: selectedDays,
                  interests: selectedInterests,
                  mustVisit: selectedMustSee,
                  accommodation: currentAccommodation(),
                  primaryInterest: primaryInterest ?? undefined,
                },
                smartPlan,
                presentedPlan
              );
            }}
          />
        }
      />
    );
  }

  return (
    <div className="pb-4">
      <SmartPlannerIntro />

      <div className="mt-6">
        <TripLengthSelector selectedDays={selectedDays} onSelect={setSelectedDays} />
      </div>

      <div className="mt-6">
        <InterestSelector selected={selectedInterests} onChange={handleInterestsChange} />
      </div>

      {selectedInterests.length >= 2 && (
        <div className="mt-6">
          <PrimaryInterestSelector interests={selectedInterests} primaryInterest={primaryInterest} onSelect={setPrimaryInterest} />
        </div>
      )}

      <div className="mt-6">
        <MustSeeSelector guide={guide} selected={selectedMustSee} onChange={setSelectedMustSee} />
      </div>

      <div className="mt-6">
        <AccommodationSelector
          choice={accommodationChoice}
          text={accommodationText}
          useAsDailyAnchor={useAsDailyAnchor}
          onChoiceChange={setAccommodationChoice}
          onTextChange={setAccommodationText}
          onAnchorToggle={setUseAsDailyAnchor}
        />
      </div>

      {generationError && (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{generationError}</p>
      )}

      <SmartPlannerGenerateButton
        disabled={!canGenerate}
        onClick={() => {
          setGenerationError(null);
          setPhase("loading");
        }}
      />
    </div>
  );
}
