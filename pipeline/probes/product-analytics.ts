// Local, keyless probes for the product-analytics arena (see ./types.ts for the contract).
// Created in the 2026-09 hot-repos fairness wave; filled by the posthog evidence pass.
// Every command verified live on 2026-09-15 before adoption.
import { CURL_MCP_INIT, type LocalProbe } from './types'

export const probes: LocalProbe[] = [
  {
    // Official PostHog CLI (@posthog/cli): version prints keylessly.
    probeId: 'cli-version',
    productId: 'posthog',
    storyIds: ['agentic-official-cli'],
    bin: 'npx',
    argv: ['npx', '-y', '@posthog/cli@latest', '--version'],
    displayCommand: 'npx -y @posthog/cli@latest --version',
    expect: /posthog-cli \d+\.\d+\.\d+/,
    timeoutMs: 120_000,
  },
  {
    // Hosted PostHog MCP server answers keylessly with its OAuth challenge (RFC 9728 metadata).
    probeId: 'mcp-remote-handshake',
    productId: 'posthog',
    storyIds: ['agentic-mcp-server'],
    bin: 'curl',
    argv: [
      'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.posthog.com/mcp',
      '-H', 'Content-Type: application/json',
      '-H', 'Accept: application/json, text/event-stream',
      '-d', CURL_MCP_INIT,
    ],
    displayCommand: `curl -si -X POST https://mcp.posthog.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
    expect: /oauth-protected-resource/,
    timeoutMs: 30_000,
  },
  {
    // Agent-legible docs index: posthog.com/llms.txt serves the per-page markdown-docs index keylessly.
    probeId: 'llms-txt-index',
    productId: 'posthog',
    storyIds: ['agentic-agent-docs'],
    bin: 'curl',
    argv: ['curl', '-s', '--max-time', '20', 'https://posthog.com/llms.txt'],
    displayCommand: 'curl -s https://posthog.com/llms.txt',
    expect: /PostHog is the platform for self-driving products/,
    timeoutMs: 30_000,
  },
]
