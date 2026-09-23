import type { LocalProbe } from './types'

// First probes for the ai-assistants arena, added with the Grok bring-up (2026-09-14 LLM-lab
// families wave). The incumbent assistants (ChatGPT, Claude, Gemini, Perplexity, Copilot) are
// login-gated consumer apps with no keyless local surface worth recording; Grok's vendor ships
// a keyless-probeable developer edge (docs.x.ai llms.txt + api.x.ai's clean 401 challenge)
// that backs its agent-access stories, so we record it the same way we do for every other
// vendor that publishes one.
export const probes: LocalProbe[] = [
  {
    // The xAI API answers a keyless request with a clean structured 401 — a live, documented
    // public API endpoint behind the Grok products (grok.com's own billing/docs route API
    // traffic through the same account system).
    probeId: 'api-keyless-401',
    productId: 'grok',
    storyIds: ['agentic-public-api'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -si --max-time 20 https://api.x.ai/v1/models | head -3; curl -s --max-time 20 https://api.x.ai/v1/models'],
    displayCommand: 'curl -si https://api.x.ai/v1/models | head -3; curl -s https://api.x.ai/v1/models',
    expect: /HTTP\/2 401[\s\S]*unauthenticated:no-credentials/,
    timeoutMs: 60_000,
  },
  {
    // docs.x.ai publishes a full llms.txt index covering the Grok app docs (grok/*.md), with
    // every page fetchable as markdown — agent-oriented docs, verified keylessly.
    probeId: 'llms-docs-index',
    productId: 'grok',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', "curl -s --max-time 20 https://docs.x.ai/llms.txt | grep -i -m 4 -E 'documentation|grok/overview|grok/user-guide'"],
    displayCommand: "curl -s https://docs.x.ai/llms.txt | grep -iE 'documentation|grok/overview|grok/user-guide'",
    expect: /docs\.x\.ai\/grok\/(overview|user-guide)\.md/,
    timeoutMs: 60_000,
  },
  {
    // The vendor also serves a public MCP server card for its docs server — the
    // .well-known/mcp discovery surface an agent uses to find it, fetched keylessly.
    probeId: 'docs-mcp-server-card',
    productId: 'grok',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.x.ai/.well-known/mcp/server-card.json | head -12'],
    displayCommand: 'curl -s https://docs.x.ai/.well-known/mcp/server-card.json | head -12',
    expect: /xai-docs-mcp/,
    timeoutMs: 60_000,
  },
  // Personal-assistant bring-ups (2026-09-14): Poke (The Interaction Company) and Martin are
  // the two independent personal assistants with a real keyless developer edge — Poke ships a
  // public inbound API + custom-MCP ingestion, Martin publishes an llms.txt-indexed docs set
  // with every page fetchable as markdown.
  {
    // Poke's documented public API endpoint (poke.com/docs/api) answers a keyless POST with a
    // clean structured 401 — live proof the inbound-message API exists and enforces Bearer keys.
    probeId: 'api-keyless-401',
    productId: 'poke',
    storyIds: ['agentic-public-api'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -si --max-time 20 -X POST https://poke.com/api/v1/inbound/api-message -H \'Content-Type: application/json\' -d \'{"message":"ping"}\' | head -3; curl -s --max-time 20 -X POST https://poke.com/api/v1/inbound/api-message -H \'Content-Type: application/json\' -d \'{"message":"ping"}\''],
    displayCommand: 'curl -si -X POST https://poke.com/api/v1/inbound/api-message -H \'Content-Type: application/json\' -d \'{"message":"ping"}\'',
    expect: /HTTP\/2 401[\s\S]*"error":"Unauthorized"/,
    timeoutMs: 60_000,
  },
  {
    // Poke's API and custom-MCP docs are server-rendered and fetchable keylessly — the pages
    // that document the inbound endpoint and MCP-server ingestion an agent would integrate with.
    probeId: 'docs-api-mcp-pages',
    productId: 'poke',
    storyIds: ['agentic-public-api', 'agentic-mcp-client'],
    bin: 'curl',
    argv: ['sh', '-c', "curl -s --max-time 20 https://poke.com/docs/api | grep -o -m 2 'api/v1/inbound/api-message' | head -2; curl -s --max-time 20 https://poke.com/docs/mcp-servers | grep -io -m 2 'mcp server' | head -2"],
    displayCommand: "curl -s https://poke.com/docs/api | grep -o 'api/v1/inbound/api-message'; curl -s https://poke.com/docs/mcp-servers | grep -io 'mcp server'",
    expect: /api\/v1\/inbound\/api-message[\s\S]*[Mm][Cc][Pp] [Ss]erver/,
    timeoutMs: 60_000,
  },
  // Launch-audit wave 4 (2026-09-22): muse and gemini were claimed-docs-only — zero probe-tier
  // evidence. Neither ships a keyless developer surface; the honest probes are absence proofs
  // (the yubikey docs-llms-txt-absent pattern): recorded reality, negative results included.
  {
    // Muse (Meta's personal agent) auth-walls its entire non-marketing surface: /llms.txt and
    // /openapi.json both answer keyless fetches with HTTP 401 — no published agent docs, no
    // public API spec. The 401 (not 404) shows the origin is live and deliberately gated.
    probeId: 'llms-openapi-authwalled',
    productId: 'muse',
    storyIds: ['agentic-agent-docs', 'agentic-public-api'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 -o /dev/null -w "llms.txt HTTP %{http_code}\\n" https://muse.ai/llms.txt; curl -s --max-time 20 -o /dev/null -w "openapi.json HTTP %{http_code}\\n" https://muse.ai/openapi.json'],
    displayCommand: 'curl -s -o /dev/null -w "llms.txt HTTP %{http_code}" https://muse.ai/llms.txt; curl -s -o /dev/null -w "openapi.json HTTP %{http_code}" https://muse.ai/openapi.json',
    expect: /llms\.txt HTTP 401[\s\S]*openapi\.json HTTP 401/,
    timeoutMs: 60_000,
  },
  {
    // Muse publishes no MCP discovery surface: the .well-known server card 404s, and the
    // api.muse.ai origin (which answers in JSON, so it exists) exposes no keyless routes.
    probeId: 'mcp-discovery-absent',
    productId: 'muse',
    storyIds: ['agentic-mcp-server'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 -o /dev/null -w "server-card HTTP %{http_code}\\n" https://muse.ai/.well-known/mcp/server-card.json; curl -si --max-time 20 https://api.muse.ai/v1/ping | grep -i -m 2 -E "^HTTP|content-type"'],
    displayCommand: 'curl -s -o /dev/null -w "server-card HTTP %{http_code}" https://muse.ai/.well-known/mcp/server-card.json; curl -si https://api.muse.ai/v1/ping | grep -iE "^HTTP|content-type"',
    expect: /server-card HTTP 404[\s\S]*HTTP\/2 404[\s\S]*application\/json/i,
    timeoutMs: 60_000,
  },
  {
    // The Gemini consumer app publishes neither an llms.txt nor an MCP server card on its own
    // origin — clean 404s, recorded as the absence proof for the assistant's agent surface
    // (the developer API lives in the separate frontier-models/gemini product, not this app).
    probeId: 'llms-mcp-absent',
    productId: 'gemini',
    storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 -o /dev/null -w "llms.txt HTTP %{http_code}\\n" https://gemini.google.com/llms.txt; curl -s --max-time 20 -o /dev/null -w "server-card HTTP %{http_code}\\n" https://gemini.google.com/.well-known/mcp/server-card.json'],
    displayCommand: 'curl -s -o /dev/null -w "llms.txt HTTP %{http_code}" https://gemini.google.com/llms.txt; curl -s -o /dev/null -w "server-card HTTP %{http_code}" https://gemini.google.com/.well-known/mcp/server-card.json',
    expect: /llms\.txt HTTP 404[\s\S]*server-card HTTP 404/,
    timeoutMs: 60_000,
  },
  {
    // docs.trymartin.com publishes an llms.txt index covering all 16 doc pages — the
    // agent-discovery surface for Martin's docs, fetched keylessly.
    probeId: 'llms-docs-index',
    productId: 'martin',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', "curl -s --max-time 20 https://docs.trymartin.com/llms.txt | grep -m 4 -E 'introduction|calendar|email-triage'"],
    displayCommand: "curl -s https://docs.trymartin.com/llms.txt | grep -E 'introduction|calendar|email-triage'",
    expect: /docs\.trymartin\.com\/(introduction|integrations\/calendar|background-tasks\/email-triage)\.md/,
    timeoutMs: 60_000,
  },
  {
    // Every Martin doc page is fetchable as raw markdown at <page>.md — verified keylessly on
    // the introduction page, which itself points agents at the llms.txt index.
    probeId: 'docs-md-endpoint',
    productId: 'martin',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.trymartin.com/introduction.md | head -8'],
    displayCommand: 'curl -s https://docs.trymartin.com/introduction.md | head -8',
    expect: /# Introduction[\s\S]*personal assistant|Documentation Index[\s\S]*# Introduction/,
    timeoutMs: 60_000,
  },
]
