import "server-only";
import { cookies } from "next/headers";

/**
 * A one-bit "your purchases were just linked" flag, so the account page can say so once.
 *
 * Why a cookie and not the render that did the linking: the sign-in step navigates and then refreshes, and the browser may render the
 * destination more than once (navigation, refresh, prefetch, a hard reload). Only one of those renders can be the one that links the
 * purchases, and the others -- including the one the visitor finally sees -- would find nothing left to link. The flag outlives them all.
 *
 * Not a credential and not an authorization: it holds "1", names nothing, and grants nothing. Recovery never reads it -- the server still
 * decides from the verified account email alone. Spoofing it can only make a harmless message appear. It is readable by client JS on purpose
 * (the page deletes it as soon as it has shown the message) and expires by itself after a few minutes.
 */
export const LINKED_NOTICE_COOKIE = "ts_purchases_linked";
const LINKED_NOTICE_MAX_AGE_SECONDS = 5 * 60;

/** Server Action / Route Handler only. */
export async function setLinkedNoticeCookie(): Promise<void> {
  const store = await cookies();
  store.set(LINKED_NOTICE_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LINKED_NOTICE_MAX_AGE_SECONDS,
  });
}

export async function hasLinkedNoticeCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(LINKED_NOTICE_COOKIE)?.value === "1";
}
