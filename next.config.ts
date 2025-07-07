import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable eslint during builds for now
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds for now
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
