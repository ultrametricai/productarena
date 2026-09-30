import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAll } from '@/lib/data'
import { loadChains, loadProcesses } from '@/lib/processes'
import { REPO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About — Ultrametric',
  description:
    'Ultrametric, Inc. builds the open startup repo: agent-runnable founder processes, evidence-graded tool rankings, and the open startup simulator — everything evidence-driven, affiliations disclosed.',
}

// Static page — the corpus counts below are read from the committed data at build time
// (never hand-maintained), same posture as the root README's `pnpm stats` badges.
export const dynamic = 'force-static'

const CARD = 'rounded-xl border border-zinc-800 p-5'

export default function AboutPage() {
  // Computed from the committed data so this page can never drift from the repo it describes.
  const categories = loadAll()
  const productCount = new Set(categories.flatMap((c) => c.products.map((p) => p.id))).size
  const processCount = loadProcesses().length
  const chainCount = loadChains().length

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">About</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">About Ultrametric</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Ultrametric is the open startup repo — a source-backed operating map for starting and
          running a company — built and published by Ultrametric, Inc., a Delaware corporation.
          Everything on this site is generated from dated, citable, testable records committed to a
          public repository, never from opinion.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <h2 className="font-display text-base font-semibold">The open startup repo</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {processCount} step-by-step founder processes and {chainCount} chained playbooks, each
            step routed agent / manual form / human with its honest agent ceiling — plus rule
            cards, jurisdictions, and cited business logic, all open on GitHub.
          </p>
        </div>
        <div className={CARD}>
          <h2 className="font-display text-base font-semibold">Evidence-graded rankings</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {categories.length} arenas and {productCount} products, judged on real user stories.
            Every verdict cites its evidence, carries a confidence grade, and can be contested with
            a reproduction.
          </p>
        </div>
        <div className={CARD}>
          <h2 className="font-display text-base font-semibold">The open startup simulator</h2>
          <p className="mt-2 text-sm text-zinc-400">
            <Link href="/virtual-startup" className="underline decoration-zinc-700 hover:text-emerald-300">
              A simulated company
            </Link>{' '}
            runs the real process corpus end to end — incorporation, EIN, banking, payroll — with
            vendors drawn from the judged rankings and every artifact visibly simulated.
          </p>
        </div>
      </section>

      <section className={CARD}>
        <h2 className="font-display leading-[1.1] text-lg font-semibold">The doctrine</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-zinc-300">Everything evidence-driven.</span> Records are dated,
            citable, and testable; rankings recompute deterministically from committed data, and a
            claim without a source does not ship. See the{' '}
            <Link href="/methodology" className="underline decoration-zinc-700 hover:text-emerald-300">
              methodology
            </Link>
            .
          </li>
          <li>
            <span className="text-zinc-300">Affiliations disclosed.</span> Owner-affiliated
            products are disclosed on every surface where they appear and get adversarial bias
            audits — favorable changes without new evidence are reverted.
          </li>
          <li>
            <span className="text-zinc-300">Open to audit.</span> The data, schemas, pipeline, and
            governance policies are public; anyone can verify a verdict against its citations or
            extend the corpus by pull request.
          </li>
        </ul>
      </section>

      <p className="text-sm text-zinc-400">
        Ultrametric was founded by Jude and Tyler.
      </p>

      {/* FOUNDER-VOICE DRAFT — awaiting Jude & Tyler's edit before this is treated as their
          words. Drafted 2026-09-30 from the repo's own thesis (founders drowning in operational
          busywork; agents can run most of it; evidence beats opinion). Contains no biographical
          claims, quotes, or history beyond what the repo states. */}
      <section className={CARD}>
        <h2 className="font-display leading-[1.1] text-lg font-semibold">A note from Jude &amp; Tyler</h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-400">
          <p>
            We started Ultrametric because running a startup still means drowning in operational
            busywork — filings, forms, payroll, compliance — that has almost nothing to do with the
            thing you set out to build. Agents can run most of it today, if someone maps every
            process honestly: which steps an agent can do, which need a form, and which still need
            a human. So we are writing that map in the open, with a source on every claim, because
            evidence beats opinion — including ours. If something here is wrong, contest it; that
            is the point.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <a
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-zinc-700 hover:text-emerald-300"
        >
          The repo on GitHub
        </a>
        <Link href="/methodology" className="underline decoration-zinc-700 hover:text-emerald-300">
          Methodology
        </Link>
        <Link href="/processes" className="underline decoration-zinc-700 hover:text-emerald-300">
          Processes
        </Link>
        <Link href="/terms" className="underline decoration-zinc-700 hover:text-emerald-300">
          Terms
        </Link>
      </div>
    </div>
  )
}
