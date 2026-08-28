import { describe, expect, it } from 'vitest'
import { buildEvidence } from '@/pipeline/stages/extract'

describe('buildEvidence', () => {
  const urls = { site: 'https://omarchy.org/', github: 'https://github.com/basecamp/omarchy' }
  const extraction = {
    stories: [
      { persona: 'developer', title: 'tile windows by keyboard', quote: 'Hyprland tiling out of the box', sourceKey: 'site' as const },
      { persona: 'switcher', title: 'install in one command', quote: 'One command converts fresh Arch', sourceKey: 'github' as const },
      { persona: 'power-user', title: 'themes everywhere', quote: 'Hyprland tiling out of the box', sourceKey: 'site' as const },
    ],
  }

  it('assigns tier-based ids, maps urls, dedupes identical quotes', () => {
    const { candidates, evidence } = buildEvidence('omarchy', extraction, urls, '2026-08-26T00:00:00Z')
    expect(evidence).toHaveLength(2) // duplicate quote deduped
    expect(evidence[0]).toMatchObject({ id: 'omarchy-docs-1', tier: 'claimed-docs', url: urls.site })
    expect(evidence[1]).toMatchObject({ id: 'omarchy-gh-1', tier: 'github', url: urls.github })
    expect(candidates).toHaveLength(3)
    expect(candidates[2].evidenceId).toBe('omarchy-docs-1') // deduped story points at existing evidence
  })

  it('maps an extra-N sourceKey to the matching urls.extra entry', () => {
    const urlsWithExtra = { ...urls, extra: ['https://omarchy.org/features'] }
    const extractionWithExtra = {
      stories: [
        { persona: 'developer', title: 'feature x', quote: 'quote from the features page', sourceKey: 'extra-0' as const },
      ],
    }
    const { evidence } = buildEvidence('omarchy', extractionWithExtra, urlsWithExtra, '2026-08-26T00:00:00Z')
    expect(evidence).toHaveLength(1)
    expect(evidence[0]).toMatchObject({ tier: 'claimed-docs', url: 'https://omarchy.org/features' })
  })

  it('falls back to the site url when the referenced extra index is missing', () => {
    const extractionWithExtra = {
      stories: [
        { persona: 'developer', title: 'feature y', quote: 'quote pointing at an out-of-range extra', sourceKey: 'extra-3' as const },
      ],
    }
    const { evidence } = buildEvidence('omarchy', extractionWithExtra, urls, '2026-08-26T00:00:00Z')
    expect(evidence[0]).toMatchObject({ url: urls.site })
  })
})
