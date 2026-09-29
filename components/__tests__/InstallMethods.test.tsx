// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import InstallBanner from '@/components/InstallBanner'
import InstallMethods, { METHODS } from '@/components/InstallMethods'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('InstallMethods (the shared /v2 install module)', () => {
  it('keeps the three /v2 methods with their exact copy values', () => {
    expect(METHODS.map((m) => [m.id, m.value])).toEqual([
      ['prompt', 'set up https://ultrametric.ai/install'],
      ['cli', 'npm install -g ultrametric && ultrametric init'],
      ['mcp', 'https://api.ultrametric.ai/mcp'],
    ])
  })

  it('marks the active tab aria-pressed and swaps panels + notes on click', () => {
    render(<InstallMethods />)
    const prompt = screen.getByRole('button', { name: 'Prompt for agent' })
    expect(prompt.getAttribute('aria-pressed')).toBe('true')
    // The prompt method has no note.
    expect(screen.queryByText(/Needs Node\.js/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'CLI' }))
    expect(prompt.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'CLI' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Needs Node.js 22.12 or later. Adds the Ultrametric skill to Claude Code or Codex.')).toBeDefined()
  })

  it('copies the active method value and announces Copied via the aria-live label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<InstallMethods />)
    // The sr-only live label doubles as the copy button's accessible name.
    fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('set up https://ultrametric.ai/install'))
    await waitFor(() => expect(screen.getByText('Copied')).toBeDefined())
  })

  it('announces Copy failed when the clipboard is unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('nope'))
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<InstallMethods />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }))
    await waitFor(() => expect(screen.getByText('Copy failed')).toBeDefined())
  })
})

describe('InstallBanner (sitewide, renders the shared module)', () => {
  it('keeps the #install anchor, the heading, and the shared methods', () => {
    render(<InstallBanner />)
    expect(document.getElementById('install')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Your AI native company starts here' })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Install method' })).toBeDefined()
    expect(screen.getByText('set up https://ultrametric.ai/install')).toBeDefined()
  })
})
