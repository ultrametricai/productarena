import type { VerificationLevel } from '@/lib/verification'

const STYLES: Record<Exclude<VerificationLevel, 'unverified'>, string> = {
  'vendor-claim': 'bg-zinc-900 text-zinc-500 ring-zinc-700',
  corroborated: 'bg-sky-950 text-sky-300 ring-sky-800',
  tested: 'bg-emerald-950 text-emerald-300 ring-emerald-800',
  disputed: 'bg-red-950 text-red-300 ring-red-800',
}

const LABELS: Record<Exclude<VerificationLevel, 'unverified'>, string> = {
  'vendor-claim': 'claimed',
  corroborated: 'corroborated',
  tested: 'tested',
  disputed: 'disputed',
}

// Single-letter glyph for the dense StoryMatrix cells, where a full pill doesn't fit.
// The full label is still available via the title attribute for a11y/discoverability.
const GLYPHS: Record<Exclude<VerificationLevel, 'unverified'>, string> = {
  'vendor-claim': 'C',
  corroborated: 'X',
  tested: 'T',
  disputed: 'D',
}

export default function VerificationBadge({
  level,
  compact = false,
}: {
  level: VerificationLevel
  compact?: boolean
}) {
  if (level === 'unverified') return null
  if (compact) {
    return (
      <span
        title={`verification: ${LABELS[level]}`}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ring-1 ${STYLES[level]}`}
      >
        {GLYPHS[level]}
      </span>
    )
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  )
}
