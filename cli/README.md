# ultrametric-cli

Pick good vendors without leaving the terminal — [Ultrametric](https://ultrametric.ai)'s
evidence-graded product rankings, comparisons, and vendor picks as a CLI. Same public data the
site renders from (see [/openapi.json](https://ultrametric.ai/openapi.json)), fetched
live with a 5-minute in-process cache.

## Install

```bash
npm i -g ultrametric-cli
# or run it without installing:
npx ultrametric-cli rankings ai-coding
```

Requires Node >= 20.

## Commands

| Command | What it does | Example |
|---|---|---|
| `arenas` | List every arena: id, name, product count. | `ultrametric-cli arenas` |
| `rankings <arena>` | One arena's leaderboard: rank, PA Score, agent-ready, agentic, API. | `ultrametric-cli rankings ai-coding` |
| `product <arena> <id>` | One product's scorecard: scores, MCP/CLI/API access, top full/none stories, links. | `ultrametric-cli product payments stripe` |
| `compare <id> <id> [...]` | Cross-arena comparison table (product ids are globally unique; max 6). | `ultrametric-cli compare stripe adyen` |
| `top [--metric M] [--oss] [--limit N]` | Cross-arena best by one metric; `--oss` restricts to open source. | `ultrametric-cli top --metric agentReady --oss` |
| `pick <role> [--metric M] [--oss]` | THE vendor pick for a role: top pick with why, runner-up, and a "too close to call" flag at Δ≤3.0. `pick --list` prints the role→arena alias map. | `ultrametric-cli pick payroll` |
| `stacks [id]` | Curated cross-arena AI stacks, every scored slot resolved live from current leaderboards. | `ultrametric-cli stacks local-sovereign` |
| `scan <url>` | Agent-readiness quick scan of any product site (llms.txt, OpenAPI, MCP/API/CLI signals, robots). | `ultrametric-cli scan https://stripe.com` |
| `certify <url> [--report F] [--mcp URL] [--api URL]` | The Agent-Ready certification suite: six keyless conformance checks (llms.txt, docs `.md` mirrors, OpenAPI, a real MCP initialize handshake, robots posture, structured JSON errors) run from your machine against your own product, scored into the two published levels. `--report` writes the machine-verifiable cert-report JSON to submit for certification — see [docs/CERTIFICATION.md](https://github.com/ultrametricai/ultrametric/blob/main/docs/CERTIFICATION.md). | `ultrametric-cli certify https://docs.stripe.com --report cert-report.json` |

Roles for `pick` are arena ids plus friendly aliases: `banking`, `payments`, `payroll`,
`accounting`, `pm`, `git`, `coding-agent`, `chat`, `baas`, `analytics`, `crm`, `edge`, `auth`,
`vector-db`, `gateway`, `terminal`, and more — `ultrametric-cli pick --list` shows the full map.

## For scripts and AI agents

Every command takes `--json` for stable, machine-readable output:

```bash
ultrametric-cli pick git --json | jq '.top.productId'
ultrametric-cli rankings ai-coding --json | jq '.rows[0]'
```

Prefer MCP? The same data is exposed as eight MCP tools — hosted at
`https://ultrametric.ai/mcp` or via the `ultrametric-mcp` npm package. Raw JSON
lives under `https://ultrametric.ai/data/…`.

## Behavior

- **Colors** are disabled automatically when stdout isn't a TTY or `NO_COLOR` is set
  (`FORCE_COLOR` overrides).
- **Exit codes**: `0` ok, `1` usage error (unknown arena/product/role/flag), `2` network error
  (including "scanner not deployed yet" for `scan`).
- **`PA_BASE_URL`** points the CLI at a local checkout (`next dev`/`next start`) instead of the
  live site.

## Data license

Everything this CLI returns is the Ultrametric dataset, © Ultrametric Inc. Querying it and
briefly quoting individual verdicts or scores is welcome with attribution to "Ultrametric by
Ultrametric Inc (ultrametric.ai)". Bulk copying, redistribution, or use to build
or train competing products or datasets requires written permission — see
[DATA-LICENSE](https://github.com/ultrametricai/ultrametric/blob/main/DATA-LICENSE).
