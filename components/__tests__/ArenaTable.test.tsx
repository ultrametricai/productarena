// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ArenaTable from '@/components/ArenaTable'
import { loadCategory } from '@/lib/data'

describe('ArenaTable', () => {
  it('renders every product with Arena Score as the default sort', () => {
    const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
    render(<ArenaTable data={data} logoMap={{}} />)
    for (const p of data.products) {
      expect(screen.getAllByText(p.name).length).toBeGreaterThan(0)
    }
    const initScoreHeader = screen.getAllByText('Arena Score').map((el) => el.closest('th')).find((th) => th !== null)
    expect(initScoreHeader?.getAttribute('aria-sort')).toBe('descending')
  })

  it('activates the preset and re-sorts when a preset button is clicked', () => {
    const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
    render(<ArenaTable data={data} logoMap={{}} />)
    fireEvent.click(screen.getByText('Most agent-ready'))
    const header = screen.getAllByText('Agent-ready').map((el) => el.closest('th')).find((th) => th !== null)
    expect(header?.getAttribute('aria-sort')).toBe('descending')
  })

  it('filters rows by the text filter', () => {
    const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
    render(<ArenaTable data={data} logoMap={{}} />)
    const input = screen.getByLabelText('Filter products by name or vendor')
    fireEvent.change(input, { target: { value: 'zzz-no-such-product' } })
    expect(screen.getByText(/No products match/)).toBeDefined()
  })

  it('sets aria-sort on the current sort column header', () => {
    const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
    render(<ArenaTable data={data} logoMap={{}} />)
    const initScoreHeader = screen.getAllByText('Arena Score').map((el) => el.closest('th')).find((th) => th !== null)
    expect(initScoreHeader?.getAttribute('aria-sort')).toBe('descending')
  })
})
