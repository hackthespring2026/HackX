import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["samples-var-watch-passed.trycloudflare.com", "localhost:3000"]
};

export default nextConfig;
