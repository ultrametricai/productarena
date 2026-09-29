// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import V2Page, { metadata } from '@/app/v2/page'

describe('the /v2 Ultrametric CLI/MCP product page (ported from the landing origin)', () => {
  it('renders the hero heading and subtitle verbatim', () => {
    render(<V2Page />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Start and run your company from any agent' }),
    ).toBeDefined()
    expect(
      screen.getByText('Step-by-step managed processes to let your agent handle incorporating, hiring, payroll, and more.'),
    ).toBeDefined()
  })

  it('renders the shared install module with the three methods and their notes', () => {
    render(<V2Page />)
    const group = screen.getByRole('group', { name: 'Install method' })
    expect(group).toBeDefined()
    // Prompt is the default panel (the text also opens the demo's incorporate thread).
    expect(screen.getAllByText('set up https://ultrametric.ai/install').length).toBeGreaterThan(0)
    // CLI: two $-prompted lines and the Node note.
    fireEvent.click(screen.getByRole('button', { name: 'CLI' }))
    expect(screen.getByText('npm install -g ultrametric')).toBeDefined()
    expect(screen.getByText('ultrametric init')).toBeDefined()
    expect(
      screen.getByText('Needs Node.js 22.12 or later. Adds the Ultrametric skill to Claude Code or Codex.'),
    ).toBeDefined()
    // MCP: the server URL and its note.
    fireEvent.click(screen.getByRole('button', { name: 'MCP' }))
    expect(screen.getByText('https://api.ultrametric.ai/mcp')).toBeDefined()
    expect(screen.getByText('Add it as a remote MCP server, then sign in.')).toBeDefined()
  })

  it('does NOT carry the #install anchor — the sitewide banner owns it', () => {
    render(<V2Page />)
    expect(document.getElementById('install')).toBeNull()
  })

  it('renders the device demo with its scene tabs, switching threads on click', () => {
    render(<V2Page />)
    const tabs = screen.getByRole('group', { name: 'Choose a process to watch' })
    expect(tabs).toBeDefined()
    // Default scene: incorporate (Claude, laptop + phone).
    expect(screen.getByText('Incorporate Acme Labs as a Delaware C-Corp. Me and Alex, 50/50.')).toBeDefined()
    expect(screen.getByText('Ready to file Acme Labs, Inc.')).toBeDefined()
    // Switch to payroll (Gemini): phone thread carries the process and approval.
    fireEvent.click(screen.getByRole('button', { name: 'Run payroll' }))
    expect(screen.getByText('Run payroll for this period.')).toBeDefined()
    expect(screen.getByText('$48,210 for 6 people, paid Friday.')).toBeDefined()
    expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0)
  })

  it('flips an approval to Approved on click, remembered per scene', () => {
    render(<V2Page />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.getByText('Approved')).toBeDefined()
    // Other scenes keep their own un-approved state.
    fireEvent.click(screen.getByRole('button', { name: 'Hire your first employee' }))
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDefined()
  })

  it('renders the "Works across the agents" section with all three cards verbatim', () => {
    render(<V2Page />)
    expect(screen.getByRole('heading', { level: 2, name: 'Works across the agents you already use' })).toBeDefined()
    for (const title of ['Keep your setup', 'Switch models anytime', 'No second AI bill']) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeDefined()
    }
    expect(screen.getByText('Ultrametric runs no model. The work uses the AI plan you already pay for.')).toBeDefined()
  })

  it("ends before the closing module — the sitewide InstallBanner is that section", () => {
    render(<V2Page />)
    expect(screen.queryByText('Your AI native company starts here')).toBeNull()
  })

  it('keeps the live page metadata: title, canonical /v2, and noindex,nofollow preserved', () => {
    expect(metadata.title).toBe('Ultrametric — Start and run your company from any agent')
    expect(metadata.alternates?.canonical).toBe('https://ultrametric.ai/v2')
    // The live /v2 ships noindex,nofollow — PRESERVED until the founder flips it.
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
