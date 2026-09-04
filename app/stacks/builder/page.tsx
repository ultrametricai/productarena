import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import StackBuilder from '@/components/StackBuilder'
import { loadAll } from '@/lib/data'
import { buildCompareProducts } from '@/lib/compareData'

export const metadata: Metadata = {
  title: 'Stack builder — ProductArena',
  description:
    'Build your own evidence-backed AI-era stack: pick roles and constraints, and every slot resolves live to the arena leaderboard winner — with its honest rank, runner-up, and a shareable URL.',
}

// Static shell, same contract as /compare: the page prerenders once and the chosen
// roles/constraints live in the query string, read client-side by StackBuilder via a
// Suspense-wrapped useSearchParams (static-export safe).
export default function StackBuilderPage() {
  const products = buildCompareProducts(loadAll())

  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Stack builder</h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Compose your own stack from live arena rankings: pick the roles your team needs, set
          constraints, and every slot resolves to the current evidence-backed winner — no vibes,
          every pick annotated with its rank. Prefer a curated starting point? See{' '}
          <Link href="/stacks" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            AI Stacks
          </Link>
          .
        </p>
      </section>

      <Suspense fallback={null}>
        <StackBuilder products={products} />
      </Suspense>
    </div>
  )
}
