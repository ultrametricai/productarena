# init-dog-mcp

A stdio [MCP](https://modelcontextprotocol.io) server exposing [INIT](https://init.dog)'s
evidence-graded product rankings, verdicts, and evidence as tools for AI agents — the same
static JSON data the site itself renders from (see the root repo's README "For AI agents"
section and `/openapi.json`).

This package is part of the [INIT](https://github.com/ultrametricai/productarena)
monorepo. **It is not published to npm** — run it from a local checkout (see below).

## Tools

| Tool | Description |
|---|---|
| `list_arenas` | List every category (id, name, description, personas, themes). |
| `get_rankings` | Leaderboard + head-to-head battles for one category. |
| `get_product` | One product's metadata, leaderboard entry, and every story verdict with rationale + cited evidence URLs. |
| `get_battle` | Head-to-head battle result between two products in one category. |
| `search_products` | Search for a product by id/name/vendor substring across every category. |
| `get_story_verdicts` | Every product's verdict for one specific story within a category. |

Data source: fetches `https://init.dog/data/...` at call time (no local
dataset, no build-time bundling). Override the base URL with the `PA_BASE_URL` env var, e.g.
to point at a local `next dev`/`next start`.

## Setup

```bash
cd mcp
pnpm install   # or: run from repo root — this package is part of the pnpm workspace
pnpm run build
```

This produces `mcp/dist/index.js`, a stdio MCP server entry point.

## Client configuration

### Claude Code

```bash
claude mcp add init -- node /absolute/path/to/INIT/mcp/dist/index.js
```

Or add it directly to `.mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "init": {
      "command": "node",
      "args": ["/absolute/path/to/INIT/mcp/dist/index.js"],
      "env": {
        "PA_BASE_URL": "https://init.dog"
      }
    }
  }
}
```

### Generic (any MCP client)

Any client that speaks MCP over stdio can launch:

```bash
node /absolute/path/to/INIT/mcp/dist/index.js
```

or, without a build step, during development:

```bash
cd mcp && pnpm run dev   # tsx src/index.ts
```

`PA_BASE_URL` (optional) overrides the data source base URL; it defaults to
`https://init.dog`.

## Development

- `mcp/src/client.ts` — thin fetch wrapper (`PA_BASE_URL`-aware).
- `mcp/src/tools.ts` — pure request-routing/formatting logic per tool, independent of the MCP
  transport — this is what's unit-tested (`mcp/src/__tests__/*.test.ts`, run via the repo's
  root `pnpm test` / vitest, with `fetch` mocked).
- `mcp/src/server.ts` — wires `tools.ts` into `McpServer.registerTool()` calls.
- `mcp/src/index.ts` — stdio entry point (the `bin`).

```bash
pnpm test    # from repo root — vitest picks up mcp/src/__tests__ automatically
```
