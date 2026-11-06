import { formatDistance, formatMinutesRange, PLAN_TEXT, type PlanLanguage } from "../i18n/planText";
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

/** "15–20 دقيقة · 1.1 كم" style label, or a single value ("دقيقتان") when min === max. Arabic by default (unchanged output). */
export function formatPlannerTransportOptionLabel(option: TransportOption, lang: PlanLanguage = "ar"): string {
  const parts = [formatMinutesRange(lang, option.durationMinutesMin, option.durationMinutesMax)];
  if (option.distanceKm !== undefined) parts.push(formatDistance(lang, option.distanceKm));
  return parts.join(" · ");
}

/** Mode name in the plan's display language (icons stay in PLANNER_TRANSPORT_MODE_META). */
export function plannerTransportModeLabel(mode: TransportMode, lang: PlanLanguage = "ar"): string {
  return lang === "ar" ? PLANNER_TRANSPORT_MODE_META[mode].label : PLAN_TEXT[lang].modes[mode];
}
