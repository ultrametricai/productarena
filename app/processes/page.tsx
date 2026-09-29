import type { Metadata } from 'next'
import Link from 'next/link'
import FatProcessSearch from '@/components/FatProcessSearch'
import ProcessesTable from '@/components/ProcessesTable'
import { buildPlaybookRows, buildProcessRows } from '@/lib/processRows'

export const metadata: Metadata = {
  title: 'Going agentic with company processes — Ultrametric',
  description:
    'Startup operations in the open — every founder process, the software that runs it, and the best an agent can do today. Agent ceilings, human/manual gaps, and simulated dry runs over real market options.',
}

export default function ProcessesPage() {
  // Rows + phases come from the shared builder (lib/processRows.ts) so the homepage's process
  // mode renders exactly this table; the playbook rows (founder 2026-09-29: "combine playbooks
  // and all processes into one table") live in the SAME table here — /processes only.
  const { rows: tableRows, phases } = buildProcessRows()
  const playbooks = buildPlaybookRows()

  return (
    <div className="space-y-12">
      {/* Founder 2026-09-25: retitled + the intro paragraph replaced by a fat search bar —
          the routing/honesty story lives on /methodology and in the per-step tooltips. */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          Going agentic with company processes
        </h1>
        {/* The fat search matches the end-to-end chains too (founder 2026-09-29) — chain rows
            carry the chain-page href, the aggregate ceiling, and the invisible 'playbook'
            pseudo-phase so typing the word still finds them (the visible copy never says it —
            founder same-day: "we don't need to say 'playbook'… playbooks are still processes"). */}
        <FatProcessSearch
          rows={[
            ...tableRows.map((r) => ({ href: `/processes/${r.slug}`, title: r.title, icon: r.icon, phase: r.phase, pct: r.pct })),
            ...playbooks.map((p) => ({ href: p.href, title: p.title, icon: p.icon, phase: 'playbook', pct: p.pct, playbook: true })),
          ]}
        />
        {/* The global geo switcher (founder GEO ask 2026-09-28, lib/geoPreference.ts): with a
            non-US country selected every process row below wears its geoScope glyph — the US
            default view is byte-identical to before. */}
      </section>

      {/* ONE view under the search (founder 2026-09-29: "combine playbooks and all processes
          into one table"; same-day follow-up: "we don't need to say 'playbook'… playbooks are
          still processes") — every row grouped by area, the end-to-end chains folded into their
          dominant area; the old separate playbooks section AND the 'Playbooks' vocabulary are
          gone from this UI. */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display leading-[1.1] text-xl font-semibold tracking-tight">All processes</h2>
          {/* Founder 2026-09-23: "this dots coloring is just not known by the user" — a visible
              legend for the multi-process rows' per-step route dots, matching ProcessesTable's
              ROUTE_DOT + the legalSignature violet. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5" title="An agent can run this step today via a recorded API/MCP/CLI path">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> agent-runnable
            </span>
            <span className="flex items-center gap-1.5" title="A form or portal a human fills in — no agent path recorded yet">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" /> manual form
            </span>
            <span className="flex items-center gap-1.5" title="A human decision or approval — deliberately not automated">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sky-400/80" /> human decision
            </span>
            <span className="flex items-center gap-1.5" title="Requires a legally binding signature — always stays with a person">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-violet-400/80" /> legal signature
            </span>
          </p>
        </div>
        <ProcessesTable rows={tableRows} phases={phases} playbooks={playbooks} />
        {/* Virtual Startup (founder ask 2026-09-23) — the playbooks composed into one seeded,
            decision-driven journey with clearly-labeled synthetic artifacts. */}
        <Link
          href="/virtual-startup"
          className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-2xl border border-zinc-800 p-4 transition hover:border-emerald-400/50 hover:bg-emerald-400/5"
        >
          <span className="font-medium text-zinc-200">🐣 Virtual Startup</span>
          <span className="text-sm text-zinc-400">
            pick the starting decisions — entity, team, funding, business model — and watch a
            simulated company run these real processes day by day
          </span>
          <span className="text-sm text-emerald-400">→</span>
        </Link>
      </section>

      <section className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
        <p>
          Every mapped vendor traces to a live arena leaderboard — swap it for a rival on the
          process page and the simulator reports exactly whose API was actually recorded.{' '}
          <Link href="/" className="text-emerald-400 underline decoration-emerald-400/40 hover:text-emerald-300">
            See all rankings →
          </Link>
        </p>
      </section>
    </div>
  )
}
