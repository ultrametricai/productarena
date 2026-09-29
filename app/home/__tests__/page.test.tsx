// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from '@/app/home/page'

describe('landing homepage (ported to /home; served at ultrametric.ai/ by the worker)', () => {
  it('renders the hero with the simulator CTA', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: /Automating\s*the startup/ })).toBeDefined()
    expect(screen.getByText('Redefining work in the AI phase transition')).toBeDefined()
    const cta = screen.getByRole('link', { name: /Open the startup simulator/ })
    expect(cta.getAttribute('href')).toBe('/virtual-startup')
  })

  it('renders the original large AFK and Foreloop product cards with their destinations', () => {
    render(<HomePage />)
    // The landing's large cards, restored (founder addendum 2026-09-29): eyebrow, display
    // title, mono subtitle, and the Explore CTA row.
    const afk = screen.getByRole('link', { name: /Explore AFK/ })
    expect(afk.getAttribute('href')).toBe('/company')
    expect(afk.textContent).toContain('Away From Keyboard')
    expect(afk.textContent).toContain('Automate running your startup.')
    const foreloop = screen.getByRole('link', { name: /Explore Foreloop/ })
    expect(foreloop.getAttribute('href')).toBe('https://foreloop.com')
    expect(foreloop.getAttribute('rel')).toContain('noopener')
    expect(foreloop.textContent).toContain('Automate building your product.')
    expect(screen.getByText('Products for the new way of working')).toBeDefined()
    // The founder-removed #products anchor stays gone.
    expect(document.getElementById('products')).toBeNull()
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
})
