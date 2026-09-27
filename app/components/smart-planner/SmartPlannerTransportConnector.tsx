"use client";

import { useState } from "react";
import SmartPlannerTransportSheet from "./SmartPlannerTransportSheet";
import { IconChevronDown } from "../icons";
import { PLANNER_TRANSPORT_MODE_META, formatPlannerTransportOptionLabel } from "../../lib/planner/plannerTransportFormat";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { PlannerRouteLeg, TransportMode } from "../../lib/planner/plannerTransportTypes";

/**
 * ONE compact connector between two Smart Planner stops. Local-only selected-mode state
 * (mirrors RouteLegConnector's pattern) — switching mode here only changes what's displayed
 * for this leg; it never touches the itinerary, stop order, or any other leg. When the leg
 * has no verified transport data yet, shows an honest neutral fallback instead of a fabricated
 * duration -- never implies Maps is the itinerary engine (Google/Apple Maps stay secondary
 * navigation buttons inside the expandable sheet).
 *
 * Redesign Food Stops + Timeline UI: `railWidth` (optional) widens the left rail placeholder to
 * match a caller's own timeline rail (see SmartPlannerV2Day.tsx, which reserves room for a time
 * label + numbered dot) so the vertical line stays visually continuous through the whole
 * timeline. Defaults to the original `w-8 sm:w-9` for V1's own day view, unchanged. The pill
 * itself is intentionally compact (small text, minimal padding, no heavy background) so it reads
 * as PART of the timeline rather than a separate giant card -- same tap-to-expand functionality
 * (walking/transit/car options, recommended mode, Google/Apple Maps) is untouched.
 */
export default function SmartPlannerTransportConnector({
  leg,
  from,
  to,
  railWidth,
}: {
  leg: PlannerRouteLeg;
  from: ResolvedPlaceSummary;
  to: ResolvedPlaceSummary;
  railWidth?: string;
}) {
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(leg.recommendedMode);
  const [sheetOpen, setSheetOpen] = useState(false);

  const option = selectedMode ? leg.options.find((item) => item.mode === selectedMode) : undefined;

  return (
    <div className="flex items-stretch gap-2">
      <div className={`flex ${railWidth ?? "w-8 sm:w-9"} flex-shrink-0 flex-col items-center`}>
        <span className="w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex flex-1 items-center gap-1 py-1.5 text-right text-[11px] text-slate-400 transition-colors hover:text-slate-600"
      >
        {selectedMode && option ? (
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <span>{PLANNER_TRANSPORT_MODE_META[selectedMode].icon}</span>
            <span>{formatPlannerTransportOptionLabel(option)}</span>
          </span>
        ) : (
          <span className="font-semibold text-slate-400">التنقل بين هالمكانين غير محسوب بدقة</span>
        )}
        <IconChevronDown className="h-3 w-3 text-slate-300" />
      </button>

      <SmartPlannerTransportSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        leg={leg}
        from={from}
        to={to}
        selectedMode={selectedMode}
        onSelect={setSelectedMode}
      />
    </div>
  );
}
