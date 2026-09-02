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
    render(<StoryMatrix data={data} logoMap={{}} />)
    const select = screen.getByLabelText('Filter by persona') as HTMLSelectElement
    const persona = data.stories[0].persona
    fireEvent.change(select, { target: { value: persona } })
    const expectedCount = data.stories.filter((s) => s.persona === persona).length
    expect(screen.getByText(`${expectedCount}/${data.stories.length} stories shown`, { exact: false })).toBeDefined()
  })
})
