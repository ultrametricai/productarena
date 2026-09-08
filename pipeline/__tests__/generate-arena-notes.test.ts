import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ChangeEvent } from '@/lib/changelog'
import {
  DRAFT_STATUS, collectNoteFacts, digestGaps, noteSchema, renderNoteMarkdown, validateNoteSources,
} from '@/pipeline/scripts/generate-arena-notes'

const OVERTAKE: ChangeEvent = {
  kind: 'overtake',
  date: '2026-09-04T10:00:00Z',
  categoryId: 'code-hosting',
  categoryName: 'Code Hosting',
  productId: 'gitea',
  productName: 'Gitea',
  productAiEra: 28.4,
  overtookId: 'github',
  overtookName: 'GitHub',
  overtookAiEra: 26.5,
}

const BASE = {
  events: [OVERTAKE],
  movers: {
    up: [{ categoryId: 'ai-coding', categoryName: 'AI Coding Agents', productId: 'codex', productName: 'Codex', delta: 15.7, to: 32.3 }],
    down: [],
  },
  closeRaces: [
    {
      categoryId: 'code-hosting', categoryName: 'Code Hosting',
      top1Name: 'GitLab', top1AiEra: 31.4, top2Name: 'Gitea', top2AiEra: 28.4,
      contestedCells: 34, unstableCells: 10,
    },
  ],
  gaps: {
    humanGapSteps: 100, irreducibleSteps: 60, unfilledSteps: 40,
    topUnfilledLabels: [{ label: 'Mail signed forms', count: 4 }],
  },
  historyBegins: '2026-08-28',
}

describe('collectNoteFacts', () => {
  it('turns overtakes, movers, close races, gaps and history caveats into sourced facts', () => {
    const facts = collectNoteFacts(BASE)
    const sources = new Set(facts.map((f) => f.source))
    expect(sources).toEqual(new Set(['/arena/code-hosting', '/arena/ai-coding', '/processes', '/changelog']))
    expect(facts[0].text).toContain('Gitea overtook GitHub in Code Hosting on 2026-09-04 (28.4 vs 26.5 Arena Score)')
    expect(facts.some((f) => f.text.includes('+15.7 Arena Score'))).toBe(true)
    expect(facts.some((f) => f.text.includes('gap 3.0') && f.text.includes('10 came back unstable'))).toBe(true)
    expect(facts.some((f) => f.text.includes('40 are unfilled market gaps'))).toBe(true)
    expect(facts.some((f) => f.text.includes('history only begins 2026-08-28'))).toBe(true)
  })

  it('ignores non-overtake events', () => {
    const launched: ChangeEvent = { kind: 'arena-launched', date: '2026-09-04T00:00:00Z', categoryId: 'c', categoryName: 'C', productCount: 4 }
    const facts = collectNoteFacts({ ...BASE, events: [launched] })
    expect(facts.every((f) => !f.text.includes('overtook'))).toBe(true)
  })
})

describe('validateNoteSources', () => {
  const allowed = new Set(['/changelog', '/arena/code-hosting'])

  it('accepts paragraphs that cite allowed sources', () => {
    expect(
      validateNoteSources(
        ['Gitea moved (source: /arena/code-hosting).', 'History is short (source: /changelog).'],
        allowed,
      ),
    ).toEqual([])
  })

  it('flags a paragraph without any citation', () => {
    expect(validateNoteSources(['No citation here.'], allowed)).toEqual([
      'paragraph 1 has no inline "(source: /...)" citation',
    ])
  })

  it('flags citations outside the fact sheet', () => {
    expect(validateNoteSources(['Made up (source: /arena/invented).'], allowed)).toEqual([
      'paragraph 1 cites "/arena/invented", which is not in the fact sheet\'s sources',
    ])
  })
})

describe('noteSchema', () => {
  const allowed = new Set(['/changelog'])
  const paragraph = 'A sufficiently long paragraph making one honest claim (source: /changelog).'

  it('accepts a well-cited note', () => {
    const parsed = noteSchema(allowed).safeParse({ title: 'The week in one flip', paragraphs: [paragraph, paragraph, paragraph, paragraph] })
    expect(parsed.success).toBe(true)
  })

  it('rejects an uncited or mis-cited note so llmJson retries with the violation', () => {
    const bad = noteSchema(allowed).safeParse({
      title: 'The week in one flip',
      paragraphs: [paragraph, paragraph, paragraph, 'A long paragraph citing nowhere at all, which is not allowed.'],
    })
    expect(bad.success).toBe(false)
    if (!bad.success) {
      expect(bad.error.issues.map((i) => i.message)).toContain('paragraph 4 has no inline "(source: /...)" citation')
    }
  })

  it('caps the essay at 5 paragraphs', () => {
    const parsed = noteSchema(allowed).safeParse({ title: 'Too long an essay', paragraphs: Array(6).fill(paragraph) })
    expect(parsed.success).toBe(false)
  })
})

describe('renderNoteMarkdown', () => {
  it('always stamps the draft status frontmatter', () => {
    const md = renderNoteMarkdown(
      { title: 'The week in one flip', paragraphs: ['One (source: /changelog).', 'Two (source: /changelog).'] },
      '2026-09-08',
    )
    expect(md.startsWith(`---\nstatus: ${DRAFT_STATUS}\ntitle: The week in one flip\ndate: 2026-09-08\n---\n`)).toBe(true)
    expect(md).toContain('One (source: /changelog).\n\nTwo (source: /changelog).')
  })
})

describe('digestGaps', () => {
  let tmp: string | undefined
  afterEach(() => { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); tmp = undefined })

  it('splits human gaps into irreducible vs unfilled and counts repeated labels', () => {
    // Empty categories.json → no live arenas → every closable rule degrades to an unfilled gap.
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-notes-gaps-'))
    fs.writeFileSync(path.join(tmp, 'categories.json'), '[]')
    const proc = (label: string, route: 'agent' | 'form' | 'person') => ({ dag: { nodes: [{ label, route }] } })
    const digest = digestGaps(
      [
        proc('Board approves the plan', 'person'), // irreducible: judgment
        proc('Submit the filing portal form', 'form'), // closer rule, but arena not live → unfilled
        proc('Submit the filing portal form', 'form'),
        proc('Agent step', 'agent'), // not a gap
      ],
      tmp,
    )
    expect(digest).toEqual({
      humanGapSteps: 3,
      irreducibleSteps: 1,
      unfilledSteps: 2,
      topUnfilledLabels: [{ label: 'Submit the filing portal form', count: 2 }],
    })
  })
})
