import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served at the domain root (ultrametric.ai/) since the 2026-09-28 rebrand — no basePath.
  // Legacy ultrametric.ai/productarena/* URLs are redirected at the proxy layer
  // (infra/cloudflare-proxy), not here.
  // These dynamic previews read the legacy corpus through parameterized paths
  // that automatic tracing cannot resolve. Include only their two runtime inputs.
  outputFileTracingIncludes: {
    '/processes/preview': ['./processes/corpus.json', './journeys/chains.json'],
    '/processes/preview/*': ['./processes/corpus.json', './journeys/chains.json'],
    '/processes/incorporate-c-corp/v2': ['./processes/corpus.json', './journeys/chains.json'],
  },
};

export default nextConfig;
