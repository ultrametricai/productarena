import type { Metadata } from 'next'
import { Suspense } from 'react'
import CompareBuilder from '@/components/CompareBuilder'
import { loadAll } from '@/lib/data'
import { buildCompareProducts } from '@/lib/compareData'

export const metadata: Metadata = {
  title: 'Compare products — ProductArena',
  description:
    'Side-by-side, evidence-backed comparison of any products on ProductArena — Arena Score, agent-readiness, API quality, shared theme scores, and agent access, with a shareable URL.',
}

// Static shell: the page prerenders once; the actual selection lives in `?p=…`, read
// client-side by CompareBuilder via useSearchParams — the <Suspense> boundary below is what
// makes that static-export safe (the builder subtree client-renders; no server sees the query).
export default function ComparePage() {
  const products = buildCompareProducts(loadAll())

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Compare</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Any products, side by side — every number is the same evidence-backed score the arenas
          publish. Your selection is the URL, so a comparison is always a shareable link.
        </p>
      </section>

      <Suspense fallback={null}>
        <CompareBuilder products={products} />
      </Suspense>
    </div>
  )
}
