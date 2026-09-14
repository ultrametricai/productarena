import type { Metadata } from 'next'
import ProcessorTable from './ProcessorTable'
import raw from '@/data/experiments/processors.json'

// EXPERIMENT PAGE — deliberately unlinked. Not in app/sitemap.ts, not in the header nav,
// Explore menu, command palette, or search aliases; reachable only by typing the URL.
// robots noindex below keeps crawlers that stumble on it from indexing it.
export const metadata: Metadata = {
  title: 'Processor comparison (experiment) — ProductArena',
  description:
    'Unlinked experiment: current CPU/SoC specs side by side, curated from vendor spec sheets. Not part of the evidence-judged arenas.',
  robots: { index: false, follow: false },
}

export default function ProcessorsExperimentPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Experiment</p>
        <h1 className="font-display mt-1 text-3xl font-bold leading-[1.1] tracking-tight">Processor comparison</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Current desktop and laptop silicon side by side — Apple M-series, AMD Zen 5 / Strix Halo, Intel Arrow
          and Lunar Lake, and Qualcomm&rsquo;s Snapdragon X2 — on the raw numbers vendors actually publish.
        </p>
        <div className="mt-4 max-w-2xl rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <strong className="font-semibold">Experiment</strong> — not part of the evidence-judged arenas; specs from
          vendor sheets, not probed. No user stories, no verdicts, no citations beyond the linked spec pages.
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Curated {raw.curatedAt} · {raw.chips.length} chips · every source URL checked reachable · hover any header
          or value for what it means and where it came from
        </p>
      </div>
      <ProcessorTable />
      <p className="max-w-3xl text-xs leading-relaxed text-zinc-500">
        Honesty notes: vendor TOPS figures use different precisions and test conditions and are not benchmark
        results. Cells marked <span className="font-mono">drv</span> are derived from the vendor&rsquo;s published
        memory spec (formula in the tooltip), because the vendor doesn&rsquo;t state a GB/s number.{' '}
        <span className="text-zinc-400">n/a</span> means the vendor doesn&rsquo;t publish the figure — unpublished,
        not zero. Prices are omitted: most of these chips ship inside devices and have no standalone list price.
      </p>
    </div>
  )
}
