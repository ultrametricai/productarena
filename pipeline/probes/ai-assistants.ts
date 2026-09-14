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
