// Single source of truth for the two identifiers that used to be scattered as string literals
// across route handlers, layout, and components: the canonical deployed origin and the GitHub
// repo path. Route handlers/pages should import these instead of re-declaring `const SITE = ...`.
//
// SITE_URL reads NEXT_PUBLIC_SITE_URL so builds still deployed at a *.vercel.app preview/prod
// URL (init.dog isn't wired up yet) can override it; once the domain is live, drop the env var
// and this const alone is the source of truth again.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://init.dog'
export const REPO = 'ultrametricai/productarena'
