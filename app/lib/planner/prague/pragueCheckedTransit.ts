/**
 * Prague: public-transport times that were CHECKED, for the transfers the sample plans use most.
 *
 * Source: Google Maps Routes (travel mode TRANSIT), departing Thursday 12 November 2026 at 13:00, between the stored
 * coordinates of the two places; door to door (walk to the stop, wait, ride, walk). One direction was asked per pair (the
 * direction listed); the other direction uses the same value, which is an assumption. Times change with the departure time.
 *
 * What it showed: on these 14 pairs the distance-based estimate (estimatedRouteLegs.ts) was about 30% too short on average
 * (from 19% too long to 80% too short). So every OTHER Prague public-transport estimate is lengthened by
 * `UNCHECKED_TRANSIT_FACTOR`; it stays an estimate and is still labelled as one.
 */
export const PRAGUE_CHECKED_TRANSIT_MINUTES: Record<string, number> = {
  "letna-park>stromovka": 25,
  "prague-zoo>letensky-zamecek": 35,
  "letensky-zamecek>prague-zoo": 29,
  "vitkov-memorial>vinohradsky-parlament": 21,
  "havlicek-gardens>spravovna": 25,
  "havlicek-gardens>riegrovy-sady": 20,
  "strahov-monastery>u-modre-kachnicky-mala-strana": 19,
  "riegrovy-sady>vitkov-memorial": 22,
  "petrin-tower>u-mecenase": 18,
  "dancing-house>vysehrad": 19,
  "strahov-monastery>john-lennon-wall": 21,
  "letna-park>u-cedru": 13,
  "letensky-zamecek>troja-chateau": 29,
  "stromovka>botanical-garden": 33,
};

export const UNCHECKED_TRANSIT_FACTOR = 1.3;

export const CHECKED_TRANSIT_NOTE_AR = "وقت المواصلات من مخطط Google Maps (فحص 12 نوفمبر 2026، خميس 13:00) من الباب للباب؛ بيتغير حسب الموعد والانتظار.";

/** Checked minutes for a pair in either direction, or null. */
export function checkedTransitMinutes(fromPlaceId: string, toPlaceId: string): number | null {
  return PRAGUE_CHECKED_TRANSIT_MINUTES[`${fromPlaceId}>${toPlaceId}`] ?? PRAGUE_CHECKED_TRANSIT_MINUTES[`${toPlaceId}>${fromPlaceId}`] ?? null;
}
