// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProofBlock from '@/components/ProofBlock'
import type { ProofIndexEntry } from '@/lib/proofs'

const TERMINAL: ProofIndexEntry = {
  probeId: 'cli-version',
  productId: 'claude-code',
  storyIds: ['agentic-official-cli'],
  command: 'claude --version',
  recordedAt: '2026-09-03T20:53:15.321Z',
  exitCode: 0,
  kind: 'terminal',
  file: 'claude-code/cli-version.txt',
}

describe('ProofBlock', () => {
  it('renders a terminal transcript with the prompt line and story chip', () => {
    render(
      <ProofBlock
        entry={TERMINAL}
        transcript={'$ claude --version\n\x1b[1m2.1.259 (Claude Code)\x1b[0m\n'}
        storyTitles={{ 'agentic-official-cli': 'I can use an official CLI' }}
      />,
    )
    expect(screen.getByText('claude --version')).toBeDefined()
    // SGR sequences are stripped for display
    expect(screen.getByText(/2\.1\.259 \(Claude Code\)/).textContent).not.toContain('\x1b')
    expect(screen.getByText('reproduced')).toBeDefined()
    const chip = screen.getByText('proves: I can use an official CLI')
    expect(chip.getAttribute('href')).toBe('#story-agentic-official-cli')
    expect(screen.getByText('recorded 2026-09-03')).toBeDefined()
  })

  it('marks a non-zero exit as failed — failed proofs are published, not hidden', () => {
    render(<ProofBlock entry={{ ...TERMINAL, exitCode: 1 }} transcript="nope\n" />)
    expect(screen.getByText('failed (exit 1)')).toBeDefined()
  })

  it('renders a video player for video proofs', () => {
    const { container } = render(
      <ProofBlock
        entry={{ ...TERMINAL, kind: 'video', file: 'claude-code/x.webm' }}
        videoSrc="/productarena/data/ai-coding/proofs/claude-code/x.webm"
      />,
    )
    const video = container.querySelector('video')
    expect(video?.getAttribute('src')).toBe('/productarena/data/ai-coding/proofs/claude-code/x.webm')
    expect(video?.hasAttribute('controls')).toBe(true)
  })

  it('falls back gracefully when the recording file is missing', () => {
    render(<ProofBlock entry={TERMINAL} transcript={null} />)
    expect(screen.getByText('recording unavailable')).toBeDefined()
  })
})
