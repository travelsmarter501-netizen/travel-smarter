import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.27"],
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
