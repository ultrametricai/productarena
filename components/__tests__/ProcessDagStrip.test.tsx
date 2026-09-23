// @vitest-environment jsdom
// ProcessDagStrip — the mini horizontal DAG preview inside "Who covers this process best"
// (founder ask 2026-09-23). Server-rendered and static: renderToString IS the shipped output.
// Asserts the strip carries one route-colored dot per step (established palette: emerald agent /
// amber form / sky person / violet signature), stacks parallel layers into one column, keeps
// labels in tooltips only, and links the whole strip to #steps. Then the integration bar:
// ProcessLeaderboard renders the strip for a real corpus task with one dot per DAG node.
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProcessDagStrip from '@/components/ProcessDagStrip'
import ProcessLeaderboard from '@/components/ProcessLeaderboard'
import type { DagEdge } from '@/lib/dagLayers'
import { loadProcesses, type DagNode } from '@/lib/processes'
import { processLeaderboard } from '@/lib/processRankings'

function node(over: Pick<DagNode, 'id' | 'label' | 'route'> & Partial<DagNode>): DagNode {
  return { estimatedMinutes: 5, ...over }
}

// One of each route plus the signature override, with a genuinely parallel middle (b ∥ c).
const NODES: DagNode[] = [
  node({ id: 'a', label: 'Draft the filing', route: 'agent' }),
  node({ id: 'b', label: 'Portal upload', route: 'form' }),
  node({ id: 'c', label: 'Review the terms', route: 'person' }),
  node({ id: 'd', label: 'Sign the consent', route: 'person', legalSignature: true }),
]
const EDGES: DagEdge[] = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'c' },
  { from: 'b', to: 'd' },
  { from: 'c', to: 'd' },
]

const mount = (jsx: React.ReactElement) => {
  const div = document.createElement('div')
  div.innerHTML = renderToString(jsx)
  return div
}

describe('ProcessDagStrip', () => {
  it('renders one dot per step with the route palette, and the whole strip links to #steps', () => {
    const el = mount(<ProcessDagStrip nodes={NODES} edges={EDGES} />)
    const strip = el.querySelector('a[href="#steps"]')
    expect(strip).not.toBeNull()
    expect(strip!.querySelectorAll('[data-route]')).toHaveLength(4)
    expect(strip!.querySelectorAll('[data-route="agent"]')).toHaveLength(1)
    expect(strip!.querySelectorAll('[data-route="form"]')).toHaveLength(1)
    expect(strip!.querySelectorAll('[data-route="person"]')).toHaveLength(1)
    expect(strip!.querySelectorAll('[data-route="signature"]')).toHaveLength(1)
    // The established palette, dot by dot.
    expect(strip!.querySelector('[data-route="agent"]')!.className).toContain('emerald')
    expect(strip!.querySelector('[data-route="form"]')!.className).toContain('amber')
    expect(strip!.querySelector('[data-route="person"]')!.className).toContain('sky')
    expect(strip!.querySelector('[data-route="signature"]')!.className).toContain('violet')
  })

  it('step labels render as title tooltips only — never as visible text', () => {
    const el = mount(<ProcessDagStrip nodes={NODES} edges={EDGES} />)
    expect(el.textContent).not.toContain('Draft the filing')
    const agentDot = el.querySelector('[data-route="agent"]')!
    expect(agentDot.getAttribute('title')).toContain('01 Draft the filing')
    expect(agentDot.getAttribute('title')).toContain('agent')
    const sigDot = el.querySelector('[data-route="signature"]')!
    expect(sigDot.getAttribute('title')).toContain('Sign the consent')
    expect(sigDot.getAttribute('title')).toContain('legally human')
  })

  it('parallel steps stack vertically in one column: layers = columns, so 4 nodes → 3 columns → 2 connectors', () => {
    const el = mount(<ProcessDagStrip nodes={NODES} edges={EDGES} />)
    const strip = el.querySelector('a[href="#steps"]')!
    // Columns are the flex-col groups; the diamond's middle layer holds two dots.
    const columns = [...strip.querySelectorAll('span.flex.flex-col')]
    expect(columns).toHaveLength(3)
    expect(columns[1].querySelectorAll('[data-route]')).toHaveLength(2)
    // Thin connectors between columns only.
    expect(strip.querySelectorAll('span.h-px')).toHaveLength(2)
  })

  it('an edgeless task reads left→right, one column per step', () => {
    const el = mount(<ProcessDagStrip nodes={NODES} />)
    const strip = el.querySelector('a[href="#steps"]')!
    expect([...strip.querySelectorAll('span.flex.flex-col')]).toHaveLength(4)
    expect(strip.querySelectorAll('span.h-px')).toHaveLength(3)
  })
})

describe('ProcessLeaderboard renders the strip', () => {
  it('a real corpus task gets the strip under the intro, one dot per DAG node', () => {
    // Any task with a non-empty leaderboard — the component returns null otherwise.
    const task = loadProcesses().find((t) => {
      const lb = processLeaderboard(t)
      return lb.entries.length > 0 && lb.rankableSteps > 0
    })
    expect(task, 'no corpus task has a rankable leaderboard').toBeDefined()
    const el = mount(<ProcessLeaderboard task={task!} />)
    const strip = el.querySelector('a[href="#steps"]')
    expect(strip).not.toBeNull()
    expect(strip!.querySelectorAll('[data-route]')).toHaveLength(task!.dag.nodes.length)
  })
})
