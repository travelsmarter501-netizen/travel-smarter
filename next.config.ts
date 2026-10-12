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
  },
};

export default nextConfig;
