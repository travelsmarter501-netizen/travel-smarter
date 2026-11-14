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
// Checked 2026-11-14 (Google Routes TRANSIT) between the stored points, departing at the time the 12 review prototypes use each leg
// (dates 20-24 Nov 2026). Against the distance model x 1.3 (middle of its range) the ratio Google / model was 0.56-1.70 (mean 1.14):
// every leg to or from the Citadella was longer than the model (1.13-1.70), the hill has no direct line.
export const BUDAPEST_CHECKED_TRANSIT_MINUTES: Record<string, number> = {
  "21-restaurant>chain-bridge": 19, // Fri 20 Nov 14:45: 4,355 m, 1,116 s
  "chain-bridge>21-restaurant": 12, // Sun 22 Nov 13:00: 2,845 m, 704 s (the uphill direction is quicker by bus)
  "citadella>great-market-hall": 22, // Sat 21 Nov 09:45: 1,758 m, 1,324 s
  "matthias-church-exterior>st-stephens-basilica": 20, // Mon 23 Nov 10:15: 4,203 m, 1,199 s
  "vaci-utca>citadella": 26, // Tue 24 Nov 11:15: 2,053 m, 1,576 s
  "citadella>danube-legend-cruise": 24, // Tue 24 Nov 14:15: 1,934 m, 1,441 s
  "hungarian-national-gallery>citadella": 36, // Fri 20 Nov 14:15: 3,501 m, 2,149 s
  "opera-house-tour>citadella": 37, // Mon 23 Nov 16:00: 3,720 m, 2,199 s
  "house-of-music>menza": 17, // Fri 20 Nov 12:15: 3,028 m, 992 s
  "citadella>gerbeaud": 28, // Sun 22 Nov 13:00: 2,199 m, 1,653 s
};

export const UNCHECKED_TRANSIT_FACTOR = 1.3;

export const CHECKED_TRANSIT_NOTE_AR = "وقت المواصلات من مخطط Google Maps (فحص 14 نوفمبر 2026، لمواعيد 20–24 نوفمبر) من الباب للباب؛ بيتغير حسب الموعد والانتظار.";

/** Checked minutes for a pair in either direction, or null. */
export function checkedTransitMinutes(fromPlaceId: string, toPlaceId: string): number | null {
  return BUDAPEST_CHECKED_TRANSIT_MINUTES[`${fromPlaceId}>${toPlaceId}`] ?? BUDAPEST_CHECKED_TRANSIT_MINUTES[`${toPlaceId}>${fromPlaceId}`] ?? null;
}
