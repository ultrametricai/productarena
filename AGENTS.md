<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Shared process content

The shared situations/process schema and records live in `content/processes/`.
Keep the old corpus, chains, jurisdiction files, and site loaders working during
the additive transition. Public Git owns shared process meaning. Private UM
instructions live as versioned additions in the API database. Do not use the
retired private process repo as a source of authority or copy private guides here.
Run `pnpm shared:check` and the shared-process tests for schema or catalog changes.
