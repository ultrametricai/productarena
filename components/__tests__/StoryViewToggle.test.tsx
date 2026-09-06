// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StoryViewToggle from '@/components/StoryViewToggle'

// jsdom has no scrollIntoView — the hash handler calls it on the deep-linked row.
Element.prototype.scrollIntoView = vi.fn()

function renderToggle() {
  return render(
    <StoryViewToggle
      map={<div data-testid="map-view">the map</div>}
      table={
        <div data-testid="table-view">
          <div id="story-agentic-public-api">row</div>
        </div>
      }
    />,
  )
}

function panel(testId: string): HTMLElement {
  // closest() because `hidden` lives on the wrapping tabpanel div, not the child.
  return screen.getByTestId(testId).closest('[role="tabpanel"]') as HTMLElement
}

afterEach(() => {
  window.location.hash = ''
})

describe('StoryViewToggle', () => {
  it('defaults to the table view with the map hidden (both server-rendered)', () => {
    renderToggle()
    expect(panel('table-view').hidden).toBe(false)
    expect(panel('map-view').hidden).toBe(true)
    expect(screen.getByRole('tab', { name: 'Table' }).getAttribute('aria-selected')).toBe('true')
  })

  it('switches to the map and back via the tabs', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))
    expect(panel('map-view').hidden).toBe(false)
    expect(panel('table-view').hidden).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: 'Table' }))
    expect(panel('table-view').hidden).toBe(false)
  })

  it('flips back to the table when a #story-<id> hash lands (map block click)', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))
    expect(panel('table-view').hidden).toBe(true)
    window.location.hash = '#story-agentic-public-api'
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(panel('table-view').hidden).toBe(false)
    expect(panel('map-view').hidden).toBe(true)
  })

  it('ignores non-story hashes', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('tab', { name: 'Map' }))
    window.location.hash = '#try-it'
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(panel('map-view').hidden).toBe(false)
  })
})
