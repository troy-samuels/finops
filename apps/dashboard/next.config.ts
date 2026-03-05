import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@finops/sdk", "@finops/db-types"],
};

export default nextConfig;
