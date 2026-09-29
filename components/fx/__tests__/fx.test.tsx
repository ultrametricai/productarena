// @vitest-environment jsdom
// The restored landing animations (founder 2026-09-29: "the homepage has lost its animations").
// jsdom has no WebGL and no 2d canvas backend (getContext logs "Not implemented" and yields
// null), so these tests exercise exactly the graceful-degradation contract: every component
// must render its (fallback-compatible) markup and bail without crashing, and the dissolve
// heading must honor prefers-reduced-motion.
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HeroFractalCanvas from '@/components/fx/HeroFractalCanvas'
import JuliaHeroCanvas from '@/components/fx/JuliaHeroCanvas'
import FooterAttractorCanvas from '@/components/fx/FooterAttractorCanvas'
import LogoWordmark from '@/components/fx/LogoWordmark'
import DissolveHeading from '@/components/fx/DissolveHeading'

afterEach(() => {
  vi.unstubAllGlobals()
})

// jsdom's matchMedia is not guaranteed — force a deterministic answer per test.
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('HeroFractalCanvas (WebGL Newton fractal)', () => {
  it('renders the hidden overlay canvas and stays on the fallback without WebGL', () => {
    const { container } = render(<HeroFractalCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    // No WebGL in jsdom → the effect bails before removing opacity-0, so the page's
    // .cb-fallback gradient underneath stays what the visitor sees.
    expect(canvas?.className).toContain('opacity-0')
    expect(canvas?.className).toContain('absolute')
  })
})

describe('JuliaHeroCanvas (/company hero)', () => {
  it('renders the hidden overlay canvas and stays on the fallback without WebGL', () => {
    const { container } = render(<JuliaHeroCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.className).toContain('opacity-0')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('FooterAttractorCanvas', () => {
  it('renders inside a footer and bails without a 2d context', () => {
    const { container } = render(
      <footer style={{ position: 'relative' }}>
        <FooterAttractorCanvas />
      </footer>,
    )
    const canvas = container.querySelector('footer canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.className).toContain('pointer-events-none')
  })
})

describe('LogoWordmark (header wordmark hover fx)', () => {
  it('renders the home link, wordmark img, and the masked overlay spans', () => {
    render(<LogoWordmark />)
    const link = screen.getByRole('link', { name: 'ultrametric' })
    expect(link.getAttribute('href')).toBe('/')
    expect(link.className).toContain('logo-root')
    const img = screen.getByAltText('ultrametric')
    expect(img.getAttribute('src')).toBe('/ultrametric-wordmark.svg')
    expect(link.querySelector('.logo-fx canvas')).not.toBeNull()
    expect(link.querySelector('.logo-shine')).not.toBeNull()
  })
})

describe('DissolveHeading (hero char-melt)', () => {
  it('splits the heading into .hchar spans and preserves the text as aria-label', () => {
    stubMatchMedia(false)
    const { container } = render(
      <DissolveHeading className="font-display">
        Automating
        <br />
        the startup
      </DissolveHeading>,
    )
    const h1 = container.querySelector('h1')
    expect(h1).not.toBeNull()
    expect(h1?.getAttribute('aria-label')).toBe('Automating the startup')
    expect(h1?.querySelectorAll('.hchar').length).toBeGreaterThan(0)
    expect(h1?.textContent?.replace(/\s+/g, ' ')).toContain('Automating')
  })

  it('leaves the heading untouched under prefers-reduced-motion', () => {
    stubMatchMedia(true)
    const { container } = render(<DissolveHeading>Automating the startup</DissolveHeading>)
    const h1 = container.querySelector('h1')
    expect(h1?.querySelectorAll('.hchar').length).toBe(0)
    expect(h1?.getAttribute('aria-label')).toBeNull()
    expect(h1?.textContent).toBe('Automating the startup')
  })
})
