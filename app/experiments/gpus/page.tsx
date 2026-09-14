import type { Metadata } from 'next'
import GpuTable from './GpuTable'
import raw from '@/data/experiments/gpus.json'

// EXPERIMENT PAGE — deliberately unlinked. Not in app/sitemap.ts, not in the header nav,
// Explore menu, command palette, or search aliases; reachable only by typing the URL.
// robots noindex below keeps crawlers that stumble on it from indexing it.
export const metadata: Metadata = {
  title: 'GPU comparison (experiment) — ProductArena',
  description:
    'Unlinked experiment: current consumer and datacenter GPU specs side by side, curated from vendor spec sheets. Not part of the evidence-judged arenas.',
  robots: { index: false, follow: false },
}

export default function GpusExperimentPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Experiment</p>
        <h1 className="font-display mt-1 text-3xl font-bold leading-[1.1] tracking-tight">GPU comparison</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Current GPUs side by side — GeForce RTX 50-series and Radeon RDNA 4 on the consumer end, RTX PRO for
          workstations, and H200 / B200 / Instinct MI355X in the datacenter — on the raw numbers vendors publish.
        </p>
        <div className="mt-4 max-w-2xl rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <strong className="font-semibold">Experiment</strong> — not part of the evidence-judged arenas; specs from
          vendor sheets, not probed. No user stories, no verdicts, no citations beyond the linked spec pages.
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Curated {raw.curatedAt} · {raw.gpus.length} GPUs · every source URL checked reachable · hover any header or
          value for what it means and where it came from
        </p>
      </div>
      <GpuTable />
      <p className="max-w-3xl text-xs leading-relaxed text-zinc-500">
        Honesty notes: the AI-perf column is <em>not</em> apples-to-apples — NVIDIA quotes consumer cards in FP4
        &ldquo;AI TOPS&rdquo; with sparsity, AMD quotes FP16 matrix TFLOPS for Radeon, and datacenter parts are shown
        as dense FP8 TFLOPS; the unit is printed on every cell and sorting mixes them. Cells marked{' '}
        <span className="font-mono">drv</span> are derived from published system totals or memory specs (formula in
        the tooltip). <span className="text-zinc-400">n/a</span> means unpublished, not zero. MSRPs are launch list
        prices where announced — street prices have varied widely.
      </p>
    </div>
  )
}
