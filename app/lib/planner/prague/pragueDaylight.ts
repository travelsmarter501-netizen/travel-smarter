/**
 * Prague daylight policy (2026-11-24), the same shape as Budapest's (budapestDaylight.ts): an EXPLICIT, hand-written classification
 * with its evidence; the planner only reads the class.
 *
 * - "prefers": better in daylight, still possible after dark. Never a closure or a ban: an edit or an added place picks a position
 *   before the estimate when the day allows one, and a stop left after the estimate on a dated day shows a note naming the estimate.
 *   Only outdoor places WITHOUT published hours are here; a place with hours (gardens that close, the zoo, the botanical garden) is
 *   held by its own hours.
 * - Every other place: no rule (indoor, or a street / bridge / square / viewpoint seen at any hour, or a place held by its own hours).
 *
 * The sunset is a MONTHLY ESTIMATE: the sunset of the 15th of each month at Prague's centre (50.0875 N, 14.4214 E), computed with the
 * standard NOAA sunrise/sunset algorithm (zenith 90.833°) in local time (CET; CEST April-October), rounded to 5 minutes. Check:
 * 15 February 2027 computes to 17:20; a published table (weather2travel, Prague, 14 February 2027) gives 17:18. It is never the exact
 * sunset of a date and is named as an estimate wherever it is shown.
 */
/** Estimated Prague sunset by month (local time; an estimate, not the sunset of a date). Index 1 = January. */
export const PRAGUE_SUNSET_ESTIMATE_BY_MONTH = [0, 16 * 60 + 30, 17 * 60 + 20, 18 * 60 + 5, 19 * 60 + 55, 20 * 60 + 40, 21 * 60 + 15, 21 * 60 + 5, 20 * 60 + 20, 19 * 60 + 15, 18 * 60 + 10, 16 * 60 + 20, 16 * 60];

export const PRAGUE_DAYLIGHT_PREFERS: Record<string, string> = {
  "obora-hvezda": "A forest walk (4.5 km loop); prague.eu gives no hours and no lighting, so dark paths after sunset are likely. Preference, not a closure.",
  parukarka: "A rugged hill park whose point is the view from the top (prague.eu); no published hours.",
  "petrin-gardens": "Hillside gardens (place data: best time «العصر»); no published hours stored.",
  "kampa-island": "A riverside park (place data: best time «العصر»); no published hours stored.",
  "letna-park": "A park visited for the view over the bridges (place data); no published hours stored.",
  stromovka: "A large park walk (place data: best time «العصر»); no published hours stored.",
  vysehrad: "Fortress grounds and viewpoints (place data: best time «العصر وقبل الغروب», before sunset); no published hours stored for the grounds.",
  "kinsky-garden": "A 22-hectare hillside garden (prague.eu); no published hours.",
  "chotek-gardens": "A small tree park (prague.eu); no published hours.",
  "novy-svet": "A lane seen for its houses and house signs (prague.eu); best in daylight (place data: «قبل الظهر»); no hours (a public street).",
};

/** Minutes a "prefers daylight" visit ending at `endMinutes` runs after the monthly sunset estimate (0 otherwise, or without a date). */
export function pragueDaylightLateMinutes(placeId: string, endMinutes: number, month: number | null): number {
  if (!PRAGUE_DAYLIGHT_PREFERS[placeId] || !month) return 0;
  return Math.max(0, endMinutes - PRAGUE_SUNSET_ESTIMATE_BY_MONTH[month]);
}

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
/**
 * The note on a "prefers daylight" stop that ends after the estimate: word for word the owner-approved Budapest note (2026-11-15), so it
 * keeps that wording and its existing English / Hebrew translation (localizePlan's template), with Prague's monthly time.
 */
export function pragueDaylightNoteAr(month: number): string {
  return `الأفضل تزوره بضوّ النهار. الغروب حوالي ${hhmm(PRAGUE_SUNSET_ESTIMATE_BY_MONTH[month])} حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.`;
}
