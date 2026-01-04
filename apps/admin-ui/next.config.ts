import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is already run as part of the CI/CD pipeline
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is already run separately
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
