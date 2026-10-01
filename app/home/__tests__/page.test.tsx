// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from '@/app/home/page'
import { HOME_PROCESSES_COUNT } from '@/components/HomeProcessesMini'
import { HOME_RANKINGS_COUNT } from '@/components/HomeRankingsMini'

describe('landing homepage (ported to /home; served at ultrametric.ai/ by the worker)', () => {
  it('renders the hero with the simulator CTA and NO eyebrow line (founder 2026-09-30)', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: /Automating\s*the startup/ })).toBeDefined()
    // "Redefining work in the AI phase transition" was removed by founder ask 2026-09-30.
    expect(screen.queryByText('Redefining work in the AI phase transition')).toBeNull()
    const cta = screen.getByRole('link', { name: /Play with the open startup/ })
    expect(cta.getAttribute('href')).toBe('/startup-sim')
  })

  it('pins the ~70% viewport hero height (founder 2026-09-30, down from 100svh)', () => {
    const { container } = render(<HomePage />)
    const hero = container.querySelector('section')
    expect(hero?.className).toContain('min-h-[calc(70svh-4rem)]')
    expect(hero?.className).not.toContain('100svh')
    // Content stays vertically centered.
    expect(hero?.className).toContain('flex')
  })

  it('renders no products section (founder 2026-09-29: removed twice, stays gone)', () => {
    render(<HomePage />)
    expect(screen.queryByText(/Products for the new way of working/i)).toBeNull()
    expect(screen.queryByText(/Away From Keyboard/i)).toBeNull()
  })

  it('keeps the static hero fallback in the server markup (canvas is client-only)', () => {
    const { container } = render(<HomePage />)
    // The .cb-fallback gradient is the SSG/no-WebGL/reduced-motion state; the WebGL canvas
    // lazy-mounts client-only (components/fx/lazy.tsx) and overlays it.
    const fallback = container.querySelector('.cb-fallback')
    expect(fallback).not.toBeNull()
    // jsdom's CSS parser drops the layered radial-gradient functions from the shorthand, so
    // assert the surviving base layer (#09090b) — enough to prove the inline gradient is set.
    expect(fallback?.getAttribute('style')).toContain('rgb(9, 9, 11)')
  })

  it('renders the Backed by builders grid with logos and faces', () => {
    render(<HomePage />)
    expect(screen.getByText('Backed by builders')).toBeDefined()
    expect(screen.getByAltText('Y Combinator logo')).toBeDefined()
    expect(screen.getByAltText('Pioneer Fund logo')).toBeDefined()
    for (const name of ['Garry Tan', 'Charlie Songhurst', 'Drew Houston', 'Immad Akhund', 'Tomer London', 'Darby Wong', 'Jude Gomila']) {
      expect(screen.getByText(name)).toBeDefined()
    }
    expect(screen.getByAltText('Photo of Jude Gomila').getAttribute('src')).toBe('/faces/jude-gomila.jpg')
  })

  it('renders the founder 2026-09-30 section flow in order: hero → builders → processes → vendor rankings → get-started content', () => {
    const { container } = render(<HomePage />)
    // One marker per section, in expected document order (founder reorder 2026-09-30:
    // processes ABOVE the vendor rankings).
    const markers = [
      screen.getByRole('heading', { level: 1, name: /Automating\s*the startup/ }),
      screen.getByText('Backed by builders'),
      screen.getByRole('heading', { level: 2, name: 'Automating founder processes' }),
      screen.getByRole('heading', { level: 2, name: 'Open vendor rankings' }),
      screen.getByRole('heading', { level: 2, name: 'Start and run your company from any agent' }),
      screen.getByRole('heading', { level: 2, name: 'Works across the agents you already use' }),
    ]
    for (let i = 1; i < markers.length; i++) {
      // DOCUMENT_POSITION_FOLLOWING (4): markers[i] comes after markers[i - 1].
      expect(markers[i - 1].compareDocumentPosition(markers[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(4)
    }
    // The closing "Your AI native company starts here" module is NOT duplicated on the page —
    // the sitewide InstallBanner (app/layout.tsx) is that section, right below.
    expect(within(container as HTMLElement).queryByText('Your AI native company starts here')).toBeNull()
  })

  it(`renders the Rankings mini table: ${HOME_RANKINGS_COUNT} rows, rank 1..${HOME_RANKINGS_COUNT}, and the /overall link`, () => {
    render(<HomePage />)
    const section = document.querySelector('section[aria-labelledby="home-rankings-heading"]') as HTMLElement
    expect(section).not.toBeNull()
    const rows = section.querySelectorAll('tbody tr')
    expect(rows.length).toBe(HOME_RANKINGS_COUNT)
    // Rank is the /overall default-order identity — the first cell counts 1..15.
    expect(rows[0].querySelector('td span')?.textContent).toBe('1')
    expect(rows[HOME_RANKINGS_COUNT - 1].querySelector('td span')?.textContent).toBe(String(HOME_RANKINGS_COUNT))
    // Every row's product cell links into its arena product page.
    const firstLink = rows[0].querySelector('a')
    expect(firstLink?.getAttribute('href')).toMatch(/^\/arena\/[^/]+\/product\/[^/]+$/)
    const seeAll = within(section).getByRole('link', { name: 'See all rankings →' })
    expect(seeAll.getAttribute('href')).toBe('/overall')
  })

  it(`renders the processes mini table: ${HOME_PROCESSES_COUNT} timeline-ordered rows and the /processes link`, () => {
    render(<HomePage />)
    const section = document.querySelector('section[aria-labelledby="home-processes-heading"]') as HTMLElement
    expect(section).not.toBeNull()
    const rows = section.querySelectorAll('tbody tr')
    expect(rows.length).toBe(HOME_PROCESSES_COUNT)
    // Every row links to its process page and carries an agent-ceiling bar; the icon renders
    // through IconGlyph as the house SVG, never as a raw `pi:` token (founder bug 2026-09-30).
    for (const row of rows) {
      expect(row.querySelector('a')?.getAttribute('href')).toMatch(/^\/processes\/[a-z0-9-]+$/)
      expect(row.querySelector('[role="img"]')?.getAttribute('aria-label')).toMatch(/% of steps agent-runnable$/)
      expect(row.textContent).not.toContain('pi:')
      expect(row.querySelector('a svg')).not.toBeNull()
    }
    // The Vendor column rides along (founder 2026-09-30): header present, and at least one row
    // carries a ?via= lens chip into its process.
    expect(within(section).getByText('Vendor')).toBeDefined()
    expect(section.querySelector('tbody a[href*="?via="]')).not.toBeNull()
    const see = within(section).getByRole('link', { name: 'See processes →' })
    expect(see.getAttribute('href')).toBe('/processes')
  })

  it('renders the shared get-started content sections (install module + device demo + agents cards)', () => {
    render(<HomePage />)
    // The install module (shared components/InstallMethods.tsx) with its default Prompt panel.
    expect(screen.getByRole('group', { name: 'Install method' })).toBeDefined()
    expect(screen.getAllByText('set up https://ultrametric.ai/install').length).toBeGreaterThan(0)
    // The device demo's scene tabs.
    expect(screen.getByRole('group', { name: 'Choose a process to watch' })).toBeDefined()
    // The agents cards.
    for (const title of ['Keep your setup', 'Switch models anytime', 'No second AI bill']) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeDefined()
    }
    // The get-started hero renders as an h2 here — the landing hero owns the page's only h1.
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1)
  })

  it('font sweep (founder 2026-09-30): no mono body text on the homepage surfaces', () => {
    const { container } = render(<HomePage />)
    // Hero, backers, and agents-cards sections carry zero font-mono — mono stays only for the
    // install module's copyable commands and the tables' numeric cells (tabular alignment).
    const hero = container.querySelector('section')
    expect(hero?.querySelector('.font-mono')).toBeNull()
    const backers = screen.getByText('Backed by builders').closest('section')
    expect(backers?.querySelector('.font-mono')).toBeNull()
    const agents = document.querySelector('section[aria-labelledby="agents-heading"]')
    expect(agents?.querySelector('.font-mono')).toBeNull()
    // The processes mini table's only mono is CeilingBar's aligned percentage column; the
    // titles/areas are body font.
    const processes = document.querySelector('section[aria-labelledby="home-processes-heading"]') as HTMLElement
    for (const el of processes.querySelectorAll('.font-mono')) {
      expect(el.className).toContain('tabular-nums')
    }
  })
})
