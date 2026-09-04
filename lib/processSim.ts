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
