"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics (cookieless, aggregated page views).
 *
 * Every URL is reduced to its path before it is sent. Several pages carry credentials or identifiers in the query string or fragment -- the
 * guest-purchase claim link (/claim-purchase?token=...), the sign-in return (/auth/callback?code=...), order ids, reset links, and marketing
 * UTM tags -- and none of that may ever leave the browser for a statistics service. Page paths are all the dashboard needs. (Campaign
 * attribution is handled separately, server-side, on the order itself: see lib/commerce/orderAttribution.ts.)
 */
const pathOnly: BeforeSend = (event) => {
  try {
    const url = new URL(event.url);
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    // An address that cannot be parsed is not worth reporting (and is not worth risking a credential in): drop the event.
    return null;
  }
};

export default function WebAnalytics() {
  return <Analytics beforeSend={pathOnly} />;
}
