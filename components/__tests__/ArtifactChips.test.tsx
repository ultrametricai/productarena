// @vitest-environment jsdom
// The Needs/Produces header rows on /processes/[slug] (founder depth wave part 2, 2026-10-01):
// the typed artifact layer rendered as house chips — Needs chips link to the canonical producer
// process, Produces chips on the producer's own page stay unlinked, and a documented exception
// producer's chip points back at the canonical page (the LLC page's EIN → Get EIN).
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ArtifactChips from '@/components/ArtifactChips'
import { artifactChipRows } from '@/lib/processDeps'
import { loadProcesses } from '@/lib/processes'

const tasks = loadProcesses()
const byId = new Map(tasks.map((t) => [t.id, t]))

describe('ArtifactChips', () => {
  it('renders Needs chips linking each required artifact to its producer process (Get EIN page)', () => {
    const task = byId.get('form_002')!
    const { container } = render(<ArtifactChips rows={artifactChipRows(task)} />)
    expect(within(container).getByText('Needs:')).toBeTruthy()
    // Get EIN requires the Certificate of Incorporation — the chip links to Incorporate C-Corp.
    const chip = within(container).getByText('Certificate of Incorporation')
    expect(chip.closest('a')?.getAttribute('href')).toBe('/processes/incorporate-c-corp')
  })

  it('renders the Produces chip unlinked on the canonical producer page itself', () => {
    const task = byId.get('form_002')!
    const { container } = render(<ArtifactChips rows={artifactChipRows(task)} />)
    expect(within(container).getByText('Produces:')).toBeTruthy()
    const ein = within(container).getByText('EIN')
    expect(ein.closest('a')).toBeNull()
    expect(ein.getAttribute('title')).toContain('Produced right here')
  })

  it('links a documented exception producer back to the canonical page (LLC page EIN → Get EIN)', () => {
    const llc = byId.get('form_011')!
    const { container } = render(<ArtifactChips rows={artifactChipRows(llc)} />)
    const ein = within(container).getByText('EIN')
    expect(ein.closest('a')?.getAttribute('href')).toBe('/processes/get-ein')
  })

  it('renders nothing for a process with no typed I/O', () => {
    const empty = tasks.find((t) => t.requires.length === 0 && t.produces.length === 0)
    expect(empty, 'corpus honesty: some processes genuinely have no registry I/O').toBeTruthy()
    const { container } = render(<ArtifactChips rows={artifactChipRows(empty!)} />)
    expect(container.innerHTML).toBe('')
  })
})
