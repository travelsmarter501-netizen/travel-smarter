"use client";

import { useEffect } from "react";
import { clearPlannerDraft } from "../../lib/planner/plannerDraft";

/** Rendered once a Personalized Plan purchase is confirmed: the questionnaire draft in this tab has done its job. */
export default function ClearPlannerDraft() {
  useEffect(() => {
    clearPlannerDraft();
  }, []);
  return null;
}
