import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at the domain root (ultrametric.ai/) since the 2026-09-28 rebrand — no basePath.
  // Legacy ultrametric.ai/productarena/* URLs are redirected at the proxy layer
  // (infra/cloudflare-proxy), not here.
};

export default nextConfig;
