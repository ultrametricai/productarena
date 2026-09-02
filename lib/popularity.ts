// Pure math/formatting for the popularity/momentum signal (see pipeline/stages/popularity.ts,
// which collects the raw numbers, and components/MomentumChip.tsx, which renders them). Kept
// free of node:fs/network so it's usable from both the pipeline (Node) and the app (client
// component) and is trivially unit-testable.
import type { Popularity } from './schemas'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_YEAR = 365.25 * MS_PER_DAY

// Guards against a repo created "today" producing an absurd stars/yr (division by ~0). A repo
// younger than ~2 weeks reports no stars/yr rather than a misleading spike.
const MIN_YEARS = 14 / 365.25

// stars ÷ years since the repo's created_at. `now` is injectable for tests; defaults to the
// real clock at call time (always a fresh pipeline run, never cached).
export function starsPerYear(stars: number, createdAt: string, now: Date = new Date()): number | undefined {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return undefined
  const years = (now.getTime() - created.getTime()) / MS_PER_YEAR
  if (years < MIN_YEARS) return undefined
  return stars / years
}

// Whole days between a repo's pushed_at and now — the "is anyone still touching this" half of
// the signal, alongside starsPerYear's "did anyone ever care" half.
export function daysSincePush(pushedAt: string, now: Date = new Date()): number | undefined {
  const pushed = new Date(pushedAt)
  if (Number.isNaN(pushed.getTime())) return undefined
  const days = (now.getTime() - pushed.getTime()) / MS_PER_DAY
  return days < 0 ? 0 : Math.round(days)
}

// "12400" -> "12.4k", "2300000" -> "2.3M". Compact number formatting shared by every chip/column
// that shows a star or download count — deliberately not Intl.NumberFormat's "compact" notation
// so output is stable across Node/browser locale data and easy to unit test byte-for-byte.
export function formatCompact(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}${trimTrailingZero((abs / 1_000_000).toFixed(1))}M`
  if (abs >= 1_000) return `${sign}${trimTrailingZero((abs / 1_000).toFixed(1))}k`
  return `${sign}${Math.round(abs)}`
}

function trimTrailingZero(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

// Whether a Popularity record has anything display-worthy at all — an entry with only
// `fetchedAt` set (fetch attempted, nothing came back) is functionally "no public signals".
export function hasSignal(p: Popularity | undefined): p is Popularity {
  if (!p) return false
  return (
    p.stars !== undefined ||
    p.starsPerYear !== undefined ||
    p.npmWeekly !== undefined ||
    p.pypiWeekly !== undefined
  )
}
