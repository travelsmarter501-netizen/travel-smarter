"use client";

import BottomSheet from "./BottomSheet";
import ExternalLink from "./ExternalLink";
import { IconExternalLink } from "../icons";
import { buildAppleMapsDirectionsUrl, buildDirectionsUrl, formatTransportOptionLabel, READY_PLAN_TRANSPORT_DISCLAIMER } from "../../lib/readyPlan";
import type { ResolvedPlaceSummary } from "../../lib/readyPlan";
import type { RouteLeg, TransportMode } from "../../lib/readyPlanTypes";

const MODE_META: Record<TransportMode, { icon: string; label: string }> = {
  walking: { icon: "🚶", label: "مشي" },
  transit: { icon: "🚇", label: "مواصلات عامة" },
  car: { icon: "🚕", label: "سيارة / تاكسي" },
};

const MODE_ORDER: TransportMode[] = ["walking", "transit", "car"];

export default function TransportOptionsSheet({
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
  leg: RouteLeg;
  from: ResolvedPlaceSummary;
  to: ResolvedPlaceSummary;
  selectedMode: TransportMode;
  onSelect: (mode: TransportMode) => void;
}) {
  const availableModes = MODE_ORDER.filter((mode) => leg.options[mode]);

  return (
    <BottomSheet open={open} onClose={onClose} title="طريقة التنقل">
      <div className="space-y-2">
        {availableModes.map((mode) => {
          const option = leg.options[mode]!;
          const active = mode === selectedMode;
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
                <span className="text-xl">{MODE_META[mode].icon}</span>
                <span className="text-sm font-bold text-slate-900">{MODE_META[mode].label}</span>
              </span>
              <span className="text-left text-xs font-semibold text-slate-600">
                <span className="block">{formatTransportOptionLabel(option)}</span>
                {option.details && <span className="mt-0.5 block font-medium text-slate-400">{option.details}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <ExternalLink
          href={buildDirectionsUrl(from, to, selectedMode)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          فتح الطريق في Google Maps
          <IconExternalLink className="h-3.5 w-3.5 opacity-80" />
        </ExternalLink>
        <ExternalLink
          href={buildAppleMapsDirectionsUrl(from, to, selectedMode)}
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
