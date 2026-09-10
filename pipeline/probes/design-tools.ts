import { CURL_MCP_INIT, type LocalProbe } from './types'

export const probes: LocalProbe[] = [
    {
      // Official Code Connect CLI (npm @figma/code-connect, bin "figma") runs keylessly.
      probeId: 'cli-version',
      productId: 'figma',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@figma/code-connect', '--version'],
      displayCommand: 'npx -y @figma/code-connect --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Figma's hosted remote MCP server (documented at developers.figma.com/docs/figma-mcp-server/
      // remote-server-installation/) answers a keyless initialize with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'figma',
      storyIds: ['agentic-mcp-server', 'agent-reads-design-context'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.figma.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.figma.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Boots the OFFICIAL Penpot docker compose (frontend+backend+exporter+postgres+valkey and
      // the first-party penpotapp/mcp service that ships enabled in the vendor's own compose
      // file), polls the real frontend, then completes a FULL keyless MCP initialize handshake
      // against the self-hosted penpot-mcp service — serverInfo {"name":"penpot"} — and tears
      // everything down.
      probeId: 'self-host-mcp-roundtrip',
      productId: 'penpot',
      storyIds: ['self-host-design-platform', 'openness-self-host', 'agentic-mcp-server', 'agent-reads-design-context'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-penpot-probe; mkdir -p /tmp/pa-penpot-probe; curl -s -o /tmp/pa-penpot-probe/docker-compose.yaml https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml; docker compose -p pa-penpot -f /tmp/pa-penpot-probe/docker-compose.yaml up -d >/dev/null 2>&1; n=0; until curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:9001/ | grep -q 200; do n=$((n+1)); [ $n -ge 120 ] && break; sleep 2; done; curl -s --max-time 5 http://127.0.0.1:9001/ | grep -oiE "<title>[^<]*</title>" | head -1; docker exec pa-penpot-penpot-frontend-1 curl -s --max-time 10 -X POST http://penpot-mcp:4401/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"productarena-probe","version":"1.0"}}}\' | head -2; echo; docker compose -p pa-penpot -f /tmp/pa-penpot-probe/docker-compose.yaml down -v >/dev/null 2>&1; rm -rf /tmp/pa-penpot-probe',
      ],
      displayCommand: `docker compose up -d (official penpot docker-compose.yaml) # poll frontend :9001, then keyless MCP initialize against the bundled penpot-mcp service`,
      expect: /"serverInfo":\{"name":"penpot"/,
      timeoutMs: 420_000,
    },
    {
      // Official Canva Apps CLI (npm @canva/cli, bin "canva") runs keylessly.
      probeId: 'cli-version',
      productId: 'canva',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@canva/cli', '--version'],
      displayCommand: 'npx -y @canva/cli --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Canva's hosted MCP server (documented at canva.dev/docs/mcp) answers a keyless
      // initialize with its OAuth challenge + resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'canva',
      storyIds: ['agentic-mcp-server', 'agent-creates-design'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.canva.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.canva.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Framer publishes an agent-oriented llms.txt on its main origin.
      probeId: 'llms-txt-fetch',
      productId: 'framer',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -sL --max-time 20 https://www.framer.com/llms.txt | head -3'],
      displayCommand: 'curl -sL https://www.framer.com/llms.txt | head -3',
      expect: /# Framer/,
      timeoutMs: 30_000,
    },
    {
      // Sketch publishes an llms.txt docs index on its main origin.
      probeId: 'llms-txt-fetch',
      productId: 'sketch',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: ['sh', '-c', 'curl -sL --max-time 20 https://www.sketch.com/llms.txt | head -3'],
      displayCommand: 'curl -sL https://www.sketch.com/llms.txt | head -3',
      expect: /# Sketch/,
      timeoutMs: 30_000,
    },
]
