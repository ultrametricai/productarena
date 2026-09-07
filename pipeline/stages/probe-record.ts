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
  // MCP infrastructure: the signature keyless proofs are (a) real JSON-RPC initialize
  // handshakes against each platform's hosted MCP endpoint — a live 401 OAuth challenge or a
  // per-user JSON-RPC error IS the product surface (managed auth) — (b) a keyless registry
  // search, and (c) real npm/pip/release installs of each platform's SDK or CLI into throwaway
  // fixtures, self-cleaned. All keyless; no accounts are created and no tools are executed.
  'mcp-infrastructure': [
    {
      probeId: 'npm-install-sdk-roundtrip',
      productId: 'composio',
      storyIds: ['agentic-sdks'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install @composio/core --no-fund --no-audit --loglevel=error && node -e "const m=require('@composio/core'); console.log('PA_PROBE_OK Composio export:', typeof m.Composio)" && cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install @composio/core && node -e "console.log('PA_PROBE_OK Composio export:', typeof require('@composio/core').Composio)"`,
      expect: /PA_PROBE_OK Composio export: function/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'pip-install-sdk-roundtrip',
      productId: 'composio',
      storyIds: ['agentic-sdks'],
      bin: 'uv',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && uv venv -q && uv pip install -q composio && ./.venv/bin/python -c "import composio; print('PA_PROBE_OK composio', getattr(composio, '__version__', 'imported'))" && cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && uv venv && uv pip install composio && python -c "import composio; print('PA_PROBE_OK composio', composio.__version__)"`,
      expect: /PA_PROBE_OK composio \d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'composio',
      storyIds: ['one-endpoint-hosted-connection', 'managed-oauth-vaulting', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://connect.composio.dev/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://connect.composio.dev/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'registry-keyless-search',
      productId: 'smithery',
      storyIds: ['registry-programmatic-api', 'server-registry-search', 'quality-scores-usage-signals'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 'https://registry.smithery.ai/servers?pageSize=3&q=browser' -H 'Accept: application/json' | head -c 900`,
      ],
      displayCommand: `curl -s 'https://registry.smithery.ai/servers?pageSize=3&q=browser' | head -c 900`,
      expect: /"servers":\[\{/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'smithery',
      storyIds: ['one-endpoint-hosted-connection', 'managed-oauth-vaulting', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://server.smithery.ai/exa/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://server.smithery.ai/exa/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'docs-mcp-handshake',
      productId: 'smithery',
      storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 -X POST https://smithery.ai/docs/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '${CURL_MCP_INIT.replace(/'/g, `'\\''`)}' | head -c 700`,
      ],
      displayCommand: `curl -s -X POST https://smithery.ai/docs/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo":\{"name":"Smithery Documentation"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'npm-install-cli-version',
      productId: 'smithery',
      storyIds: ['publisher-cli-workflow', 'agentic-official-cli'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install @smithery/cli --no-fund --no-audit --loglevel=error && ./node_modules/.bin/smithery --version && cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install @smithery/cli && ./node_modules/.bin/smithery --version`,
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'registry-api-authgate',
      productId: 'glama',
      storyIds: ['registry-programmatic-api'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 'https://glama.ai/api/mcp/v1/servers?first=2' -H 'Accept: application/json' | head -c 700`,
      ],
      displayCommand: `curl -s 'https://glama.ai/api/mcp/v1/servers?first=2' | head -c 700`,
      expect: /API key|unauthorized/i,
      timeoutMs: 30_000,
    },
    {
      probeId: 'openapi-spec-fetch',
      productId: 'glama',
      storyIds: ['agentic-public-api', 'api-machine-spec'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 https://glama.ai/api/mcp/openapi.json | head -c 500`,
      ],
      displayCommand: `curl -s https://glama.ai/api/mcp/openapi.json | head -c 500`,
      expect: /"openapi"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'pipedream-mcp',
      storyIds: ['one-endpoint-hosted-connection', 'per-end-user-multi-tenant-auth', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://remote.mcp.pipedream.net',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://remote.mcp.pipedream.net -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /external user id is required/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'npm-install-sdk-roundtrip',
      productId: 'pipedream-mcp',
      storyIds: ['agentic-sdks'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install @pipedream/sdk --no-fund --no-audit --loglevel=error && node -e "const m=require('@pipedream/sdk'); console.log('PA_PROBE_OK PipedreamClient export:', typeof m.PipedreamClient)" && cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install @pipedream/sdk && node -e "console.log('PA_PROBE_OK PipedreamClient export:', typeof require('@pipedream/sdk').PipedreamClient)"`,
      expect: /PA_PROBE_OK PipedreamClient export: function/,
      timeoutMs: 180_000,
    },
    {
      // Real install of the vendor-published release binary — the same artifact the official
      // installer script (go.getgram.ai/cli.sh) fetches — into a throwaway dir, then a version
      // print. No sudo, self-cleaned.
      probeId: 'cli-release-install-version',
      productId: 'gram',
      storyIds: ['publisher-cli-workflow', 'agentic-official-cli'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && tag=$(curl -sf https://raw.githubusercontent.com/speakeasy-api/gram/refs/heads/main/cli/package.json | grep -oE '"(name|version)": *"[^"]*"' | sed -E 's/.*: *"([^"]*)"/\\1/' | paste -sd@ -) && echo "tag=$tag" && curl -fsSL "https://github.com/speakeasy-api/gram/releases/download/$tag/gram_darwin_arm64.zip" -o gram.zip && unzip -q gram.zip && ./gram --version && cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && curl -fsSL https://github.com/speakeasy-api/gram/releases/download/cli@<latest>/gram_darwin_arm64.zip -o gram.zip && unzip gram.zip && ./gram --version`,
      expect: /gram version \d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
  ],
  // Browser automation for agents: the signature keyless proofs are (a) real MCP stdio
  // initialize handshakes against the first-party servers the vendors publish (uvx/npx pulls
  // the published package — an install AND a handshake in one transcript), (b) a full
  // self-host roundtrip for the OSS browser API (docker up → create a live session through the
  // REST API → teardown), and (c) real pip/npm/installer installs into throwaway fixtures.
  // All keyless and self-cleaned; no cloud accounts, no tasks executed against third parties.
  'browser-agents': [
    {
      probeId: 'mcp-stdio-handshake',
      productId: 'browser-use',
      storyIds: ['agentic-mcp-server', 'nl-task-to-completion'],
      bin: 'uvx',
      argv: ['sh', '-c', `uvx --from 'browser-use[cli]' browser-use --mcp`],
      displayCommand: `echo '<jsonrpc initialize>' | uvx --from 'browser-use[cli]' browser-use --mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 240_000,
    },
    {
      probeId: 'pip-install-import-roundtrip',
      productId: 'browser-use',
      storyIds: ['agentic-sdks', 'local-browser-mode'],
      bin: 'uv',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && uv venv -q && uv pip install -q browser-use && ./.venv/bin/python -c "from importlib.metadata import version; import browser_use; print('PA_PROBE_OK browser-use', version('browser-use'))" ; cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && uv venv && uv pip install browser-use && python -c "import browser_use; print('PA_PROBE_OK browser-use', version('browser-use'))"`,
      expect: /PA_PROBE_OK browser-use \d+\.\d+/,
      timeoutMs: 240_000,
    },
    {
      probeId: 'npm-install-import-roundtrip',
      productId: 'stagehand',
      storyIds: ['agentic-sdks'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install @browserbasehq/stagehand --no-fund --no-audit --loglevel=error && node -e "import('@browserbasehq/stagehand').then(m=>console.log('PA_PROBE_OK Stagehand export:', typeof m.Stagehand))" ; cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install @browserbasehq/stagehand && node -e "import('@browserbasehq/stagehand').then(m=>console.log('PA_PROBE_OK Stagehand export:', typeof m.Stagehand))"`,
      expect: /PA_PROBE_OK Stagehand export: function/,
      timeoutMs: 240_000,
    },
    {
      probeId: 'mcp-stdio-handshake',
      productId: 'stagehand',
      storyIds: ['agentic-mcp-server', 'dom-action-primitives'],
      bin: 'npx',
      argv: ['sh', '-c', 'npx -y @browserbasehq/mcp'],
      displayCommand: `echo '<jsonrpc initialize>' | npx -y @browserbasehq/mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 180_000,
    },
    {
      probeId: 'mcp-remote-handshake',
      productId: 'skyvern',
      storyIds: ['agentic-mcp-server', 'hosted-task-api'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.skyvern.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.skyvern.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'pip-install-cli-roundtrip',
      productId: 'skyvern',
      storyIds: ['agentic-sdks', 'agentic-official-cli', 'local-browser-mode'],
      bin: 'uv',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && uv venv -q && uv pip install -q skyvern && ./.venv/bin/python -c "from importlib.metadata import version; print('PA_PROBE_OK skyvern', version('skyvern'))" && ./.venv/bin/skyvern --help | head -8 ; cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && uv venv && uv pip install skyvern && skyvern --help`,
      expect: /Manage and run your local Skyvern environment/,
      timeoutMs: 300_000,
    },
    {
      probeId: 'mcp-stdio-handshake',
      productId: 'hyperbrowser',
      storyIds: ['agentic-mcp-server'],
      bin: 'npx',
      argv: ['sh', '-c', 'npx -y hyperbrowser-mcp'],
      displayCommand: `echo '<jsonrpc initialize>' | npx -y hyperbrowser-mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 180_000,
    },
    {
      probeId: 'npm-install-import-roundtrip',
      productId: 'hyperbrowser',
      storyIds: ['agentic-sdks'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install @hyperbrowser/sdk --no-fund --no-audit --loglevel=error && node -e "const m=require('@hyperbrowser/sdk'); console.log('PA_PROBE_OK Hyperbrowser export:', typeof m.Hyperbrowser)" ; cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install @hyperbrowser/sdk && node -e "console.log('PA_PROBE_OK Hyperbrowser export:', typeof require('@hyperbrowser/sdk').Hyperbrowser)"`,
      expect: /PA_PROBE_OK Hyperbrowser export: function/,
      timeoutMs: 240_000,
    },
    {
      // Full keyless self-host roundtrip for the OSS browser API: boot the official image on a
      // throwaway port, wait for /v1/health, create a LIVE browser session through the REST
      // API, list it back, tear the container down.
      probeId: 'docker-selfhost-session-roundtrip',
      productId: 'steel',
      storyIds: ['openness-self-host', 'agentic-public-api', 'parallel-fleet-scale'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-steel-probe >/dev/null 2>&1; docker run -d --name pa-steel-probe -p 13000:3000 ghcr.io/steel-dev/steel-browser && n=0; while [ $n -lt 60 ] && ! curl -s http://localhost:13000/v1/health >/dev/null 2>&1; do sleep 2; n=$((n+1)); done; curl -s http://localhost:13000/v1/health; echo; curl -s -X POST http://localhost:13000/v1/sessions -H "Content-Type: application/json" -d "{}" | head -c 300; echo; curl -s http://localhost:13000/v1/sessions | head -c 200; echo; docker rm -f pa-steel-probe >/dev/null 2>&1',
      ],
      displayCommand: `docker run -d --name pa-steel-probe -p 13000:3000 ghcr.io/steel-dev/steel-browser && curl localhost:13000/v1/health && curl -X POST localhost:13000/v1/sessions -d '{}' && curl localhost:13000/v1/sessions`,
      expect: /"status":"live"/,
      timeoutMs: 300_000,
    },
    {
      // Official installer into a throwaway HOME (installs to ~/.steel/bin), then a version
      // print — no PATH or shell-profile mutation escapes the fixture.
      probeId: 'cli-install-version',
      productId: 'steel',
      storyIds: ['agentic-official-cli'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `h=$(mktemp -d) && HOME="$h" sh -c 'curl -sSf https://setup.steel.dev | sh -s -- --non-interactive >/dev/null 2>&1; "$HOME/.steel/bin/steel" --version' ; rm -rf "$h"`,
      ],
      displayCommand: `HOME=$(mktemp -d) sh -c 'curl -sSf https://setup.steel.dev | sh -s -- --non-interactive && ~/.steel/bin/steel --version'`,
      expect: /steel \d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'npm-install-import-roundtrip',
      productId: 'steel',
      storyIds: ['agentic-sdks'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        `d=$(mktemp -d) && cd "$d" && npm init -y >/dev/null 2>&1 && npm install steel-sdk --no-fund --no-audit --loglevel=error && node -e "const m=require('steel-sdk'); console.log('PA_PROBE_OK Steel export:', typeof m.Steel)" ; cd / && rm -rf "$d"`,
      ],
      displayCommand: `mktemp -d && npm install steel-sdk && node -e "console.log('PA_PROBE_OK Steel export:', typeof require('steel-sdk').Steel)"`,
      expect: /PA_PROBE_OK Steel export: function/,
      timeoutMs: 240_000,
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
  'ai-memory': [
    {
      // Official mem0 CLI (pypi mem0-cli), run keylessly through uvx — help prints the full
      // memory command surface (add/search/get/list/update/delete) without an account.
      probeId: 'cli-help',
      productId: 'mem0',
      storyIds: ['agentic-official-cli'],
      bin: 'uvx',
      argv: ['sh', '-c', 'uvx --from mem0-cli mem0 --help | cat'],
      displayCommand: 'uvx --from mem0-cli mem0 --help',
      expect: /Memory Layer for AI Agents/,
      timeoutMs: 120_000,
    },
    {
      // OSS SDK is pip-installable and importable with no key: `from mem0 import Memory`.
      probeId: 'sdk-pip-import',
      productId: 'mem0',
      storyIds: ['agentic-sdks', 'self-host-oss-deployment'],
      bin: 'uv',
      argv: [
        'uv', 'run', '--no-project', '--with', 'mem0ai', 'python3', '-c',
        'import mem0; from mem0 import Memory; print("PA_PROBE_OK mem0ai", mem0.__version__)',
      ],
      displayCommand: `uv run --with mem0ai python3 -c 'import mem0; from mem0 import Memory; print("PA_PROBE_OK mem0ai", mem0.__version__)'`,
      expect: /PA_PROBE_OK mem0ai \d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Hosted MCP server answers keylessly with its OAuth challenge + protected-resource
      // metadata — live proof the endpoint exists and gates access (workos precedent).
      probeId: 'mcp-remote-handshake',
      productId: 'mem0',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.mem0.ai/mcp/',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.mem0.ai/mcp/ -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Zep docs MCP server completes a full keyless initialize handshake (open, no auth).
      probeId: 'docs-mcp-handshake',
      productId: 'zep',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://help.getzep.com/_mcp/server',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://help.getzep.com/_mcp/server -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo"/,
      timeoutMs: 30_000,
    },
    {
      // Zep Memory MCP server (api.getzep.com/mcp) is live and IdP-gated: keyless initialize
      // draws the OAuth 401 challenge with protected-resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'zep',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.getzep.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.getzep.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource\/mcp/,
      timeoutMs: 30_000,
    },
    {
      // Graphiti — Zep's open-source temporal-knowledge-graph engine — installs and imports
      // from pypi with no key.
      probeId: 'sdk-pip-import',
      productId: 'zep',
      storyIds: ['agentic-sdks', 'entity-graph-memory'],
      bin: 'uv',
      argv: [
        'uv', 'run', '--no-project', '--with', 'graphiti-core', '--with', 'httpx', 'python3', '-c',
        'import graphiti_core; from graphiti_core import Graphiti; print("PA_PROBE_OK graphiti-core imported")',
      ],
      displayCommand: `uv run --with graphiti-core python3 -c 'from graphiti_core import Graphiti; print("PA_PROBE_OK graphiti-core imported")'`,
      expect: /PA_PROBE_OK graphiti-core imported/,
      timeoutMs: 120_000,
    },
    {
      probeId: 'cli-version',
      productId: 'letta',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@letta-ai/letta-code', '--version'],
      displayCommand: 'npx -y @letta-ai/letta-code --version',
      expect: /\d+\.\d+\.\d+ \(Letta Code\)/,
      timeoutMs: 120_000,
    },
    {
      // Keyless local App Server bring-up: `letta server --backend local` boots with no
      // account and prints its listen URLs; the probe captures the startup banner then kills it.
      probeId: 'local-server-keyless-boot',
      productId: 'letta',
      storyIds: ['self-host-oss-deployment', 'agentic-headless'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'pkill -f "letta-code" 2>/dev/null; (npx -y @letta-ai/letta-code server --backend local --listen ws://127.0.0.1:4500 >/tmp/pa-letta-app.log 2>&1 &); n=0; until grep -q "Listening on" /tmp/pa-letta-app.log 2>/dev/null; do n=$((n+1)); [ $n -ge 40 ] && break; sleep 2; done; cat /tmp/pa-letta-app.log; pkill -f "letta-code"; rm -f /tmp/pa-letta-app.log',
      ],
      displayCommand: 'npx -y @letta-ai/letta-code server --backend local --listen ws://127.0.0.1:4500  # keyless boot, then kill',
      expect: /Listening on ws:\/\/127\.0\.0\.1:4500/,
      timeoutMs: 180_000,
    },
    {
      // Hosted MCP server answers keylessly with its OAuth challenge (no API key required
      // by design — sign-in happens in the browser).
      probeId: 'mcp-remote-handshake',
      productId: 'supermemory',
      storyIds: ['agentic-mcp-server', 'assistant-memory-plugins'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.supermemory.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.supermemory.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Published machine-readable OpenAPI spec + live gated v3 API: the spec is keyless,
      // and a keyless POST to /v3/search draws a clean 401 from the live endpoint.
      probeId: 'openapi-and-live-api',
      productId: 'supermemory',
      storyIds: ['api-machine-spec', 'agentic-public-api'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s --max-time 20 https://supermemory.ai/openapi.json | head -c 200; echo; curl -s -i --max-time 20 -X POST https://api.supermemory.ai/v3/search -H "Content-Type: application/json" -d \'{"q":"probe"}\' | head -5',
      ],
      displayCommand: `curl -s https://supermemory.ai/openapi.json | head -c 200 && curl -si -X POST https://api.supermemory.ai/v3/search -d '{"q":"probe"}'`,
      expect: /"openapi"[\s\S]*401/,
      timeoutMs: 45_000,
    },
    {
      // Keyless end-to-end memory roundtrip on the official CLI: `cognee-cli demo` loads a
      // bundled knowledge graph (47 nodes/86 edges) and answers recall queries with no LLM
      // key, then `forget` tears the dataset down.
      probeId: 'cli-demo-roundtrip',
      productId: 'cognee',
      storyIds: ['agentic-official-cli', 'local-embedded-mode'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        'uvx --from cognee cognee-cli demo 2>/dev/null | tail -20; uvx --from cognee cognee-cli forget --dataset demo 2>/dev/null | tail -2',
      ],
      displayCommand: 'uvx --from cognee cognee-cli demo && uvx --from cognee cognee-cli forget --dataset demo',
      expect: /Demo graph loaded into dataset 'demo'/,
      timeoutMs: 300_000,
    },
    {
      // First-party cognee MCP server (pypi cognee-mcp) answers a stdio initialize handshake.
      probeId: 'mcp-stdio-handshake',
      productId: 'cognee',
      storyIds: ['agentic-mcp-server'],
      bin: 'uvx',
      argv: ['sh', '-c', 'uvx cognee-mcp'],
      displayCommand: `echo '<jsonrpc initialize>' | uvx cognee-mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo"/,
      longRunning: true,
      timeoutMs: 300_000,
    },
  ],
  'voice-agents': [
    {
      // Official Vapi CLI, installed via the vendor's install.sh into ~/.vapi/bin.
      probeId: 'cli-version',
      productId: 'vapi',
      storyIds: ['agentic-official-cli'],
      bin: 'sh',
      argv: ['sh', '-c', '"$HOME/.vapi/bin/vapi" --version'],
      displayCommand: 'vapi --version  # installed via `curl -sSL https://vapi.ai/install.sh | bash`',
      expect: /vapi version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Hosted Vapi MCP server draws a keyless 401 — live, bearer-gated endpoint.
      probeId: 'mcp-remote-handshake',
      productId: 'vapi',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.vapi.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.vapi.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'retell',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@retell-ai/retell-cli', '--version'],
      displayCommand: 'npx -y @retell-ai/retell-cli --version',
      expect: /retell \d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Retell's hosted MCP server completes a full KEYLESS initialize handshake (tool calls
      // authenticate later with a bearer key) — serverInfo "retell-sdk" comes back openly.
      probeId: 'mcp-remote-handshake',
      productId: 'retell',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.retellai.com',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.retellai.com -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo":\{"name":"retell-sdk"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'elevenlabs-agents',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@elevenlabs/cli', '--version'],
      displayCommand: 'npx -y @elevenlabs/cli --version',
      expect: /elevenlabs \d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // ElevenLabs hosted MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'elevenlabs-agents',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.elevenlabs.io/v1/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.elevenlabs.io/v1/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'bland',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', 'bland-cli', '--version'],
      displayCommand: 'npx -y bland-cli --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Bland's hosted MCP endpoint draws a keyless 401 — live, key-gated.
      probeId: 'mcp-remote-handshake',
      productId: 'bland',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.bland.ai/v1/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.bland.ai/v1/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'livekit-agents',
      storyIds: ['agentic-official-cli'],
      bin: 'lk',
      argv: ['lk', '--version'],
      displayCommand: 'lk --version',
      expect: /lk version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Keyless self-host: `livekit-server --dev` boots locally with placeholder keys and
      // serves HTTP 200 on :7880; probe polls it then tears down.
      probeId: 'local-server-keyless-boot',
      productId: 'livekit-agents',
      storyIds: ['self-host-oss-runtime', 'openness-self-host'],
      bin: 'livekit-server',
      argv: [
        'sh', '-c',
        'pkill -f "livekit-server --dev" 2>/dev/null; (livekit-server --dev >/tmp/pa-livekit.log 2>&1 &); n=0; until curl -s --max-time 2 http://localhost:7880/ >/dev/null 2>&1; do n=$((n+1)); [ $n -ge 20 ] && break; sleep 1; done; curl -s -i --max-time 5 http://localhost:7880/ | head -2; grep -iE "starting in development mode|placeholder keys|starting LiveKit server" /tmp/pa-livekit.log | head -3; pkill -f "livekit-server --dev"; rm -f /tmp/pa-livekit.log',
      ],
      displayCommand: 'livekit-server --dev  # keyless boot, curl :7880, then kill',
      expect: /HTTP\/1\.1 200 OK/,
      timeoutMs: 90_000,
    },
    {
      // livekit-agents framework installs and imports from pypi with no key.
      probeId: 'sdk-pip-import',
      productId: 'livekit-agents',
      storyIds: ['agentic-sdks'],
      bin: 'uv',
      argv: [
        'uv', 'run', '--no-project', '--with', 'livekit-agents', 'python3', '-c',
        'import livekit.agents as a; print("PA_PROBE_OK livekit-agents", a.__version__)',
      ],
      displayCommand: `uv run --with livekit-agents python3 -c 'import livekit.agents as a; print("PA_PROBE_OK livekit-agents", a.__version__)'`,
      expect: /PA_PROBE_OK livekit-agents \d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      // Official Pipecat CLI (pypi pipecat-ai[cli]) runs keylessly via uvx.
      probeId: 'cli-help',
      productId: 'pipecat',
      storyIds: ['agentic-official-cli'],
      bin: 'uvx',
      argv: ['sh', '-c', 'uvx --from "pipecat-ai[cli]" pipecat --help | cat'],
      displayCommand: 'uvx --from "pipecat-ai[cli]" pipecat --help',
      expect: /Command-line tools for building Pipecat AI applications/,
      timeoutMs: 300_000,
    },
    {
      // pipecat-ai framework installs and imports from pypi with no key.
      probeId: 'sdk-pip-import',
      productId: 'pipecat',
      storyIds: ['agentic-sdks', 'self-host-oss-runtime'],
      bin: 'uv',
      argv: [
        'uv', 'run', '--no-project', '--with', 'pipecat-ai', 'python3', '-c',
        'import pipecat; print("PA_PROBE_OK pipecat-ai imported")',
      ],
      displayCommand: `uv run --with pipecat-ai python3 -c 'import pipecat; print("PA_PROBE_OK pipecat-ai imported")'`,
      expect: /PA_PROBE_OK pipecat-ai imported/,
      timeoutMs: 180_000,
    },
  ],
  'notes-knowledge': [
    {
      // Obsidian has no CLI (checked at bring-up), but its community-plugin registry is a
      // public JSON file in the vendor's own obsidian-releases repo — counting it keylessly
      // proves the plugin ecosystem's scale, not just the marketing claim.
      probeId: 'plugin-registry-count',
      productId: 'obsidian',
      storyIds: ['community-plugin-ecosystem'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        `curl -s --max-time 30 https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print("PA_PROBE_OK obsidian community plugins:", len(d))'`,
      ],
      displayCommand: `curl -s https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json | python3 -c 'import json,sys; print("PA_PROBE_OK obsidian community plugins:", len(json.load(sys.stdin)))'`,
      expect: /PA_PROBE_OK obsidian community plugins: \d{4}/,
      timeoutMs: 60_000,
    },
    {
      // Logseq's plugin marketplace is a public registry repo under the vendor org — one
      // package per directory; counting it keylessly proves marketplace scale.
      probeId: 'marketplace-registry-count',
      productId: 'logseq',
      storyIds: ['community-plugin-ecosystem'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        `curl -s --max-time 30 https://api.github.com/repos/logseq/marketplace/contents/packages | python3 -c 'import json,sys; d=json.load(sys.stdin); print("PA_PROBE_OK logseq marketplace packages:", len(d))'`,
      ],
      displayCommand: `curl -s https://api.github.com/repos/logseq/marketplace/contents/packages | python3 -c 'import json,sys; print("PA_PROBE_OK logseq marketplace packages:", len(json.load(sys.stdin)))'`,
      expect: /PA_PROBE_OK logseq marketplace packages: \d{3}/,
      timeoutMs: 60_000,
    },
    {
      // Official Anytype MCP server (npm @anyproto/anytype-mcp) launches keylessly from npx;
      // without the local Anytype app it prints its startup banner and the API-connection
      // requirement — proof the vendor ships a real MCP server binary that fronts the local API.
      probeId: 'mcp-stdio-launch',
      productId: 'anytype',
      storyIds: ['agentic-mcp-server'],
      bin: 'npx',
      argv: ['npx', '-y', '@anyproto/anytype-mcp'],
      displayCommand: `echo '<jsonrpc initialize>' | npx -y @anyproto/anytype-mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /Initializing Anytype MCP Server/,
      longRunning: true,
      timeoutMs: 180_000,
    },
    {
      // The local API's machine-readable OpenAPI spec ships in the vendor's core repo
      // (anytype-heart, the engine every desktop app embeds) — fetched keylessly.
      probeId: 'openapi-spec-in-repo',
      productId: 'anytype',
      storyIds: ['api-machine-spec'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        `curl -s --max-time 30 https://raw.githubusercontent.com/anyproto/anytype-heart/main/core/api/docs/openapi.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print("PA_PROBE_OK anytype openapi:", d.get("openapi", d.get("swagger","spec")), "paths:", len(d.get("paths",{})))'`,
      ],
      displayCommand: `curl -s https://raw.githubusercontent.com/anyproto/anytype-heart/main/core/api/docs/openapi.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print("PA_PROBE_OK anytype openapi:", d.get("openapi"), "paths:", len(d.get("paths",{})))'`,
      expect: /PA_PROBE_OK anytype openapi: .* paths: \d+/,
      timeoutMs: 60_000,
    },
    {
      // Capacities publishes a machine-readable OpenAPI 3.1 spec and the live API answers a
      // keyless request with a clean 401 — spec + live-endpoint pair.
      probeId: 'openapi-and-live-api',
      productId: 'capacities',
      storyIds: ['agentic-public-api', 'api-machine-spec'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        'curl -s --max-time 20 https://api.capacities.io/openapi.json | head -c 200; echo; curl -s -i --max-time 20 https://api.capacities.io/spaces | head -6',
      ],
      displayCommand: 'curl -s https://api.capacities.io/openapi.json | head -c 200; curl -si https://api.capacities.io/spaces | head -6',
      expect: /"openapi":"3\.1\.0"[\s\S]*HTTP\/2 401/,
      timeoutMs: 60_000,
    },
    {
      // Hosted Capacities MCP server draws a keyless 401 with MCP OAuth resource metadata and
      // mcp:read/mcp:write scopes — live, protocol-speaking endpoint.
      probeId: 'mcp-remote-handshake',
      productId: 'capacities',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.capacities.io/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.capacities.io/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*mcp:read mcp:write/,
      timeoutMs: 30_000,
    },
    {
      // Reflect's documented REST API (base reflect.app/api) answers keyless requests with a
      // clean JSON 401 — the endpoint documented at reflect.academy/api is live.
      probeId: 'api-keyless-401',
      productId: 'reflect',
      storyIds: ['agentic-public-api'],
      bin: 'curl',
      argv: ['curl', '-s', '-i', '--max-time', '20', 'https://reflect.app/api/graphs'],
      displayCommand: 'curl -si https://reflect.app/api/graphs',
      expect: /HTTP\/2 401[\s\S]*Authentication required/,
      timeoutMs: 30_000,
    },
  ],
  'meeting-ai': [
    {
      // Granola's hosted MCP server draws a keyless 401 with MCP OAuth resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'granola',
      storyIds: ['agentic-mcp-server', 'meeting-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.granola.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.granola.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Fireflies' hosted MCP server draws a keyless 401 with MCP OAuth resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'fireflies',
      storyIds: ['agentic-mcp-server', 'meeting-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.fireflies.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.fireflies.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Fireflies docs MCP completes a FULL keyless initialize handshake (Mintlify docs MCP).
      probeId: 'docs-mcp-handshake',
      productId: 'fireflies',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://docs.fireflies.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://docs.fireflies.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"result":\{"protocolVersion"/,
      timeoutMs: 30_000,
    },
    {
      // Fireflies GraphQL API answers a keyless query with its documented auth challenge.
      probeId: 'graphql-keyless-auth',
      productId: 'fireflies',
      storyIds: ['agentic-public-api', 'transcripts-via-api'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.fireflies.ai/graphql',
        '-H', 'Content-Type: application/json',
        '-d', '{"query":"{ user { email } }"}',
      ],
      displayCommand: `curl -si -X POST https://api.fireflies.ai/graphql -H 'Content-Type: application/json' -d '{"query":"{ user { email } }"}'`,
      expect: /auth_failed/,
      timeoutMs: 30_000,
    },
    {
      // Otter's hosted MCP server draws a keyless 401 with MCP OAuth resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'otter',
      storyIds: ['agentic-mcp-server', 'meeting-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.otter.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.otter.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Fathom's hosted MCP server draws a keyless 401 with MCP OAuth resource metadata.
      probeId: 'mcp-remote-handshake',
      productId: 'fathom',
      storyIds: ['agentic-mcp-server', 'meeting-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.fathom.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.fathom.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Fathom's documented REST base answers keylessly with 401 plus its documented
      // RateLimit-* headers — live endpoint matching developers.fathom.ai exactly.
      probeId: 'api-keyless-401',
      productId: 'fathom',
      storyIds: ['agentic-public-api', 'transcripts-via-api'],
      bin: 'curl',
      argv: ['curl', '-s', '-i', '--max-time', '20', 'https://api.fathom.ai/external/v1/meetings'],
      displayCommand: 'curl -si https://api.fathom.ai/external/v1/meetings',
      expect: /HTTP\/2 401[\s\S]*ratelimit-limit/i,
      timeoutMs: 30_000,
    },
    {
      // Fathom publishes its machine-readable OpenAPI spec at the URL its own llms.txt
      // advertises — fetched keylessly.
      probeId: 'openapi-spec',
      productId: 'fathom',
      storyIds: ['api-machine-spec'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        'curl -s --max-time 30 https://developers.fathom.ai/api-reference/openapi.yaml | head -8',
      ],
      displayCommand: 'curl -s https://developers.fathom.ai/api-reference/openapi.yaml | head -8',
      expect: /openapi: 3\.\d/,
      timeoutMs: 60_000,
    },
    {
      // Fellow's hosted MCP server draws a keyless 401 Bearer challenge at the documented URL.
      probeId: 'mcp-remote-handshake',
      productId: 'fellow',
      storyIds: ['agentic-mcp-server', 'meeting-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://fellow.app/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://fellow.app/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401[\s\S]*Bearer/,
      timeoutMs: 30_000,
    },
  ],
  'gpu-clouds': [
    {
      probeId: 'cli-version',
      productId: 'runpod',
      storyIds: ['agentic-official-cli'],
      bin: 'runpodctl',
      argv: ['runpodctl', 'version'],
      displayCommand: 'runpodctl version  # installed via `brew install runpod/runpodctl/runpodctl`',
      expect: /runpodctl \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-help',
      productId: 'runpod',
      storyIds: ['agentic-official-cli', 'agent-provisions-gpu'],
      bin: 'runpodctl',
      argv: ['sh', '-c', 'runpodctl --help | cat'],
      displayCommand: 'runpodctl --help',
      expect: /manage gpu pods/,
      timeoutMs: 30_000,
    },
    {
      // Hosted API MCP server (mcp.getrunpod.io) draws a keyless 401 with its OAuth
      // protected-resource challenge — live, Sign-in-with-Runpod-gated, as documented.
      probeId: 'mcp-remote-handshake',
      productId: 'runpod',
      storyIds: ['agentic-mcp-server', 'agent-provisions-gpu'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.getrunpod.io/',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.getrunpod.io/ -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // The documented no-auth docs MCP server completes a FULL keyless initialize handshake.
      probeId: 'docs-mcp-handshake',
      productId: 'runpod',
      storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 -X POST https://docs.runpod.io/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '${CURL_MCP_INIT.replace(/'/g, `'\\''`)}' | head -c 700`,
      ],
      displayCommand: `curl -s -X POST https://docs.runpod.io/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo"/,
      timeoutMs: 30_000,
    },
    {
      // Public OpenAPI spec + the live REST API answering keylessly with 401 — the documented
      // machine-readable surface an agent provisions Pods through.
      probeId: 'openapi-and-live-api',
      productId: 'runpod',
      storyIds: ['agentic-public-api', 'api-machine-spec', 'agent-provisions-gpu'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s --max-time 20 https://rest.runpod.io/v1/openapi.json | head -c 300; echo; curl -s -i --max-time 20 https://rest.runpod.io/v1/pods | head -4',
      ],
      displayCommand: 'curl -s https://rest.runpod.io/v1/openapi.json | head -c 300 && curl -si https://rest.runpod.io/v1/pods',
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // Lambda publishes its Cloud API OpenAPI 3.1 spec keylessly; the live API next to it
      // answers a bare request with 401 — spec + auth-gate pair, no account involved.
      probeId: 'openapi-and-live-api',
      productId: 'lambda-labs',
      storyIds: ['agentic-public-api', 'api-machine-spec', 'agent-provisions-gpu'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s --max-time 20 https://cloud.lambda.ai/api/v1/openapi.json | head -c 400; echo; curl -s -i --max-time 20 https://cloud.lambda.ai/api/v1/instances | head -4',
      ],
      displayCommand: 'curl -s https://cloud.lambda.ai/api/v1/openapi.json | head -c 400 && curl -si https://cloud.lambda.ai/api/v1/instances',
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // CKS provisioning API (api.coreweave.com) is live and token-gated: bare list-clusters
      // GET draws 401 exactly as the API reference documents.
      probeId: 'api-keyless-authgate',
      productId: 'coreweave',
      storyIds: ['agentic-public-api', 'agent-provisions-gpu'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s -i --max-time 20 https://api.coreweave.com/v1beta1/cks/clusters | head -4',
      ],
      displayCommand: 'curl -si https://api.coreweave.com/v1beta1/cks/clusters',
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // CoreWeave's docs MCP endpoint completes a full keyless initialize handshake
      // (serverInfo "CoreWeave Docs") — agent-readable docs over MCP.
      probeId: 'docs-mcp-handshake',
      productId: 'coreweave',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 -X POST https://docs.coreweave.com/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '${CURL_MCP_INIT.replace(/'/g, `'\\''`)}' | head -c 700`,
      ],
      displayCommand: `curl -s -X POST https://docs.coreweave.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo":\{"name":"CoreWeave Docs"/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-help',
      productId: 'vast-ai',
      storyIds: ['agentic-official-cli'],
      bin: 'uvx',
      argv: ['sh', '-c', 'uvx --from vastai vastai --help | cat'],
      displayCommand: 'uvx --from vastai vastai --help',
      expect: /usage: vastai/,
      timeoutMs: 240_000,
    },
    {
      // The arena's signature probe: the official CLI searches the LIVE GPU marketplace with
      // no account and no key — real RTX 4090 offers with real prices come back.
      probeId: 'cli-keyless-market-search',
      productId: 'vast-ai',
      storyIds: ['keyless-catalog-pricing-api', 'gpu-availability-transparency', 'agentic-official-cli'],
      bin: 'uvx',
      argv: ['sh', '-c', `uvx --from vastai vastai search offers 'gpu_name=RTX_4090 num_gpus=1' -o 'dph' | head -12`],
      displayCommand: `uvx --from vastai vastai search offers 'gpu_name=RTX_4090 num_gpus=1' -o 'dph' | head -12`,
      expect: /RTX_4090/,
      timeoutMs: 240_000,
    },
    {
      // Same keyless market read straight off the REST endpoint: live offers with per-GPU-hour
      // prices (dph_total) from a bare GET.
      probeId: 'api-keyless-offer-search',
      productId: 'vast-ai',
      storyIds: ['keyless-catalog-pricing-api', 'agentic-public-api'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 'https://console.vast.ai/api/v0/bundles/' -H 'Accept: application/json' | head -c 600`,
      ],
      displayCommand: `curl -s 'https://console.vast.ai/api/v0/bundles/' | head -c 600`,
      expect: /"dph_total"/,
      timeoutMs: 30_000,
    },
    {
      // Official installer into a throwaway HOME (installs to ~/.paperspace/bin), then a real
      // version print — nothing escapes the fixture.
      probeId: 'cli-install-version',
      productId: 'paperspace',
      storyIds: ['agentic-official-cli'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `h=$(mktemp -d) && HOME="$h" sh -c 'curl -fsSL https://paperspace.com/install.sh | sh >/dev/null 2>&1; "$HOME/.paperspace/bin/pspace" version; "$HOME/.paperspace/bin/pspace" --help | head -16' ; rm -rf "$h"`,
      ],
      displayCommand: `HOME=$(mktemp -d) sh -c 'curl -fsSL https://paperspace.com/install.sh | sh && ~/.paperspace/bin/pspace version && ~/.paperspace/bin/pspace --help'`,
      expect: /pspace v\d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
  ],
  'feature-flags': [
    {
      probeId: 'cli-version',
      productId: 'launchdarkly',
      storyIds: ['agentic-official-cli'],
      bin: 'ldcli',
      argv: ['ldcli', '--version'],
      displayCommand: 'ldcli --version  # installed via `brew tap launchdarkly/homebrew-tap && brew install ldcli`',
      expect: /ldcli version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Official npm MCP server completes a full keyless stdio initialize handshake
      // (tool calls authenticate later with an API key).
      probeId: 'mcp-stdio-handshake',
      productId: 'launchdarkly',
      storyIds: ['agentic-mcp-server', 'agent-toggles-flag-safely'],
      bin: 'npx',
      argv: ['sh', '-c', 'npx -y @launchdarkly/mcp-server start --transport stdio'],
      displayCommand: `echo '<jsonrpc initialize>' | npx -y @launchdarkly/mcp-server start --transport stdio`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo":\{"name":"LaunchDarkly"/,
      longRunning: true,
      timeoutMs: 180_000,
    },
    {
      // Documented hosted MCP endpoint draws a keyless 401 — live and auth-gated.
      probeId: 'mcp-remote-handshake',
      productId: 'launchdarkly',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.launchdarkly.com/mcp/launchdarkly',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.launchdarkly.com/mcp/launchdarkly -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'statsig',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@statsig/siggy', '--version'],
      displayCommand: 'npx -y @statsig/siggy --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Hosted Statsig MCP answers keylessly with its OAuth protected-resource challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'statsig',
      storyIds: ['agentic-mcp-server', 'agent-toggles-flag-safely'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.statsig.com/v1/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.statsig.com/v1/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // Documented no-auth docs MCP server: full keyless initialize (serverInfo statsig-docs).
      probeId: 'docs-mcp-handshake',
      productId: 'statsig',
      storyIds: ['agentic-agent-docs', 'agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 -X POST https://docs.statsig.com/api/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '${CURL_MCP_INIT.replace(/'/g, `'\\''`)}' | head -c 500`,
      ],
      displayCommand: `curl -s -X POST https://docs.statsig.com/api/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo":\{"name":"statsig-docs"/,
      timeoutMs: 30_000,
    },
    {
      // Official npm MCP server: full keyless stdio initialize handshake.
      probeId: 'mcp-stdio-handshake',
      productId: 'growthbook',
      storyIds: ['agentic-mcp-server', 'agent-toggles-flag-safely'],
      bin: 'npx',
      argv: ['sh', '-c', 'npx -y @growthbook/mcp'],
      displayCommand: `echo '<jsonrpc initialize>' | npx -y @growthbook/mcp`,
      stdinPayload: MCP_INITIALIZE,
      expect: /"serverInfo":\{"name":"GrowthBook MCP/,
      longRunning: true,
      timeoutMs: 180_000,
    },
    {
      // Full keyless self-host roundtrip: boot mongo + the official image, register the first
      // user through the API, create an org and a boolean feature, mint an SDK connection, and
      // read the flag back from the keyless SDK-payload endpoint. Self-cleaned.
      probeId: 'docker-flag-create-evaluate-roundtrip',
      productId: 'growthbook',
      storyIds: ['self-host-open-source', 'openness-self-host', 'agent-toggles-flag-safely'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-gb-probe pa-gb-mongo >/dev/null 2>&1; docker network rm pa-gb-net >/dev/null 2>&1; docker network create pa-gb-net >/dev/null && docker run -d --name pa-gb-mongo --network pa-gb-net -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=password mongo:6 >/dev/null && docker run -d --name pa-gb-probe --network pa-gb-net -p 13100:3100 -e "MONGODB_URI=mongodb://root:password@pa-gb-mongo:27017/growthbook?authSource=admin" -e APP_ORIGIN=http://localhost:13000 -e API_HOST=http://localhost:13100 -e JWT_SECRET=pa-probe-secret -e ENCRYPTION_KEY=pa-probe-enc-key growthbook/growthbook:latest >/dev/null; n=0; until curl -s http://localhost:13100/healthcheck >/dev/null 2>&1; do n=$((n+1)); [ $n -ge 90 ] && break; sleep 2; done; curl -s http://localhost:13100/healthcheck; echo; curl -s -X POST http://localhost:13100/auth/register -H "Content-Type: application/json" -d "{\\"companyname\\":\\"PA Probe\\",\\"name\\":\\"PA Probe\\",\\"email\\":\\"probe@example.com\\",\\"password\\":\\"pa-Probe-Passw0rd!\\"}" >/dev/null; TOKEN=$(curl -s -X POST http://localhost:13100/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"probe@example.com\\",\\"password\\":\\"pa-Probe-Passw0rd!\\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"token\\"])"); ORG=$(curl -s -X POST http://localhost:13100/organization -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\\"company\\":\\"PA Probe\\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"orgId\\"])"); echo "org: $ORG"; TOKEN=$(curl -s -X POST http://localhost:13100/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"probe@example.com\\",\\"password\\":\\"pa-Probe-Passw0rd!\\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"token\\"])"); curl -s -X POST http://localhost:13100/feature -H "Authorization: Bearer $TOKEN" -H "X-Organization: $ORG" -H "Content-Type: application/json" -d "{\\"id\\":\\"pa-probe-flag\\",\\"valueType\\":\\"boolean\\",\\"defaultValue\\":\\"true\\",\\"description\\":\\"probe\\",\\"environmentSettings\\":{\\"production\\":{\\"enabled\\":true,\\"rules\\":[]}},\\"project\\":\\"\\",\\"tags\\":[]}" | head -c 120; echo; KEY=$(curl -s -X POST http://localhost:13100/sdk-connections -H "Authorization: Bearer $TOKEN" -H "X-Organization: $ORG" -H "Content-Type: application/json" -d "{\\"name\\":\\"pa-probe\\",\\"languages\\":[\\"javascript\\"],\\"environment\\":\\"production\\",\\"sdkVersion\\":\\"1.0.0\\",\\"projects\\":[]}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"connection\\"][\\"key\\"])"); echo "sdk key: $KEY"; curl -s "http://localhost:13100/api/features/$KEY"; echo; docker rm -f pa-gb-probe pa-gb-mongo >/dev/null 2>&1; docker network rm pa-gb-net >/dev/null 2>&1',
      ],
      displayCommand: 'docker run -d mongo:6 && docker run -d -p 13100:3100 growthbook/growthbook && POST /auth/register && POST /organization && POST /feature {id: pa-probe-flag} && POST /sdk-connections && curl /api/features/<sdk-key>',
      // The API pretty-prints its JSON, so allow whitespace/newlines between the tokens.
      expect: /"pa-probe-flag":[\s\S]{0,40}"defaultValue":\s*true/,
      timeoutMs: 420_000,
    },
    {
      // Hosted Flagsmith MCP endpoint draws a keyless 401 — live and key-gated as documented.
      probeId: 'mcp-remote-handshake',
      productId: 'flagsmith',
      storyIds: ['agentic-mcp-server', 'agent-toggles-flag-safely'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.flagsmith.com',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.flagsmith.com -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /HTTP\/2 401/,
      timeoutMs: 30_000,
    },
    {
      // Full keyless self-host roundtrip: postgres + the official unified image, register the
      // first user via the API, create org → project → environment, create a flag enabled by
      // default, then evaluate it KEYLESSLY via the environment's client-side key. Self-cleaned.
      probeId: 'docker-flag-create-evaluate-roundtrip',
      productId: 'flagsmith',
      storyIds: ['self-host-open-source', 'openness-self-host', 'agent-toggles-flag-safely'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-flagsmith-probe pa-flagsmith-db >/dev/null 2>&1; docker network rm pa-flagsmith-net >/dev/null 2>&1; docker network create pa-flagsmith-net >/dev/null && docker run -d --name pa-flagsmith-db --network pa-flagsmith-net -e POSTGRES_DB=flagsmith -e POSTGRES_USER=flagsmith -e POSTGRES_PASSWORD=flagsmith postgres:16-alpine >/dev/null && docker run -d --name pa-flagsmith-probe --network pa-flagsmith-net -p 18000:8000 -e "DATABASE_URL=postgresql://flagsmith:flagsmith@pa-flagsmith-db:5432/flagsmith" -e "DJANGO_ALLOWED_HOSTS=*" flagsmith/flagsmith:latest >/dev/null; n=0; until curl -s http://localhost:18000/health >/dev/null 2>&1; do n=$((n+1)); [ $n -ge 90 ] && break; sleep 2; done; curl -s -i http://localhost:18000/health | head -1; curl -s -X POST http://localhost:18000/api/v1/auth/users/ -H "Content-Type: application/json" -d "{\\"email\\":\\"probe@example.com\\",\\"password\\":\\"pa-Probe-Passw0rd!\\",\\"first_name\\":\\"PA\\",\\"last_name\\":\\"Probe\\"}" >/dev/null; TOKEN=$(curl -s -X POST http://localhost:18000/api/v1/auth/login/ -H "Content-Type: application/json" -d "{\\"email\\":\\"probe@example.com\\",\\"password\\":\\"pa-Probe-Passw0rd!\\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"key\\"])"); ORG=$(curl -s -X POST http://localhost:18000/api/v1/organisations/ -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" -d "{\\"name\\":\\"PA Probe Org\\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"id\\"])"); PROJ=$(curl -s -X POST http://localhost:18000/api/v1/projects/ -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" -d "{\\"name\\":\\"pa-probe\\",\\"organisation\\":$ORG}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"id\\"])"); ENVKEY=$(curl -s -X POST http://localhost:18000/api/v1/environments/ -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" -d "{\\"name\\":\\"Development\\",\\"project\\":$PROJ}" | python3 -c "import json,sys; print(json.load(sys.stdin)[\\"api_key\\"])"); echo "env key: $ENVKEY"; curl -s -X POST "http://localhost:18000/api/v1/projects/$PROJ/features/" -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" -d "{\\"name\\":\\"pa_probe_flag\\",\\"default_enabled\\":true}" | head -c 120; echo; curl -s http://localhost:18000/api/v1/flags/ -H "X-Environment-Key: $ENVKEY" | head -c 400; echo; docker rm -f pa-flagsmith-probe pa-flagsmith-db >/dev/null 2>&1; docker network rm pa-flagsmith-net >/dev/null 2>&1',
      ],
      displayCommand: 'docker run -d postgres:16-alpine && docker run -d -p 18000:8000 flagsmith/flagsmith && POST /api/v1/auth/users/ && POST /organisations/ && POST /projects/ && POST /environments/ && POST /features/ {pa_probe_flag} && curl /api/v1/flags/ -H "X-Environment-Key: <key>"',
      expect: /"name":"pa_probe_flag".*"enabled":true|"enabled":true.*"pa_probe_flag"/,
      timeoutMs: 420_000,
    },
    {
      // Full keyless self-host roundtrip: postgres + the official image with INIT tokens,
      // create a flag via the Admin API, attach a strategy, enable it in development, then
      // evaluate it through the Client API — the exact loop an agent runs. Self-cleaned.
      probeId: 'docker-flag-create-evaluate-roundtrip',
      productId: 'unleash',
      storyIds: ['self-host-open-source', 'openness-self-host', 'agent-toggles-flag-safely'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-unleash-probe pa-unleash-db >/dev/null 2>&1; docker network rm pa-unleash-net >/dev/null 2>&1; docker network create pa-unleash-net >/dev/null && docker run -d --name pa-unleash-db --network pa-unleash-net -e POSTGRES_DB=unleash -e POSTGRES_USER=unleash -e POSTGRES_PASSWORD=unleash postgres:16-alpine >/dev/null && docker run -d --name pa-unleash-probe --network pa-unleash-net -p 14242:4242 -e DATABASE_HOST=pa-unleash-db -e DATABASE_NAME=unleash -e DATABASE_USERNAME=unleash -e DATABASE_PASSWORD=unleash -e DATABASE_SSL=false -e "INIT_ADMIN_API_TOKENS=*:*.pa-probe-admin-token" -e "INIT_CLIENT_API_TOKENS=default:development.pa-probe-client-token" unleashorg/unleash-server:latest >/dev/null; n=0; until curl -s http://localhost:14242/health >/dev/null 2>&1; do n=$((n+1)); [ $n -ge 90 ] && break; sleep 2; done; curl -s http://localhost:14242/health; echo; curl -s -X POST http://localhost:14242/api/admin/projects/default/features -H "Authorization: *:*.pa-probe-admin-token" -H "Content-Type: application/json" -d "{\\"name\\":\\"pa-probe-flag\\",\\"type\\":\\"release\\"}" | head -c 170; echo; curl -s -X POST http://localhost:14242/api/admin/projects/default/features/pa-probe-flag/environments/development/strategies -H "Authorization: *:*.pa-probe-admin-token" -H "Content-Type: application/json" -d "{\\"name\\":\\"default\\"}" | head -c 120; echo; curl -s -X POST http://localhost:14242/api/admin/projects/default/features/pa-probe-flag/environments/development/on -H "Authorization: *:*.pa-probe-admin-token" -o /dev/null -w "enable -> HTTP %{http_code}"; echo; curl -s http://localhost:14242/api/client/features/pa-probe-flag -H "Authorization: default:development.pa-probe-client-token"; echo; docker rm -f pa-unleash-probe pa-unleash-db >/dev/null 2>&1; docker network rm pa-unleash-net >/dev/null 2>&1',
      ],
      displayCommand: 'docker run -d postgres:16-alpine && docker run -d -p 14242:4242 -e INIT_ADMIN_API_TOKENS=... -e INIT_CLIENT_API_TOKENS=... unleashorg/unleash-server && POST /api/admin/projects/default/features {pa-probe-flag} && POST .../strategies && POST .../environments/development/on && curl /api/client/features/pa-probe-flag',
      expect: /"name":"pa-probe-flag","type":"release","enabled":true/,
      timeoutMs: 420_000,
    },
    {
      // Unleash's docs MCP endpoint completes a full keyless initialize handshake.
      probeId: 'docs-mcp-handshake',
      productId: 'unleash',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s --max-time 20 -X POST https://docs.getunleash.io/_mcp/server -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '${CURL_MCP_INIT.replace(/'/g, `'\\''`)}' | head -c 400`,
      ],
      displayCommand: `curl -s -X POST https://docs.getunleash.io/_mcp/server -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /"serverInfo"/,
      timeoutMs: 30_000,
    },
  ],
  'serverless-databases': [
    {
      // Official Neon CLI (npm package renamed neonctl → neon): version prints keylessly.
      probeId: 'cli-version',
      productId: 'neon',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', 'neon@latest', '--version'],
      displayCommand: 'npx -y neon@latest --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Hosted Neon MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'neon',
      storyIds: ['agentic-mcp-server', 'agent-provisions-database'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.neon.tech/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.neon.tech/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Official Turso CLI, installed via the vendor's get.tur.so installer into ~/.turso.
      probeId: 'cli-version',
      productId: 'turso',
      storyIds: ['agentic-official-cli', 'cli-daily-workflow'],
      bin: 'sh',
      argv: ['sh', '-c', '"$HOME/.turso/turso" --version'],
      displayCommand: 'turso --version  # installed via `curl -sSfL https://get.tur.so/install.sh | bash`',
      expect: /turso version v\d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // `turso dev` boots a KEYLESS local libSQL server (sqld); a real SQL roundtrip —
      // CREATE / INSERT / SELECT — runs over the Hrana HTTP pipeline API, then the server dies.
      probeId: 'local-dev-roundtrip',
      productId: 'turso',
      storyIds: ['local-keyless-engine', 'agentic-headless'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        'export PATH="$HOME/.turso:$PATH"; rm -f /tmp/pa-turso-probe.db*; pkill -f "sqld" 2>/dev/null; (turso dev --db-file /tmp/pa-turso-probe.db --port 8085 >/tmp/pa-turso-probe.log 2>&1 &); n=0; until curl -s --max-time 2 http://127.0.0.1:8085/health >/dev/null 2>&1; do n=$((n+1)); [ $n -ge 20 ] && break; sleep 1; done; curl -s --max-time 10 -X POST http://127.0.0.1:8085/v2/pipeline -H "Content-Type: application/json" -d "{\\"requests\\":[{\\"type\\":\\"execute\\",\\"stmt\\":{\\"sql\\":\\"CREATE TABLE arenas (id INTEGER PRIMARY KEY)\\"}},{\\"type\\":\\"execute\\",\\"stmt\\":{\\"sql\\":\\"INSERT INTO arenas (id) VALUES (6)\\"}},{\\"type\\":\\"execute\\",\\"stmt\\":{\\"sql\\":\\"SELECT id*7 AS answer FROM arenas\\"}},{\\"type\\":\\"close\\"}]}"; echo; grep -i "sqld listening" /tmp/pa-turso-probe.log | head -1; pkill -f "sqld"; rm -f /tmp/pa-turso-probe.db* /tmp/pa-turso-probe.log',
      ],
      displayCommand: 'turso dev --db-file /tmp/pa-turso-probe.db --port 8085  # local libSQL, no account — then CREATE/INSERT/SELECT (6*7) over the Hrana HTTP API',
      expect: /"type":"integer","value":"42"/,
      timeoutMs: 90_000,
    },
    {
      // Hosted Turso Cloud MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'turso',
      storyIds: ['agentic-mcp-server', 'agent-provisions-database'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.turso.ai/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.turso.ai/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      probeId: 'cli-version',
      productId: 'planetscale',
      storyIds: ['agentic-official-cli'],
      bin: 'pscale',
      argv: ['pscale', '--version'],
      displayCommand: 'pscale --version  # installed via `brew install planetscale/tap/pscale`',
      expect: /pscale version \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // `pscale --skill` prints a packaged agent guide (frontmatter name: pscale-cli) keylessly —
      // vendor-shipped agent docs inside the CLI binary itself.
      probeId: 'cli-agent-skill',
      productId: 'planetscale',
      storyIds: ['agentic-agent-docs', 'agentic-headless'],
      bin: 'pscale',
      argv: ['sh', '-c', 'pscale --skill | cat'],
      displayCommand: 'pscale --skill',
      expect: /name: pscale-cli/,
      timeoutMs: 30_000,
    },
    {
      // Hosted PlanetScale MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'planetscale',
      storyIds: ['agentic-mcp-server', 'agent-safe-sql-operations'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.pscale.dev/mcp/planetscale',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.pscale.dev/mcp/planetscale -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // Single official binary from the vendor's `curl https://clickhouse.com/ | sh` installer.
      probeId: 'cli-version',
      productId: 'clickhouse',
      storyIds: ['agentic-official-cli'],
      bin: 'sh',
      argv: ['sh', '-c', '"$HOME/.clickhouse-bin/clickhouse" --version'],
      displayCommand: 'clickhouse --version  # installed via `curl https://clickhouse.com/ | sh`',
      expect: /ClickHouse local version \d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // clickhouse-local runs a REAL analytical SQL roundtrip fully keylessly — CREATE TABLE,
      // INSERT, aggregate SELECT — no server, no account, no config.
      probeId: 'local-query-roundtrip',
      productId: 'clickhouse',
      storyIds: ['local-keyless-engine', 'analytical-queries', 'openness-self-host'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        '"$HOME/.clickhouse-bin/clickhouse" local --query "CREATE TABLE arenas (id UInt32, name String) ENGINE = MergeTree ORDER BY id; INSERT INTO arenas VALUES (1, \'serverless\'), (2, \'databases\'); SELECT concat(\'PA_PROBE_OK rows=\', toString(count()), \' names=\', arrayStringConcat(groupArray(name), \'+\')) FROM arenas;"',
      ],
      displayCommand: `clickhouse local --query "CREATE TABLE arenas ...; INSERT INTO arenas VALUES ...; SELECT concat('PA_PROBE_OK rows=', toString(count()), ...) FROM arenas;"`,
      expect: /PA_PROBE_OK rows=2 names=serverless\+databases/,
      timeoutMs: 60_000,
    },
    {
      // Official mcp-clickhouse (pypi) completes a FULL keyless stdio initialize handshake —
      // serverInfo comes back openly; connection credentials are only needed at tool-call time.
      probeId: 'mcp-stdio-handshake',
      productId: 'clickhouse',
      storyIds: ['agentic-mcp-server', 'agent-safe-sql-operations'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        `printf '%s\\n' '${MCP_INITIALIZE.trim().replace(/'/g, "'\\''")}' | CLICKHOUSE_HOST=localhost CLICKHOUSE_USER=default CLICKHOUSE_PASSWORD= uvx mcp-clickhouse 2>/dev/null | head -1`,
      ],
      displayCommand: `printf '<jsonrpc initialize>' | uvx mcp-clickhouse  # stdio handshake, no ClickHouse credentials`,
      expect: /"serverInfo":\{"name":"mcp-clickhouse"/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'cli-version',
      productId: 'cockroachdb',
      storyIds: ['agentic-official-cli'],
      bin: 'cockroach',
      argv: ['cockroach', 'version'],
      displayCommand: 'cockroach version  # installed via `brew install cockroachdb/tap/cockroach`',
      expect: /Build Tag:\s+v\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // `cockroach demo` boots a KEYLESS in-memory single-node cluster and runs a real SQL
      // roundtrip — CREATE / INSERT / SELECT — then exits on its own.
      probeId: 'local-demo-roundtrip',
      productId: 'cockroachdb',
      storyIds: ['local-keyless-engine', 'agentic-headless'],
      bin: 'cockroach',
      argv: [
        'cockroach', 'demo', '--no-example-database', '--insecure=true',
        '-e', "CREATE TABLE arenas (id INT PRIMARY KEY, name STRING); INSERT INTO arenas VALUES (1, 'serverless-databases'); SELECT 'ROUNDTRIP=' || count(*)::STRING FROM arenas;",
      ],
      displayCommand: `cockroach demo --no-example-database --insecure=true -e "CREATE TABLE arenas ...; INSERT ...; SELECT 'ROUNDTRIP=' || count(*)::STRING FROM arenas;"`,
      expect: /ROUNDTRIP=1/,
      timeoutMs: 120_000,
    },
    {
      // Hosted CockroachDB Cloud MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'cockroachdb',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://cockroachlabs.cloud/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://cockroachlabs.cloud/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
  ],
  'agent-skills': [
    {
      // The open skills.sh CLI runs keylessly from npm.
      probeId: 'cli-version',
      productId: 'skills-cli',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', 'skills', '--version'],
      displayCommand: 'npx -y skills --version',
      expect: /\d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Lists a repo's skills (name + trigger description) WITHOUT installing — the
      // review-before-install path, keyless against a public repo.
      probeId: 'registry-list',
      productId: 'skills-cli',
      storyIds: ['browse-searchable-catalog', 'inspect-before-install'],
      bin: 'npx',
      argv: ['npx', '-y', 'skills', 'add', 'vercel-labs/agent-skills', '--list'],
      displayCommand: 'npx -y skills add vercel-labs/agent-skills --list',
      // The pty recording colorizes the count (`Found \x1b[32m9\x1b[39m skills`) — allow ANSI
      // escapes between the words.
      expect: /Found .{0,12}\d+.{0,12} skills/,
      timeoutMs: 180_000,
    },
    {
      // A REAL end-to-end skill install into a scratch project dir: fetches obra/superpowers,
      // copies one skill into ./.claude/skills, then prints the installed SKILL.md frontmatter.
      // Fully keyless and non-interactive (agent-detected).
      probeId: 'scratch-install-roundtrip',
      productId: 'superpowers',
      storyIds: ['one-command-install', 'agent-installs-skill', 'plain-files-portability'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-sp; mkdir -p /tmp/pa-skill-sp; cd /tmp/pa-skill-sp; npx -y skills add obra/superpowers --skill test-driven-development -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,4p .claude/skills/test-driven-development/SKILL.md; cd /; rm -rf /tmp/pa-skill-sp',
      ],
      displayCommand: 'npx -y skills add obra/superpowers --skill test-driven-development -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: test-driven-development/,
      timeoutMs: 300_000,
    },
    {
      // Same REAL install roundtrip for the official Anthropic skills repo (skill-creator).
      probeId: 'scratch-install-roundtrip',
      productId: 'anthropic-skills',
      storyIds: ['one-command-install', 'agent-installs-skill', 'selective-install'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-an; mkdir -p /tmp/pa-skill-an; cd /tmp/pa-skill-an; npx -y skills add anthropics/skills --skill skill-creator -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .claude/skills/skill-creator/SKILL.md; cd /; rm -rf /tmp/pa-skill-an',
      ],
      displayCommand: 'npx -y skills add anthropics/skills --skill skill-creator -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: skill-creator/,
      timeoutMs: 300_000,
    },
    {
      // Same REAL install roundtrip for mattpocock/skills (tdd) — selective install by name.
      probeId: 'scratch-install-roundtrip',
      productId: 'mattpocock-skills',
      storyIds: ['one-command-install', 'agent-installs-skill', 'selective-install'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-mp; mkdir -p /tmp/pa-skill-mp; cd /tmp/pa-skill-mp; npx -y skills add mattpocock/skills --skill tdd -a claude-code -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .claude/skills/tdd/SKILL.md; cd /; rm -rf /tmp/pa-skill-mp',
      ],
      displayCommand: 'npx -y skills add mattpocock/skills --skill tdd -a claude-code -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: tdd/,
      timeoutMs: 300_000,
    },
    {
      // openai/plugins skills install cross-harness: plugin-creator lands in ./.agents/skills
      // (the Codex agent dir) — proving the catalog's skills are plain portable folders.
      probeId: 'scratch-install-roundtrip',
      productId: 'codex-plugins',
      storyIds: ['agent-installs-skill', 'plain-files-portability'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-skill-cx; mkdir -p /tmp/pa-skill-cx; cd /tmp/pa-skill-cx; npx -y skills add openai/plugins --skill plugin-creator -a codex -y --copy; echo "--- installed SKILL.md frontmatter ---"; sed -n 1,3p .agents/skills/plugin-creator/SKILL.md; cd /; rm -rf /tmp/pa-skill-cx',
      ],
      displayCommand: 'npx -y skills add openai/plugins --skill plugin-creator -a codex -y --copy  # in a scratch dir, then print installed SKILL.md frontmatter',
      expect: /name: plugin-creator/,
      timeoutMs: 300_000,
    },
    {
      // The Codex marketplace manifest is a public, keyless JSON catalog of curated plugins.
      probeId: 'marketplace-manifest',
      productId: 'codex-plugins',
      storyIds: ['browse-searchable-catalog', 'team-distribution'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s https://raw.githubusercontent.com/openai/plugins/HEAD/.agents/plugins/marketplace.json | head -40',
      ],
      displayCommand: 'curl -s https://raw.githubusercontent.com/openai/plugins/HEAD/.agents/plugins/marketplace.json | head -40',
      expect: /"openai-curated"/,
      timeoutMs: 60_000,
    },
  ],
  'data-warehouses': [
    {
      // The official Snowflake CLI installs and prints its version keylessly from pypi.
      probeId: 'cli-version',
      productId: 'snowflake',
      storyIds: ['agentic-official-cli'],
      bin: 'uvx',
      argv: ['uvx', '--from', 'snowflake-cli', 'snow', '--version'],
      displayCommand: 'uvx --from snowflake-cli snow --version',
      // The pty recording colorizes the version segments — allow ANSI escapes inside.
      expect: /Snowflake CLI version: .{0,12}\d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      // `snow sql` documents a fully headless SQL surface: -q, files, and stdin piping
      // ("cat my.sql | snow sql -i") — exactly the path an agent scripts.
      probeId: 'cli-headless-sql-help',
      productId: 'snowflake',
      storyIds: ['agent-runs-sql-headless', 'agentic-headless'],
      bin: 'uvx',
      argv: ['uvx', '--from', 'snowflake-cli', 'snow', 'sql', '--help'],
      displayCommand: 'uvx --from snowflake-cli snow sql --help',
      expect: /Executes Snowflake query/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'cli-version',
      productId: 'databricks',
      storyIds: ['agentic-official-cli'],
      bin: 'databricks',
      argv: ['databricks', '--version'],
      displayCommand: 'databricks --version  # installed via `brew tap databricks/tap && brew install databricks`',
      expect: /Databricks CLI v\d+\.\d+\.\d+/,
      timeoutMs: 60_000,
    },
    {
      // The Databricks CLI SHIPS vendor agent skills: `databricks aitools install --path <dir>`
      // writes the full skill set as plain SKILL.md folders to a scratch dir — keyless, no
      // workspace, no state.
      probeId: 'cli-agent-skills-scratch',
      productId: 'databricks',
      storyIds: ['agentic-agent-docs', 'agentic-official-cli'],
      bin: 'databricks',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-dbx-skills; databricks aitools install --path /tmp/pa-dbx-skills; echo "--- installed skills ---"; find /tmp/pa-dbx-skills -name SKILL.md | sort | head -8; echo "--- frontmatter of databricks-docs ---"; sed -n 1,3p /tmp/pa-dbx-skills/databricks-docs/SKILL.md; rm -rf /tmp/pa-dbx-skills',
      ],
      displayCommand: 'databricks aitools install --path /tmp/pa-dbx-skills  # vendor-shipped agent skills, then list + print one SKILL.md frontmatter',
      expect: /name: databricks-docs/,
      timeoutMs: 180_000,
    },
    {
      // BigQuery's REST surface is publicly self-describing: the v2 discovery document
      // downloads keylessly and machine-readably.
      probeId: 'rest-discovery',
      productId: 'bigquery',
      storyIds: ['agentic-public-api', 'api-machine-spec'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        `curl -s https://bigquery.googleapis.com/discovery/v1/apis/bigquery/v2/rest | python3 -c 'import sys, json; d = json.load(sys.stdin); print("id:", d["id"]); print("title:", d["title"]); print("basePath:", d["basePath"]); print("resources:", ", ".join(sorted(d["resources"])))'`,
      ],
      displayCommand: `curl -s https://bigquery.googleapis.com/discovery/v1/apis/bigquery/v2/rest | python3 -c '<print id/title/basePath/resources>'`,
      // The discovery JSON's top-level key order varies between responses — parse it instead of
      // grepping the first lines.
      expect: /id: bigquery:v2/,
      timeoutMs: 60_000,
    },
    {
      // Google's official MCP Toolbox for Databases (BigQuery prebuilt tools) runs from npm and
      // prints its version keylessly; a live server needs ADC credentials + BIGQUERY_PROJECT.
      probeId: 'mcp-toolbox-version',
      productId: 'bigquery',
      storyIds: ['agentic-mcp-server'],
      bin: 'npx',
      argv: ['npx', '-y', '@toolbox-sdk/server', '--version'],
      displayCommand: 'npx -y @toolbox-sdk/server --version  # MCP Toolbox for Databases (prebuilt BigQuery tools)',
      expect: /toolbox version \d+\.\d+\.\d+/,
      timeoutMs: 180_000,
    },
    {
      // The engine under MotherDuck runs FULLY keyless on this machine: a REAL analytical
      // roundtrip — build a 1M-row table, then an aggregate GROUP BY — in one command.
      probeId: 'local-analytical-roundtrip',
      productId: 'motherduck',
      storyIds: ['local-dev-loop', 'full-sql-surface', 'agentic-official-cli'],
      bin: 'duckdb',
      argv: [
        'duckdb', '-c',
        'CREATE TABLE events AS SELECT range AS id, range % 4 AS region, range * 1.5 AS revenue FROM range(1000000); SELECT region, count(*) AS n, round(sum(revenue),1) AS total_revenue FROM events GROUP BY region ORDER BY region;',
      ],
      displayCommand: `duckdb -c 'CREATE TABLE events AS SELECT ... FROM range(1000000); SELECT region, count(*), sum(revenue) FROM events GROUP BY region'  # keyless in-memory engine`,
      expect: /250000/,
      timeoutMs: 120_000,
    },
    {
      // The official DuckDB/MotherDuck MCP server (pypi) completes a FULL keyless stdio
      // initialize handshake against an in-memory DuckDB — no MotherDuck account.
      probeId: 'mcp-stdio-handshake',
      productId: 'motherduck',
      storyIds: ['agentic-mcp-server', 'agent-runs-sql-headless'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        `{ printf '%s\\n' '${MCP_INITIALIZE.trim().replace(/'/g, "'\\''")}'; sleep 8; } | uvx mcp-server-motherduck --db-path :memory: --read-write 2>/dev/null | head -1 | cut -c 1-400`,
      ],
      displayCommand: `printf '<jsonrpc initialize>' | uvx mcp-server-motherduck --db-path :memory: --read-write  # stdio handshake, no account`,
      expect: /"serverInfo":\{"name":"mcp-server-motherduck"/,
      timeoutMs: 180_000,
    },
    {
      // A REAL analytical query THROUGH MCP: initialize → initialized → tools/call execute_query
      // (aggregate GROUP BY over 1000 generated rows) — the full agent path, entirely keyless.
      probeId: 'mcp-query-roundtrip',
      productId: 'motherduck',
      storyIds: ['agent-runs-sql-headless', 'agentic-mcp-server', 'local-dev-loop'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        `{ printf '%s\\n%s\\n%s\\n' '${MCP_INITIALIZE.trim().replace(/'/g, "'\\''")}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"execute_query","arguments":{"sql":"SELECT region, count(*) AS n, sum(revenue) AS total FROM (SELECT range % 2 AS region, range * 1.5 AS revenue FROM range(1000)) GROUP BY region ORDER BY region"}}}'; sleep 10; } | uvx mcp-server-motherduck --db-path :memory: --read-write 2>/dev/null | tail -1 | cut -c 1-900`,
      ],
      displayCommand: `printf '<initialize> <initialized> <tools/call execute_query GROUP BY>' | uvx mcp-server-motherduck --db-path :memory: --read-write  # real SQL through MCP, keyless`,
      expect: /374250/,
      timeoutMs: 180_000,
    },
    {
      // The hosted MotherDuck remote MCP answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'motherduck',
      storyIds: ['agentic-mcp-server'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://api.motherduck.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://api.motherduck.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // MotherDuck publishes an agentskills.io-conformant discovery manifest at
      // /.well-known/agent-skills — agent-oriented docs as a first-class, machine-readable surface.
      probeId: 'agent-skills-manifest',
      productId: 'motherduck',
      storyIds: ['agentic-agent-docs'],
      bin: 'curl',
      argv: [
        'sh', '-c',
        'curl -s https://motherduck.com/.well-known/agent-skills/index.json | head -20',
      ],
      displayCommand: 'curl -s https://motherduck.com/.well-known/agent-skills/index.json | head -20',
      expect: /schemas\.agentskills\.io/,
      timeoutMs: 60_000,
    },
  ],
  'search-infra': [
    {
      // Official Algolia CLI runs keylessly from npm.
      probeId: 'cli-version',
      productId: 'algolia',
      storyIds: ['agentic-official-cli'],
      bin: 'npx',
      argv: ['npx', '-y', '@algolia/cli', '--version'],
      displayCommand: 'npx -y @algolia/cli --version',
      expect: /algolia version \d+\.\d+\.\d+/,
      timeoutMs: 120_000,
    },
    {
      // Hosted Algolia MCP server answers keylessly with its OAuth challenge.
      probeId: 'mcp-remote-handshake',
      productId: 'algolia',
      storyIds: ['agentic-mcp-server', 'agent-search-tool'],
      bin: 'curl',
      argv: [
        'curl', '-s', '-i', '--max-time', '20', '-X', 'POST', 'https://mcp.algolia.com/mcp',
        '-H', 'Content-Type: application/json',
        '-H', 'Accept: application/json, text/event-stream',
        '-d', CURL_MCP_INIT,
      ],
      displayCommand: `curl -si -X POST https://mcp.algolia.com/mcp -H 'Content-Type: application/json' -d '<jsonrpc initialize>'`,
      expect: /oauth-protected-resource/,
      timeoutMs: 30_000,
    },
    {
      // The full Meilisearch engine binary (brew) prints its version with no account.
      probeId: 'server-version',
      productId: 'meilisearch',
      storyIds: ['agentic-official-cli', 'self-host-full-featured'],
      bin: 'meilisearch',
      argv: ['meilisearch', '--version'],
      displayCommand: 'meilisearch --version  # installed via `brew install meilisearch`',
      expect: /meilisearch \d+\.\d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Boots a fully keyless local Meilisearch (no master key = dev mode), indexes two
      // documents, and runs a REAL typo-tolerant search ("serverles") over HTTP, then dies.
      probeId: 'local-index-search-roundtrip',
      productId: 'meilisearch',
      storyIds: ['five-minute-quickstart', 'typo-tolerance', 'agentic-headless'],
      bin: 'meilisearch',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-meili-probe; pkill -f "meilisearch --db-path /tmp/pa-meili-probe" 2>/dev/null; (meilisearch --db-path /tmp/pa-meili-probe --http-addr 127.0.0.1:7777 --no-analytics >/tmp/pa-meili-probe.log 2>&1 &); n=0; until curl -s --max-time 2 http://127.0.0.1:7777/health | grep -q available; do n=$((n+1)); [ $n -ge 30 ] && break; sleep 1; done; curl -s -X POST http://127.0.0.1:7777/indexes/arenas/documents -H "Content-Type: application/json" -d "[{\\"id\\":1,\\"name\\":\\"serverless databases\\"},{\\"id\\":2,\\"name\\":\\"search infrastructure\\"}]"; echo; sleep 2; curl -s "http://127.0.0.1:7777/indexes/arenas/search?q=serverles"; echo; pkill -f "meilisearch --db-path /tmp/pa-meili-probe"; rm -rf /tmp/pa-meili-probe /tmp/pa-meili-probe.log',
      ],
      displayCommand: 'meilisearch --db-path /tmp/pa-meili-probe --http-addr 127.0.0.1:7777  # no master key, then index 2 docs + typo search q=serverles over HTTP',
      expect: /"hits":\[\{"id":1,"name":"serverless databases"\}\]/,
      timeoutMs: 120_000,
    },
    {
      // Official meilisearch-mcp (pypi) completes a FULL keyless stdio initialize handshake.
      probeId: 'mcp-stdio-handshake',
      productId: 'meilisearch',
      storyIds: ['agentic-mcp-server', 'agent-search-tool'],
      bin: 'uvx',
      argv: [
        'sh', '-c',
        `printf '%s\\n' '${MCP_INITIALIZE.trim().replace(/'/g, "'\\''")}' | uvx meilisearch-mcp 2>/dev/null | head -1`,
      ],
      displayCommand: `printf '<jsonrpc initialize>' | uvx meilisearch-mcp  # stdio handshake, no Meilisearch instance`,
      expect: /"serverInfo":\{"name":"meilisearch"/,
      timeoutMs: 180_000,
    },
    {
      probeId: 'server-version',
      productId: 'typesense',
      storyIds: ['agentic-official-cli', 'self-host-full-featured'],
      bin: 'sh',
      argv: ['sh', '-c', '"/opt/homebrew/opt/typesense-server@30.2/bin/typesense-server" --version 2>&1 | head -1'],
      displayCommand: 'typesense-server --version  # installed via `brew install typesense/tap/typesense-server@30.2`',
      expect: /Typesense \d+\.\d+/,
      timeoutMs: 30_000,
    },
    {
      // Boots a local Typesense with a self-set local API key (no account, no cloud), creates a
      // collection, indexes a document, and runs a REAL typo-tolerant search ("serch infra").
      probeId: 'local-index-search-roundtrip',
      productId: 'typesense',
      storyIds: ['five-minute-quickstart', 'typo-tolerance', 'self-host-full-featured'],
      bin: 'sh',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-ts-probe; mkdir -p /tmp/pa-ts-probe; pkill -f "typesense-server" 2>/dev/null; ("/opt/homebrew/opt/typesense-server@30.2/bin/typesense-server" --data-dir /tmp/pa-ts-probe --api-key=localdev --api-port 8188 >/tmp/pa-ts-probe.log 2>&1 &); n=0; until curl -s --max-time 2 http://127.0.0.1:8188/health | grep -q "\\"ok\\":true"; do n=$((n+1)); [ $n -ge 30 ] && break; sleep 1; done; curl -s -X POST http://127.0.0.1:8188/collections -H "X-TYPESENSE-API-KEY: localdev" -H "Content-Type: application/json" -d "{\\"name\\":\\"arenas\\",\\"fields\\":[{\\"name\\":\\"name\\",\\"type\\":\\"string\\"}]}" >/dev/null; curl -s -X POST http://127.0.0.1:8188/collections/arenas/documents -H "X-TYPESENSE-API-KEY: localdev" -d "{\\"name\\":\\"search infrastructure arena\\"}"; echo; curl -s "http://127.0.0.1:8188/collections/arenas/documents/search?q=serch%20infra&query_by=name" -H "X-TYPESENSE-API-KEY: localdev"; echo; pkill -f "typesense-server"; rm -rf /tmp/pa-ts-probe /tmp/pa-ts-probe.log',
      ],
      displayCommand: 'typesense-server --data-dir /tmp/pa-ts-probe --api-key=localdev --api-port 8188  # local self-set key, then create collection + index doc + typo search q="serch infra"',
      expect: /<mark>search<\/mark> <mark>infra<\/mark>structure arena/,
      timeoutMs: 120_000,
    },
    {
      // Official @elastic/mcp-server-elasticsearch (npm) completes a FULL keyless stdio
      // initialize handshake — only a placeholder ES_URL is needed, no cluster, no credentials.
      probeId: 'mcp-stdio-handshake',
      productId: 'elastic',
      storyIds: ['agentic-mcp-server', 'agent-search-tool'],
      bin: 'npx',
      argv: [
        'sh', '-c',
        `printf '%s\\n' '${MCP_INITIALIZE.trim().replace(/'/g, "'\\''")}' | ES_URL=http://127.0.0.1:9299 npx -y @elastic/mcp-server-elasticsearch 2>/dev/null | grep '"serverInfo"' | head -1`,
      ],
      displayCommand: `printf '<jsonrpc initialize>' | ES_URL=http://127.0.0.1:9299 npx -y @elastic/mcp-server-elasticsearch  # stdio handshake, no cluster`,
      expect: /"serverInfo":\{"name":"elasticsearch-mcp"/,
      timeoutMs: 180_000,
    },
    {
      // Full Elasticsearch boots locally in docker with security disabled (the engine itself is
      // free and runs with no account), then a REAL index + search roundtrip runs over HTTP.
      probeId: 'local-docker-roundtrip',
      productId: 'elastic',
      storyIds: ['self-host-full-featured', 'five-minute-quickstart'],
      bin: 'docker',
      argv: [
        'sh', '-c',
        'docker rm -f pa-es >/dev/null 2>&1; docker run -d --name pa-es -e discovery.type=single-node -e xpack.security.enabled=false -e ES_JAVA_OPTS="-Xms512m -Xmx512m" -p 9299:9200 docker.elastic.co/elasticsearch/elasticsearch:9.5.3 >/dev/null; n=0; until curl -s --max-time 2 http://127.0.0.1:9299/ | grep -q "You Know, for Search"; do n=$((n+1)); [ $n -ge 90 ] && break; sleep 2; done; curl -s -X POST "http://127.0.0.1:9299/arenas/_doc/1?refresh=true" -H "Content-Type: application/json" -d "{\\"name\\":\\"search infrastructure arena\\"}"; echo; curl -s "http://127.0.0.1:9299/arenas/_search?q=name:infrastructure"; echo; docker rm -f pa-es >/dev/null',
      ],
      displayCommand: 'docker run docker.elastic.co/elasticsearch/elasticsearch:9.5.3 (single-node, security off)  # then index a doc + query q=name:infrastructure over HTTP',
      expect: /"_source":\{"name":"search infrastructure arena"\}/,
      timeoutMs: 420_000,
    },
    {
      // The OSS TypeScript engine installs from npm and runs a REAL in-process index + insert +
      // typo-tolerant search roundtrip in one node invocation — no server, no account at all.
      probeId: 'sdk-node-roundtrip',
      productId: 'orama',
      storyIds: ['agentic-sdks', 'five-minute-quickstart', 'typo-tolerance'],
      bin: 'npm',
      argv: [
        'sh', '-c',
        'rm -rf /tmp/pa-orama-probe; mkdir -p /tmp/pa-orama-probe; cd /tmp/pa-orama-probe; npm init -y >/dev/null 2>&1; npm i @orama/orama >/dev/null 2>&1; node --input-type=module -e \'import { create, insert, search } from "@orama/orama"; const db = create({ schema: { name: "string" } }); insert(db, { name: "serverless databases arena" }); insert(db, { name: "search infrastructure arena" }); const r = search(db, { term: "infrastucture", tolerance: 2 }); console.log("PA_PROBE_OK hits=" + r.count, JSON.stringify(r.hits.map((h) => h.document.name)));\'; cd /; rm -rf /tmp/pa-orama-probe',
      ],
      displayCommand: `npm i @orama/orama && node -e 'create → insert ×2 → search({ term: "infrastucture", tolerance: 2 })'  # in-process, no server`,
      expect: /PA_PROBE_OK hits=1 \["search infrastructure arena"\]/,
      timeoutMs: 180_000,
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
