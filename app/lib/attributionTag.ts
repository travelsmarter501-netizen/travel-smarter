/**
 * Marketing-attribution tag: WHICH campaign link a visitor arrived from, so a paid order can later be credited to it.
 *
 * Pure and dependency-free (no browser or server APIs) because the browser builds the tag from the landing URL and the server re-validates
 * whatever it receives with the very same rules -- the browser is never trusted.
 *
 * The tag is deliberately tiny and impersonal: a channel from a closed list, and an optional campaign label (lowercase letters, digits and
 * "_ . -", at most 40 characters). Nothing else survives: no free text, no other parameter, no identifier of the visitor.
 */
export const ATTRIBUTION_CHANNELS = ["tiktok", "instagram", "other"] as const;
export type AttributionChannel = (typeof ATTRIBUTION_CHANNELS)[number];
export type Attribution = { channel: AttributionChannel; campaign?: string };

const CAMPAIGN_LABEL = /^[a-z0-9_.-]{1,40}$/;
// An unknown but plain source ("newsletter", "google_ads") is kept as "other"; anything that does not look like a plain label is not a tag at all.
const SOURCE_LABEL = /^[a-z0-9_.+-]{1,40}$/;

/** The campaign label if it is a plain one, else undefined. Case is ignored (the label is stored lowercase). */
function cleanCampaign(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const label = value.trim().toLowerCase();
  return CAMPAIGN_LABEL.test(label) ? label : undefined;
}

/**
 * Builds the tag from a landing URL's query string (utm_source / utm_campaign). Exactly "tiktok" or "instagram" (any case) become those
 * channels; any other plain source becomes "other"; no (or a malformed) utm_source means there is no tag.
 */
export function attributionFromSearch(search: string): Attribution | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const source = (params.get("utm_source") ?? "").trim().toLowerCase();
  if (!source) return null;
  const campaign = cleanCampaign(params.get("utm_campaign"));
  if (source === "tiktok" || source === "instagram") return campaign ? { channel: source, campaign } : { channel: source };
  if (!SOURCE_LABEL.test(source)) return null;
  return campaign ? { channel: "other", campaign } : { channel: "other" };
}

/** Re-validates a tag received from anywhere (session storage, a request body). Returns a clean copy, or null if it is not a valid tag. */
export function normalizeAttribution(value: unknown): Attribution | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { channel, campaign } = value as { channel?: unknown; campaign?: unknown };
  if (typeof channel !== "string" || !(ATTRIBUTION_CHANNELS as readonly string[]).includes(channel)) return null;
  const clean = cleanCampaign(campaign);
  return clean ? { channel: channel as AttributionChannel, campaign: clean } : { channel: channel as AttributionChannel };
}
