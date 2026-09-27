"use client";

import BottomSheet from "../guide/BottomSheet";
import ExternalLink from "../guide/ExternalLink";
import { IconExternalLink } from "../icons";
import { buildAppleMapsDirectionsUrl, buildDirectionsUrl, READY_PLAN_TRANSPORT_DISCLAIMER } from "../../lib/readyPlan";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import { PLANNER_TRANSPORT_MODE_META, PLANNER_TRANSPORT_MODE_ORDER, formatPlannerTransportOptionLabel } from "../../lib/planner/plannerTransportFormat";
import type { PlannerRouteLeg, TransportMode } from "../../lib/planner/plannerTransportTypes";

/**
 * Planner-specific counterpart to TransportOptionsSheet (Ready Plan): same visual pattern,
 * but built for PlannerRouteLeg's own shape (an options ARRAY with durationMinutesMin/Max,
 * and a recommendedMode that can be null for a not-yet-verified leg). Reuses BottomSheet,
 * ExternalLink, and the exact same Google/Apple Maps URL builders — those only need a
 * ResolvedPlaceSummary + mode string, and work identically here.
 */
export default function SmartPlannerTransportSheet({
  open,
  onClose,
  leg,
  from,
  to,
  selectedMode,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  leg: PlannerRouteLeg;
  from: ResolvedPlaceSummary;
  to: ResolvedPlaceSummary;
  selectedMode: TransportMode | null;
  onSelect: (mode: TransportMode) => void;
}) {
  const availableModes = PLANNER_TRANSPORT_MODE_ORDER.filter((mode) => leg.options.some((option) => option.mode === mode));

  return (
    <BottomSheet open={open} onClose={onClose} title="طريقة التنقل">
      {availableModes.length === 0 ? (
        <p className="py-4 text-center text-sm leading-6 text-slate-500">
          تقدر تشوف خيارات التنقل المباشرة على الخرائط. افتح الطريق من خرائط جوجل أو أبل بالأسفل.
        </p>
      ) : (
        <div className="space-y-2">
          {availableModes.map((mode) => {
            const option = leg.options.find((item) => item.mode === mode)!;
            const active = mode === selectedMode;
            const recommended = mode === leg.recommendedMode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  onSelect(mode);
                  onClose();
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right transition-colors ${
                  active ? "border-teal-600 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-xl">{PLANNER_TRANSPORT_MODE_META[mode].icon}</span>
                  <span className="text-sm font-bold text-slate-900">{PLANNER_TRANSPORT_MODE_META[mode].label}</span>
                  {recommended && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">مقترح</span>}
                </span>
                <span className="text-left text-xs font-semibold text-slate-600">
                  <span className="block">{formatPlannerTransportOptionLabel(option)}</span>
                  {option.note && <span className="mt-0.5 block max-w-40 font-medium text-slate-400">{option.note}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <ExternalLink
          href={buildDirectionsUrl(from, to, selectedMode ?? "walking")}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          فتح الطريق في Google Maps
          <IconExternalLink className="h-3.5 w-3.5 opacity-80" />
        </ExternalLink>
        <ExternalLink
          href={buildAppleMapsDirectionsUrl(from, to, selectedMode ?? "walking")}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-teal-300"
        >
          فتح الطريق في Apple Maps
          <IconExternalLink className="h-3.5 w-3.5 opacity-60" />
        </ExternalLink>
      </div>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">{READY_PLAN_TRANSPORT_DISCLAIMER}</p>
    </BottomSheet>
  );
}
