"use client";

import { useState } from "react";
import TransportOptionsSheet from "./TransportOptionsSheet";
import { formatTransportOptionLabel } from "../../lib/readyPlan";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { RouteLeg, TransportMode } from "../../lib/readyPlanTypes";
import { IconChevronDown } from "../icons";

const MODE_ICON: Record<TransportMode, string> = { walking: "🚶", transit: "🚇", car: "🚕" };

/**
 * ONE compact connector between two itinerary places — shows only the currently
 * selected/recommended transport mode. Tapping it opens the full 3-option sheet.
 * The selected mode is UI state only; it never reorders or affects the itinerary.
 */
export default function RouteLegConnector({ leg, from, to }: { leg: RouteLeg; from: ResolvedPlaceSummary; to: ResolvedPlaceSummary }) {
  const [selectedMode, setSelectedMode] = useState<TransportMode>(leg.recommendedMode);
  const [sheetOpen, setSheetOpen] = useState(false);

  const option = leg.options[selectedMode];

  return (
    <div className="flex items-stretch gap-3 py-1">
      <div className="flex w-8 flex-shrink-0 flex-col items-center sm:w-10">
        <span className="w-px flex-1 border-r border-dashed border-slate-300" aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-xs text-slate-500 transition-colors hover:bg-slate-100"
      >
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-600">
          <span className="flex-shrink-0">{MODE_ICON[selectedMode]}</span>
          {option && <span className="truncate">{formatTransportOptionLabel(option)}</span>}
        </span>
        <IconChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      </button>

      <TransportOptionsSheet
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
