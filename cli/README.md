# productarena

Pick good vendors without leaving the terminal — [ProductArena](https://ultrametric.ai/productarena)'s
evidence-graded product rankings, comparisons, and vendor picks as a CLI. Same public data the
site renders from (see [/openapi.json](https://ultrametric.ai/productarena/openapi.json)), fetched
live with a 5-minute in-process cache.

## Install

```bash
npm i -g productarena
# or run it without installing:
npx productarena rankings ai-coding
```

Requires Node >= 20.

## Commands

| Command | What it does | Example |
|---|---|---|
| `arenas` | List every arena: id, name, product count. | `productarena arenas` |
| `rankings <arena>` | One arena's leaderboard: rank, Arena Score, agent-ready, agentic, API. | `productarena rankings ai-coding` |
| `product <arena> <id>` | One product's scorecard: scores, MCP/CLI/API access, top full/none stories, links. | `productarena product payments stripe` |
| `compare <id> <id> [...]` | Cross-arena comparison table (product ids are globally unique; max 6). | `productarena compare stripe adyen` |
| `top [--metric M] [--oss] [--limit N]` | Cross-arena best by one metric; `--oss` restricts to open source. | `productarena top --metric agentReady --oss` |
| `pick <role> [--metric M] [--oss]` | THE vendor pick for a role: top pick with why, runner-up, and a "too close to call" flag at Δ≤3.0. `pick --list` prints the role→arena alias map. | `productarena pick payroll` |
| `stacks [id]` | Curated cross-arena AI stacks, every scored slot resolved live from current leaderboards. | `productarena stacks local-sovereign` |
| `scan <url>` | Agent-readiness quick scan of any product site (llms.txt, OpenAPI, MCP/API/CLI signals, robots). | `productarena scan https://stripe.com` |

Roles for `pick` are arena ids plus friendly aliases: `banking`, `payments`, `payroll`,
`accounting`, `pm`, `git`, `coding-agent`, `chat`, `baas`, `analytics`, `crm`, `edge`, `auth`,
`vector-db`, `gateway`, `terminal`, and more — `productarena pick --list` shows the full map.

## For scripts and AI agents

Every command takes `--json` for stable, machine-readable output:

```bash
productarena pick git --json | jq '.top.productId'
productarena rankings ai-coding --json | jq '.rows[0]'
```

Prefer MCP? The same data is exposed as eight MCP tools — hosted at
`https://ultrametric.ai/productarena/mcp` or via the `productarena-mcp` npm package. Raw JSON
lives under `https://ultrametric.ai/productarena/data/…`.

## Behavior

- **Colors** are disabled automatically when stdout isn't a TTY or `NO_COLOR` is set
  (`FORCE_COLOR` overrides).
- **Exit codes**: `0` ok, `1` usage error (unknown arena/product/role/flag), `2` network error
  (including "scanner not deployed yet" for `scan`).
- **`PA_BASE_URL`** points the CLI at a local checkout (`next dev`/`next start`) instead of the
  live site.

## Data license

Everything this CLI returns is the ProductArena dataset, © Ultrametric Inc. Querying it and
briefly quoting individual verdicts or scores is welcome with attribution to "ProductArena by
Ultrametric Inc (ultrametric.ai/productarena)". Bulk copying, redistribution, or use to build
or train competing products or datasets requires written permission — see
[DATA-LICENSE](https://github.com/ultrametricai/productarena/blob/main/DATA-LICENSE).
