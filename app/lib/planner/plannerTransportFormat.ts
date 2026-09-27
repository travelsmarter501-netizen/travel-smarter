import { formatDistanceAr } from "../geo";
import { formatMinutesAr } from "../readyPlan";
import type { TransportMode, TransportOption } from "./plannerTransportTypes";

/**
 * Small formatting helpers shared between SmartPlannerTransportConnector and
 * SmartPlannerTransportSheet — kept in app/lib (not a component) since it's pure
 * presentation logic over already-verified data, no new data invented.
 */

export const PLANNER_TRANSPORT_MODE_META: Record<TransportMode, { icon: string; label: string }> = {
  walking: { icon: "🚶", label: "مشي" },
  transit: { icon: "🚇", label: "مواصلات عامة" },
  car: { icon: "🚕", label: "سيارة / تاكسي" },
};

export const PLANNER_TRANSPORT_MODE_ORDER: TransportMode[] = ["walking", "transit", "car"];

/** "15–20 دقيقة · 1.1 كم" style label, or a single value ("دقيقتان") when min === max. */
export function formatPlannerTransportOptionLabel(option: TransportOption): string {
  const durationLabel =
    option.durationMinutesMin === option.durationMinutesMax
      ? formatMinutesAr(option.durationMinutesMin)
      : `${option.durationMinutesMin}–${option.durationMinutesMax} دقيقة`;

  const parts = [durationLabel];
  if (option.distanceKm !== undefined) parts.push(formatDistanceAr(option.distanceKm));
  return parts.join(" · ");
}
