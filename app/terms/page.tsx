import type { Metadata } from 'next'
import Link from 'next/link'
import { REPO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of use — ProductArena',
  description:
    'ProductArena-specific terms: rankings are evidence-derived opinions, not advice; dataset copyright and reuse rules; trademark, dispute, and API terms — on top of the Ultrametric Terms of Service.',
}

// Static page — no data dependency, no dynamic segments. Plain-language terms: this page (plus
// DATA-LICENSE in the repo) is the single place the dataset copyright, reuse rules, watermark
// notice, and liability disclaimer live; footers and exports link here instead of restating.
// PA-specific risk coverage (opinions-not-advice, trademarks, dispute path, scraping/API) layers
// on top of the Ultrametric base Terms of Service at ultrametric.ai/tos.
export const dynamic = 'force-static'

const SECTION = 'rounded-xl border border-zinc-800 p-4'
const H2 = 'text-sm font-semibold uppercase tracking-widest text-emerald-400'
const EXT_LINK = 'underline decoration-zinc-700 hover:text-emerald-300'

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
            target="_blank"
            rel="noopener noreferrer"
            title="The data license on GitHub"
            className={EXT_LINK}
          >
            DATA-LICENSE
          </a>{' '}
          in the repository. How we handle data about you is on the{' '}
          <Link href="/privacy" className={EXT_LINK}>
            privacy
          </Link>{' '}
          page.
        </p>
      </div>

      <section className={SECTION}>
        <h2 className={H2}>The Ultrametric terms apply</h2>
        <p className="mt-2 text-sm text-zinc-300">
          ProductArena is a product of Ultrametric, Inc. Your use of it is governed by the{' '}
          <a
            href="https://ultrametric.ai/tos"
            target="_blank"
            rel="noopener noreferrer"
            className={EXT_LINK}
          >
            Ultrametric Terms of Service
          </a>{' '}
          — including its warranty disclaimers, limitation of liability, indemnification, governing law
          (Delaware), and dispute-resolution provisions. This page adds the ProductArena-specific terms below;
          where the two differ on a ProductArena-specific point, this page controls for ProductArena.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Rankings are opinions, not advice</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Rankings, verdicts, scores, and comparisons on ProductArena are research opinions derived from the
          cited public evidence at a point in time, produced by the process described in the{' '}
          <Link href="/methodology" className={EXT_LINK}>
            methodology
          </Link>
          . They are not professional advice — not procurement, legal, financial, security, or investment
          advice — and we make no warranty of their accuracy, completeness, or fitness for any purpose.
          Products change faster than any dataset; before acting, verify against the cited evidence and the
          vendor&apos;s own documentation.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>No liability</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Everything on ProductArena is provided &quot;as is&quot;, without warranties of any kind. Ultrametric
          Inc accepts no responsibility for decisions — purchasing, procurement, investment, or otherwise —
          made in reliance on rankings, verdicts, scores, or any other ProductArena output. The liability
          limitations and cap in the Ultrametric Terms of Service apply to ProductArena.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Trademarks and affiliation</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Product names, logos, and brands that appear on ProductArena belong to their respective owners and
          are used only to identify the products being compared. Listing or ranking a product does not imply
          the vendor&apos;s affiliation with, sponsorship of, or endorsement by Ultrametric Inc — or ours of
          them. If we ever have a commercial relationship with a listed vendor, we disclose it on the relevant
          page.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={H2}>Disputes: flag it</h2>
        <p className="mt-2 text-sm text-zinc-300">
          If you are a vendor (or anyone else) who believes a verdict, score, or evidence record is wrong, the
          remedy is the public correction process: use the ⚑ flag link next to any verdict — it opens a
          prefilled{' '}
          <a
            href={`https://github.com/${REPO}/issues/new?template=flag-verdict.yml`}
            target="_blank"
            rel="noopener noreferrer"
            className={EXT_LINK}
          >
            GitHub issue
          </a>{' '}
          — and attach evidence URLs supporting the correction. Flags with evidence are re-judged against the
          same methodology as everything else. For trademark or takedown concerns, email{' '}
          <a href="mailto:legal@ultrametric.ai" className={EXT_LINK}>
            legal@ultrametric.ai
          </a>
          .
        </p>
      </section>

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
          products or datasets — requires prior written permission from Ultrametric Inc. The same limits apply
          however you get the data: the public API, the published JSON files, the MCP server, or scraping the
          site. Automated access is fine at reasonable, rate-limited volumes for querying and quoting; it is
          not a bulk-export channel, and you may not circumvent rate limits or access controls.
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
        <h2 className={H2}>Changes</h2>
        <p className="mt-2 text-sm text-zinc-300">
          We may update these terms as ProductArena evolves; material changes show up here and in the
          repository history. Continued use after a change means you accept it. Questions:{' '}
          <a href="mailto:legal@ultrametric.ai" className={EXT_LINK}>
            legal@ultrametric.ai
          </a>
          .
        </p>
      </section>
    </div>
  )
}
