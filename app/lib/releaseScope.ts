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
export const ENABLED_LANGUAGES: readonly Language[] = ["ar", "en"];

export function isEnabledLanguage(value: unknown): value is Language {
  return typeof value === "string" && (ENABLED_LANGUAGES as readonly string[]).includes(value);
}

export const RELEASE_EXCLUDED_DESTINATION_IDS: readonly string[] = ["vienna"];

export function isReleaseExcludedDestination(destinationId: string): boolean {
  return RELEASE_EXCLUDED_DESTINATION_IDS.includes(destinationId);
}
