# Connectors — optional integrations

Integrations with vendor and government systems, kept strictly optional and separate from the
knowledge layer: the corpus must stay fully useful with zero accounts, keys, or network calls.

What exists today:

- **`mcp/`** — the Ultrametric MCP server package (`ultrametric-mcp`), exposing the rankings
  and evidence to agent runtimes.
- **`cli/`** — `ultrametric-cli`, including the agent-readiness certify probe.
- **`data/assistant-plugins.json`** — the vendor ↔ assistant-platform integration map (254
  entries across Claude, ChatGPT, Grok, Muse), rendered on product pages.
- **The worker's live probes** (`infra/cloudflare-proxy/`) — rate-limited, allowlisted MCP
  endpoint probes behind the product pages' "Try it".

Adapter rules (from the architecture doc, binding for anything added here): vendor APIs behind
scopes and a secret vault, dry-run mode where possible, idempotency keys, least-privilege
credentials, auditable receipts, and a named human approval for any external effect. No
connector may become a default vendor route — routing stays evidence-ranked, never paid.
