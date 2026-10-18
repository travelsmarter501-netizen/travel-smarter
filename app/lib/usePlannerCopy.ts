"use client";

import { useLanguage } from "./language";
import { plannerCopyAr, plannerCopyEn, type PlannerCopy } from "./plannerCopy";

/**
 * The planner / checkout wording for the current language.
 *
 * It used to ride inside the site-wide translation object (`t.planner`), which put roughly 19 KB of planner-only text
 * into the JavaScript of EVERY page, the homepage included. Only the planner screens read it, so they now import it
 * through this hook and only their routes carry it. The wording itself is unchanged.
 */
export function usePlannerCopy(): PlannerCopy {
  const { language } = useLanguage();
  return language === "en" ? plannerCopyEn : plannerCopyAr;
}
