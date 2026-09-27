import type { DestinationGuideContent } from "../guideTypes";

/**
 * Custom Plan Admin Builder V1 -- deterministic matching of a customer's free-text mustVisit
 * field (e.g. "Sagrada, Camp Nou, la boqueria") against real Barcelona Guide place names.
 *
 * Matches only against "main stop" types (attractions/beaches/shoppingAreas/experiences) --
 * the same set resolvePlannerPlace treats as main stops (see app/lib/readyPlan.ts). Never
 * invents a place: an unmatched token is returned as-is for the admin to handle manually,
 * never silently dropped or guessed into the nearest place.
 */

export type MustVisitMatchResult = {
  matchedPlaceIds: string[];
  unmatched: string[];
};

type NameIndexEntry = { normalizedName: string; placeId: string };

const COMBINING_MARKS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");
const NON_WORD_PATTERN = new RegExp("[^a-z0-9\\u0600-\\u06FF\\s]", "g");
const WHITESPACE_PATTERN = new RegExp("\\s+", "g");
const SPLIT_PATTERN = new RegExp("[,\\n\\r\\u060C\\u061B;]+|\\s+\\u0648\\s+|\\s+and\\s+", "gi");

/** Lowercase, strips diacritics (including Arabic harakat, which are Unicode combining marks
 * too -- "مدريد" and a fully-voweled spelling of the same word should still match), collapses
 * punctuation/whitespace. Keeps Latin and Arabic letters. */
function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .toLowerCase()
    .replace(NON_WORD_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();
}

function buildNameIndex(guide: DestinationGuideContent): NameIndexEntry[] {
  const entries: { id: string; name: string }[] = [
    ...guide.attractions,
    ...guide.beaches,
    ...guide.shoppingAreas,
    ...guide.experiences,
  ];
  return entries
    .map((entry) => ({ normalizedName: normalizeForMatch(entry.name), placeId: entry.id }))
    .filter((entry) => entry.normalizedName.length > 0);
}

/** Exact match first, then substring match (either direction) -- substring only applies to
 * tokens of at least 3 normalized characters, to avoid a short token like "la" matching almost
 * anything. */
function matchToken(normalizedToken: string, index: NameIndexEntry[]): string | null {
  if (!normalizedToken) return null;

  const exact = index.find((entry) => entry.normalizedName === normalizedToken);
  if (exact) return exact.placeId;

  if (normalizedToken.length >= 3) {
    const partial = index.find(
      (entry) => entry.normalizedName.includes(normalizedToken) || normalizedToken.includes(entry.normalizedName)
    );
    if (partial) return partial.placeId;
  }

  return null;
}

/** Splits free text on common list delimiters (commas, semicolons, Arabic "و", English "and", newlines). */
function splitMustVisitText(text: string): string[] {
  return text
    .split(SPLIT_PATTERN)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function matchMustVisitText(text: string, guide: DestinationGuideContent): MustVisitMatchResult {
  const trimmed = text.trim();
  if (!trimmed) return { matchedPlaceIds: [], unmatched: [] };

  const index = buildNameIndex(guide);
  const tokens = splitMustVisitText(trimmed);

  const matchedPlaceIds: string[] = [];
  const unmatched: string[] = [];
  const seenPlaceIds = new Set<string>();

  for (const token of tokens) {
    const placeId = matchToken(normalizeForMatch(token), index);
    if (placeId) {
      if (!seenPlaceIds.has(placeId)) {
        matchedPlaceIds.push(placeId);
        seenPlaceIds.add(placeId);
      }
    } else {
      unmatched.push(token);
    }
  }

  return { matchedPlaceIds, unmatched };
}
