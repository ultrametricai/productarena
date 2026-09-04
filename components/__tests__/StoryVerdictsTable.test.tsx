// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import StoryVerdictsTable from '@/components/StoryVerdictsTable'
import { loadCategory } from '@/lib/data'
import { buildStoryVerdictRows } from '@/lib/storyVerdictsSort'

const data = loadCategory('desktop-os', path.resolve(__dirname, '../../data'))
const productId = data.products[0].id
const rows = buildStoryVerdictRows(data, productId)

function renderTable() {
  return render(<StoryVerdictsTable category="desktop-os" productId={productId} rows={rows} />)
}

afterEach(() => {
  // The hash auto-expand test sets location.hash; reset so later mounts start collapsed.
  window.location.hash = ''
})

describe('StoryVerdictsTable', () => {
  it('renders one anchored row per story and defaults to "Sorted by quality"', () => {
    const { container } = renderTable()
    for (const row of rows) {
      const anchored = container.querySelector(`[id="story-${row.storyId}"]`)
      expect(anchored, `missing #story-${row.storyId}`).not.toBeNull()
      expect(anchored!.className).toContain('scroll-mt-4')
    }
    expect(screen.getByText(/Sorted by/).textContent).toMatch(/quality/)
  })

  it('expands a row to reveal the rationale and evidence links', () => {
    renderTable()
    const target = rows.find((r) => r.evidence.length > 0)!
    const button = screen.getByLabelText(`Details for story ${target.storyId}`)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText(target.rationale).length).toBeGreaterThan(0)
    const link = screen.getAllByText(`[${target.evidence[0].tier}]`)[0].closest('a')
    expect(link?.getAttribute('href')).toBe(target.evidence[0].url)
  })

  it('auto-expands the row targeted by a #story-<id> hash on mount', () => {
    const target = rows[0]
    window.location.hash = `#story-${target.storyId}`
    renderTable()
    const button = screen.getByLabelText(`Details for story ${target.storyId}`)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText(target.rationale).length).toBeGreaterThan(0)
  })

  it('filters rows by the text filter', () => {
    renderTable()
    const input = screen.getByLabelText('Filter stories by title, persona, or theme')
    fireEvent.change(input, { target: { value: 'zzz-no-such-story' } })
    expect(screen.getByText(/No stories match/)).toBeDefined()
  })

  it('filters rows by the theme dropdown', () => {
    const { container } = renderTable()
    const themes = [...new Set(rows.map((r) => r.theme))]
    expect(themes.length).toBeGreaterThan(1)
    const select = screen.getByLabelText('Filter stories by theme')
    fireEvent.change(select, { target: { value: themes[0] } })
    const expected = rows.filter((r) => r.theme === themes[0])
    const visible = container.querySelectorAll('tr[id^="story-"]:not([id^="story-details-"])')
    expect(visible.length).toBe(expected.length)
  })

  it('renders the official vendor response block in the expanded row when one exists', () => {
    // software-factory carries the one real seeded response: foreloop / agentic-agent-docs
    // (see data/software-factory/vendor-responses.json and docs/VENDOR-RESPONSES.md).
    const sf = loadCategory('software-factory', path.resolve(__dirname, '../../data'))
    const sfRows = buildStoryVerdictRows(sf, 'foreloop')
    const target = sfRows.find((r) => r.vendorResponse !== null)!
    expect(target.storyId).toBe('agentic-agent-docs')
    render(<StoryVerdictsTable category="software-factory" productId="foreloop" rows={sfRows} />)

    // Collapsed: the block is not in the DOM yet.
    expect(screen.queryByText('Official vendor response')).toBeNull()

    fireEvent.click(screen.getByLabelText(`Details for story ${target.storyId}`))
    expect(screen.getByText('Official vendor response')).toBeDefined()
    expect(screen.getByText('Vendor')).toBeDefined()
    // Statement renders verbatim, in quotes.
    expect(screen.getByText(`“${target.vendorResponse!.statement}”`)).toBeDefined()
    // Verification method + never-changes-a-verdict rule are stated inline.
    expect(screen.getByText(/verified via vendor GitHub org/)).toBeDefined()
    expect(screen.getByText(/never change a verdict by themselves/)).toBeDefined()
    // The fuller-statement link points at the vendor's url.
    expect(screen.getByText('full statement ↗').getAttribute('href')).toBe(target.vendorResponse!.url)
  })

  it('renders no vendor response block for rows without one', () => {
    renderTable()
    const target = rows.find((r) => r.evidence.length > 0)!
    expect(target.vendorResponse).toBeNull()
    fireEvent.click(screen.getByLabelText(`Details for story ${target.storyId}`))
    expect(screen.queryByText('Official vendor response')).toBeNull()
  })

  it('re-sorts when a column header is clicked, with aria-sort on the current column', () => {
    renderTable()
    const qualityHeader = screen.getByText('Quality').closest('th')
    expect(qualityHeader?.getAttribute('aria-sort')).toBe('descending')
    fireEvent.click(screen.getByText('Weight'))
    const weightHeader = screen.getByText('Weight').closest('th')
    expect(weightHeader?.getAttribute('aria-sort')).toBe('descending')
    expect(screen.getByText(/Sorted by/).textContent).toMatch(/weight/)
  })
})
