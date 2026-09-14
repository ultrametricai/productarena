import type { Metadata } from 'next'
import { Suspense } from 'react'
import CompareBuilder from '@/components/CompareBuilder'
import { loadAll } from '@/lib/data'
import { buildCompareProducts } from '@/lib/compareData'
import { withBase } from '@/lib/site'

// Curated starter comparisons so the empty state offers something clickable, not just
// instructions. Ids are validated against the live catalog below — a renamed/removed product
// silently drops its starter rather than shipping a dead link.
const STARTERS: { label: string; ids: string[] }[] = [
  { label: 'Claude Code vs Codex vs Cursor', ids: ['claude-code', 'codex', 'cursor'] },
  { label: 'Stripe vs Adyen vs PayPal', ids: ['stripe', 'adyen', 'paypal'] },
  { label: 'Linear vs Jira', ids: ['linear', 'jira'] },
  { label: 'Supabase vs Firebase', ids: ['supabase', 'firebase'] },
]

export const metadata: Metadata = {
  title: 'Compare products — ProductArena',
  description:
    'Side-by-side, evidence-backed comparison of any products on ProductArena — PA Score, agent-readiness, API quality, shared theme scores, and agent access, with a shareable URL.',
}

// Static shell: the page prerenders once; the actual selection lives in `?p=…`, read
// client-side by CompareBuilder via useSearchParams — the <Suspense> boundary below is what
// makes that static-export safe (the builder subtree client-renders; no server sees the query).
export default function ComparePage() {
  const products = buildCompareProducts(loadAll())
  const validIds = new Set(products.map((p) => p.id))
  const starters = STARTERS.filter((s) => s.ids.every((id) => validIds.has(id)))

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Compare</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Any products, side by side — every number is the same evidence-backed score the arenas
          publish. Your selection is the URL, so a comparison is always a shareable link.
        </p>
        {starters.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="uppercase tracking-widest text-zinc-500">Try one</span>
            {starters.map((s) => (
              // Plain <a> (with withBase) on purpose: CompareBuilder reads `?p=` in a lazy
              // useState initializer, so a client-side Link nav on an already-mounted /compare
              // would not apply the selection — a full navigation always does.
              <a
                key={s.label}
                href={withBase(`/compare?p=${s.ids.join(',')}`)}
                className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-300 transition hover:border-emerald-400/60 hover:text-emerald-300"
              >
                {s.label}
              </a>
            ))}
          </p>
        )}
      </section>

      <Suspense fallback={null}>
        <CompareBuilder products={products} />
      </Suspense>
    </div>
  )
}
