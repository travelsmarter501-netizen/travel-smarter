import type { Language } from "./homepageTranslations";

/**
 * Release scope of the Prague release (branch `release/prague-preview`, 2026-11-07).
 *
 * The development branch also carries Hebrew and Vienna. They stay in the code (so merging this release back into the
 * development branch never deletes them) but are switched off here:
 * - Hebrew: not offered in the language switcher, and a stored "he" choice falls back to Arabic.
 * - Vienna: no planner module is returned for it and the preview switch ignores it, so it can never be generated.
 *
 * On the development branch, revert the commit that added this file's restrictions (or widen the lists) to work on them.
 */
/**
 * Preview-only languages (2026-11-16): NEXT_PUBLIC_PREVIEW_LANGUAGES=he adds Hebrew, but ONLY on a Vercel Preview build
 * (NEXT_PUBLIC_VERCEL_ENV === "preview", set by Vercel when system environment variables are exposed) or in local development
 * (`next dev`, no Vercel environment). On Vercel Production the variable is ignored even if it were set there by mistake, and a build
 * whose environment is unknown fails closed (no extra language).
 */
function previewLanguages(): Language[] {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const allowed = vercelEnv === "preview" || (vercelEnv === undefined && process.env.NODE_ENV === "development");
  if (!allowed) return [];
  const raw = process.env.NEXT_PUBLIC_PREVIEW_LANGUAGES ?? "";
  return raw.split(",").map((x) => x.trim()).filter((x): x is Language => x === "he");
}

export const ENABLED_LANGUAGES: readonly Language[] = ["ar", "en", ...previewLanguages()];

export function isEnabledLanguage(value: unknown): value is Language {
  return typeof value === "string" && (ENABLED_LANGUAGES as readonly string[]).includes(value);
}

export const RELEASE_EXCLUDED_DESTINATION_IDS: readonly string[] = ["vienna"];

export function isReleaseExcludedDestination(destinationId: string): boolean {
  return RELEASE_EXCLUDED_DESTINATION_IDS.includes(destinationId);
}
