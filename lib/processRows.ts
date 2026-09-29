import type { PlaybookRow, ProcessRow } from '@/components/ProcessesTable'
import { loadCategory } from '@/lib/data'
import { hasLogo } from '@/lib/logos'
import { isShutdown } from '@/lib/shutdown'
import { chainIcon, processIcon } from '@/lib/processIcons'
import { crossArenaStepRankings, processLeaderboard, stepRanking } from '@/lib/processRankings'
import {
  CADENCE_META, cadenceRank, chainTasks, computeCeiling, loadChains, loadProcesses, phaseRank,
  processSlug, taskCeiling, type ProcessTask, VENDOR_ARENA, vendorLabel, vendorProductId,
} from '@/lib/processes'

// Server-side builder for the "all processes" table rows — extracted from app/processes/page.tsx
// (2026-09-21) so the homepage's process mode renders the exact same rows as /processes; one
// derivation, two surfaces.

// ---- Areas (founder 2026-09-28): friendly display groups over the corpus's internal phases —
// the primary grouping on the "All processes" table (inspiration: the old site's sections at
// ultrametric.ai/process — Formation, Fundraising, Finance, HR & Payroll, Legal, Compliance &
// Tax, Operations, Sales, Growth, Software). Order = the founder-lifecycle order the grouped
// table renders in. The map must stay TOTAL over the corpus: areaOf throws on an unmapped
// phase, and the totality test in lib/__tests__/processRows.test.ts walks the live corpus — a
// new phase without a curated area fails loudly at test (and build) time instead of silently
// rendering a stray group.
export const AREA_ORDER = [
  'Starting up',
  'Fundraising & investors',
  'Money & finance',
  'Team & payroll',
  'Legal',
  'Ongoing compliance & tax',
  'Running operations',
  'Building & shipping',
  'Growth & sales',
] as const

export type Area = (typeof AREA_ORDER)[number]

export const PHASE_AREA: Record<string, Area> = {
  startup: 'Starting up',
  formation: 'Starting up',
  fundraising: 'Fundraising & investors',
  vc: 'Fundraising & investors',
  finance: 'Money & finance',
  hr: 'Team & payroll',
  legal: 'Legal',
  compliance: 'Ongoing compliance & tax', // the corpus has no separate tax phase — filings live here
  operations: 'Running operations',
  product: 'Building & shipping',
  software: 'Building & shipping',
  growth: 'Growth & sales',
  sales: 'Growth & sales',
}

/** The display area for a corpus phase — throws on an unmapped phase (totality by force). */
export function areaOf(phase: string): Area {
  const area = PHASE_AREA[phase]
  if (area === undefined) {
    throw new Error(`No display area mapped for phase "${phase}" — add it to PHASE_AREA in lib/processRows.ts`)
  }
  return area
}

/** Founder-lifecycle rank of an area (its AREA_ORDER index) — the grouped table's group order. */
export function areaRank(area: string): number {
  return (AREA_ORDER as readonly string[]).indexOf(area)
}

// Vendor-cell cap for the index table — founder 2026-09-22 ("we are missing vendors on the
// processes main page, e.g. GitLab for 'Cut a release' — I want a more complete answer"):
// raised from 4, and the cell now always tops up from the derived market after the curated
// vendors instead of showing one source or the other.
const VENDOR_CELL_CAP = 6

// Founder 2026-09-18: no empty vendor cells — the top story-ranked options across the task's
// steps (same evidence-gated rankings the process page shows; cross-arena entries included).
function derivedVendorsFor(t: ProcessTask, seed?: { id: string; label: string; arena: string | null; hasLogo: boolean }[]) {
  const out = [...(seed ?? [])]
  const seen = new Set<string>(out.map((v) => v.id))
  const push = (id: string, label: string, arena: string | null) => {
    if (seen.has(id) || out.length >= VENDOR_CELL_CAP) return
    seen.add(id)
    out.push({ id, label, arena, hasLogo: hasLogo(id) })
  }
  for (const e of processLeaderboard(t).entries) push(e.productId, e.name, e.arenaId)
  if (out.length < VENDOR_CELL_CAP) {
    for (const node of t.dag.nodes) {
      const rankings = [stepRanking(t.id, node), ...crossArenaStepRankings(t.id, node)]
      for (const r of rankings) {
        if (!r) continue
        for (const v of r.vendors.slice(0, 2)) push(v.productId, v.name, v.arenaId)
      }
    }
  }
  return out
}

// ---- Playbook rows (founder 2026-09-29: "combine playbooks and all processes into one table
// so we have one view for the processes under the process search"): the curated chains
// (journeys/chains.json) serialized for the SAME table the process rows render in — a leading
// 'Playbooks' group in the grouped default, distinct playbook rows in the flat sorted view.
// Server-side like buildProcessRows so the client table never imports the node-only loaders.
export function buildPlaybookRows(): PlaybookRow[] {
  return loadChains().map((chain) => {
    const tasks = chainTasks(chain)
    const nodes = tasks.flatMap((t) => t.dag.nodes)
    const ceiling = computeCeiling(nodes)
    return {
      id: chain.id,
      title: chain.name,
      tagline: chain.tagline,
      icon: chainIcon(chain.id),
      href: `/processes/chains/${chain.id}`,
      // The constituent processes as icon chips (the old playbooks table's 'Processes' column),
      // plus their phases so the table's phase filter can honestly scope playbooks too.
      processes: tasks.map((t) => ({ id: t.id, icon: processIcon(t.id), title: t.title, phase: t.phase })),
      phases: [...new Set(tasks.map((t) => t.phase))],
      // Aggregate agent ceiling across every step of every process in the chain — what the
      // combined table sorts playbooks by where a ceiling/steps sort is active.
      pct: ceiling.pct,
      agentSteps: ceiling.agentSteps,
      totalSteps: ceiling.totalSteps,
      // The route strip: one dot per step, capped client-side (legalSignature wears violet).
      steps: nodes.map((n) => ({ label: n.label, route: n.route, legalSignature: n.legalSignature ?? false })),
    }
  })
}

export interface ProcessRowsBundle {
  rows: ProcessRow[]
  phases: string[]
  /** Corpus-wide agent ceiling: agent-runnable steps / total steps, as a 0–100 percent. */
  agentStepPct: number
  totalProcesses: number
}

export function buildProcessRows(): ProcessRowsBundle {
  const tasks = loadProcesses()

  const byPhase = new Map<string, true>()
  for (const t of tasks) byPhase.set(t.phase, true)
  const phases = [...byPhase.keys()].sort((a, b) => phaseRank(a) - phaseRank(b) || a.localeCompare(b))

  let agentSteps = 0
  let totalSteps = 0
  const rows: ProcessRow[] = tasks.map((t) => {
    const c = taskCeiling(t)
    agentSteps += c.agentSteps
    totalSteps += c.totalSteps
    // Resolved server-side (like cadence below) so the client table never imports this
    // node-only module — the row carries both the area name and its lifecycle rank.
    const area = areaOf(t.phase)
    return {
      slug: processSlug(t.title),
      title: t.title,
      icon: processIcon(t.id),
      phase: t.phase,
      area,
      areaRank: areaRank(area),
      // Required on every corpus process (lib/processes.ts) — the index rows carry it for the
      // client-side geo-scope glyph shown while a non-US country is selected (GeoSwitcher).
      geoScope: t.geoScope,
      pct: c.pct,
      agentSteps: c.agentSteps,
      totalSteps: c.totalSteps,
      complexity: t.complexity,
      // The five-orderings fields (curated on the corpus; cadence resolved to its display
      // label/rank here so the client table never imports the node-only helpers).
      timeOrder: t.timeOrder,
      cadenceLabel: CADENCE_META[t.cadence].label,
      cadenceRank: cadenceRank(t.cadence),
      annoyance: t.annoyance,
      risk: t.risk,
      growthImpact: t.growthImpact,
      // Curated vendors lead, then the cell tops up from the derived market to the cap — so
      // "Cut a release" shows github + sentry AND the ranked code-hosting field (gitlab…).
      // Shutdown products never seed a vendor cell (founder 2026-09-23: Pulley, retired, was
      // still showing in the processes view via curated task vendors).
      vendors: derivedVendorsFor(
        t,
        [...new Set(t.vendors)]
          .filter((v) => {
            const arena = VENDOR_ARENA[v]
            if (!arena) return true // untracked chips have no shutdown state
            const p = loadCategory(arena).products.find((x) => x.id === vendorProductId(v))
            return !p || !isShutdown(p)
          })
          .slice(0, VENDOR_CELL_CAP)
          .map((v) => {
            const id = vendorProductId(v)
            return { id, label: vendorLabel(v), arena: VENDOR_ARENA[v] ?? null, hasLogo: hasLogo(id) }
          }),
      ),
    }
  })

  return {
    rows,
    phases,
    agentStepPct: totalSteps === 0 ? 0 : Math.round((agentSteps / totalSteps) * 100),
    totalProcesses: tasks.length,
  }
}
