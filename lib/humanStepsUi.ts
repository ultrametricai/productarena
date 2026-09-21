import type { ComputerUseFeasibility } from './humanSteps'

// Display language for the human-step audit verdicts (data/human-step-audit.json). One place so
// the step blocks (components/ProcessDag.tsx) and the agent-ceiling box
// (components/ProcessVerdict.tsx) say exactly the same thing about the same node.
export const FEASIBILITY_META: Record<ComputerUseFeasibility, { icon: string; label: string; tone: 'emerald' | 'amber' | 'red' | 'zinc' }> = {
  drivable: { icon: '🖥', label: 'computer-use drivable', tone: 'emerald' },
  assist: { icon: '🖥', label: 'agent preps, human decides', tone: 'amber' },
  'policy-gate': { icon: '⛔', label: 'policy gate — not an agent’s call', tone: 'red' },
  'no-screen': { icon: '🚫', label: 'no screen to drive', tone: 'zinc' },
  'third-party-wait': { icon: '⏳', label: 'third party’s clock', tone: 'zinc' },
}

// Whether the judged computer-use fleet chips are honest capability evidence for this node:
// only where the blocker is mechanical (an agent could drive or prep it). Where the blocker is
// authority, physics, or someone else's clock, showing "could attempt it today" misleads.
export function showComputerUseChips(feasibility: ComputerUseFeasibility | undefined): boolean {
  return feasibility === undefined || feasibility === 'drivable' || feasibility === 'assist'
}
