import { attributionFromSearch, normalizeAttribution, type Attribution } from "./attributionTag";

/**
 * Remembers, for THIS browser tab only, which campaign link the visitor arrived from -- so that if they buy, the order can be credited to it.
 *
 * Nothing is sent anywhere by this file. The tag lives in sessionStorage (gone when the tab closes; not a cookie, not shared between tabs,
 * no identifier) and is only read when the visitor starts a checkout, which passes it to the server together with the order request.
 * First touch wins: once a tag is stored, a later page with other UTM values does not replace it.
 *
 * Every access is wrapped: storage can be unavailable (private mode, blocked by an in-app browser) and the visitor must never notice.
 */
const STORAGE_KEY = "ts_attr";

/** Call once when the site loads: stores the tag from the landing URL unless this tab already has one. */
export function captureAttribution(): void {
  try {
    if (normalizeAttribution(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null"))) return;
    const tag = attributionFromSearch(window.location.search);
    if (tag) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tag));
  } catch {
    // no storage, nothing to remember
  }
}

/** The tag for this tab, or undefined. Re-validated on the way out, so a tampered value is simply ignored. */
export function readAttribution(): Attribution | undefined {
  try {
    return normalizeAttribution(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null")) ?? undefined;
  } catch {
    return undefined;
  }
}
