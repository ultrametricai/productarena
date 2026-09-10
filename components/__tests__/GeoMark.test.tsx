// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GeoMark, { geoSignature, geoSpec } from '@/components/GeoMark'
import categories from '@/data/categories.json'

const arenaIds = (categories as Array<{ id: string }>).map((c) => c.id)

describe('GeoMark', () => {
  it('is deterministic: same seed → identical spec and identical rendered SVG', () => {
    for (const seed of ['proofs', 'claims-integrity', 'agent-native', ...arenaIds.slice(0, 5)]) {
      expect(geoSignature(seed)).toBe(geoSignature(seed))
      const a = render(<GeoMark seed={seed} title="t" />)
      const b = render(<GeoMark seed={seed} title="t" />)
      expect(a.container.innerHTML).toBe(b.container.innerHTML)
      a.unmount()
      b.unmount()
    }
  })

  it('produces distinct marks across all arena ids', () => {
    expect(arenaIds.length).toBeGreaterThanOrEqual(60)
    const signatures = new Set(arenaIds.map((id) => geoSignature(id)))
    expect(signatures.size).toBe(arenaIds.length)
    // Rendered output is distinct too, not just the abstract spec.
    const html = new Set(
      arenaIds.map((id) => {
        const view = render(<GeoMark seed={id} title="t" />)
        const out = view.container.innerHTML
        view.unmount()
        return out
      }),
    )
    expect(html.size).toBe(arenaIds.length)
  })

  it('respects a pinned variant and keeps parameters in their documented ranges', () => {
    for (const id of arenaIds) {
      const star = geoSpec(id, 'star')
      if (star.family !== 'star') throw new Error('variant not honored')
      expect(star.n).toBeGreaterThanOrEqual(5)
      expect(star.n).toBeLessThanOrEqual(9)
      expect(star.k).toBeGreaterThanOrEqual(2)
      // Never the degenerate {n / n/2} digon figure.
      expect(star.n % 2 === 0 ? star.k < star.n / 2 : star.k <= (star.n - 1) / 2).toBe(true)
      const dendro = geoSpec(id, 'dendro')
      if (dendro.family !== 'dendro') throw new Error('variant not honored')
      // Ultrametric nesting: root above both merges, merges above the leaf baseline.
      expect(dendro.rootY).toBeLessThan(dendro.h2)
      expect(dendro.h2).toBeLessThan(dendro.h1)
      expect(dendro.h1).toBeLessThan(19.5)
    }
  })

  it('always carries its concept tooltip (house rule)', () => {
    const { container, getByText } = render(<GeoMark seed="proofs" title="Probe proofs" />)
    expect(container.querySelector('span[title="Probe proofs"]')).not.toBeNull()
    expect(getByText('Probe proofs').className).toContain('sr-only')
  })
})
