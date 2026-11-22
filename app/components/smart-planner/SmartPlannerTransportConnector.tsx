"use client";

import { useState } from "react";
import SmartPlannerTransportSheet from "./SmartPlannerTransportSheet";
import { IconChevronDown } from "../icons";
import { PLANNER_TRANSPORT_MODE_META, formatPlannerConnectorLabel } from "../../lib/planner/plannerTransportFormat";
import { optionDistanceKm } from "../../lib/planner/planDistance";
import { PLAN_TEXT, type PlanLanguage } from "../../lib/i18n/planText";
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
  lang = "ar",
  bare,
  compact,
}: {
  leg: PlannerRouteLeg;
  from: ResolvedPlaceSummary;
  to: ResolvedPlaceSummary;
  railWidth?: string;
  lang?: PlanLanguage;
  /** Day screen (2026-11-22): no rail (used inside the optional suggestions, which are not on the program's line). */
  bare?: boolean;
  /** Day screen (2026-11-22): a shorter row (the button keeps a 36 px tap height). */
  compact?: boolean;
}) {
  const ui = PLAN_TEXT[lang];
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(leg.recommendedMode);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The connector is reused at the same position when a day is edited (a place removed / added before the next one). A different
  // leg starts again from ITS recommended mode, the one the schedule was computed with; a mode picked for the previous leg is not
  // carried over (it showed "walk 39 min" for a leg the schedule plans as transit).
  const legKey = `${leg.fromPlaceId}>${leg.toPlaceId}>${leg.recommendedMode ?? ""}`;
  const [shownLegKey, setShownLegKey] = useState(legKey);
  if (shownLegKey !== legKey) {
    setShownLegKey(legKey);
    setSelectedMode(leg.recommendedMode);
  }

  const option = selectedMode ? leg.options.find((item) => item.mode === selectedMode) : undefined;

  return (
    <div className="flex items-stretch gap-2">
      {!bare && (
        <div className={`flex ${railWidth ?? "w-8 sm:w-9"} flex-shrink-0 flex-col items-center`}>
          <span className="w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={`flex flex-1 items-center gap-1 text-start text-xs text-slate-500 transition-colors hover:text-slate-700 ${compact ? "min-h-9 py-1" : "min-h-11 py-1.5"}`}
      >
        {selectedMode && option ? (
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <span>{PLANNER_TRANSPORT_MODE_META[selectedMode].icon}</span>
            {/* "≈": an estimate (distance model or a route measured here, not a checked trip); the sheet's note says how. */}
            <span>{leg.sourceStatus === "estimated" ? "≈ " : ""}{formatPlannerConnectorLabel(option, lang, optionDistanceKm(option))}</span>
          </span>
        ) : (
          <span className="font-semibold text-slate-400">{ui.transportUnknown}</span>
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
        lang={lang}
      />
    </div>
  );
}
