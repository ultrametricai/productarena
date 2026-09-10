import { CURL_MCP_INIT, type LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      probeId: 'cli-version',
      productId: 'e2b',
      storyIds: ['agentic-official-cli'],
      bin: 'e2b',
      argv: ['e2b', '--version'],
      displayCommand: 'e2b --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-help',
      productId: 'e2b',
      storyIds: ['agentic-official-cli'],
      bin: 'e2b',
      argv: ['e2b', '--help'],
      displayCommand: 'e2b --help',
      expect: /sandbox templates/i,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'modal',
      storyIds: ['agentic-official-cli'],
      bin: 'modal',
      argv: ['modal', '--version'],
      displayCommand: 'modal --version',
      expect: /modal client version: \d/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-help',
      productId: 'modal',
      storyIds: ['agentic-official-cli', 'agentic-headless'],
      bin: 'modal',
      argv: ['modal', '--help'],
      displayCommand: 'modal --help',
      expect: /run code in the cloud/i,
      timeoutMs: 30_000,
    },
    {
      // Blaxel's site-root llms.txt is a real index (docs domain has its own too).
      probeId: 'llms-site-index',
      productId: 'blaxel',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://blaxel.ai/llms.txt | head -6'],
      displayCommand: 'curl -s https://blaxel.ai/llms.txt | head -6',
      expect: /# Blaxel/,
      timeoutMs: 30_000,
    },
    {
      // Docs serve clean markdown at page URL + .md.
      probeId: 'docs-md-endpoint',
      productId: 'blaxel',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -s --max-time 20 https://docs.blaxel.ai/Get-started.md | head -6'],
      displayCommand: 'curl -s https://docs.blaxel.ai/Get-started.md | head -6',
      expect: /Documentation Index/,
      timeoutMs: 30_000,
    },
    {
      // Blaxel's resource-management MCP answers a keyless initialize with its OAuth challenge
      // (realm "Blaxel MCP") and a blaxel-version header — live, versioned, protocol-speaking.
      probeId: 'mcp-remote-handshake',
      productId: 'blaxel',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.blaxel.ai/v0/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.blaxel.ai/v0/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /Blaxel MCP|oauth-protected-resource/,
      timeoutMs: 30_000,
    },
]
