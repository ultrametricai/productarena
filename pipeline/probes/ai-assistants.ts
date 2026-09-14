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
]
