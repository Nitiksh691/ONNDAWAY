import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Increase timeout for external image optimization
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
