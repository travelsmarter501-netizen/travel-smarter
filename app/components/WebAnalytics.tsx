"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics (cookieless, aggregated page views and conversion events).
 *
 * Every URL is reduced to its path before it is sent. Several pages carry credentials or identifiers in the query string or fragment -- the
 * guest-purchase claim link (/claim-purchase?token=...), the sign-in return (/auth/callback?code=...), order ids, reset links -- and none of that
 * may ever leave the browser for a statistics service.
 *
 * The one exception is marketing-campaign tags, so a TikTok / Instagram campaign link can be measured: ONLY the five standard utm_* parameters
 * are kept, and only when the value is a short plain label (letters, digits, "_", "-", ".", "+"). Anything else -- any other parameter, any
 * long or odd-looking value -- is dropped.
 */
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CAMPAIGN_VALUE = /^[A-Za-z0-9_.+-]{1,64}$/;

const keepPathAndCampaignTags: BeforeSend = (event) => {
  try {
    const url = new URL(event.url);
    const campaign = new URLSearchParams();
    for (const name of CAMPAIGN_PARAMS) {
      const value = url.searchParams.get(name);
      if (value !== null && CAMPAIGN_VALUE.test(value)) campaign.set(name, value);
    }
    url.search = campaign.toString();
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    // An address that cannot be parsed is not worth reporting (and is not worth risking a credential in): drop the event.
    return null;
  }
};

export default function WebAnalytics() {
  return <Analytics beforeSend={keepPathAndCampaignTags} />;
}
