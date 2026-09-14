import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadChains, loadProcesses } from '@/lib/processes'
import {
  CHAIN_ICONS, chainIcon, PHASE_ICONS, phaseIcon, phaseTooltip, PROCESS_ICONS, processIcon,
} from '@/lib/processIcons'

const DATA_DIR = path.resolve(__dirname, '../../data')

// A curated icon must be a real glyph, not ASCII filler — every emoji (and the ®️/©️ marks)
// lives outside the 7-bit range.
const looksLikeIcon = (s: string) => s.length > 0 && [...s].some((ch) => (ch.codePointAt(0) ?? 0) > 0x7f)

describe('process icon coverage', () => {
  it('every live process has a curated icon', () => {
    for (const task of loadProcesses(DATA_DIR)) {
      const icon = processIcon(task.id)
      expect(looksLikeIcon(icon), `process ${task.id} (${task.title}) needs a curated icon`).toBe(true)
    }
  })

  it('every live phase has a curated icon and a tooltip naming the concept', () => {
    const phases = new Set(loadProcesses(DATA_DIR).map((t) => t.phase))
    for (const phase of phases) {
      expect(looksLikeIcon(phaseIcon(phase)), `phase ${phase} needs a curated icon`).toBe(true)
      expect(phaseTooltip(phase)).toContain(phase)
      expect(phaseTooltip(phase)).toContain('—')
    }
  })

  it('every live playbook (chain) has a curated icon', () => {
    for (const chain of loadChains(DATA_DIR)) {
      expect(looksLikeIcon(chainIcon(chain.id)), `chain ${chain.id} needs a curated icon`).toBe(true)
    }
  })

  it('no stale mappings: every curated key points at a live process/phase/chain', () => {
    const taskIds = new Set(loadProcesses(DATA_DIR).map((t) => t.id))
    for (const id of Object.keys(PROCESS_ICONS)) {
      expect(taskIds.has(id), `PROCESS_ICONS has stale task id ${id}`).toBe(true)
    }
    const phases = new Set(loadProcesses(DATA_DIR).map((t) => t.phase))
    for (const phase of Object.keys(PHASE_ICONS)) {
      expect(phases.has(phase), `PHASE_ICONS has stale phase ${phase}`).toBe(true)
    }
    const chainIds = new Set(loadChains(DATA_DIR).map((c) => c.id))
    for (const id of Object.keys(CHAIN_ICONS)) {
      expect(chainIds.has(id), `CHAIN_ICONS has stale chain id ${id}`).toBe(true)
    }
  })

  it('unknown ids resolve to empty string (callers render nothing, never a wrong icon)', () => {
    expect(processIcon('nope_999')).toBe('')
    expect(phaseIcon('nope')).toBe('')
    expect(chainIcon('nope')).toBe('')
  })
})
