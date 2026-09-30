// @vitest-environment jsdom
// IconChip is the single choke point for functional icons (founder rule: every icon ships a
// tooltip naming the concept). Since 2026-09-30 it speaks two vocabularies: house icon tokens
// (`pi:<glyph>:<hue>` from lib/processIcons.ts) render the hand-authored SVG set, and every
// other non-empty string (arena emoji, theme emoji) keeps rendering as text — which is how all
// existing consumers upgraded to the custom set without layout edits.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IconChip, { IconGlyph } from '@/components/IconChip'
import { processIcon } from '@/lib/processIcons'

describe('IconChip', () => {
  it('renders a house token as duotone SVG, with the REQUIRED tooltip and sr-only name', () => {
    const { container, getByTitle } = render(
      <IconChip icon={processIcon('startup_001')} title="Validate the idea — startup process" />,
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('data-glyph')).toBe('flask')
    expect(getByTitle('Validate the idea — startup process')).toBeTruthy()
    expect(container.querySelector('.sr-only')!.textContent).toBe('Validate the idea — startup process')
    // The glyph itself stays decorative; the sr-only span carries the name.
    expect(svg!.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders a non-token (emoji) as text — the two icon systems coexist', () => {
    const { container } = render(<IconChip icon="🏦" title="Bank — money stories" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.textContent).toContain('🏦')
  })

  it('renders nothing for an empty icon (unknown ids resolve to empty string upstream)', () => {
    const { container } = render(<IconChip icon="" title="nothing" />)
    expect(container.firstChild).toBeNull()
  })

  it('IconGlyph (bare, for parents that already carry the title) resolves both vocabularies', () => {
    const token = render(<IconGlyph icon={processIcon('qs_023')} />)
    expect(token.container.querySelector('svg')!.getAttribute('data-glyph')).toBe('bank')
    const emoji = render(<IconGlyph icon="⭐" />)
    expect(emoji.container.querySelector('svg')).toBeNull()
    expect(emoji.container.textContent).toBe('⭐')
  })

  it('a malformed token still renders (honest placeholder), never crashes a table row', () => {
    const { container } = render(<IconChip icon="pi:never-designed:emerald" title="future process" />)
    expect(container.querySelector('svg')!.getAttribute('data-glyph')).toBe('unknown')
  })
})
