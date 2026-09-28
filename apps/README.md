# Apps — the surfaces over the corpus

The user-facing surfaces currently live at their pre-lift paths; this directory documents the
map until stage 3 of the corpus lift physically moves them:

- **Site** — the Next.js app at `app/` (+ `components/`, `lib/`, `public/`), statically
  exporting ~5,900 pages: arenas, rankings, processes, playbooks, stacks, the Virtual Startup,
  compare, tools. Deployed to Vercel; `scripts/deploy-prod.sh`.
- **CLI** — `cli/` (`ultrametric-cli`): search, compare, and the certify probe.
- **MCP server** — `mcp/` (`ultrametric-mcp`): the private/agent interface to the same data.
- **Edge worker** — `infra/cloudflare-proxy/`: zone routing, auth, watchlist/stack APIs, live
  MCP probes.

Stage 3 (deliberately last — it touches deploy infra, not knowledge): relocate these under
`apps/` as proper workspace packages. Nothing about the corpus contract depends on it.
