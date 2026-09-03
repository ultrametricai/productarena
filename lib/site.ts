// Single source of truth for the identifiers that used to be scattered as string literals
// across route handlers, layout, and components: the canonical deployed origin, the basePath
// the app is served under, and the GitHub repo path. Route handlers/pages should import these
// instead of re-declaring `const SITE = ...`.
//
// SITE_URL reads NEXT_PUBLIC_SITE_URL so builds still deployed at a *.vercel.app preview/prod
// URL can override it; it already includes the /productarena basePath since the app is served
// at ultrametric.ai/productarena, not at the domain root.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ultrametric.ai/productarena'
export const REPO = 'ultrametricai/productarena'

// Must match `basePath` in next.config.ts. Next.js rewrites next/link and next/navigation for
// us, but plain <img>/<a> src/href values (e.g. unoptimized logos, hardcoded /data or /logos
// references) need this prefix applied manually.
export const BASE_PATH = '/productarena'

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalized}`
}
