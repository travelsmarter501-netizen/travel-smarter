/**
 * Budapest: public-transport times that were CHECKED, one record per DIRECTION and per checked departure.
 *
 * Source: Google Maps Routes (travel mode TRANSIT, via the Maps MCP tool), between the stored coordinates of the two places, door to door
 * (walk to the stop, wait, ride, walk). Lines and changes are not returned by the tool and were not checked against BKK.
 *
 * Rules (owner, 2026-11-14):
 * - Only the checked DIRECTION counts as checked. The reverse direction is NOT borrowed (the two directions differ: 21 Restaurant ->
 *   Chain Bridge 19 min, Chain Bridge -> 21 Restaurant 12 min); it falls back to the labelled estimate.
 * - A checked time is a measurement for ONE departure (date, local time, time zone below). Used at another date or hour it is still shown
 *   with the checked departure in its note, never as a check of the customer's own time.
 * Every other transfer is the distance estimate (estimatedRouteLegs.ts) x `UNCHECKED_TRANSIT_FACTOR` (Prague's measured factor, NOT
 * measured for Budapest), labelled as an estimate.
 */
export type CheckedTransit = {
  minutes: number;
  /** Departure that was checked, local time. */
  departureLocal: string;
  timeZone: "Europe/Budapest";
  /** Date the check was made. */
  checkedOn: string;
  distanceMeters: number;
  durationSeconds: number;
  source: string;
};

const SOURCE = "Google Maps Routes, travel mode TRANSIT (Maps MCP tool)";
const rec = (minutes: number, departureLocal: string, distanceMeters: number, durationSeconds: number): CheckedTransit => ({ minutes, departureLocal, timeZone: "Europe/Budapest", checkedOn: "2026-11-14", distanceMeters, durationSeconds, source: SOURCE });

/** Key = "from>to" (that direction only). */
export const BUDAPEST_CHECKED_TRANSIT: Record<string, CheckedTransit> = {
  "21-restaurant>chain-bridge": rec(19, "2026-11-20T14:45", 4355, 1116),
  "chain-bridge>21-restaurant": rec(12, "2026-11-22T13:00", 2845, 704),
  "citadella>great-market-hall": rec(22, "2026-11-21T09:45", 1758, 1324),
  "matthias-church-exterior>st-stephens-basilica": rec(20, "2026-11-23T10:15", 4203, 1199),
  "vaci-utca>citadella": rec(26, "2026-11-24T11:15", 2053, 1576),
  "citadella>danube-legend-cruise": rec(24, "2026-11-24T14:15", 1934, 1441),
  "hungarian-national-gallery>citadella": rec(36, "2026-11-20T14:15", 3501, 2149),
  "opera-house-tour>citadella": rec(37, "2026-11-23T16:00", 3720, 2199),
  "house-of-music>menza": rec(17, "2026-11-20T12:15", 3028, 992),
  "citadella>gerbeaud": rec(28, "2026-11-22T13:00", 2199, 1653),
};

export const UNCHECKED_TRANSIT_FACTOR = 1.3;

const WEEKDAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** The note shown with a checked time: the direction and the one departure that was checked. */
export function checkedTransitNoteAr(check: CheckedTransit): string {
  const [date, time] = check.departureLocal.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAY_AR[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `وقت المواصلات من مخطط Google Maps بهالاتجاه، لانطلاق ${weekday} ${d}/${m}/${y} الساعة ${time} (توقيت بودابست)، من الباب للباب؛ بموعد تاني بيتغير حسب الخط والانتظار.`;
}

/** The checked record for exactly this direction, or null (no reverse-direction fallback). */
export function checkedTransit(fromPlaceId: string, toPlaceId: string): CheckedTransit | null {
  return BUDAPEST_CHECKED_TRANSIT[`${fromPlaceId}>${toPlaceId}`] ?? null;
}
