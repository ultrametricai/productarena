import { CURL_MCP_INIT, type LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      probeId: 'cli-version',
      productId: 'stripe',
      storyIds: ['agentic-official-cli'],
      bin: 'stripe',
      argv: ['stripe', '--version'],
      displayCommand: 'stripe --version',
      expect: /stripe version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-resources-discovery',
      productId: 'stripe',
      storyIds: ['agentic-official-cli', 'agentic-headless'],
      bin: 'stripe',
      argv: ['stripe', 'resources'],
      displayCommand: 'stripe resources',
      expect: /payment_intents/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-webhook-listen-help',
      productId: 'stripe',
      storyIds: ['agentic-webhooks', 'webhook-delivery-reliability'],
      bin: 'stripe',
      argv: ['stripe', 'listen', '--help'],
      displayCommand: 'stripe listen --help',
      expect: /webhook/i,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'stripe',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.stripe.com',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.stripe.com -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /docs\.stripe\.com\/mcp/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-discovery',
      productId: 'paypal',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: ['curl', '-s', '--max-time', '20', 'https://mcp.paypal.com/.well-known/oauth-protected-resource/mcp'],
      displayCommand: 'curl -s https://mcp.paypal.com/.well-known/oauth-protected-resource/mcp',
      expect: /"authorization_servers"/,
      timeoutMs: 30_000,
    },
    {
      // Keyless JSON-RPC initialize to PayPal's hosted MCP answers the RFC 9728 OAuth
      // challenge (401 + www-authenticate resource_metadata) — the server is live and
      // speaks the MCP authorization spec.
      probeId: 'mcp-remote-handshake',
      productId: 'paypal',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.paypal.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.paypal.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /resource_metadata/,
      timeoutMs: 30_000,
    },
    {
      // developer.paypal.com publishes a sectioned llms.txt index (each section links its own
      // per-area page index) — keyless, agent-oriented docs discovery.
      probeId: 'llms-docs-index',
      productId: 'paypal',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://developer.paypal.com/llms.txt | head -8'],
      displayCommand: 'curl -s https://developer.paypal.com/llms.txt | head -8',
      expect: /# PayPal Developer Documentation/,
      timeoutMs: 30_000,
    },
    {
      // docs.adyen.com publishes llms.txt per the llmstxt.org convention, links llms-full.txt,
      // and documents that every page renders as markdown at URL + `.md`.
      probeId: 'llms-docs-index',
      productId: 'adyen',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.adyen.com/llms.txt | head -6'],
      displayCommand: 'curl -s https://docs.adyen.com/llms.txt | head -6',
      expect: /# Adyen Docs/,
      timeoutMs: 30_000,
    },
    {
      // The documented `.md` suffix convention, checked against the MCP-server docs page.
      probeId: 'docs-md-endpoint',
      productId: 'adyen',
      storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.adyen.com/development-resources/mcp-server.md | head -14'],
      displayCommand: 'curl -s https://docs.adyen.com/development-resources/mcp-server.md | head -14',
      expect: /Model Context Protocol/,
      timeoutMs: 30_000,
    },
    {
      // Keyless JSON-RPC initialize to Square's hosted MCP (mcp.squareup.com) answers the
      // RFC 9728 OAuth challenge — live remote server, OAuth-gated with granular scopes.
      probeId: 'mcp-remote-handshake',
      productId: 'square',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.squareup.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.squareup.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /resource_metadata/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-discovery',
      productId: 'square',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: ['curl', '-s', '--max-time', '20', 'https://mcp.squareup.com/.well-known/oauth-protected-resource/mcp'],
      displayCommand: 'curl -s https://mcp.squareup.com/.well-known/oauth-protected-resource/mcp',
      expect: /"authorization_servers"/,
      timeoutMs: 30_000,
    },
    {
      // developer.squareup.com's llms.txt declares the docs "Designed to be consumable by
      // both human developers and AI agents" and ships explicit per-agent guidance.
      probeId: 'llms-docs-index',
      productId: 'square',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://developer.squareup.com/llms.txt | head -8'],
      displayCommand: 'curl -s https://developer.squareup.com/llms.txt | head -8',
      expect: /Square Developer Platform/,
      timeoutMs: 30_000,
    },
    {
      // Autumn's docs publish a full llms.txt index.
      probeId: 'llms-docs-index',
      productId: 'autumn',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.useautumn.com/llms.txt | head -6'],
      displayCommand: 'curl -s https://docs.useautumn.com/llms.txt | head -6',
      expect: /# Autumn/,
      timeoutMs: 30_000,
    },
    {
      // Docs serve clean markdown at page URL + .md — the MCP page documents the hosted server.
      probeId: 'docs-md-endpoint',
      productId: 'autumn',
      storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.useautumn.com/documentation/mcp.md | head -8'],
      displayCommand: 'curl -s https://docs.useautumn.com/documentation/mcp.md | head -8',
      expect: /Documentation Index/,
      timeoutMs: 30_000,
    },
    {
      // Autumn's hosted MCP answers a keyless initialize with an OAuth challenge whose
      // www-authenticate header enumerates the full scope surface (customers, plans, billing,
      // analytics…) — the agent capability map in one header.
      probeId: 'mcp-remote-handshake',
      productId: 'autumn',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.useautumn.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.useautumn.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
]
