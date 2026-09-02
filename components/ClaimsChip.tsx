import { claimBucketCounts, claimedStoryCount } from '@/lib/claims'
import type { CategoryData } from '@/lib/data-helpers'

// ArenaTable's claims scoreboard cell: "{verified}/{claimed} claims verified" — how many of a
// product's own vendor claims our judge independently corroborated, out of however many claims
// actually map onto this arena's story taxonomy. Title tooltip carries the full bucket
// breakdown (see lib/claims.ts's claimStatus), same "dense glyph, full detail in the tooltip"
// pattern as VerificationMixChip.
export default function ClaimsChip({ data, productId }: { data: CategoryData; productId: string }) {
  const counts = claimBucketCounts(data, productId)
  const claimed = claimedStoryCount(counts)
  const title = `Claims vs evidence — verified ${counts['claimed-verified']} · unverified (vendor-claim only) ${counts['claimed-unverified']} · contradicted ${counts['claimed-contradicted']} · delivered but never claimed ${counts['delivered-unclaimed']}`

  if (claimed === 0) {
    return <span title={title} className="font-mono text-xs text-zinc-500">—</span>
  }

  const verified = counts['claimed-verified']
  const colorClass = counts['claimed-contradicted'] > 0 ? 'text-red-400' : verified === claimed ? 'text-emerald-400' : 'text-zinc-300'

  return (
    <span title={title} className="font-mono text-xs">
      <span className={colorClass}>{verified}</span>
      <span className="text-zinc-500">/{claimed} claims verified</span>
    </span>
  )
}
