// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from '@/app/about/page'
import { REPO } from '@/lib/site'

describe('about page', () => {
  it('renders the company facts, the doctrine, and the founder note', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'About Ultrametric' })).toBeDefined()
    // The legal entity is stated (matches /tos: Ultrametric, Inc., a Delaware corporation).
    expect(screen.getByText(/Ultrametric, Inc\., a Delaware corporation/)).toBeDefined()
    // The three surfaces.
    expect(screen.getByRole('heading', { name: 'The open startup repo' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Evidence-graded rankings' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'The open startup simulator' })).toBeDefined()
    // The doctrine: evidence-driven, affiliations disclosed.
    expect(screen.getByText('Everything evidence-driven.')).toBeDefined()
    expect(screen.getByText('Affiliations disclosed.')).toBeDefined()
    // Founders + the clearly-marked draft note (a FOUNDER-VOICE DRAFT until they edit it).
    expect(screen.getByText('Ultrametric was founded by Jude and Tyler.')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'A note from Jude & Tyler' })).toBeDefined()
    expect(screen.getByText(/evidence beats opinion/)).toBeDefined()
    // Repo link.
    const repo = screen.getByRole('link', { name: 'The repo on GitHub' })
    expect(repo.getAttribute('href')).toBe(`https://github.com/${REPO}`)
  })

  it('states corpus counts computed from the committed data, never hand-maintained', () => {
    render(<AboutPage />)
    // The exact numbers come from loadProcesses()/loadChains()/loadAll() at render time, so the
    // page cannot drift from the repo: assert the sentence shape, not a frozen number.
    expect(screen.getByText(/\d+ step-by-step founder processes and \d+ chained playbooks/)).toBeDefined()
    expect(screen.getByText(/\d+ arenas and \d+ products, judged on real user stories/)).toBeDefined()
  })
})
