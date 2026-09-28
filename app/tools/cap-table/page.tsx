import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import CapTableTool from '@/components/CapTableTool'
import GeoMark from '@/components/GeoMark'

export const metadata: Metadata = {
  title: 'Cap table calculator — Ultrametric',
  description:
    'Open-source cap-table math for founders: build a cap table event-by-event (founding, SAFEs, priced round), watch the dilution waterfall live — YC post-money SAFE mechanics with cited formulas, CSV/markdown export, and a shareable URL.',
}

// Static shell, same contract as /stacks/builder: the page prerenders once and the whole
// event list lives in ?ct=, read client-side by CapTableTool via a Suspense-wrapped
// useSearchParams (static-export safe, zero server state). The math itself is
// lib/openstartup/capTable.ts — the first module of the open-startup toolkit.
export default function CapTablePage() {
  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 flex items-center justify-center gap-2.5 text-3xl font-bold tracking-tight">
          <GeoMark seed="cap-table" title="Cap table — open-source dilution math" size={22} className="text-zinc-500" />
          Cap table
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Model your ownership event-by-event: found the company, stack SAFEs (caps, discounts,
          MFN, pro rata), then convert everything in a priced round and see the full dilution
          waterfall. Post-money SAFE mechanics follow the current published YC forms, every
          formula cited and tested against YC&apos;s own worked examples.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-zinc-500">
          Open-source cap-table math — educational, not legal advice. Real financings have
          lawyer-maintained cap tables; use this to understand the mechanics before you sign.
        </p>
      </section>

      <Suspense fallback={null}>
        <CapTableTool />
      </Suspense>

      <section className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-400">
        <h2 className="font-display text-lg font-semibold text-zinc-100">How the math works</h2>
        <p>
          A post-money SAFE sells <span className="font-mono text-zinc-300">amount ÷ post-money cap</span> of the
          company. At the priced round every SAFE converts at the most advantageous of its Safe Price (cap ÷ Company
          Capitalization), its Discount Price (round PPS × discount rate), or the round price itself — with all SAFEs
          in each other&apos;s denominator, so we solve the conversion simultaneously, exactly like the pro-forma cap
          tables in the YC Safe User Guide. Shares round down (you cannot issue a fraction of a share), prices to four
          decimals. The engine and its sources live in{' '}
          <a
            href="https://github.com/ultrametricai/productarena"
            className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
          >
            lib/openstartup/capTable.ts
          </a>{' '}
          — the tests replay YC&apos;s published worked examples number-for-number.
        </p>
        <p>
          Sources: the{' '}
          <a
            href="https://www.ycombinator.com/documents"
            className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
          >
            YC SAFE documents &amp; Post-Money Safe User Guide
          </a>{' '}
          (conversion, pool shuffle, pro rata; the legacy pre-money SAFE is noted there as the original form) and{' '}
          <a
            href="https://www.cooleygo.com/founder-basics-founders-stock/"
            className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300"
          >
            Cooley GO
          </a>{' '}
          (standard 4-year / 1-year-cliff vesting). Modeling a real raise? Walk the{' '}
          <Link href="/processes/raise-pre-seed-safes" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            SAFE raise
          </Link>
          ,{' '}
          <Link href="/processes/close-a-priced-equity-round" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            priced round
          </Link>{' '}
          and{' '}
          <Link href="/processes/audit-cap-table" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            cap-table audit
          </Link>{' '}
          processes.
        </p>
      </section>
    </div>
  )
}
