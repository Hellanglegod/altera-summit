import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/stellar-gateway-x7k2m9",
        destination: "/admin",
      },
      {
        source: "/stellar-gateway-x7k2m9/:path*",
        destination: "/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
