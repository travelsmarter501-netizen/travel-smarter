/**
 * Budapest daylight policy (2026-11-15). An EXPLICIT classification of the outdoor places, written by hand with its evidence; nothing
 * is read out of descriptive texts at run time. The information (why a place is in a class) is kept apart from the planning decision
 * (what the planner does with the class):
 *
 * - "needs": the visit only makes sense in daylight. Enforced through the place's OWN planning hours (official hours or a planning
 *   window in the data), the same hours every path uses (create, edit, add, start change). Today the only such place is the Zoo; its
 *   official closing time is compared with the monthly estimate in docs/budapest/tools/bud-daylight.mts (a report, not a proof of dusk).
 * - "prefers": better in daylight, still possible after dark (open, safe, seen from outside). NEVER a closure or a ban. Creation avoids
 *   it through the day-quality cost (minutes after the estimated sunset); adding such a place picks the position of the day that keeps
 *   it before the estimate when one exists; any path that leaves it after the estimate shows a note naming the estimate.
 * - "evening": nothing in the visit depends on daylight; no rule.
 *
 * The sunset is a MONTHLY ESTIMATE (one rounded time per month, local time; SUNSET_ESTIMATE_BY_MONTH), never the exact sunset of the
 * date. Its error for a given date is not measured here, so it is never used to claim a precise sunset, and it is named as an estimate
 * wherever it is shown.
 */
/** Estimated Budapest sunset by month (local time, one rounded time per month; an estimate, not the sunset of a date). Index 1 = January. */
export const SUNSET_ESTIMATE_BY_MONTH = [0, 16 * 60 + 20, 17 * 60 + 5, 17 * 60 + 45, 19 * 60 + 50, 20 * 60 + 25, 20 * 60 + 45, 20 * 60 + 40, 20 * 60, 19 * 60, 18 * 60, 16 * 60 + 15, 15 * 60 + 55];

export type DaylightClass = "needs" | "prefers" | "evening";

export const BUDAPEST_DAYLIGHT: Record<string, { class: DaylightClass; evidence: string }> = {
  citadella: {
    class: "prefers",
    evidence:
      "A panoramic viewpoint; the place data gives its best time as «قبل الغروب» (before sunset). Official park hours (citadella.hu): November-March 8:00-22:00, April-October 6:00-24:00, so it is open after dark: a preference, not a closure.",
  },
  "vajdahunyad-castle": {
    class: "prefers",
    evidence:
      "Visited from outside (the castle's architecture by the City Park lake). No official source on its night lighting was found and the place data says «أي وقت» (any time): classed as a soft preference only, never a ban.",
  },
  "margaret-island": {
    class: "prefers",
    evidence: "A park walk (place data: best time «بعد الظهر», afternoon); the island is open at all hours, so a preference, not a closure.",
  },
  "budapest-zoo": {
    class: "needs",
    evidence:
      "Enforced by its official hours (zoobudapest.com): it closes between 16:00 and 19:00 by season. Against the monthly estimate it closes at or before it in 11 months; in December it closes 16:00, after the 15:55 estimate. No rule beyond the hours.",
  },
  "chain-bridge": { class: "evening", evidence: "A bridge walk; place data «أي وقت» (any time)." },
  "parliament-exterior": { class: "evening", evidence: "Seen from Kossuth tér; place data «أي وقت» (any time)." },
  "shoes-on-the-danube": { class: "evening", evidence: "A memorial on the embankment; place data «أي وقت» (any time)." },
  "heroes-square": { class: "evening", evidence: "An open square; place data «أي وقت» (any time)." },
  "matthias-church-exterior": { class: "evening", evidence: "Seen from Szentháromság tér; place data «أي وقت» (any time)." },
  "fishermans-bastion": {
    class: "evening",
    evidence: "The place data's «الصبح بدري» (early morning) is about crowds, not light; the terraces are a viewpoint at any hour. Ticketed parts follow their own hours.",
  },
  "andrassy-avenue": { class: "evening", evidence: "A street walk; no daylight-only content." },
  "vaci-utca": { class: "evening", evidence: "A shopping street; shops follow their own hours." },
  "gozsdu-udvar": { class: "evening", evidence: "A passage of bars and restaurants, busiest in the evening." },
};

/** The monthly sunset estimate (minutes after midnight) or null without a date. */
export function budapestSunsetEstimate(month: number | null): number | null {
  return month ? SUNSET_ESTIMATE_BY_MONTH[month] : null;
}

/** Minutes a "prefers daylight" visit ending at `endMinutes` runs after the monthly sunset estimate (0 otherwise, or without a date). */
export function budapestDaylightLateMinutes(placeId: string, endMinutes: number, month: number | null): number {
  if (BUDAPEST_DAYLIGHT[placeId]?.class !== "prefers") return 0;
  const sunset = budapestSunsetEstimate(month);
  return sunset === null ? 0 : Math.max(0, endMinutes - sunset);
}

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
/**
 * The note on a "prefers daylight" stop that ends after the estimate. Text approved by the owner (2026-11-15). It names the time as the
 * month's estimate, never as the exact sunset of the date.
 */
export function budapestDaylightNoteAr(month: number): string {
  return `الأفضل تزوره بضوّ النهار. الغروب حوالي ${hhmm(SUNSET_ESTIMATE_BY_MONTH[month])} حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.`;
}
