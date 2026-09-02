import VerdictBadge from '@/components/VerdictBadge'
import { claimBucketCounts, claimEntriesByStatus, unmappedClaims, type ClaimStatus } from '@/lib/claims'
import { evidenceById, type CategoryData } from '@/lib/data'
import { REPO } from '@/lib/site'
import { strongestEvidence } from '@/lib/verification'

// Server component (no client interactivity beyond native <details>/<summary> disclosure, which
// needs no JS) — the product page's "Claims vs evidence" section: what the vendor's own
// claimed-docs/github materials say the product can do, reconciled against what our judge
// independently found. See lib/claims.ts's claimStatus for the reconciliation rules.
const BUCKETS: Array<{ status: ClaimStatus; label: string; numberClass: string; borderClass: string }> = [
  { status: 'claimed-verified', label: 'Verified', numberClass: 'text-emerald-400', borderClass: 'border-emerald-900/60' },
  { status: 'claimed-unverified', label: 'Unverified', numberClass: 'text-zinc-300', borderClass: 'border-zinc-800' },
  { status: 'claimed-contradicted', label: 'Contradicted', numberClass: 'text-red-400', borderClass: 'border-red-900/60' },
  { status: 'delivered-unclaimed', label: 'Undersold', numberClass: 'text-amber-400', borderClass: 'border-amber-900/60' },
]

export default function ClaimsSection({
  data,
  category,
  productId,
}: {
  data: CategoryData
  category: string
  productId: string
}) {
  const claims = data.claims[productId] ?? []
  if (claims.length === 0) return null

  const product = data.products.find((p) => p.id === productId)!
  const counts = claimBucketCounts(data, productId)
  const evidence = evidenceById(data)
  const storyById = new Map(data.stories.map((s) => [s.id, s]))
  const unmapped = unmappedClaims(data, productId)

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Claims vs evidence</h2>
      <p className="mb-3 text-xs text-zinc-400">
        {claims.length} distinct capability claims found in {product.name}&rsquo;s own claimed-docs/GitHub materials,
        reconciled against our judge&rsquo;s independent verdicts.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKETS.map(({ status, label, numberClass, borderClass }) => (
          <div key={status} className={`rounded-lg border ${borderClass} p-3 text-center`}>
            <p className={`text-2xl font-bold tabular-nums ${numberClass}`}>{counts[status]}</p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {BUCKETS.map(({ status, label, numberClass }) => {
          const entries = claimEntriesByStatus(data, productId, status)
          if (entries.length === 0) return null
          return (
            <details key={status} className="rounded-lg border border-zinc-800 p-3">
              <summary className={`cursor-pointer text-sm font-medium ${numberClass}`}>
                {label} ({entries.length})
              </summary>
              <ul className="mt-2 space-y-3">
                {entries.map(({ claim, storyId }, i) => {
                  const story = storyById.get(storyId)!
                  const v = data.verdicts.find((x) => x.productId === productId && x.storyId === storyId)!
                  const proof = strongestEvidence(v, evidence)
                  return (
                    <li key={`${storyId}-${i}`} className="text-sm">
                      {claim && <p className="text-zinc-300">&ldquo;{claim.text}&rdquo;</p>}
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <a href={`#story-${story.id}`} className="underline decoration-zinc-700 hover:text-amber-300">
                          {story.title}
                        </a>
                        <VerdictBadge verdict={v.verdict} />
                        {proof && (
                          <a href={proof.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-300">
                            proof ↗
                          </a>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </details>
          )
        })}
      </div>
      {unmapped.length > 0 && (
        <details className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-400">
            Claims outside our story set ({unmapped.length})
          </summary>
          <p className="mt-1 text-xs text-zinc-500">
            Real capability claims found in {product.name}&rsquo;s own materials, but no story in this arena&rsquo;s
            taxonomy covers them yet — that&rsquo;s feedback on the taxonomy, not a mark against the product.
          </p>
          <ul className="mt-2 space-y-2">
            {unmapped.map((c) => (
              <li key={c.id} className="text-sm">
                <p className="text-zinc-300">&ldquo;{c.text}&rdquo;</p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-amber-300"
                >
                  source ↗
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`[taxonomy gap] ${category}/${productId}`)}&labels=contest`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
          >
            Suggest a story for these →
          </a>
        </details>
      )}
    </div>
  )
}
