import type { Metadata } from 'next'
import FatProcessSearch from '@/components/FatProcessSearch'
import ProcessesTable from '@/components/ProcessesTable'
import { PROCESSES_INDEX_DEFAULT_GEO } from '@/lib/geoPreference'
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
        {/* The geo dimension (founder GEO ask 2026-09-28, lib/geoPreference.ts): every process
            row below always wears its geoScope glyph; since 2026-09-30 the index opens on the
            GLOBAL framing by default (see the ProcessesTable defaultGeo prop below). */}
      </section>

      {/* ONE view under the search (founder 2026-09-29: "combine playbooks and all processes
          into one table"; same-day follow-up: "we don't need to say 'playbook'… playbooks are
          still processes") — every row grouped by area, the end-to-end chains folded into their
          dominant area; the old separate playbooks section AND the 'Playbooks' vocabulary are
          gone from this UI. */}
      <section className="space-y-3">
        {/* No 'All processes' heading (founder 2026-09-30) — the table stands alone under the
            search. The route-dot legend went earlier (founder 2026-09-29). */}
        {/* The index DEFAULTS onto the global view (founder 2026-09-30: "default /processes
            onto a global view — you can include the US specific ones in the first view"): the
            geo dropdown opens on 🌐 Global and the always-on scope glyphs run sharp (🌐/🇺🇸/🏛)
            — server-rendered via this prop, not a mount flash, with every US-specific row still
            in the first view. A COUNTRY selection (?geo=in…) now FILTERS honestly (founder
            2026-10-02): US-scoped rows stay only where the committed note says the need exists
            there as its own process, and a muted disclosure under the table lists what hid.
            ?geo=/pa-geo win as before; process DETAIL pages keep their US default (the seam is
            documented on lib/geoPreference.ts PROCESSES_INDEX_DEFAULT_GEO). */}
        {/* The simulator promo card and the vendor-tracing footer line are gone (founder
            2026-10-02) — the table IS the page's bottom; /startup-sim stays reachable through
            the nav and ⌘K. */}
        <ProcessesTable rows={tableRows} phases={phases} playbooks={playbooks} defaultGeo={PROCESSES_INDEX_DEFAULT_GEO} />
      </section>
    </div>
  )
}
