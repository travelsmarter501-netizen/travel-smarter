import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.27"],
  async redirects() {
    return [
      // Legacy V1 Smart Planner. Its page bundled the ENTIRE paid Barcelona guide into a public client
      // chunk, so the route is gone: it now redirects (308, permanent) to the unified planner. Because the
      // page no longer exists, that chunk is no longer built or served.
      { source: "/smart-planner/barcelona-v1", destination: "/planner", permanent: true },
      // One canonical host. Once www.travelsmarters.com is attached to this Vercel project (it needs its own
      // certificate -- see the domain settings), every path on it is redirected to the apex domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.travelsmarters.com" }],
        destination: "https://travelsmarters.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
    // AVIF first (smaller than WebP at equivalent quality for photos, which is most of the
    // Guide/planner image set); Next.js still falls back to WebP or the original format for
    // browsers/requests that don't accept AVIF. Purely an encoding-format change -- no source
    // image, remote host, or dimension is affected.
    formats: ["image/avif", "image/webp"],
    // Quality 60 is used for the large photographic images (homepage hero, product and destination cards): visually
    // equivalent for photos at these sizes and roughly a quarter smaller than the default 75. Next 16 only honours
    // qualities that are listed here; 75 stays for everything that does not ask for a specific quality.
    qualities: [60, 75],
    // The optimized variants are derived from images that practically never change (public/ files and fixed
    // Wikimedia URLs), so keep them for 30 days instead of the 4-hour default: fewer re-optimizations / revalidations.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    // Small, rarely-changing static files that appear on the first screen. Browsers may reuse them for a day without
    // asking again (and serve a stale copy for up to 30 days while refreshing in the background) -- repeat visits and
    // in-app navigations stop paying a network round trip per file. Hashed /_next/static assets are already immutable.
    const cacheDay = "public, max-age=86400, stale-while-revalidate=2592000";
    return ["/flags/:path*", "/brand/:path*", "/hero/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: cacheDay }],
    }));
  },
};

export default nextConfig;
