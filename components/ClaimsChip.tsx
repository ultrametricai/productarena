import { claimsIntegrity } from '@/lib/claimsIntegrity'
import type { CategoryData } from '@/lib/data-helpers'

// ArenaTable's claims scoreboard cell: the product's claims-integrity score ("{score}/100") —
// how honestly the vendor's own claims survive our judge's independent verdicts, verified
// claims counting fully and contradicted ones counting doubly against (see
// lib/claimsIntegrity.ts for the formula). Title tooltip carries the full bucket breakdown
// (see lib/claims.ts's claimStatus), same "dense glyph, full detail in the tooltip" pattern
// as VerificationMixChip. Also reused verbatim by ClaimsIntegrityIndexTable so the number
// renders identically on the arena scoreboard and the global ranking.
export default function ClaimsChip({ data, productId }: { data: CategoryData; productId: string }) {
  const { score, verified, unverified, contradicted, untestable } = claimsIntegrity(data, productId)
  const title = `Claims integrity — verified ${verified} · unverified (vendor-claim only) ${unverified} · contradicted ${contradicted} · untestable (outside our story set) ${untestable}`

  if (score === null) {
    return (
      <span
        title={`${title}. No testable claims found — unscored, not zero.`}
        className="font-sans text-xs italic text-zinc-500"
      >
        untested
      </span>
    )
  }

  const colorClass = contradicted > 0 ? 'text-red-400' : score === 100 ? 'text-emerald-400' : 'text-zinc-300'

  return (
    <span title={title} className="font-mono text-xs tabular-nums">
      <span className={colorClass}>{score}</span>
      <span className="text-zinc-500">/100 integrity</span>
    </span>
  )
}
