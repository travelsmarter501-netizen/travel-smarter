/**
 * Detects "embedded" browsers -- the in-app webviews of TikTok, Instagram, Facebook, Snapchat and similar apps -- from a user-agent string.
 *
 * Why it matters: Google refuses OAuth sign-in inside embedded webviews (error 403 "disallowed_useragent"), and TikTok's browser does not even
 * open the Google authorization URL ("Open this link in your browser"). Worse, the OAuth (PKCE) flow stores its verifier in cookies of the
 * browser that STARTED it; if the visitor finishes in Safari the callback cannot find it. So inside these browsers Google sign-in must not be
 * started at all; email + password keeps working there because it never leaves the page.
 *
 * Pure function (no DOM access) so it can be unit-tested with real user-agent strings. It only drives UI wording -- it grants nothing.
 */
export type EmbeddedBrowserPlatform = "ios" | "android" | "other";

// Apps that embed their own webview and identify themselves in the user-agent.
const KNOWN_APP =
  /musical_ly|bytedancewebview|tiktok|trill_|aweme|instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|snapchat|pinterest|linkedinapp|micromessenger|kakaotalk|\bline\/\d/i;

/** Which platform the embedded browser runs on, or null when this user-agent is a normal browser. */
export function embeddedBrowserPlatform(userAgent: string): EmbeddedBrowserPlatform | null {
  if (!userAgent) return null;
  const isIos = /\b(iPhone|iPod|iPad)\b/.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const platform: EmbeddedBrowserPlatform = isIos ? "ios" : isAndroid ? "android" : "other";

  if (KNOWN_APP.test(userAgent)) return platform;
  // Android System WebView (any app): the "; wv)" token inside the platform comment.
  if (isAndroid && /;\s*wv\)/.test(userAgent)) return "android";
  // iOS WKWebView in an app that does not name itself: real Safari, Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS) and
  // SFSafariViewController all include "Safari/" in their user-agent; a bare WKWebView does not.
  if (isIos && !/Safari\//.test(userAgent)) return "ios";
  return null;
}

/** The embedded browser the visitor is in right now (client only). A home-screen web app is not an embedded browser. */
export function currentEmbeddedBrowser(): EmbeddedBrowserPlatform | null {
  try {
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return null;
    return embeddedBrowserPlatform(navigator.userAgent);
  } catch {
    return null;
  }
}

/** The browser to point someone to on this platform: Safari on iPhone/iPad, Chrome on Android. */
export function suggestedBrowser(platform: EmbeddedBrowserPlatform | null): "safari" | "chrome" | "any" {
  if (platform === "android") return "chrome";
  if (platform === "other") return "any";
  return "safari";
}

/** Platform of the current device for wording only (never null): iPhone/iPad -> ios, Android -> android, anything else -> ios wording (Safari). */
export function currentPlatformForWording(): "ios" | "android" {
  try {
    return /Android/i.test(navigator.userAgent) ? "android" : "ios";
  } catch {
    return "ios";
  }
}
