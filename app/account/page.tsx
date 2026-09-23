import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import AccountHeader from '@/components/AccountHeader'
import GeoMark from '@/components/GeoMark'
import MyStackBuilder from '@/components/MyStackBuilder'
import YourStack from '@/components/YourStack'
import adjacencyClusters from '@/data/adjacent-arenas.json'
import { loadArenaSections } from '@/lib/arenaSections'
import { loadAll } from '@/lib/data'
import { loadIntegrationGraph, verifiedPairKeys } from '@/lib/integrations'
import { buildMyStackProducts, curatedStackArenaPatterns } from '@/lib/myStackData'

// The user area (founder 2026-09-22: "a user area where they can set their vendors — if they
// set 'I'm using this' it will be recorded and have an area in their settings"). One place for
// the account: who you're signed in as, YOUR VENDORS (the same account stack every "I'm using"
// click on a product page writes, the same store the process pages personalize from), and the
// watchlist. Static shell — all personal state is client-gated (lib/session.ts + lib/myStack.ts);
// the server never sees a stack.
export const metadata: Metadata = {
  title: 'Account — ProductArena',
  description: 'Your account: the vendors you run, your watchlist, and session settings.',
  // Session-gated content: noindex, and deliberately absent from app/sitemap.ts.
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  const categories = loadAll()
  const products = buildMyStackProducts(categories)
  const verifiedPairs = verifiedPairKeys(loadIntegrationGraph(categories.map((d) => d.category.id)))
  const sections = loadArenaSections().map((s) => ({ name: s.name, arenaIds: s.arenaIds }))

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display leading-[1.1] mt-1 flex items-center gap-2.5 text-3xl font-bold tracking-tight">
          <GeoMark seed="account" title="Your ProductArena account" size={22} className="text-zinc-500" />
          Account
        </h1>
        {/* Client-gated identity row: email + log out when signed in, sign-up prompt when not. */}
        <AccountHeader />
      </section>

      <section>
        <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">Your vendors</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          The software you actually run — your picks per arena, several allowed (Mercury AND
          Brex is a real stack). Every{' '}
          <span className="text-emerald-300">&ldquo;I&rsquo;m using this&rdquo;</span> click on a
          product page is recorded here, and everything here personalizes the{' '}
          <Link href="/processes" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            process pages
          </Link>{' '}
          (your vendor drives each step it covers) and your{' '}
          <Link href="/my-stack" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            stack advice
          </Link>
          . Signed in, it syncs to your account; signed out, it stays on this device.
        </p>
        <YourStack products={products} sections={sections} />
        <Suspense fallback={null}>
          <MyStackBuilder
            products={products}
            adjacency={adjacencyClusters as string[][]}
            curatedStackArenas={curatedStackArenaPatterns()}
            verifiedPairs={verifiedPairs}
          />
        </Suspense>
      </section>

      <section className="border-t border-zinc-800 pt-4 text-sm">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">Also yours</span>{' '}
        <Link href="/watchlist" className="ml-2 text-zinc-300 underline decoration-zinc-700 underline-offset-2 hover:text-emerald-300">
          ☆ Watchlist
        </Link>
      </section>
    </div>
  )
}
