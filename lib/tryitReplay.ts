// Client-safe (no node:fs) logic behind the product pages' "Try it" microterminal
// (components/TryIt/Microterminal.tsx): character-paced replay math, SGR stripping for plain
// display, and the rendering of a live /api/mcp-probe result as terminal lines. Kept pure so
// lib/__tests__/tryitReplay.test.ts can exercise every branch without a DOM or a network.

// One selectable "story" in the microterminal menu. Recorded stories carry a full transcript
// (a proof recording from lib/proofs.ts, SGR-stripped server-side); the live MCP story has no
// transcript — its text is produced at run time from the probe result.
export interface TryItStory {
  id: string
  /** Human title from the prefixed user stories the proof substantiates. */
  title: string
  kind: 'recorded' | 'live-mcp'
  command: string
  recordedAt?: string
  exitCode?: number
  transcript?: string
}

export const REPLAY_MS_PER_CHAR = 8

// How many characters of a transcript are visible `elapsedMs` after replay start. Pure and
// clamped so the component can drive it straight from an rAF timestamp; "skip" simply renders
// the full length.
export function replayCharCount(elapsedMs: number, totalChars: number, msPerChar: number = REPLAY_MS_PER_CHAR): number {
  if (totalChars <= 0 || elapsedMs <= 0) return 0
  return Math.min(totalChars, Math.floor(elapsedMs / Math.max(1, msPerChar)))
}

// Recordings keep SGR color sequences on disk (lib/proofs.ts); the microterminal renders plain
// text, so drop them before replaying (same regex as components/ProofBlock.tsx).
export function stripSgr(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

// Sanitized summary returned by the worker's /api/mcp-probe (infra/cloudflare-proxy/worker.js
// — probeMcpEndpoint + handleMcpProbe).
export interface McpProbeResult {
  ok?: boolean
  error?: string
  endpoint?: string
  probedAt?: string
  reachable?: boolean
  authRequired?: boolean
  oauth?: boolean
  httpStatus?: number
  handshake?: boolean
  serverInfo?: { name: string; version: string }
  protocolVersion?: string
  toolCount?: number
  toolNames?: string[]
}

// Render one probe result as the terminal lines the microterminal types out. Honest by
// construction: a 401 is reported as proof of life + auth requirement, never dressed up as a
// working session.
export function probeResultLines(result: McpProbeResult): string[] {
  if (result.error) return [`← probe failed: ${result.error}`]
  if (!result.reachable) return ['← no response — endpoint unreachable from our edge right now']

  if (result.authRequired) {
    return [
      `← HTTP ${result.httpStatus ?? 401} unauthorized${result.oauth ? ' (OAuth)' : ''} — server is live, auth required`,
      '  the server answered our handshake; a real session needs you to sign in with the vendor',
    ]
  }

  if (!result.handshake) {
    return [`← HTTP ${result.httpStatus ?? '???'} — endpoint responded, but not with an MCP handshake we understand`]
  }

  const lines = [
    `← initialized — ${result.serverInfo?.name ?? 'unknown server'} v${result.serverInfo?.version ?? '?'} (protocol ${result.protocolVersion ?? '?'})`,
    '→ tools/list',
  ]
  if (typeof result.toolCount === 'number') {
    const names = result.toolNames ?? []
    const suffix = result.toolCount > names.length ? ', …' : ''
    lines.push(`← ${result.toolCount} tools: ${names.join(', ')}${suffix}`)
  } else {
    lines.push('← tools/list not answered keyless — tool catalog needs an authenticated session')
  }
  return lines
}
