// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import StoryMatrix from '@/components/StoryMatrix'
import { loadCategory } from '@/lib/data'

describe('StoryMatrix', () => {
  it('strips the "As a(n) X, I can" prefix from displayed story titles', () => {
    const data = loadCategory('ai-coding', path.resolve(__dirname, '../../data'))
    render(<StoryMatrix data={data} logoMap={{}} />)
    expect(screen.queryByText(/^As an? /)).toBeNull()
  })

  it('shows a persona tag column and a persona filter dropdown', () => {
    const data = loadCategory('ai-coding', path.resolve(__dirname, '../../data'))
    render(<StoryMatrix data={data} logoMap={{}} />)
    expect(screen.getByLabelText('Filter by persona')).toBeDefined()
    const personas = [...new Set(data.stories.map((s) => s.persona))]
    for (const p of personas) {
      expect(screen.getAllByText(p).length).toBeGreaterThan(0)
    }
  })

  it('filters visible story rows when a persona is selected', () => {
    const data = loadCategory('ai-coding', path.resolve(__dirname, '../../data'))
    const { container } = render(<StoryMatrix data={data} logoMap={{}} />)
    const select = screen.getByLabelText('Filter by persona') as HTMLSelectElement
    const persona = data.stories[0].persona
    fireEvent.change(select, { target: { value: persona } })
    const expectedCount = data.stories.filter((s) => s.persona === persona).length
    expect(container.querySelectorAll('tbody tr').length).toBe(expectedCount)
  })

  it("the 'N/N stories shown · legend' line next to the persona filter is gone (founder 2026-10-02)", () => {
    // The count line and its #legend jump link were removed; the Legend section itself still
    // renders at #legend on the arena page (app/arena/[category]/page.tsx), so the legend
    // content stays reachable where it explains the tables.
    const data = loadCategory('ai-coding', path.resolve(__dirname, '../../data'))
    const { container } = render(<StoryMatrix data={data} logoMap={{}} />)
    expect(container.textContent).not.toContain('stories shown')
    expect(container.querySelector('a[href="#legend"]')).toBeNull()
  })

  it('shows the action-primitives theme under its plain-language name (founder 2026-09-30)', () => {
    const data = loadCategory('browser-agents', path.resolve(__dirname, '../../data'))
    render(<StoryMatrix data={data} logoMap={{}} />)
    expect(screen.getAllByText('Agent actions').length).toBeGreaterThan(0)
    expect(screen.queryByText('Action primitives')).toBeNull()
  })

  it('keeps group section names (the "Caching" label) at the readable secondary tier', () => {
    // Founder 2026-09-30: group section names rendered very dark grey on black. Labels that
    // name a section sit at zinc-400 (secondary), never zinc-500/600.
    const data = loadCategory('browser-agents', path.resolve(__dirname, '../../data'))
    render(<StoryMatrix data={data} logoMap={{}} />)
    for (const label of screen.getAllByText('Caching')) {
      expect(label.className).toContain('text-zinc-400')
    }
  })
})
