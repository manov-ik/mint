import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.1.35", "192.168.1.38", "localhost"],
};

export default nextConfig;
