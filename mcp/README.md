# productarena-mcp

A stdio [MCP](https://modelcontextprotocol.io) server exposing [ProductArena](https://ultrametric.ai/productarena)'s
evidence-graded product rankings, verdicts, and evidence as tools for AI agents — the same
static JSON data the site itself renders from (see
[/openapi.json](https://ultrametric.ai/productarena/openapi.json) and
[/llms.txt](https://ultrametric.ai/productarena/llms.txt)).

Prefer not to run anything locally? The same eight tools are hosted as a remote MCP endpoint
at **`https://ultrametric.ai/productarena/mcp`** (streamable HTTP, no auth, rate-limited) —
opening that same URL in a browser shows the setup page, or just point any HTTP-transport MCP
client at it.

## Tools

| Tool | Arguments | Description |
|---|---|---|
| `list_arenas` | — | List every arena/category (id, name, description, personas, themes). |
| `get_rankings` | `arena` | One arena's full leaderboard (coverage score, Arena Score, agent-readiness, per-theme scores) plus its head-to-head battle log. |
| `get_product` | `arena`, `product` | One product: metadata, leaderboard entry with rank, verdict counts, and a per-story verdict summary. |
| `get_verdict` | `arena`, `product`, `story` | The full judged verdict for one (product, story) cell: tier, quality, confidence, rationale, and cited evidence URLs. |
| `search_products` | `query` | Find products by id/name/vendor substring across every arena. |
| `compare` | `products[]` | Cross-arena score comparison — rank, coverage score, Arena Score, agent-readiness, AI-native, API quality per product. Product ids are globally unique. |
| `get_stacks` | — | Curated cross-arena AI stacks with every scored slot resolved live from current leaderboards. |
| `top_products` | `metric`, `limit?` | Cross-arena top-N by one metric: `score`, `arenaScore`, `agentReady`, `agenticApp`, or `apiQuality`. |

Data source: fetches `https://ultrametric.ai/productarena/data/...` at call time with a 5-minute
in-process cache (no local dataset, no build-time bundling). Override the base URL with the
`PA_BASE_URL` env var, e.g. to point at a local `next dev`/`next start`.

## Install & configure

### Claude Code

```bash
claude mcp add productarena -- npx -y productarena-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "productarena": {
      "command": "npx",
      "args": ["-y", "productarena-mcp"]
    }
  }
}
```

### Generic (any stdio MCP client)

Any client that speaks MCP over stdio can launch:

```bash
npx -y productarena-mcp
```

Optional env: `PA_BASE_URL` overrides the data source base URL (default
`https://ultrametric.ai/productarena`).

### From a repo checkout (no npm install)

```bash
cd mcp
pnpm install && pnpm run build   # produces dist/index.js
node dist/index.js               # or, without a build step: pnpm run dev (tsx src/index.ts)
```

Then configure your client with `"command": "node", "args": ["/absolute/path/to/productarena/mcp/dist/index.js"]`.

## Data license

This package's **code** is UNLICENSED (© Ultrametric Inc, all rights reserved; source visible
at [ultrametricai/productarena](https://github.com/ultrametricai/productarena)).

The **data the tools return** is the ProductArena dataset, © Ultrametric Inc — mirroring the
repo's [DATA-LICENSE](https://github.com/ultrametricai/productarena/blob/main/DATA-LICENSE):
you may view and query it through these tools and **briefly quote individual verdicts, scores,
or evidence excerpts with attribution** to "ProductArena by Ultrametric Inc
(ultrametric.ai/productarena)", and use it to evaluate, contest, or contribute corrections
back. Bulk copying, redistribution, resale, or use to build/train competing products or
datasets requires prior written permission.

## Development

- `mcp/src/client.ts` — fetch wrapper (`PA_BASE_URL`-aware) with the 5-minute TTL cache.
- `mcp/src/tools.ts` — pure request-routing/formatting logic per tool, independent of the MCP
  transport — this is what's unit-tested (`mcp/src/__tests__/*.test.ts`, run via the repo's
  root `pnpm test` / vitest, with `fetch` mocked).
- `mcp/src/server.ts` — wires `tools.ts` into `McpServer.registerTool()` calls.
- `mcp/src/index.ts` — stdio entry point (the `bin`).

The Cloudflare worker's remote endpoint (`infra/cloudflare-proxy/worker.js` in the repo)
hand-rolls the same eight tools — keep the two in sync if tool shapes change.

```bash
pnpm test    # from repo root — vitest picks up mcp/src/__tests__ automatically
```
