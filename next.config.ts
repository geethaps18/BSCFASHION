import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  images: {
    remotePatterns: [
      // ✅ Cloudinary (HTTP + HTTPS)
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // ✅ Supabase
      {
        protocol: "https",
        hostname: "chcucwnebherhnvmoyqz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // ✅ Shopify
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },

      // ✅ Your domain
      {
        protocol: "https",
        hostname: "bscfashion.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
