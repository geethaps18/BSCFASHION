import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "chcucwnebherhnvmoyqz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "bscfashion.com",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // optional: modern formats
    minimumCacheTTL: 60, // optional: cache TTL in seconds
  },
};

export default nextConfig;
