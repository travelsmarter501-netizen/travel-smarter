import type { ReactNode } from "react";
import ReadyPlanDayTabs from "../guide/ReadyPlanDayTabs";
import SmartPlannerDay from "./SmartPlannerDay";
import { INTEREST_OPTIONS } from "./InterestSelector";
import { READY_PLAN_TRANSPORT_DISCLAIMER } from "../../lib/readyPlan";
import type { SmartPlannerPlan } from "../../lib/planner/generateBarcelonaSmartPlan";
import type { PresentedPlannerPlan } from "../../lib/planner/plannerPresentationTypes";
import type { PlannerAccommodation, PlannerInterest } from "../../lib/planner/plannerTypes";
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

const INTEREST_LABELS: Record<PlannerInterest, string> = Object.fromEntries(
  INTEREST_OPTIONS.map((option) => [option.key, option.label])
) as Record<PlannerInterest, string>;

export default function SmartPlannerResult({
  smartPlan,
  presentedPlan,
  guide,
  guideSlug,
  selectedInterests,
  accommodation,
  activeDayIndex,
  onChangeDay,
  onEditPreferences,
  saveAction,
}: {
  smartPlan: SmartPlannerPlan;
  presentedPlan: PresentedPlannerPlan;
  guide: GuideData;
  guideSlug: string;
  selectedInterests: PlannerInterest[];
  /** Optional -- omitted when the customer didn't provide accommodation. Purely presentational
   * here: only ever passed down to SmartPlannerDay for its dynamic map-link blocks. */
  accommodation?: PlannerAccommodation;
  activeDayIndex: number;
  onChangeDay: (index: number) => void;
  onEditPreferences: () => void;
  /** Optional compact save action rendered under the header -- omitted entirely when reopening
   * an already-saved plan (see SmartPlannerSavedPlanView), shown on a freshly generated one. */
  saveAction?: ReactNode;
}) {
  const days = smartPlan.plan.days;
  const activeDay = days[activeDayIndex] ?? days[0];
  const activeIndex = days.findIndex((day) => day.dayNumber === activeDay?.dayNumber);
  const activeLegs = smartPlan.legsByDay[activeIndex] ?? [];
  const activePresentation = presentedPlan.byDay[activeIndex];

  if (!activeDay || !activePresentation) return null;

  const interestsLabel = selectedInterests.map((interest) => INTEREST_LABELS[interest]).join(" + ");

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">خطتك لبرشلونة 🇪🇸</h1>
      <p className="mt-1 text-sm text-slate-600">
        {days.length} أيام · {interestsLabel}
      </p>

      <button
        type="button"
        onClick={onEditPreferences}
        className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
      >
        عدّل اختياراتي
      </button>

      {saveAction}

      <div className="sticky top-16 z-30 -mx-5 mt-4 border-b border-slate-100 bg-white/95 px-5 py-2.5 backdrop-blur sm:-mx-8 sm:px-8 md:top-20 lg:-mx-10 lg:px-10">
        <ReadyPlanDayTabs
          days={days.map((day) => ({ id: String(day.dayNumber), label: `اليوم ${day.dayNumber}` }))}
          activeDayId={String(activeDay.dayNumber)}
          onSelect={(id) => {
            const index = days.findIndex((day) => String(day.dayNumber) === id);
            if (index !== -1) onChangeDay(index);
          }}
        />
      </div>

      <div className="mt-4">
        {/* key resets any open sheet / local transport-selection state cleanly when switching days */}
        <SmartPlannerDay
          key={activeDay.dayNumber}
          day={activeDay}
          legs={activeLegs}
          guide={guide}
          guideSlug={guideSlug}
          presentation={activePresentation}
          accommodation={accommodation}
        />
      </div>

      <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">{READY_PLAN_TRANSPORT_DISCLAIMER}</p>
    </div>
  );
}
