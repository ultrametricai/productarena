// @vitest-environment jsdom
// The house glyph set (components/icons/ProcessIcon.tsx) must hold as a SYSTEM: every designed
// glyph renders real SVG geometry (never an empty frame), every path is well-formed and drawn
// on the 24×24 grid, and an unknown id degrades to the honest placeholder instead of a wrong
// concept. lib/__tests__/processIcons.test.ts covers the corpus side (every live process/phase/
// chain resolves to one of these glyphs).
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProcessIcon, { GLYPHS, ICON_HUES } from '@/components/icons/ProcessIcon'

// SVG path data may only contain command letters, digits, separators, signs, and decimal
// points — a stray character here means a typo that browsers would silently half-render.
const PATH_CHARS = /^[MmLlHhVvCcSsQqTtAaZz0-9 ,.\-+]+$/

describe('ProcessIcon', () => {
  it('renders valid duotone SVG for every designed glyph', () => {
    for (const id of Object.keys(GLYPHS)) {
      const { container, unmount } = render(<ProcessIcon id={id} hue="emerald" />)
      const svg = container.querySelector('svg')
      expect(svg, `glyph ${id} must render an <svg>`).toBeTruthy()
      expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24')
      expect(svg!.getAttribute('data-glyph')).toBe(id)
      const shapes = svg!.querySelectorAll('path, circle, rect')
      expect(shapes.length, `glyph ${id} must draw at least one shape`).toBeGreaterThan(0)
      for (const p of svg!.querySelectorAll('path')) {
        const d = p.getAttribute('d') ?? ''
        expect(d.startsWith('M'), `glyph ${id} has a path not starting at M: '${d}'`).toBe(true)
        expect(PATH_CHARS.test(d), `glyph ${id} has malformed path data: '${d}'`).toBe(true)
      }
      for (const c of svg!.querySelectorAll('circle')) {
        expect(Number(c.getAttribute('r')), `glyph ${id} has a zero-radius circle`).toBeGreaterThan(0)
      }
      // Duotone contract: shapes paint in the hue's strong or soft tone, nothing else.
      const allowed = new Set([ICON_HUES.emerald.strong, ICON_HUES.emerald.soft])
      for (const s of shapes) {
        const paint = s.getAttribute('stroke') === 'none' ? s.getAttribute('fill') : s.getAttribute('stroke')
        expect(allowed.has(paint ?? ''), `glyph ${id} paints outside its duotone (${paint})`).toBe(true)
      }
      unmount()
    }
  })

  it('keeps every glyph on the 24×24 grid (all numeric coordinates within bounds)', () => {
    for (const [id, glyph] of Object.entries(GLYPHS)) {
      for (const shape of glyph.shapes) {
        if (shape.c) {
          const [cx, cy, r] = shape.c
          expect(cx - r >= 0 && cx + r <= 24 && cy - r >= 0 && cy + r <= 24, `glyph ${id}: circle out of grid`).toBe(true)
        }
        if (shape.r) {
          const [x, y, w, h] = shape.r
          expect(x >= 0 && y >= 0 && x + w <= 24 && y + h <= 24, `glyph ${id}: rect out of grid`).toBe(true)
        }
      }
    }
  })

  it('an unknown id renders the honest placeholder, never a wrong concept', () => {
    const { container } = render(<ProcessIcon id="not-a-glyph" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('data-glyph')).toBe('unknown')
    expect(svg.querySelectorAll('path, circle, rect').length).toBeGreaterThan(0)
  })

  it('sizes like the emoji it replaces: 1em square by default, explicit px for the gallery', () => {
    const inline = render(<ProcessIcon id="flask" />).container.querySelector('svg')!
    expect(inline.getAttribute('width')).toBe('1em')
    expect(inline.getAttribute('height')).toBe('1em')
    const sized = render(<ProcessIcon id="flask" size={28} />).container.querySelector('svg')!
    expect(sized.getAttribute('width')).toBe('28')
  })

  it('glyph names are unique (two concepts may never share a label)', () => {
    const names = Object.values(GLYPHS).map((g) => g.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
