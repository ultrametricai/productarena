// @vitest-environment jsdom
// The header dropdown's grouped + searchable behavior: section headers render, the pinned
// search filters items live (empty sections disappear), and mouse selection still works.
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArenaMenu, { type ArenaMenuSection } from '@/components/ArenaMenu'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const SECTIONS: ArenaMenuSection[] = [
  { name: 'AI & Agents', items: [{ id: 'ai-coding', name: 'AI Coding Agents', label: 'AI' }] },
  {
    name: 'Fintech & Back Office',
    items: [
      { id: 'payments', name: 'Online Payments', label: 'Payments' },
      { id: 'payroll', name: 'Payroll & HR Ops', label: 'Payroll' },
    ],
  },
]

function openMenu() {
  render(<ArenaMenu sections={SECTIONS} searchable />)
  fireEvent.click(screen.getByRole('button', { name: /Arenas/ }))
}

describe('ArenaMenu (grouped + searchable)', () => {
  it('renders section headers and every item when open', () => {
    openMenu()
    expect(screen.getByText('AI & Agents')).toBeTruthy()
    expect(screen.getByText('Fintech & Back Office')).toBeTruthy()
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
  })

  it('filters live from the pinned search and hides empty sections', () => {
    openMenu()
    fireEvent.change(screen.getByLabelText('Search arenas'), { target: { value: 'payro' } })
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
    expect(screen.getByText('Payroll & HR Ops')).toBeTruthy()
    expect(screen.queryByText('AI & Agents')).toBeNull()
  })

  it('shows an honest empty state for a no-match query', () => {
    openMenu()
    fireEvent.change(screen.getByLabelText('Search arenas'), { target: { value: 'zzz' } })
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    expect(screen.getByText('No matches')).toBeTruthy()
  })

  it('menu items stay clickable links (mouse selection unchanged)', () => {
    openMenu()
    const link = screen.getByText('Online Payments').closest('a')
    expect(link?.getAttribute('href')).toBe('/arena/payments')
    fireEvent.click(link!)
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0) // clicking closes the menu
  })

  it('keeps the flat items mode for the Explore menu', () => {
    render(<ArenaMenu title="Explore" items={[{ id: 'global', name: 'Capability adoption', label: 'stats', href: '/global' }]} />)
    fireEvent.click(screen.getByRole('button', { name: /Explore/ }))
    expect(screen.getByText('Capability adoption').closest('a')?.getAttribute('href')).toBe('/global')
    expect(screen.queryByLabelText('Search explore')).toBeNull() // not searchable unless asked
  })
})
