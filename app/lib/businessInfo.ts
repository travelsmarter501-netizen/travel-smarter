/**
 * Public business details shown on the website. These are intentionally public (footer and
 * legal pages), not secrets.
 *
 * The physical address lives in its own export on purpose: only the legal pages
 * (Privacy Policy / Terms of Service) import it. The footer and homepage import
 * BUSINESS_CONTACT only, so the address is never rendered or bundled there.
 */
export const BUSINESS_CONTACT = {
  name: "Travel Smarter",
  email: "travelsmarter501@gmail.com",
  phone: "0532249914",
} as const;

export const BUSINESS_ADDRESS = "I'billin 1, Israel";
