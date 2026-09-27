"use client";

import { useState } from "react";
import Price from "../Price";
import ReadyPlanRouteOverview from "./ReadyPlanRouteOverview";
import ReadyPlanDayTabs from "./ReadyPlanDayTabs";
import ReadyPlanTimeline from "./ReadyPlanTimeline";
import { READY_PLAN_TRANSPORT_DISCLAIMER } from "../../lib/readyPlan";
import type { ReadyPlan } from "../../lib/readyPlanTypes";
import type { Area, Attraction, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "../../lib/guideTypes";

type GuideData = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
  nightlifeVenues?: NightlifeVenue[];
};

export default function BarcelonaReadyPlan({ guideSlug, plan, guide }: { guideSlug: string; plan: ReadyPlan; guide: GuideData }) {
  const [activeDayId, setActiveDayId] = useState(plan.days[0]?.id);
  const activeDay = plan.days.find((day) => day.id === activeDayId) ?? plan.days[0];

  if (!activeDay) return null;

  return (
    <div>
      <h1 dir="auto" className="text-xl font-bold text-slate-900">
        {plan.title}
      </h1>
      <p className="mt-1 text-sm leading-6 text-slate-600">{plan.subtitle}</p>

      {plan.priceILS > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500">سعر الرزمة</p>
          <Price ils={plan.priceILS} className="text-lg font-bold text-slate-900" />
        </div>
      )}

      {plan.days.length > 1 && (
        <div className="mt-4">
          <ReadyPlanDayTabs days={plan.days.map((day) => ({ id: day.id, label: day.label }))} activeDayId={activeDay.id} onSelect={setActiveDayId} />
        </div>
      )}

      <p className="mt-3 text-sm font-bold text-slate-800">{activeDay.theme}</p>
      {activeDay.summary && <p className="mt-1 text-xs leading-5 text-slate-500">{activeDay.summary}</p>}

      <div className="mt-3">
        <ReadyPlanRouteOverview day={activeDay} guide={guide} />
      </div>

      <div className="mt-4">
        {/* key resets any open sheet / local transport-selection state cleanly when switching days */}
        <ReadyPlanTimeline key={activeDay.id} day={activeDay} guide={guide} guideSlug={guideSlug} />
      </div>

      <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">{READY_PLAN_TRANSPORT_DISCLAIMER}</p>
    </div>
  );
}
