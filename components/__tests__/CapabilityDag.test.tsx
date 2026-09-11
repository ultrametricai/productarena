// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CapabilityDag, { capabilityDagStats } from '@/components/CapabilityDag'
import { canonGraphStoryIds } from '@/lib/storyGraph'
import { CANON_SHORT_LABELS, combinedCanonEdges } from '@/lib/storyEdges'

describe('CapabilityDag', () => {
  const adoption = Object.fromEntries(
    [...canonGraphStoryIds].map((id, i) => [id, { pct: (i * 7) % 100, adopters: i, total: 100 }]),
  )
  const titles = Object.fromEntries([...canonGraphStoryIds].map((id) => [id, `full title of ${id}`]))

  it('renders every canon story as a linked node and every curated edge with its why', () => {
    const { container } = render(<CapabilityDag adoption={adoption} titles={titles} />)
    const links = [...container.querySelectorAll('a')]
    expect(links.length).toBe(canonGraphStoryIds.size)
    for (const id of canonGraphStoryIds) {
      expect(links.some((a) => a.getAttribute('href') === `/global/${id}`), `no node link for ${id}`).toBe(true)
    }
    // Edge tooltips carry the curated why — spot-check one cross edge.
    const cross = combinedCanonEdges().find((e) => e.kind === 'cross')!
    const titleTexts = [...container.querySelectorAll('title')].map((t) => t.textContent ?? '')
    expect(titleTexts.some((t) => t.includes(cross.why))).toBe(true)
  })

  it('shows the adoption percentage per node and an honest dash when adoption is missing', () => {
    const { container } = render(<CapabilityDag adoption={{}} titles={titles} />)
    const texts = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(texts.filter((t) => t === '—').length).toBe(canonGraphStoryIds.size)
    expect(texts).toContain(CANON_SHORT_LABELS['agentic-public-api'])
  })

  it('stats cover the full canon and both edge files', () => {
    const s = capabilityDagStats()
    expect(s.nodes).toBe(canonGraphStoryIds.size)
    expect(s.edges).toBe(combinedCanonEdges().length)
    expect(s.crossEdges).toBeGreaterThan(0)
    expect(s.crossEdges).toBeLessThan(s.edges)
  })
})
