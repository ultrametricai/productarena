// Client-safe half of lib/processes.ts — the flattened simulator prop shapes plus display
// helpers, with NO node:fs/path imports so components/ProcessSimulator.tsx (a client component)
// can bundle it. Same split convention as lib/megaTableSort.ts (client) vs lib/megaTable.ts
// (server-side row builder).

export type StepRoute = 'agent' | 'form' | 'person'

export interface SwapOption {
  id: string
  name: string
  agentReady: number | null
}

export interface VendorRole {
  arenaId: string
  arenaName: string
  // The corpus vendor key the DAG canonically records calls against.
  canonicalVendor: string
  defaultProductId: string
  defaultProductName: string
  // How many DAG nodes are attributed to this role's vendors.
  stepCount: number
  // The arena's whole leaderboard, ranked by agentReady desc (nulls last) — includes the default.
  alternatives: SwapOption[]
}

// An agentic gap-closer: a live-arena workaround for a non-agent step, resolved server-side by
// lib/gapClosers.ts (this type stays here so the client-side simulator can receive it as a prop).
export interface GapCloser {
  arenaId: string
  arenaName: string
  // The arena's current #1 by agent-readiness — the concrete product to hand the step to.
  topProduct: SwapOption
  blurb: string
  // Honest fine print (e.g. "unofficial path — verify the portal's terms allow automation").
  caution: string | null
}

// What we honestly know about a non-agent step: either today's market can close it (closer), or
// it is judgment/identity work no agent should stand in for (irreducible). Steps with neither
// resolve to null — no workaround yet, and we don't invent one.
export type GapResolution =
  | { kind: 'closer'; closer: GapCloser }
  | { kind: 'irreducible'; reason: string }

// The one-line honest reason a non-agent step blocks the agent — shared by the ceiling verdict,
// the simulator transcript, and the gap-closer split.
export function gapWhy(route: 'form' | 'person'): string {
  return route === 'person' ? 'needs a human' : 'manual form/portal — no API path'
}

export interface SimStep {
  taskId: string
  taskTitle: string
  label: string
  route: StepRoute
  vendor: string | null
  vendorLabel: string | null
  // Set when the vendor is mapped to an arena — the simulator swaps this step's product.
  arenaId: string | null
  calls: string[]
  toolCall: string | null
  approvalRequired: boolean
  riskLevel: 'low' | 'medium' | 'high' | null
  estimatedMinutes: number
  async: boolean
  // Pre-resolved (server-side) agentic workaround for non-agent steps; null for agent steps and
  // for gaps with no honest workaround.
  gap: GapResolution | null
}

// Human-scale minutes: "12 min", "1.5 h", "2 d". Waiting-on-the-government steps run to days —
// keep them readable instead of "2880 minutes".
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} min`
  if (mins < 60 * 24) {
    const h = mins / 60
    return `${Number.isInteger(h) ? h : h.toFixed(1)} h`
  }
  const d = mins / (60 * 24)
  return `${Number.isInteger(d) ? d : d.toFixed(1)} d`
}
