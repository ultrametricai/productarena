// Buyer checklist / RFP view of an arena's story taxonomy (app/arena/[category]/checklist/
// page.tsx): every judged user story becomes a checkbox line grouped by theme, with its weight
// surfaced as a buyer priority (3 = must-have, 2 = should-have, 1 = nice-to-have — the same
// weights lib/scoring.ts multiplies by). Pure and `node:fs`-free, same contract as
// lib/data-helpers.ts: callers pass CategoryData, tests pass fixtures.
import { groupInOrder, stripPersonaPrefix, verdictFor, type CategoryData } from './data-helpers'
import type { Story, Verdict } from './schemas'
import { SITE_URL } from './site'

export type Priority = 'must-have' | 'should-have' | 'nice-to-have'

export function priorityForWeight(weight: number): Priority {
  return weight >= 3 ? 'must-have' : weight === 2 ? 'should-have' : 'nice-to-have'
}

// Stories grouped by theme in first-seen order, each theme's stories sorted heaviest-first
// (stable within a weight, preserving taxonomy order) — the shape both the page and the
// markdown export render.
export function checklistThemes(stories: Story[]): Array<[string, Story[]]> {
  return groupInOrder(stories, (s) => s.theme).map(([theme, themeStories]) => [
    theme,
    [...themeStories].sort((a, b) => b.weight - a.weight),
  ])
}

// The matrix's column set: the arena's top-N stories by weight (stable within a weight, so
// taxonomy order breaks ties deterministically).
export function topWeightedStories(stories: Story[], n = 10): Story[] {
  return [...stories].sort((a, b) => b.weight - a.weight).slice(0, n)
}

// Same glyph vocabulary as VerdictBadge/the access-glyph strips, plus an explicit 'n/a' for
// the matrix (where a blank cell would read as "missing data", not "not applicable").
export const VERDICT_GLYPHS: Record<Verdict['verdict'], string> = {
  full: '✓',
  partial: '~',
  disputed: '!',
  none: '—',
  na: 'n/a',
}

export function matrixGlyph(data: CategoryData, productId: string, storyId: string): string {
  return VERDICT_GLYPHS[verdictFor(data, productId, storyId).verdict]
}

// The "copy as markdown" payload: a clean, self-contained RFP checklist — GitHub-flavored
// task-list lines grouped by theme, each tagged with its priority — ending with a provenance
// line back to the arena so recipients can check the evidence themselves. Deliberately no
// verdict matrix: an RFP asks vendors the questions; the arena page holds our answers.
export function checklistMarkdown(data: CategoryData): string {
  const lines: string[] = [
    `# ${data.category.name} — buyer checklist (RFP)`,
    '',
    `Derived from ProductArena's evidence-graded user-story taxonomy for ${data.category.name}: ${data.stories.length} judged requirements. Priorities mirror story weights (3 = must-have, 2 = should-have, 1 = nice-to-have).`,
    '',
  ]
  for (const [theme, stories] of checklistThemes(data.stories)) {
    lines.push(`## ${theme}`, '')
    for (const s of stories) {
      lines.push(`- [ ] **[${priorityForWeight(s.weight)}]** ${stripPersonaPrefix(s.title)}`)
    }
    lines.push('')
  }
  lines.push(
    '---',
    '',
    `Source: ${SITE_URL}/arena/${data.category.id} (evidence-graded verdicts for ${data.products.length} products) · methodology: ${SITE_URL}/methodology`,
    '',
  )
  return lines.join('\n')
}
