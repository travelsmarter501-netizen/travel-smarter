import "server-only";
import { PRAGUE_PHOTOS, type PlacePhoto } from "./prague/praguePhotos";
import type { V2Plan } from "./barcelonaV2Resolve";

/**
 * Display only: a saved plan keeps the place data of the day it was made, so a Prague plan saved before the photos existed has
 * an empty or missing `image`. When such a plan is shown, every place object (stop / meal / suggestion card summaries and the
 * details-sheet data) without an image and with a documented photo gets that photo and its credit. Nothing else changes
 * and nothing is written back: the stored plan stays as it was saved.
 */
const PHOTOS_BY_CITY: Record<string, Record<string, PlacePhoto>> = { prague: PRAGUE_PHOTOS };

function fill(value: unknown, photos: Record<string, PlacePhoto>): unknown {
  if (Array.isArray(value)) return value.map((item) => fill(item, photos));
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(obj)) out[key] = fill(child, photos);
  const photo = typeof obj.id === "string" ? photos[obj.id] : undefined;
  if (photo && !obj.image) Object.assign(out, photo);
  return out;
}

export function withCurrentPlacePhotos(plan: V2Plan): V2Plan {
  const photos = PHOTOS_BY_CITY[plan.destination];
  return photos ? (fill(plan, photos) as V2Plan) : plan;
}
