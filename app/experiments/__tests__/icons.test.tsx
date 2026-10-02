// @vitest-environment jsdom
// Smoke for the unlisted /experiments/icons gallery — the founder's review surface for the
// house process-icon set. It must render the ENTIRE designed set (every glyph tile with its
// name and guiding emoji), every live corpus token (areas, processes, playbooks), and stay
// unlisted (noindex; /experiments/* never joins app/sitemap.ts).
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GLYPHS } from '@/components/icons/ProcessIcon'
import { loadChains, loadProcesses } from '@/lib/processes'
import IconGalleryPage, { metadata } from '../icons/page'

describe('/experiments/icons gallery', () => {
  // 120s timeout: this smoke test legitimately outgrew vitest's 30s default — it renders the
  // whole gallery (every glyph at review + 16px size, every process/playbook tile) in jsdom and
  // then runs a getAllByText scan per glyph, which scales with glyph-count × DOM size. At the
  // 2026-10-02 corpus it takes ~40s on an idle machine and was timing out on main itself (the
  // failure predates — and reproduces without — this branch's changes).
  it('renders every designed glyph with its name, and every live process and playbook', { timeout: 120_000 }, () => {
    const { container, getAllByText } = render(<IconGalleryPage />)
    // One neutral tile per glyph in the full-set grid (plus colorized renders above it).
    for (const [id, glyph] of Object.entries(GLYPHS)) {
      expect(getAllByText(glyph.name).length, `gallery must show glyph ${id} (${glyph.name})`).toBeGreaterThan(0)
    }
    const svgFor = (glyphId: string) => container.querySelectorAll(`svg[data-glyph="${glyphId}"]`)
    expect(svgFor('flask').length).toBeGreaterThan(0)
    // Every live process and chain appears by title/name.
    const text = container.textContent ?? ''
    for (const task of loadProcesses()) expect(text, `gallery must list ${task.id}`).toContain(task.title)
    for (const chain of loadChains()) expect(text, `gallery must list chain ${chain.id}`).toContain(chain.name)
    // Nothing on this page ever renders the unknown-glyph placeholder.
    expect(svgFor('unknown').length).toBe(0)
  })

  it('stays unlisted: noindex robots metadata (house /experiments posture)', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
