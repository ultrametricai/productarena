// @vitest-environment jsdom
// Product-page pins for the founder's 2026-10-02 batch, rendered against the real committed
// corpus (startup-banking/mercury — a product with processes, integrations, and score history
// coverage): the vendor line links OUT to the vendor's committed site (never a guessed domain),
// the per-rect theme tooltips are gone, the bottom utility card grid collapsed to the one
// ⚑ Flag a verdict button, and the agent-discovery pointers the grid carried moved into
// generateMetadata alternates (<link rel="alternate">) — same URLs /llms.txt and /openapi.json
// document.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProductPage, { generateMetadata } from '@/app/arena/[category]/product/[id]/page'

const ARENA = 'startup-banking'
const ID = 'mercury'
const params = Promise.resolve({ category: ARENA, id: ID })

async function renderPage() {
  return render(await ProductPage({ params }))
}

describe('product page — founder 2026-10-02 batch', () => {
  it('the vendor line links to the vendor\'s committed site (external-link hygiene, ↗)', async () => {
    await renderPage()
    const link = screen.getByRole('link', { name: /Mercury Technologies/ })
    expect(link.getAttribute('href')).toBe('https://mercury.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.textContent).toContain('↗')
    // The URL comes from committed product data, said out loud in the tooltip — never guessed.
    expect(link.getAttribute('title')).toContain('https://mercury.com')
  })

  it('theme rectangles carry no per-card tooltip (the section heading keeps its mark)', async () => {
    const { container } = await renderPage()
    expect(screen.getByText('By theme')).toBeTruthy()
    const cards = [...container.querySelectorAll('a[href="#story-verdicts"].group')]
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) expect(card.getAttribute('title')).toBeNull()
  })

  it('the bottom utility grid is collapsed to the one ⚑ Flag a verdict button (prefilled issue link)', async () => {
    const { container } = await renderPage()
    const flag = screen.getByRole('link', { name: /⚑ Flag a verdict/ })
    const href = flag.getAttribute('href') ?? ''
    expect(href).toContain('github.com/ultrametricai/ultrametric/issues/new')
    expect(href).toContain('template=contest-verdict.md')
    expect(href).toContain(encodeURIComponent(`[contest] ${ARENA}/${ID}/<story-id>`).replace(/%20/g, '+'))
    // The rest of the card grid is gone — labels and links alike.
    for (const gone of ['For agents', 'This page as markdown', 'Evidence (JSON)', 'Verdicts (JSON)', 'Embed this product']) {
      expect(container.textContent).not.toContain(gone)
    }
    expect(container.querySelector(`a[href="/badges#${ID}"]`)).toBeNull()
  })

  it('removed explainer sentences: integrations and score trend keep their content, lose the prose', async () => {
    const { container } = await renderPage()
    expect(container.textContent).not.toContain('Connections to other tracked products')
    expect(container.textContent).not.toContain('a point per change, not per day')
    expect(screen.getByText('Verified integrations')).toBeTruthy()
  })

  it('generateMetadata preserves the agent-discovery pointers as alternates (llms.md + data JSON)', async () => {
    const meta = await generateMetadata({ params })
    const types = meta.alternates?.types as Record<string, unknown>
    expect(types['text/markdown']).toBe(`https://ultrametric.ai/arena/${ARENA}/product/${ID}/llms.md`)
    const json = types['application/json'] as Array<{ url: string }>
    expect(json.map((j) => j.url)).toEqual([
      `https://ultrametric.ai/data/${ARENA}/evidence/${ID}.json`,
      `https://ultrametric.ai/data/${ARENA}/verdicts.json`,
    ])
  })
})
