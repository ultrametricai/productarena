import { CURL_MCP_INIT, type LocalProbe } from './types'

  // Workflow automation: n8n's CLI comes from a scratch npm-prefix install prepended to PATH by
  // the operator (same convention as bun above); zapier-platform-cli v19 renamed its binary to
  // `zapier-platform`. The temporal roundtrip is the arena's signature local proof: boot the
  // dev server headless on a throwaway port + db file, ask the cluster for its health over gRPC,
  // list workflows, tear down — the exact local-dev loop an agent runs, fully self-cleaned.
  // Remote MCP endpoints (Zapier, Make, Pipedream) are probed keylessly: an auth-gated MCP
  // server answers a bare initialize POST with its own auth challenge, proving the endpoint
  // exists and speaks the protocol.
export const probes: LocalProbe[] = [
    {
      probeId: 'cli-version',
      productId: 'n8n',
      storyIds: ['agentic-official-cli'],
      bin: 'n8n',
      argv: ['n8n', '--version'],
      displayCommand: 'n8n --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'export-workflow-help',
      productId: 'n8n',
      storyIds: ['agentic-headless', 'environments-source-control'],
      bin: 'n8n',
      argv: ['sh', '-c', 'n8n export:workflow --help | cat'],
      displayCommand: 'n8n export:workflow --help',
      expect: /Export all workflows/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'cli-version',
      productId: 'zapier',
      storyIds: ['agentic-official-cli', 'custom-connector-sdk'],
      bin: 'zapier-platform',
      argv: ['zapier-platform', '--version'],
      displayCommand: 'zapier-platform --version',
      expect: /CLI version: \d+\.\d+\.\d+/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'zapier',
      storyIds: ['agentic-mcp-server', 'workflows-as-mcp-tools'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.zapier.com/api/mcp/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.zapier.com/api/mcp/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /Expected Bearer token for MCP authentication/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-discovery',
      productId: 'make',
      storyIds: ['agentic-mcp-server', 'workflows-as-mcp-tools'],
      bin: 'curl',
      argv: ['curl', '-s', '--max-time', '20', 'https://mcp.make.com/.well-known/oauth-protected-resource'],
      displayCommand: 'curl -s https://mcp.make.com/.well-known/oauth-protected-resource',
      expect: /"authorization_servers"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'temporal',
      storyIds: ['agentic-official-cli'],
      bin: 'temporal',
      argv: ['temporal', '--version'],
      displayCommand: 'temporal --version',
      expect: /temporal version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Full local-dev roundtrip: headless dev server on a throwaway port + db file, gRPC
      // health check, workflow list, teardown. Self-cleaned.
      probeId: 'dev-server-roundtrip',
      productId: 'temporal',
      storyIds: ['local-dev-instance', 'agentic-headless'],
      bin: 'temporal',
      argv: [
        'sh', '-c',
        'pkill -f "temporal server start-dev" 2>/dev/null; sleep 1; rm -f /tmp/pa-temporal-probe.db; (temporal server start-dev --headless --port 17233 --db-filename /tmp/pa-temporal-probe.db >/dev/null 2>&1 &); n=0; while [ $n -lt 30 ] && ! temporal operator cluster health --address localhost:17233 >/dev/null 2>&1; do sleep 1; n=$((n+1)); done; temporal operator cluster health --address localhost:17233; temporal workflow list --address localhost:17233; pkill -f "temporal server start-dev"; rm -f /tmp/pa-temporal-probe.db',
      ],
      displayCommand: 'temporal server start-dev --headless --port 17233 & temporal operator cluster health --address localhost:17233 && temporal workflow list --address localhost:17233',
      expect: /SERVING/,
      timeoutMs: 90_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'pipedream',
      storyIds: ['agentic-mcp-server', 'workflows-as-mcp-tools'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.pipedream.net',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.pipedream.net -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /external user id is required/,
      timeoutMs: 30_000,
    },
]
