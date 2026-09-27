"use client";

import SmartPlannerStopCardBody from "./SmartPlannerStopCardBody";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { PlannerOperationalWarning } from "../../lib/planner/barcelonaPlannerOperationalWarnings";

/**
 * One Smart Planner stop card: number circle + card body (image, name, area, suggested visit
 * duration, description, warnings, "تفاصيل المكان"). Used by V1's own day view and
 * MustSeeSelector, neither of which has a timeline rail -- the number circle lives right here.
 *
 * Redesign Food Stops + Timeline UI: the actual card content is now SmartPlannerStopCardBody,
 * shared with the V2 timeline rail (SmartPlannerV2Day.tsx), which renders that same body next to
 * its OWN number/time/line rail instead of this component's number circle -- one visual source
 * of truth for what an itinerary stop card looks like, whether it's an attraction or (via
 * `foodMeta`, not used by this wrapper) a real scheduled restaurant. This wrapper's own output is
 * byte-identical to before the extraction for every existing caller.
 *
 * `priority` (optional): only the first couple of visible stop cards in the CURRENTLY mounted
 * day should set this (see SmartPlannerV2Day.tsx) -- never every card, to avoid flooding the
 * browser with simultaneous high-priority fetches. Defaults to unset (lazy), unchanged from
 * before for every caller that doesn't pass it (V1's own day view, MustSeeSelector, etc).
 */
export default function SmartPlannerPlaceCard({
  routeNumber,
  summary,
  areaName,
  description,
  visitDurationMinutes,
  warnings,
  onClick,
  priority,
}: {
  routeNumber: number;
  summary: ResolvedPlaceSummary;
  areaName?: string;
  description?: string;
  visitDurationMinutes?: number;
  warnings?: PlannerOperationalWarning[];
  onClick: () => void;
  priority?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-8 flex-shrink-0 justify-center sm:w-9">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white sm:h-9 sm:w-9">
          {routeNumber}
        </span>
      </div>
      <SmartPlannerStopCardBody
        summary={summary}
        areaName={areaName}
        description={description}
        visitDurationMinutes={visitDurationMinutes}
        warnings={warnings}
        onClick={onClick}
        priority={priority}
      />
    </div>
  );
}
