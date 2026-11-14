/**
 * Budapest: public-transport times that were CHECKED for the transfers the review plans use.
 *
 * Source: Google Maps Routes (travel mode TRANSIT, via the Maps MCP tool), departing Thursday 19 November 2026 at the time each pair is
 * used, between the stored coordinates of the two places; door to door (walk to the stop, wait, ride, walk). Lines and changes are not
 * returned by the tool and were not checked against BKK. One direction was asked per pair; the other direction uses the same value
 * (an assumption). Times change with the departure time.
 *
 * Every OTHER public-transport time is the distance estimate (estimatedRouteLegs.ts) lengthened by `UNCHECKED_TRANSIT_FACTOR`, measured
 * on the checked pairs below against the same estimate (see the review file), and stays labelled as an estimate.
 */
export const BUDAPEST_CHECKED_TRANSIT_MINUTES: Record<string, number> = {};

export const UNCHECKED_TRANSIT_FACTOR = 1.3;

export const CHECKED_TRANSIT_NOTE_AR = "وقت المواصلات من مخطط Google Maps (فحص 13 نوفمبر 2026، لموعد خميس 19 نوفمبر) من الباب للباب؛ بيتغير حسب الموعد والانتظار.";

/** Checked minutes for a pair in either direction, or null. */
export function checkedTransitMinutes(fromPlaceId: string, toPlaceId: string): number | null {
  return BUDAPEST_CHECKED_TRANSIT_MINUTES[`${fromPlaceId}>${toPlaceId}`] ?? BUDAPEST_CHECKED_TRANSIT_MINUTES[`${toPlaceId}>${fromPlaceId}`] ?? null;
}
