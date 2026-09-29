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

  it('renders the AFK and Foreloop product cards with their destinations', () => {
    render(<HomePage />)
    const afk = screen.getByRole('link', { name: /Company processes/ })
    expect(afk.getAttribute('href')).toBe('/company')
    const foreloop = screen.getByRole('link', { name: /Product development/ })
    expect(foreloop.getAttribute('href')).toBe('https://foreloop.com')
    expect(foreloop.getAttribute('rel')).toContain('noopener')
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
