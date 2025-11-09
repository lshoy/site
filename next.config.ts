import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  images: { unoptimized: true },
  ...(phase === PHASE_PRODUCTION_BUILD ? { output: "export" } : {}),
  redirects: async () => [
    {
      source: "/blog",
      destination: "/writings",
      permanent: true,
    },
    {
      source: "/blog/:slug",
      destination: "/writings/:slug",
      permanent: true,
    },
  ],
});

export default nextConfig;
