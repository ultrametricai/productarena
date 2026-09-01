// Single source of truth for the two identifiers that used to be scattered as string literals
// across route handlers, layout, and components: the canonical deployed origin and the GitHub
// repo path. Route handlers/pages should import these instead of re-declaring `const SITE = ...`.
export const SITE_URL = 'https://ainess.vercel.app'
export const REPO = 'ultrametricai/AIness'
