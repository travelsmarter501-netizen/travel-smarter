"use client";

import { useSyncExternalStore } from "react";
import { currentEmbeddedBrowser, type EmbeddedBrowserPlatform } from "./inAppBrowser";

const noopSubscribe = () => () => {};
// A primitive snapshot ("" = a normal browser) keeps useSyncExternalStore stable. The server render and hydration use "" (the normal page),
// then the real answer is applied on the client -- no markup mismatch.
const snapshot = () => currentEmbeddedBrowser() ?? "";

/** The embedded browser (TikTok, Instagram, ...) the visitor is in, or null in a normal browser. Wording only -- it grants nothing. */
export function useEmbeddedBrowser(): EmbeddedBrowserPlatform | null {
  const value = useSyncExternalStore(noopSubscribe, snapshot, () => "") as EmbeddedBrowserPlatform | "";
  return value === "" ? null : value;
}

/** True when `next` is the post-payment claim page (with or without its token): the visitor is signing in to attach a purchase. */
export function isClaimNext(next: string | null | undefined): boolean {
  return typeof next === "string" && (next === "/claim-purchase" || next.startsWith("/claim-purchase?"));
}
