import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname, // ✅ add this line
  images: {
    remotePatterns: [
      // ✅ Supabase bucket
      {
        protocol: "https",
        hostname: "chcucwnebherhnvmoyqz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // ✅ Your custom domain
      {
        protocol: "https",
        hostname: "bscfashion.com",
        pathname: "/**",
      },
      // ✅ Shopify
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      // ✅ Global catch-all (any domain)
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // modern formats
    minimumCacheTTL: 3600, // 1h cache
  },
};

export default nextConfig;
