# Try it — hands-on product pages

The product page's primary CTA is **Try it →**, not a bounce to the vendor: a visitor should
SEE what an agent can do with the product before ever signing up. Honest v1 ships three layers,
each labeled for exactly what it is.

## The three layers

| Layer | What it is | Status |
|---|---|---|
| 1. Recorded sessions | Replays of real probe-harness transcripts (`data/*/proofs/`), character-paced in a microterminal | **Live** |
| 2. Live MCP handshake | One real JSON-RPC `initialize` (+ keyless `tools/list`) against the vendor's own documented remote MCP endpoint, run from our Cloudflare edge | **Live** (allowlisted products) |
| 3. Full sandbox | An ephemeral VM where the visitor drives the vendor CLI themselves | **Designed, gated** — this document |

Implementation map:

- `components/TryIt/Microterminal.tsx` — the terminal UI (client), replay + live probe.
- `components/TryIt/TryItSection.tsx` — server assembly, process cross-links.
- `lib/tryit.ts` / `lib/tryitReplay.ts` — eligibility, story building, pure replay logic.
- `lib/mcpEndpoints.ts` — GENERATED static allowlist (`scripts/generate-mcp-allowlist.mjs`).
- `infra/cloudflare-proxy/worker.js` — `POST /productarena/api/mcp-probe` (`MCP_ENDPOINTS`
  hardcoded copy of the same allowlist; clients send `{arena, product}`, never URLs).

A product gets the section when it has ≥1 replayable terminal proof OR an allowlisted MCP
endpoint. Products with neither keep their old primary CTA — **no fake try**.

## Layer 3 design: "Run it yourself (sandboxed)"

Visible today as a disabled tab ("coming online when sandbox capacity ships"). The design below
is ready to build the day sandbox keys/capacity exist.

### Session model

- **Per-session ephemeral VM.** One E2B sandbox (or Daytona workspace — both are already
  ranked in our `agent-sandboxes` arena; we should dogfood the leader) per visitor session.
  Created on demand, destroyed on disconnect. Nothing persists between sessions; no shared
  state, no snapshots containing user input.
- **Prefixed user stories only.** The visitor picks from the same story menu as layers 1–2;
  each story maps to a curated starting script (install command, sample repo, seeded test
  data). Free-form typing is allowed *inside* the session, but the session starts from a
  reviewed recipe — the stories are the product tour, the shell is real.
- **Browser ↔ sandbox transport:** WebSocket relay through the same Cloudflare worker
  (Durable Object per session) so the sandbox provider's API key never reaches the browser.

### Security invariants (non-negotiable)

- **No secrets in the VM.** Sessions run keyless, exactly like the probe harness: vendor CLIs
  in test/sandbox modes only (e.g. `stripe` CLI against a Stripe *sandbox* account provisioned
  per-session, never a live key). If a story can't run keyless or with a disposable sandbox
  credential minted server-side and scoped to the session, it isn't offered.
- **Allowlisted egress to the one vendor.** VM network policy permits DNS + HTTPS to the
  product's own documented domains (same registrable-domain guard as
  `scripts/generate-mcp-allowlist.mjs`) plus the package registry needed for install; default
  deny everything else. No metadata endpoints, no private ranges — the provider's firewall
  plus our own egress proxy.
- **Hard timeouts.** 90 s idle, 10 min wall-clock, hard `kill` at the cap. CPU/memory/disk
  quotas at the provider's smallest tier. One concurrent session per IP, N total site-wide
  (capacity gate below).
- **Transcript hygiene.** Anything we later publish from a session goes through the same
  `sanitizeForPublication` gate as recorded proofs (`lib/proofs.ts`) — sanitize, redact,
  hard-fail on residual secret patterns.

### Cost model & capacity gate

- Smallest E2B instance ≈ $0.000014/vCPU-s → a fully-used 10-minute 2-vCPU session ≈ $0.02;
  budget cap ~$50/month ⇒ ~2,500 full sessions (idle-killed sessions cost far less).
- Site-wide concurrency cap (start: 5) enforced in the worker; over-cap visitors see layers
  1–2 plus a "sandbox busy — try the recorded session" notice.
- Feature flag: the tab enables when `SANDBOX_PROVIDER_KEY` is configured in the worker and
  the monthly budget counter (KV) is under cap. Ships dark otherwise — exactly today's state.

### Why not sooner

Layers 1–2 already prove the two things visitors doubt: *the recordings are real* (verbatim,
redacted, replayable) and *the vendor's agent surface is live* (the 401-with-OAuth is itself
evidence). Layer 3 adds "and you can drive it" — worth shipping only with the egress and
budget guards above actually in place, not before.
