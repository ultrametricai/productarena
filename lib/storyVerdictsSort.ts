// Pure row-building + sort/filter logic for components/StoryVerdictsTable.tsx, kept out of the
// client component so it's testable without rendering React — the same split as
// lib/arenaTableSort.ts / components/ArenaTable.tsx. Everything imported here is node:fs-free
// (data-helpers + verification are explicitly client-safe), so the client bundle stays clean.

import {
  evidenceById, originLabel, uncertaintyFor, verdictFor, type CategoryData,
} from './data-helpers'
import type { Evidence, Story, UncertaintyEntry, Verdict } from './schemas'
import { strongestEvidence, verificationLevel, type VerificationLevel } from './verification'

export type StoryVerdictColumn =
  | 'title'
  | 'theme'
  | 'weight'
  | 'verdict'
  | 'quality'
  | 'verification'
  | 'evidence'

export type SortDirection = 'asc' | 'desc'

// One cited evidence item, flattened to exactly what the expanded row renders — url, tier
// badge, excerpt. Serializable (server page → client table), no Map/CategoryData crossing.
export interface StoryVerdictEvidenceLink {
  id: string
  tier: Evidence['tier']
  url: string
  excerpt: string
}

// One (story, verdict) cell for a single product, flattened server-side so the client table
// never needs the full CategoryData.
export interface StoryVerdictRow {
  storyId: string
  title: string
  persona: string
  // originLabel(story) — surfaced as the title tooltip, same as the old vertical list.
  origin: string
  theme: string
  group: string
  weight: number
  verdict: Verdict['verdict']
  quality: number
  confidence: Verdict['confidence']
  rationale: string
  verification: VerificationLevel
  evidence: StoryVerdictEvidenceLink[]
  // strongestEvidence(...)?.url — the single best "proof ↗" link, or null if nothing cited.
  proofUrl: string | null
  // Story scope (global/category/product — see lib/schemas.ts's StorySchema), undefined for
  // stories not yet tagged; the table renders it as a [G]/[C]/[P] chip and a filter option.
  scope?: Story['scope']
  // `/global/{storyId}` when this is a global story with a cross-arena comparison page (see
  // lib/globalStories.ts's globalStoryIds), else null — the [G] chip links here.
  globalHref: string | null
  // Multi-judge agreement ('2/3' etc) when an uncertainty entry exists for this cell.
  agreement?: UncertaintyEntry['agreement']
}

export function buildStoryVerdictRows(
  data: CategoryData,
  productId: string,
  // Ids that have a /global/[story] page (lib/globalStories.ts's globalStoryIds) — optional so
  // callers that never render the chip link (tests, llms.md) can skip the cross-arena load.
  globalStoryIds?: ReadonlySet<string>,
): StoryVerdictRow[] {
  const evidence = evidenceById(data)
  return data.stories.map((s) => {
    const v = verdictFor(data, productId, s.id)
    const proof = strongestEvidence(v, evidence)
    return {
      storyId: s.id,
      title: s.title,
      persona: s.persona,
      origin: originLabel(s),
      theme: s.theme,
      group: s.group,
      weight: s.weight,
      scope: s.scope,
      globalHref: s.scope === 'global' && globalStoryIds?.has(s.id) ? `/global/${s.id}` : null,
      verdict: v.verdict,
      quality: v.quality,
      confidence: v.confidence,
      rationale: v.rationale,
      verification: verificationLevel(v, evidence),
      evidence: v.evidenceIds
        .map((eid) => evidence.get(eid))
        .filter((e): e is Evidence => e !== undefined)
        .map((e) => ({ id: e.id, tier: e.tier, url: e.url, excerpt: e.excerpt })),
      proofUrl: proof?.url ?? null,
      agreement: uncertaintyFor(data, productId, s.id)?.agreement,
    }
  })
}

// Per-cell version of lib/data-helpers.ts's isGroupUntested rule: a zero-evidence none/na means
// we found nothing pro or con and never probed — rendering its quality as 0 would overstate
// what we know, so the table shows "untested" and sorts it last (like a null).
export function isStoryUntested(row: Pick<StoryVerdictRow, 'verdict' | 'evidence'>): boolean {
  return (row.verdict === 'none' || row.verdict === 'na') && row.evidence.length === 0
}

// Verdict strength ladder for sorting: a full pass beats partial beats disputed beats an
// evidenced "none", with "n/a" (story doesn't apply) last.
const VERDICT_STRENGTH: Record<Verdict['verdict'], number> = {
  full: 4,
  partial: 3,
  disputed: 2,
  none: 1,
  na: 0,
}

// How independently substantiated the verdict is: hands-on probe > community corroboration >
// vendor's own claim > actively disputed > nothing citable at all.
const VERIFICATION_RANK: Record<VerificationLevel, number> = {
  tested: 4,
  corroborated: 3,
  'vendor-claim': 2,
  disputed: 1,
  unverified: 0,
}

// Human-readable label for the live "Sorted by ___" strip, mirroring arenaTableSort's
// COLUMN_LABELS convention.
export const COLUMN_LABELS: Record<StoryVerdictColumn, string> = {
  title: 'story title',
  theme: 'theme',
  weight: 'weight',
  verdict: 'verdict strength',
  quality: 'quality',
  verification: 'verification',
  evidence: 'evidence count',
}

// Text columns default ascending (A→Z); every ranked/numeric column defaults descending
// (strongest/highest first) — same convention as arenaTableSort's defaultDirectionFor.
export function defaultDirectionFor(column: StoryVerdictColumn): SortDirection {
  return column === 'title' || column === 'theme' ? 'asc' : 'desc'
}

function compareNullableNumber(a: number | null, b: number | null, direction: SortDirection): number {
  // Nulls (untested cells on the quality column) always sort last regardless of direction —
  // "we don't know" is never honestly the best or worst quality.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'desc' ? b - a : a - b
}

function numericValue(row: StoryVerdictRow, column: Exclude<StoryVerdictColumn, 'title' | 'theme'>): number | null {
  switch (column) {
    case 'weight':
      return row.weight
    case 'verdict':
      return VERDICT_STRENGTH[row.verdict]
    case 'quality':
      return isStoryUntested(row) ? null : row.quality
    case 'verification':
      return VERIFICATION_RANK[row.verification]
    case 'evidence':
      return row.evidence.length
  }
}

export function sortStoryVerdictRows(
  rows: StoryVerdictRow[],
  column: StoryVerdictColumn,
  direction: SortDirection,
): StoryVerdictRow[] {
  return [...rows].sort((a, b) => {
    if (column === 'title' || column === 'theme') {
      const cmp = a[column].localeCompare(b[column])
      return direction === 'desc' ? -cmp : cmp
    }
    return compareNullableNumber(numericValue(a, column), numericValue(b, column), direction)
  })
}

// Case-insensitive substring match over title + persona + theme + group (the text filter),
// optionally intersected with an exact theme (the theme dropdown) and/or an exact scope (the
// scope dropdown). Empty theme/scope = no restriction.
export function filterStoryVerdictRows(
  rows: StoryVerdictRow[],
  query: string,
  theme = '',
  scope = '',
): StoryVerdictRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((r) => {
    if (theme !== '' && r.theme !== theme) return false
    if (scope !== '' && r.scope !== scope) return false
    if (q === '') return true
    return (
      r.title.toLowerCase().includes(q) ||
      r.persona.toLowerCase().includes(q) ||
      r.theme.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q)
    )
  })
}
