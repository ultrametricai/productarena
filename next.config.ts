import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at ultrametric.ai/productarena, not domain root. Keep in sync with
  // lib/site.ts's BASE_PATH constant (used for hardcoded asset/API paths that Next
  // doesn't rewrite automatically, e.g. unoptimized <img> src).
  basePath: "/productarena",
  // Root of the domain (both ultrametric.ai/ and the productarena.vercel.app/ preview alias)
  // would otherwise 404 once basePath is set, since the whole app only exists under
  // /productarena/*. `basePath: false` here means `/` is literally the domain root, not
  // `${basePath}/`. Mirrored in vercel.json for platforms that read that file instead of
  // running `next start` (both are harmless to keep together).
  async redirects() {
    return [
      { source: "/", destination: "/productarena", basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
