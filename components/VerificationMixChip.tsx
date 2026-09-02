import type { CategoryData } from '@/lib/data-helpers'
import { verificationMix } from '@/lib/verification'

const ORDER = ['tested', 'corroborated', 'vendor-claim', 'disputed'] as const
const GLYPH: Record<(typeof ORDER)[number], string> = {
  tested: 'T', corroborated: 'X', 'vendor-claim': 'C', disputed: 'D',
}
const COLOR: Record<(typeof ORDER)[number], string> = {
  tested: 'text-emerald-400',
  corroborated: 'text-sky-400',
  'vendor-claim': 'text-zinc-400',
  disputed: 'text-red-400',
}

// Dense mini-chip for the ArenaTable: how a product's coverage breaks down across the four
// verified levels (see lib/verification.ts's verificationMix + components/Legend.tsx). Renders
// only levels with a non-zero count, so a product with no disputed cells doesn't show "D0"
// clutter — full breakdown (including zeros) is always in the title tooltip.
export default function VerificationMixChip({ data, productId }: { data: CategoryData; productId: string }) {
  const mix = verificationMix(data, productId)
  const total = ORDER.reduce((sum, key) => sum + mix[key], 0)
  const title = `Verification mix — tested ${mix.tested} · corroborated ${mix.corroborated} · claimed ${mix['vendor-claim']} · disputed ${mix.disputed}. See legend.`
  if (total === 0) {
    return <span title={title} className="font-mono text-xs text-zinc-500">—</span>
  }
  return (
    <span title={title} className="flex items-center gap-1.5 font-mono text-xs">
      {ORDER.filter((key) => mix[key] > 0).map((key) => (
        <span key={key} className={COLOR[key]}>
          {GLYPH[key]}
          <span className="text-zinc-500">{mix[key]}</span>
        </span>
      ))}
    </span>
  )
}
