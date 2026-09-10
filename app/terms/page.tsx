import type { Metadata } from 'next'
import Link from 'next/link'
import { REPO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of use — ProductArena',
  description:
    'Dataset copyright, what you may quote and reuse, the provenance watermark, and the no-liability disclaimer for acting on rankings.',
}

// Static page — no data dependency, no dynamic segments. Plain-language terms: this page (plus
// DATA-LICENSE in the repo) is the single place the dataset copyright, reuse rules, watermark
// notice, and liability disclaimer live; footers and exports link here instead of restating.
export const dynamic = 'force-static'

const SECTION = 'rounded-xl border border-zinc-800 p-4'
const H2 = 'text-sm font-semibold uppercase tracking-widest text-emerald-400'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">Terms</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">Terms of use</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Plain-language terms for the ProductArena site and datasets. The authoritative data license is{' '}
          <a
            href={`https://github.com/${REPO}/blob/main/DATA-LICENSE`}
            className="underline decoration-zinc-700 hover:text-emerald-300"
          >
            DATA-LICENSE
          </a>{' '}
          in the repository.
        </p>
      </div>

      <section className={SECTION}>
        <h2 className={H2}>Copyright</h2>
        <p className="mt-2 text-sm text-zinc-300">
          The ProductArena datasets — stories, evidence records, verdicts, claims, rankings, proofs, and popularity
          signals — are © 2026 Ultrametric Inc, all rights reserved.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>What you may do</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Browse and query the data through the site and its public API. Quote individual verdicts, scores, or
          evidence excerpts, with attribution to &quot;ProductArena by Ultrametric Inc
          (ultrametric.ai/productarena)&quot; and a link back. Use the data to evaluate, contest, or contribute
          corrections to ProductArena.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>What you may not do</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Bulk copying, republication, or resale of the datasets — or using them to build or train competing
          products or datasets — requires prior written permission from Ultrametric Inc.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Watermark</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Published dataset files carry a provenance watermark: a <code className="text-zinc-400">_provenance</code>{' '}
          object with a cryptographic fingerprint of the file&apos;s exact content. It lets us (and anyone else)
          verify that a republished copy came from ProductArena — and spot copies that were altered.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>No liability</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Rankings, verdicts, and scores are research outputs derived from the cited evidence at a point in time.
          They are provided &quot;as is&quot;, without warranties of any kind. Ultrametric Inc accepts no
          responsibility for decisions — purchasing, procurement, investment, or otherwise — made in reliance on
          them. Products change; before acting, verify against the cited evidence and the vendor&apos;s own
          documentation. See the{' '}
          <Link href="/methodology" className="underline decoration-zinc-700 hover:text-emerald-300">
            methodology
          </Link>{' '}
          for how scores are produced.
        </p>
      </section>
    </div>
  )
}
