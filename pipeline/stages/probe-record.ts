import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ProofIndexEntry } from '../../lib/proofs'
import { upsertProofIndex, writeProofArtifact } from '../proof-io'
import { resolveCategories } from '../paths'

// Local, keyless probe commands with replayable recordings ("proofs"). Where probe.ts checks
// what a vendor *publishes* (llms.txt, OpenAPI, docs), this stage checks what a vendor *ships*:
// it runs the product's own CLI on this machine — version prints, headless-mode help, real MCP
// stdio initialize handshakes — and, when PA_RECORD=1, captures the session through the BSD
// `script` pty recorder so the resulting transcript is a faithful terminal capture, published
// at data/<category>/proofs/ (layout + sanitization contract: lib/proofs.ts).
//
// Deliberately opt-in and side-effect-light:
//   - without PA_RECORD=1 it only runs the probes and prints pass/fail (a dry run);
//   - it never touches data/<category>/evidence/*.json — proof metadata lives in sidecar JSON
//     until the schema integration phase (docs/PROVE-IT.md, phase 2), because lib/schemas.ts
//     is owned by another lane;
//   - probes only run for binaries already installed on PATH, and every child process gets a
//     minimal env (PATH/HOME/TERM only) so no local API keys can even reach the pty.

export interface LocalProbe {
  probeId: string
  productId: string
  storyIds: string[]
  bin: string
  argv: string[]
  /** Rendered as the `$ ...` prompt line and stored as the sidecar `command`. */
  displayCommand: string
  /** JSON-RPC payload piped to stdin for MCP stdio handshakes. */
  stdinPayload?: string
  /** Transcript must match for the probe to pass. */
  expect: RegExp
  /**
   * Servers (e.g. `claude mcp serve`) never exit on their own: the runner terminates them
   * after the handshake window and the sidecar exitCode reports the ASSERTION result
   * (0 = expected handshake observed, 1 = not) instead of a process exit code.
   */
  longRunning?: boolean
  timeoutMs: number
}

const MCP_INITIALIZE = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'productarena-probe', version: '1.0' },
  },
}) + '\n'

// Remote MCP endpoints are probed with a bare curl initialize POST: a live, auth-gated MCP
// server answers with its OAuth challenge (401 + protected-resource metadata), which is
// exactly the keyless, read-only proof that the endpoint exists and speaks the protocol.
const CURL_MCP_INIT = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'productarena-probe', version: '1.0' },
  },
})

// Every command here is cheap, keyless, and read-only: --version/--help prints and stdio MCP
// initialize handshakes. Nothing installs, mutates state, or needs credentials.
const LOCAL_PROBES: Record<string, LocalProbe[]> = {
  payments: [
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
  ],
  accounting: [
    {
      probeId: 'mcp-remote-handshake',
      productId: 'xero',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.xero.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.xero.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/[12](?:\.1)? 401/,
      timeoutMs: 30_000,
    },
  ],
  // The Claude Agent SDK drives the Claude Code CLI as its engine (code.claude.com/docs/en/
  // agent-sdk/overview) — a keyless version print of that engine is the SDK's own runtime proof.
  'agent-frameworks': [
    {
      probeId: 'cli-version',
      productId: 'claude-agent-sdk',
      storyIds: ['agentic-official-cli'],
      bin: 'claude',
      argv: ['claude', '--version'],
      displayCommand: 'claude --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
  ],
  'agent-sandboxes': [
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
  ],
  'ai-coding': [
    {
      probeId: 'cli-version',
      productId: 'claude-code',
      storyIds: ['agentic-official-cli'],
      bin: 'claude',
      argv: ['claude', '--version'],
      displayCommand: 'claude --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-serve-handshake',
      productId: 'claude-code',
      storyIds: ['agentic-mcp-server'],
      bin: 'claude',
      argv: ['claude', 'mcp', 'serve'],
      displayCommand: `echo '<jsonrpc initialize>' | claude mcp serve`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'codex',
      storyIds: ['agentic-official-cli'],
      bin: 'codex',
      argv: ['codex', '--version'],
      displayCommand: 'codex --version',
      expect: /codex-cli \d/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-server-handshake',
      productId: 'codex',
      storyIds: ['agentic-mcp-server'],
      bin: 'codex',
      argv: ['codex', 'mcp-server'],
      displayCommand: `echo '<jsonrpc initialize>' | codex mcp-server`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 30_000,
    },
    {
      probeId: 'exec-headless-help',
      productId: 'codex',
      storyIds: ['agentic-headless'],
      bin: 'codex',
      argv: ['codex', 'exec', '--help'],
      displayCommand: 'codex exec --help',
      expect: /non-interactively/i,
      timeoutMs: 30_000,
    },
  ],
  'security-scanners': [
    {
      probeId: 'cli-version',
      productId: 'trufflehog',
      storyIds: ['agentic-official-cli'],
      bin: 'trufflehog',
      argv: ['trufflehog', '--version'],
      displayCommand: 'trufflehog --version',
      expect: /trufflehog \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'semgrep',
      storyIds: ['agentic-official-cli'],
      bin: 'semgrep',
      argv: ['semgrep', '--version'],
      displayCommand: 'semgrep --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'cli-version',
      productId: 'gitleaks',
      storyIds: ['agentic-official-cli'],
      bin: 'gitleaks',
      argv: ['gitleaks', 'version'],
      displayCommand: 'gitleaks version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'snyk',
      storyIds: ['agentic-official-cli'],
      bin: 'snyk',
      argv: ['snyk', '--version'],
      displayCommand: 'snyk --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-stdio-handshake',
      productId: 'snyk',
      storyIds: ['agentic-mcp-server'],
      bin: 'snyk',
      argv: ['snyk', 'mcp', '-t', 'stdio'],
      displayCommand: `echo '<jsonrpc initialize>' | snyk mcp -t stdio`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'trivy',
      storyIds: ['agentic-official-cli'],
      bin: 'trivy',
      argv: ['trivy', '--version'],
      displayCommand: 'trivy --version',
      expect: /Version: \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Requires the official MCP plugin (`trivy plugin install mcp`) on the recording
      // machine; without it the probe fails, which is itself a finding (docs/PROVE-IT.md).
      probeId: 'mcp-stdio-handshake',
      productId: 'trivy',
      storyIds: ['agentic-mcp-server'],
      bin: 'trivy',
      argv: ['trivy', 'mcp', '--transport', 'stdio'],
      displayCommand: `echo '<jsonrpc initialize>' | trivy mcp --transport stdio`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 30_000,
    },
  ],
  // Terminal emulators: the arena's signature axis is whether an agent can drive the terminal
  // ITSELF (kitty remote control, wezterm cli/mux). The two "roundtrip" probes go beyond
  // --version/--help prints: they spawn an ephemeral instance on a throwaway socket, send a
  // command, read the screen back, and tear everything down — nothing persistent is mutated
  // (tmp sockets, self-cleaned) and no credentials are involved. Alacritty has no probe here
  // because its Homebrew cask was disabled on 2026-09-01 (fails the macOS Gatekeeper check),
  // which is itself a finding; iTerm2's control surfaces (AppleScript/Python API) need a GUI
  // session + automation permissions, so they're judged from docs instead.
  terminals: [
    {
      probeId: 'cli-version',
      productId: 'ghostty',
      storyIds: ['agentic-official-cli'],
      bin: 'ghostty',
      argv: ['ghostty', '--version'],
      displayCommand: 'ghostty --version',
      expect: /Ghostty \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-list-actions',
      productId: 'ghostty',
      storyIds: ['agentic-official-cli'],
      bin: 'ghostty',
      argv: ['ghostty', '+list-actions'],
      displayCommand: 'ghostty +list-actions',
      expect: /new_split/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'kitty',
      storyIds: ['agentic-official-cli'],
      bin: 'kitty',
      argv: ['kitty', '--version'],
      displayCommand: 'kitty --version',
      // Lenient about ANSI styling: kitty colorizes --version when stdout is a pty.
      expect: /kitty.*\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'remote-control-help',
      productId: 'kitty',
      storyIds: ['cli-remote-control'],
      // Piped through cat so kitten's help never opens a pager inside the pty recorder.
      bin: 'kitten',
      argv: ['sh', '-c', 'kitten @ --help | cat'],
      displayCommand: 'kitten @ --help',
      expect: /Control kitty by sending it commands/,
      timeoutMs: 30_000,
    },
    {
      // Full agent-drives-terminal roundtrip: launch kitty listening on a throwaway unix
      // socket, query live window state as JSON, then close the window (which quits the
      // ephemeral instance via macos_quit_when_last_window_closed).
      probeId: 'remote-control-roundtrip',
      productId: 'kitty',
      storyIds: ['agent-drives-terminal', 'cli-remote-control'],
      bin: 'kitty',
      argv: [
        'sh', '-c',
        'pkill -x kitty 2>/dev/null; sleep 2; rm -f /tmp/pa-kitty-probe; kitty --detach -o allow_remote_control=socket-only --listen-on unix:/tmp/pa-kitty-probe -o macos_quit_when_last_window_closed=yes; n=0; while [ $n -lt 20 ] && ! kitten @ --to unix:/tmp/pa-kitty-probe ls >/dev/null 2>&1; do sleep 1; n=$((n+1)); done; kitten @ --to unix:/tmp/pa-kitty-probe ls; kitten @ --to unix:/tmp/pa-kitty-probe send-text "echo PA_PROBE_OK\\n"; sleep 2; kitten @ --to unix:/tmp/pa-kitty-probe get-text; kitten @ --to unix:/tmp/pa-kitty-probe close-window --match all',
      ],
      displayCommand: 'kitty --detach -o allow_remote_control=socket-only --listen-on unix:/tmp/pa-kitty-probe && kitten @ --to unix:/tmp/pa-kitty-probe ls && kitten @ ... send-text "echo PA_PROBE_OK\\n" && kitten @ ... get-text && kitten @ ... close-window --match all',
      expect: /PA_PROBE_OK/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'cli-version',
      productId: 'wezterm',
      storyIds: ['agentic-official-cli'],
      bin: 'wezterm',
      argv: ['wezterm', '--version'],
      displayCommand: 'wezterm --version',
      expect: /wezterm \d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-help',
      productId: 'wezterm',
      storyIds: ['cli-remote-control'],
      bin: 'wezterm',
      argv: ['wezterm', 'cli', '--help'],
      displayCommand: 'wezterm cli --help',
      expect: /send-text/,
      timeoutMs: 30_000,
    },
    {
      // Fully headless roundtrip against wezterm's own mux server: spawn a pane, send text,
      // read the pane content back, list panes, then kill the ephemeral server.
      probeId: 'mux-roundtrip',
      productId: 'wezterm',
      storyIds: ['agent-drives-terminal', 'cli-remote-control'],
      bin: 'wezterm-mux-server',
      argv: [
        'sh', '-c',
        'pkill -f wezterm-mux-server 2>/dev/null; sleep 1; wezterm-mux-server --daemonize; sleep 3; PANE=$(wezterm cli spawn --new-window -- /bin/zsh -l); wezterm cli send-text --pane-id "$PANE" --no-paste "echo PA_PROBE_OK"; sleep 1; wezterm cli get-text --pane-id "$PANE"; wezterm cli list; pkill -f wezterm-mux-server',
      ],
      displayCommand: 'wezterm-mux-server --daemonize && PANE=$(wezterm cli spawn --new-window -- /bin/zsh -l) && wezterm cli send-text --pane-id $PANE --no-paste "echo PA_PROBE_OK" && wezterm cli get-text --pane-id $PANE && wezterm cli list',
      expect: /PA_PROBE_OK/,
      timeoutMs: 60_000,
    },
  ],
  // Package & toolchain managers: a CLI-native arena, so the probes go beyond version prints —
  // real installs into throwaway mktemp fixtures (self-cleaned; the global stores/caches these
  // populate live under HOME and are the managers' normal operation). nix has a probe entry but
  // is skipped gracefully where the multi-user install isn't present; bun is exercised from a
  // scratch npm-prefix install prepended to PATH by the operator (binAvailable honors PATH).
  'package-managers': [
    {
      probeId: 'cli-version',
      productId: 'homebrew',
      storyIds: ['agentic-official-cli'],
      bin: 'brew',
      argv: ['brew', '--version'],
      displayCommand: 'brew --version',
      expect: /Homebrew \d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'info-json-output',
      productId: 'homebrew',
      storyIds: ['machine-readable-cli-output', 'agentic-headless'],
      bin: 'brew',
      argv: ['sh', '-c', 'brew info --json=v2 ca-certificates | head -c 1200'],
      displayCommand: 'brew info --json=v2 ca-certificates | head -c 1200',
      expect: /"formulae"/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'cli-version',
      productId: 'nix',
      storyIds: ['agentic-official-cli'],
      bin: 'nix',
      argv: ['nix', '--version'],
      displayCommand: 'nix --version',
      expect: /nix \(Nix\) \d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'pnpm',
      storyIds: ['agentic-official-cli'],
      bin: 'pnpm',
      argv: ['pnpm', '--version'],
      displayCommand: 'pnpm --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Real install into a throwaway fixture: manifest in, lockfile out — the headless
      // install + reproducible-lockfile loop an agent runs, end to end, self-cleaned.
      probeId: 'install-lockfile-roundtrip',
      productId: 'pnpm',
      storyIds: ['agent-headless-dependency-install', 'lockfile-reproducible-install'],
      bin: 'pnpm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && printf '{"name":"pa-probe-fixture","version":"1.0.0","dependencies":{"is-odd":"3.0.1"}}' > package.json && pnpm install --reporter=append-only && head -3 pnpm-lock.yaml && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && printf '{"dependencies":{"is-odd":"3.0.1"}}' > package.json && pnpm install --reporter=append-only && head -3 pnpm-lock.yaml`,
      expect: /lockfileVersion/,
      timeoutMs: 120_000,
    },
    {
      probeId: 'cli-version',
      productId: 'uv',
      storyIds: ['agentic-official-cli'],
      bin: 'uv',
      argv: ['uv', '--version'],
      displayCommand: 'uv --version',
      expect: /uv \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Real venv + install roundtrip in a throwaway fixture, finishing with --format=json so
      // the transcript shows the machine-readable surface an agent parses. Self-cleaned.
      probeId: 'venv-pip-install-roundtrip',
      productId: 'uv',
      storyIds: ['agent-headless-dependency-install', 'machine-readable-cli-output'],
      bin: 'uv',
      argv: [
        'sh', '-c',
        'd=$(mktemp -d) && cd "$d" && uv venv && uv pip install requests && uv pip list --format=json && rm -rf "$d"',
      ],
      displayCommand: 'mktemp -d && uv venv && uv pip install requests && uv pip list --format=json',
      expect: /"requests"/,
      timeoutMs: 120_000,
    },
    {
      probeId: 'pip-interface-help',
      productId: 'uv',
      storyIds: ['incumbent-interface-compat', 'agentic-official-cli'],
      bin: 'uv',
      argv: ['sh', '-c', 'uv pip install --help | cat'],
      displayCommand: 'uv pip install --help',
      expect: /Install packages into an environment/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'bun',
      storyIds: ['agentic-official-cli'],
      bin: 'bun',
      argv: ['bun', '--version'],
      displayCommand: 'bun --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Real install into a throwaway fixture; bun.lock is text-based JSONC, so the transcript
      // shows the parseable lockfile an agent can read and diff. Self-cleaned.
      probeId: 'install-lockfile-roundtrip',
      productId: 'bun',
      storyIds: ['agent-headless-dependency-install', 'parseable-lockfile-format'],
      bin: 'bun',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && printf '{"name":"pa-probe-fixture","version":"1.0.0","dependencies":{"is-odd":"3.0.1"}}' > package.json && bun install && head -3 bun.lock && bun pm ls && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && printf '{"dependencies":{"is-odd":"3.0.1"}}' > package.json && bun install && head -3 bun.lock && bun pm ls`,
      expect: /lockfileVersion/,
      timeoutMs: 120_000,
    },
    {
      probeId: 'cli-version',
      productId: 'mise',
      storyIds: ['agentic-official-cli'],
      bin: 'mise',
      argv: ['mise', '--version'],
      displayCommand: 'mise --version',
      expect: /\d{4}\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'registry-and-json-ls',
      productId: 'mise',
      storyIds: ['machine-readable-cli-output', 'registry-breadth'],
      bin: 'mise',
      argv: ['sh', '-c', 'mise ls --json; mise registry | head -12'],
      displayCommand: 'mise ls --json && mise registry | head -12',
      expect: /aqua:|vfox:/,
      timeoutMs: 60_000,
    },
  ],
  // Vector databases: the signature keyless proof is "an agent provisions a collection through
  // the public API without credentials" — run for real against ephemeral local instances
  // (docker containers on throwaway ports, chroma's local server, milvus-lite's embedded file
  // store, qdrant-client's in-process mode), all self-cleaned. MCP handshakes cover the two
  // first-party stdio servers (uvx-published) plus Pinecone's keyless hosted docs MCP endpoint.
  // The python3/uvx probes expect the operator to prepend a scratch venv (chromadb +
  // qdrant-client + pymilvus[milvus_lite]) to PATH; binAvailable skips them gracefully otherwise.
  'vector-databases': [
    {
      probeId: 'mcp-remote-handshake',
      productId: 'pinecone',
      storyIds: ['agentic-mcp-server', 'agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://docs.pinecone.io/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://docs.pinecone.io/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo"/,
      timeoutMs: 30_000,
    },
    {
      // Full keyless provision roundtrip against a real self-hosted server: boot the official
      // docker image on a throwaway port with anonymous access, create a collection via the
      // REST API, read the schema back, tear the container down.
      probeId: 'docker-provision-roundtrip',
      productId: 'weaviate',
      storyIds: ['openness-self-host', 'agentic-public-api'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-weaviate-probe >/dev/null 2>&1; docker run -d --name pa-weaviate-probe -p 18080:8080 -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true -e PERSISTENCE_DATA_PATH=/var/lib/weaviate cr.weaviate.io/semitechnologies/weaviate:latest && n=0; while [ $n -lt 45 ] && ! curl -s http://localhost:18080/v1/.well-known/ready >/dev/null 2>&1; do sleep 2; n=$((n+1)); done; curl -s http://localhost:18080/v1/meta | head -c 240; echo; curl -s -X POST http://localhost:18080/v1/schema -H "Content-Type: application/json" -d "{\\"class\\":\\"PaProbe\\",\\"vectorizer\\":\\"none\\"}" | head -c 240; echo; curl -s http://localhost:18080/v1/schema | head -c 240; echo; docker rm -f pa-weaviate-probe >/dev/null 2>&1',
      ],
      displayCommand: 'docker run -d --name pa-weaviate-probe -p 18080:8080 -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true cr.weaviate.io/semitechnologies/weaviate:latest && curl -X POST localhost:18080/v1/schema -d \'{"class":"PaProbe","vectorizer":"none"}\' && curl localhost:18080/v1/schema',
      expect: /"classes":\[\{"class":"PaProbe"/,
      timeoutMs: 180_000,
    },
    {
      // Same keyless provision roundtrip for qdrant: boot the official image on a throwaway
      // port, PUT a collection through the REST API, list it back, tear down.
      probeId: 'docker-provision-roundtrip',
      productId: 'qdrant',
      storyIds: ['openness-self-host', 'agentic-public-api'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-qdrant-probe >/dev/null 2>&1; docker run -d --name pa-qdrant-probe -p 16333:6333 qdrant/qdrant && n=0; while [ $n -lt 45 ] && ! curl -s http://localhost:16333/readyz >/dev/null 2>&1; do sleep 2; n=$((n+1)); done; curl -s http://localhost:16333/ ; echo; curl -s -X PUT http://localhost:16333/collections/pa_probe -H "Content-Type: application/json" -d "{\\"vectors\\":{\\"size\\":8,\\"distance\\":\\"Cosine\\"}}"; echo; curl -s http://localhost:16333/collections; echo; docker rm -f pa-qdrant-probe >/dev/null 2>&1',
      ],
      displayCommand: 'docker run -d --name pa-qdrant-probe -p 16333:6333 qdrant/qdrant && curl -X PUT localhost:16333/collections/pa_probe -d \'{"vectors":{"size":8,"distance":"Cosine"}}\' && curl localhost:16333/collections',
      expect: /"collections":\[\{"name":"pa_probe"\}\]/,
      timeoutMs: 180_000,
    },
    {
      // First-party MCP server (uvx-published mcp-server-qdrant) speaking stdio against a
      // throwaway local store — no cloud, no credentials.
      probeId: 'mcp-stdio-handshake',
      productId: 'qdrant',
      storyIds: ['agentic-mcp-server'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-qdrant-mcp; QDRANT_LOCAL_PATH=/tmp/pa-qdrant-mcp COLLECTION_NAME=pa-probe uvx mcp-server-qdrant',
      ],
      displayCommand: `echo '<jsonrpc initialize>' | QDRANT_LOCAL_PATH=/tmp/pa-qdrant-mcp COLLECTION_NAME=pa-probe uvx mcp-server-qdrant`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 90_000,
    },
    {
      probeId: 'cli-help',
      productId: 'chroma',
      storyIds: ['agentic-official-cli'],
      bin: 'chroma',
      argv: ['sh', '-c', 'chroma --help | cat'],
      displayCommand: 'chroma --help',
      expect: /A CLI for Chroma/,
      timeoutMs: 30_000,
    },
    {
      // Keyless provision roundtrip against chroma's own local server: `chroma run` on a
      // throwaway port + path, create a collection via the v2 REST API, list it back, kill.
      probeId: 'local-server-provision-roundtrip',
      productId: 'chroma',
      storyIds: ['embedded-local-mode', 'agentic-public-api'],
      bin: 'chroma',
      argv: [
        'sh', '-c',
        'pkill -f "chroma run --path /tmp/pa-chroma-probe" 2>/dev/null; rm -rf /tmp/pa-chroma-probe; (chroma run --path /tmp/pa-chroma-probe --port 8765 >/dev/null 2>&1 &); n=0; while [ $n -lt 30 ] && ! curl -s http://localhost:8765/api/v2/heartbeat >/dev/null 2>&1; do sleep 1; n=$((n+1)); done; curl -s http://localhost:8765/api/v2/heartbeat; echo; curl -s -X POST http://localhost:8765/api/v2/tenants/default_tenant/databases/default_database/collections -H "Content-Type: application/json" -d "{\\"name\\":\\"pa_probe\\"}" | head -c 240; echo; curl -s http://localhost:8765/api/v2/tenants/default_tenant/databases/default_database/collections | head -c 240; echo; pkill -f "chroma run --path /tmp/pa-chroma-probe"; rm -rf /tmp/pa-chroma-probe',
      ],
      displayCommand: 'chroma run --path /tmp/pa-chroma-probe --port 8765 & curl -X POST localhost:8765/api/v2/tenants/default_tenant/databases/default_database/collections -d \'{"name":"pa_probe"}\' && curl localhost:8765/api/v2/tenants/default_tenant/databases/default_database/collections',
      expect: /"name":"pa_probe"/,
      timeoutMs: 120_000,
    },
    {
      // First-party chroma-mcp stdio server against an ephemeral in-memory client.
      probeId: 'mcp-stdio-handshake',
      productId: 'chroma',
      storyIds: ['agentic-mcp-server'],
      bin: 'uvx',
      argv: ['sh', '-c', 'uvx chroma-mcp --client-type ephemeral'],
      displayCommand: `echo '<jsonrpc initialize>' | uvx chroma-mcp --client-type ephemeral`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 90_000,
    },
    {
      // Milvus Lite embedded mode: create a collection against a throwaway local file store
      // through the official pymilvus client — the documented laptop-scale deployment.
      probeId: 'milvus-lite-provision-roundtrip',
      productId: 'milvus',
      storyIds: ['embedded-local-mode', 'agentic-sdks'],
      bin: 'python3',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-milvus-probe.db && python3 -c \'from pymilvus import MilvusClient; c = MilvusClient("/tmp/pa-milvus-probe.db"); c.create_collection("pa_probe", dimension=8); print("PA_PROBE_OK", c.list_collections())\' ; rm -rf /tmp/pa-milvus-probe.db',
      ],
      displayCommand: `python3 -c 'from pymilvus import MilvusClient; c = MilvusClient("/tmp/pa-milvus-probe.db"); c.create_collection("pa_probe", dimension=8); print("PA_PROBE_OK", c.list_collections())'`,
      expect: /PA_PROBE_OK \['pa_probe'\]/,
      timeoutMs: 120_000,
    },
  ],
  // Workflow automation: n8n's CLI comes from a scratch npm-prefix install prepended to PATH by
  // the operator (same convention as bun above); zapier-platform-cli v19 renamed its binary to
  // `zapier-platform`. The temporal roundtrip is the arena's signature local proof: boot the
  // dev server headless on a throwaway port + db file, ask the cluster for its health over gRPC,
  // list workflows, tear down — the exact local-dev loop an agent runs, fully self-cleaned.
  // Remote MCP endpoints (Zapier, Make, Pipedream) are probed keylessly: an auth-gated MCP
  // server answers a bare initialize POST with its own auth challenge, proving the endpoint
  // exists and speaks the protocol.
  'workflow-automation': [
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
  ],
  // Observability: grafana's official MCP server (brew-installed mcp-grafana) answers a stdio
  // initialize with serverInfo even with no Grafana configured — the handshake itself is the
  // keyless proof. The docker roundtrip is the arena's signature local proof: boot grafana-oss,
  // create a dashboard through the HTTP API (container-default admin:admin — local throwaway,
  // no cloud credentials), search it back, tear down. Hosted MCP endpoints (Sentry, Datadog,
  // New Relic, Honeycomb) are probed keylessly via their auth challenges / RFC 9728 metadata.
  observability: [
    {
      probeId: 'mcp-stdio-handshake',
      productId: 'grafana',
      storyIds: ['agentic-mcp-server', 'agent-queries-telemetry'],
      bin: 'mcp-grafana',
      argv: ['mcp-grafana'],
      displayCommand: `echo '<jsonrpc initialize>' | mcp-grafana`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 30_000,
    },
    {
      probeId: 'docker-provision-roundtrip',
      productId: 'grafana',
      storyIds: ['openness-self-host', 'dashboards-monitors-as-code', 'agentic-public-api'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-grafana-probe >/dev/null 2>&1; docker run -d --name pa-grafana-probe -p 13000:3000 grafana/grafana-oss >/dev/null 2>&1; n=0; while [ $n -lt 45 ] && ! curl -s http://localhost:13000/api/health >/dev/null 2>&1; do sleep 2; n=$((n+1)); done; curl -s http://localhost:13000/api/health; echo; curl -s -X POST http://admin:admin@localhost:13000/api/dashboards/db -H "Content-Type: application/json" -d "{\\"dashboard\\":{\\"title\\":\\"PA Probe\\",\\"panels\\":[]},\\"overwrite\\":true}"; echo; curl -s "http://admin:admin@localhost:13000/api/search?query=PA%20Probe"; echo; docker rm -f pa-grafana-probe >/dev/null 2>&1',
      ],
      displayCommand: `docker run -d --name pa-grafana-probe -p 13000:3000 grafana/grafana-oss && curl localhost:13000/api/health && curl -X POST http://admin:admin@localhost:13000/api/dashboards/db -d '{"dashboard":{"title":"PA Probe"},"overwrite":true}' && curl 'http://admin:admin@localhost:13000/api/search?query=PA%20Probe'`,
      expect: /"title":"PA Probe"/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'cli-version',
      productId: 'sentry',
      storyIds: ['agentic-official-cli'],
      bin: 'sentry-cli',
      argv: ['sentry-cli', '--version'],
      displayCommand: 'sentry-cli --version',
      expect: /sentry-cli \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'sentry',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.sentry.dev/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.sentry.dev/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'datadog',
      storyIds: ['agentic-official-cli', 'agentic-headless'],
      bin: 'datadog-ci',
      argv: ['datadog-ci', 'version'],
      displayCommand: 'datadog-ci version',
      expect: /v\d+\.\d+\.\d+/,
      timeoutMs: 60_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'datadog',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.datadoghq.com/api/unstable/mcp-server/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.datadoghq.com/api/unstable/mcp-server/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /\{"errors":\["Unauthorized"\]\}/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'new-relic',
      storyIds: ['agentic-official-cli'],
      bin: 'newrelic',
      argv: ['newrelic', 'version'],
      displayCommand: 'newrelic version',
      expect: /newrelic version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'new-relic',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.newrelic.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.newrelic.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"authentication_options"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-discovery',
      productId: 'honeycomb',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: ['curl', '-s', '--max-time', '20', 'https://mcp.honeycomb.io/.well-known/oauth-protected-resource'],
      displayCommand: 'curl -s https://mcp.honeycomb.io/.well-known/oauth-protected-resource',
      expect: /"authorization_servers"/,
      timeoutMs: 30_000,
    },
  ],
  'infra-as-code': [
    {
      probeId: 'cli-version',
      productId: 'terraform',
      storyIds: ['agentic-official-cli'],
      bin: 'terraform',
      argv: ['terraform', 'version'],
      displayCommand: 'terraform version',
      expect: /Terraform v\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'plan-headless-help',
      productId: 'terraform',
      storyIds: ['agentic-headless', 'structured-plan-output'],
      bin: 'terraform',
      argv: ['terraform', 'plan', '-help'],
      displayCommand: 'terraform plan -help',
      expect: /-detailed-exitcode/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'opentofu',
      storyIds: ['agentic-official-cli'],
      bin: 'tofu',
      argv: ['tofu', 'version'],
      displayCommand: 'tofu version',
      expect: /OpenTofu v\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'plan-headless-help',
      productId: 'opentofu',
      storyIds: ['agentic-headless', 'structured-plan-output'],
      bin: 'tofu',
      argv: ['tofu', 'plan', '-help'],
      displayCommand: 'tofu plan -help',
      expect: /-detailed-exitcode/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'pulumi',
      storyIds: ['agentic-official-cli'],
      bin: 'pulumi',
      argv: ['pulumi', 'version'],
      displayCommand: 'pulumi version',
      expect: /v\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'preview-json-help',
      productId: 'pulumi',
      storyIds: ['agentic-headless', 'structured-plan-output'],
      bin: 'pulumi',
      argv: ['pulumi', 'preview', '--help'],
      displayCommand: 'pulumi preview --help',
      expect: /--json/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'crossplane',
      storyIds: ['agentic-official-cli'],
      bin: 'crossplane',
      argv: ['crossplane', 'version', '--client'],
      displayCommand: 'crossplane version --client',
      expect: /Client Version: v\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
  ],
}

// Children never see the parent env (which may hold API keys): PATH to find the binary, HOME
// because CLIs read their own config, TERM for the pty, NODE_ENV because Next's type
// augmentation makes it mandatory on ProcessEnv (and it's harmless). That's it.
function minimalEnv(): NodeJS.ProcessEnv {
  return { PATH: process.env.PATH, HOME: process.env.HOME, TERM: 'xterm-256color', NODE_ENV: 'production' }
}

function binAvailable(bin: string): boolean {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (dir && fs.existsSync(path.join(dir, bin))) return true
  }
  return false
}

function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`
}

interface RunOutcome {
  transcript: string
  exitCode: number
}

// Waits for natural exit or terminates at timeoutMs (SIGTERM, then SIGKILL). Long-running
// server probes are EXPECTED to be terminated — see LocalProbe.longRunning.
function waitForExit(child: ReturnType<typeof spawn>, timeoutMs: number): Promise<{ code: number | null; killed: boolean }> {
  return new Promise((resolve) => {
    let killed = false
    const term = setTimeout(() => {
      killed = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref()
    }, timeoutMs)
    child.on('exit', (code) => {
      clearTimeout(term)
      resolve({ code, killed })
    })
    child.on('error', () => {
      clearTimeout(term)
      resolve({ code: 127, killed })
    })
  })
}

// PA_RECORD=1 path: run the probe inside a `script(1)` pty so the transcript is a real
// terminal capture. BSD script tcgetattr()s its stdin, which must therefore be a plain fd
// (here /dev/null), never a node socketpair — so stdin payloads are piped INSIDE the pty via
// `sh -c '{ cat payload; sleep 6; } | cmd'` (the sleep keeps stdin open long enough for the
// server to answer before EOF).
async function runRecorded(probe: LocalProbe, tmpDir: string): Promise<RunOutcome> {
  const outFile = path.join(tmpDir, `${probe.productId}-${probe.probeId}.raw`)
  let argv: string[]
  if (probe.stdinPayload) {
    const payloadFile = path.join(tmpDir, `${probe.productId}-${probe.probeId}.stdin`)
    fs.writeFileSync(payloadFile, probe.stdinPayload)
    const inner = `{ cat ${shellQuote(payloadFile)}; sleep 6; } | ${probe.argv.map(shellQuote).join(' ')}`
    argv = ['/usr/bin/script', '-q', '-t', '0', outFile, 'sh', '-c', inner]
  } else {
    argv = ['/usr/bin/script', '-q', '-t', '0', outFile, ...probe.argv]
  }
  const devNull = fs.openSync('/dev/null', 'r')
  const child = spawn(argv[0], argv.slice(1), { env: minimalEnv(), stdio: [devNull, 'ignore', 'ignore'] })
  const { code, killed } = await waitForExit(child, probe.timeoutMs)
  fs.closeSync(devNull)
  const transcript = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : ''
  return { transcript, exitCode: exitCodeFor(probe, transcript, code, killed) }
}

// Dry-run path (no PA_RECORD): same probes, plain stdout/stderr capture, nothing written.
async function runPlain(probe: LocalProbe): Promise<RunOutcome> {
  const child = spawn(probe.argv[0], probe.argv.slice(1), { env: minimalEnv(), stdio: ['pipe', 'pipe', 'pipe'] })
  let out = ''
  child.stdout?.on('data', (d: Buffer) => { out += d.toString() })
  child.stderr?.on('data', (d: Buffer) => { out += d.toString() })
  if (probe.stdinPayload) child.stdin?.write(probe.stdinPayload)
  else child.stdin?.end()
  const { code, killed } = await waitForExit(child, probe.timeoutMs)
  return { transcript: out, exitCode: exitCodeFor(probe, out, code, killed) }
}

function exitCodeFor(probe: LocalProbe, transcript: string, code: number | null, killed: boolean): number {
  if (probe.longRunning) return probe.expect.test(transcript) ? 0 : 1
  if (killed || code === null) return 124
  return code
}

export async function runProbeRecord({ category, product }: { category?: string; product?: string }): Promise<void> {
  const record = process.env.PA_RECORD === '1'
  if (record && (process.platform !== 'darwin' || !fs.existsSync('/usr/bin/script'))) {
    throw new Error('PA_RECORD=1 requires the BSD script(1) pty recorder (macOS)')
  }
  if (!record) console.log('probe-record: dry run (set PA_RECORD=1 to write recordings)')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-probe-record-'))
  try {
    for (const cat of resolveCategories(category)) {
      const probes = (LOCAL_PROBES[cat.id] ?? []).filter((p) => !product || p.productId === product)
      const entries: ProofIndexEntry[] = []
      for (const probe of probes) {
        if (!binAvailable(probe.bin)) {
          console.log(`probe-record: ${cat.id}/${probe.productId}/${probe.probeId} — skipped (${probe.bin} not on PATH)`)
          continue
        }
        const outcome = record ? await runRecorded(probe, tmpDir) : await runPlain(probe)
        const passed = probe.expect.test(outcome.transcript)
        console.log(
          `probe-record: ${cat.id}/${probe.productId}/${probe.probeId} — ${passed ? 'PASS' : 'FAIL'} (exit ${outcome.exitCode})`,
        )
        if (!record) continue
        const entry: ProofIndexEntry = {
          probeId: probe.probeId,
          productId: probe.productId,
          storyIds: probe.storyIds,
          command: probe.displayCommand,
          recordedAt: new Date().toISOString(),
          exitCode: outcome.exitCode,
          kind: 'terminal',
          file: `${probe.productId}/${probe.probeId}.txt`,
        }
        // Failed probes are still published — a claim that doesn't reproduce is a finding,
        // not a gap (docs/PROVE-IT.md).
        writeProofArtifact(cat.id, entry, { content: `$ ${probe.displayCommand}\n${outcome.transcript}` })
        entries.push(entry)
      }
      if (record && entries.length > 0) upsertProofIndex(cat.id, entries)
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
