# cloudflare-proxy

The Cloudflare Worker on the `ultrametric.ai/productarena*` route. Three jobs:

1. **Transparent proxy** — forwards everything to the Vercel deployment
   (`productarena.vercel.app`, built with basePath `/productarena`), rewriting absolute
   redirects back onto `ultrametric.ai`.
2. **`POST /productarena/api/scan`** — the keyless "test my product" quick scan behind
   `/submit`. Deliberately paranoid (SSRF-hardened URL validation, capped redirects, bounded
   reads, 10 requests / 5 min per IP) — see the comments in `worker.js` before touching it.
3. **`POST /productarena/mcp`** — a remote MCP endpoint (see below).

## Remote MCP endpoint

`https://ultrametric.ai/productarena/mcp` implements MCP's streamable-HTTP transport in its
plain-JSON response mode: the client POSTs one JSON-RPC 2.0 message, the worker answers with
one `application/json` body.

Design notes:

- **Stateless** — no `Mcp-Session-Id` is issued (the spec permits this); every POST stands
  alone, so any client, curl included, can talk to it without a handshake dance. `initialize`
  still works and negotiates a protocol version (`2025-06-18`, `2025-03-26`, or `2024-11-05`).
- **No SSE** — a `GET` with `Accept: text/event-stream` returns 405; responses are single JSON
  bodies (the tools are all fast reads, so streaming buys nothing). A plain browser `GET` of
  the same URL falls through to the proxy and serves the site's human-readable `/mcp` page —
  one URL for both the docs and the endpoint.
- **Methods** — `initialize`, `ping`, `tools/list`, `tools/call`. Everything else gets a clean
  JSON-RPC `-32601`. Batches get `-32600` (batching was removed in protocol 2025-06-18).
  Notifications (no `id`) get `202` with an empty body.
- **Tools** — the same eight as the stdio `productarena-mcp` npm package (`mcp/` in the repo;
  keep the two in sync): `list_arenas`, `get_rankings`, `get_product`, `get_verdict`,
  `search_products`, `compare`, `get_stacks`, `top_products`. Tool-level failures (unknown
  ids, bad params, upstream hiccups) come back as tool results with `isError: true` so the
  calling agent can self-correct.
- **Data source** — the Vercel origin's public `/productarena/data/*.json` files, cached
  in-isolate for 5 minutes (plus Cloudflare edge cache via `cf.cacheTtl`).
- **Rate limit** — 60 requests / 5 min per IP, best-effort per-isolate (same pattern as
  `/api/scan`, separate buckets). 429 with `Retry-After: 300`.
- **No auth** — this is the same public site data anyone can GET from `/data/*`. If access is
  ever tiered ("API keys" for higher limits / bulk endpoints), gate it in `handleMcp` before
  the rate limiter — there's a comment marking the spot.
- **Dependency-free** — the JSON-RPC layer is hand-rolled; `worker.js` imports nothing.
- **CORS** — permissive (`*`) for `/mcp` only, deliberately: read-only public data, no
  cookies, no user state. `/api/scan` keeps its allowlist.

The JSON-RPC/tool layer is unit-tested without a Workers runtime:
`__tests__/mcp.test.ts` (runs under the repo root's `pnpm test`) injects a fake `fetchJson`
into the exported `handleJsonRpc`.

## Deploy

Deploys are manual and operator-side (nothing in CI has Cloudflare credentials):

```bash
cd infra/cloudflare-proxy
wrangler deploy
```

`wrangler.toml` pins the route (`ultrametric.ai/productarena*`).

## Post-deploy smoke test

```bash
./smoke-mcp.sh                       # against https://ultrametric.ai/productarena/mcp
./smoke-mcp.sh http://localhost:8787/productarena/mcp   # against `wrangler dev`
```

The script runs `initialize`, `tools/list`, and one `tools/call` and fails loudly on any
non-JSON or error response.
