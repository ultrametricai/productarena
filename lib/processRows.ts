import type { ProcessRow } from '@/components/ProcessesTable'
import { hasLogo } from '@/lib/logos'
import { processIcon } from '@/lib/processIcons'
import { crossArenaStepRankings, processLeaderboard, stepRanking } from '@/lib/processRankings'
import {
  CADENCE_META, cadenceRank, loadProcesses, phaseRank, processSlug, taskCeiling,
  type ProcessTask, VENDOR_ARENA, vendorLabel, vendorProductId,
} from '@/lib/processes'

// Server-side builder for the "all processes" table rows — extracted from app/processes/page.tsx
// (2026-09-21) so the homepage's process mode renders the exact same rows as /processes; one
// derivation, two surfaces.

// Founder 2026-09-18: no empty vendor cells — processes without hand-curated vendors fall back
// to the top story-ranked options across their steps (same evidence-gated rankings the process
// page shows; cross-arena entries included). Cap 4 for the cell.
function derivedVendorsFor(t: ProcessTask) {
  const seen = new Set<string>()
  const out: { id: string; label: string; arena: string | null; hasLogo: boolean }[] = []
  const push = (id: string, label: string, arena: string | null) => {
    if (seen.has(id) || out.length >= 4) return
    seen.add(id)
    out.push({ id, label, arena, hasLogo: hasLogo(id) })
  }
  for (const e of processLeaderboard(t).entries) push(e.productId, e.name, e.arenaId)
  if (out.length < 4) {
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
    return {
      slug: processSlug(t.title),
      title: t.title,
      icon: processIcon(t.id),
      phase: t.phase,
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
      vendors: (t.vendors.length > 0
        ? [...new Set(t.vendors)].map((v) => {
            const id = vendorProductId(v)
            return { id, label: vendorLabel(v), arena: VENDOR_ARENA[v] ?? null, hasLogo: hasLogo(id) }
          })
        : derivedVendorsFor(t)),
    }
  })

  return {
    rows,
    phases,
    agentStepPct: totalSteps === 0 ? 0 : Math.round((agentSteps / totalSteps) * 100),
    totalProcesses: tasks.length,
  }
}
