import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cần cho Docker: build ra .next/standalone kèm server.js tối giản.
  output: "standalone",
};

export default nextConfig;
