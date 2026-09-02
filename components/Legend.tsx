import type { ReactNode } from 'react'

// Compact, collapsible glossary for the verdict/verification/glyph/quality/INIT Score vocabulary
// used across every arena page, the story matrix, and battle views. Native <details>/<summary> —
// no client JS needed, so it stays static-export-safe and works even with JS disabled. Linked
// from the story matrix and battle sections via `#legend` and rendered open-by-default near the
// top of arena pages.
export default function Legend({ id = 'legend', defaultOpen = false }: { id?: string; defaultOpen?: boolean }) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="scroll-mt-4 rounded-xl border border-zinc-800 text-sm"
    >
      <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-zinc-200">
        Legend — how to read this page
      </summary>
      <div className="grid gap-6 border-t border-zinc-800 px-4 py-4 sm:grid-cols-2">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Verdict badges</h3>
          <dl className="mt-2 space-y-1.5">
            <LegendRow swatch="bg-emerald-950 text-emerald-300 ring-emerald-800" term="full">
              Clear evidence the product delivers this, no major caveats.
            </LegendRow>
            <LegendRow swatch="bg-amber-950 text-amber-300 ring-amber-800" term="partial">
              Delivers it, but with caveats, extra tools, or real effort required.
            </LegendRow>
            <LegendRow swatch="bg-red-950 text-red-300 ring-red-800" term="disputed">
              Vendor claims it, independent evidence disagrees — we show both sides.
            </LegendRow>
            <LegendRow swatch="bg-zinc-900 text-zinc-400 ring-zinc-700" term="none">
              No evidence found. Not proof the product can&apos;t do it, just that we found no citation.
            </LegendRow>
            <LegendRow swatch="bg-zinc-900 text-zinc-500 ring-zinc-800" term="n/a">
              Wrong question for this kind of product — excluded from scoring entirely.
            </LegendRow>
          </dl>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Verification badges</h3>
          <dl className="mt-2 space-y-1.5">
            <LegendRow swatch="bg-zinc-900 text-zinc-400 ring-zinc-700" term="claimed" glyph="C">
              Only the vendor&apos;s own docs/GitHub back this verdict.
            </LegendRow>
            <LegendRow swatch="bg-sky-950 text-sky-300 ring-sky-800" term="corroborated" glyph="X">
              An independent community source (forum, issue) backs this too.
            </LegendRow>
            <LegendRow swatch="bg-emerald-950 text-emerald-300 ring-emerald-800" term="tested" glyph="T">
              We hands-on probed this ourselves.
            </LegendRow>
            <LegendRow swatch="bg-red-950 text-red-300 ring-red-800" term="disputed" glyph="D">
              Independent evidence actively contradicts the vendor&apos;s claim.
            </LegendRow>
          </dl>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Access glyphs (MCP / CLI / API)</h3>
          <dl className="mt-2 space-y-1.5 font-mono">
            <LegendRow swatch="text-emerald-400 bg-transparent ring-0" term="✓" plain>
              Full — the product delivers this access mode well.
            </LegendRow>
            <LegendRow swatch="text-amber-400 bg-transparent ring-0" term="~" plain>
              Partial — delivers it, with caveats.
            </LegendRow>
            <LegendRow swatch="text-red-400 bg-transparent ring-0" term="!" plain>
              Disputed — vendor claims it, independent evidence disagrees.
            </LegendRow>
            <LegendRow swatch="text-zinc-500 bg-transparent ring-0" term="—" plain>
              None or n/a — no evidence, or not a fair question for this product.
            </LegendRow>
          </dl>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Quality &amp; INIT Score</h3>
          <p className="mt-2 text-zinc-400">
            Every full/partial/disputed verdict also gets a <strong className="text-zinc-200">quality</strong> score
            from 0 (barely counts) to 10 (best-in-class execution) — how complete the evidence we found is, not a
            vibe score. <code className="text-zinc-300">none</code> and <code className="text-zinc-300">n/a</code>{' '}
            are always quality 0.
          </p>
          <p className="mt-2 text-zinc-400">
            The <strong className="text-zinc-200">INIT Score</strong> (0–100) blends five angles — agent-ready, API
            quality, openness, agentic app, automation — into one number answering &ldquo;how ready is this product
            for a world where AI agents, not just humans, use it?&rdquo; See{' '}
            <a
              href="/methodology#ai-era"
              className="text-amber-400 underline decoration-amber-400/40 hover:text-amber-300"
            >
              methodology
            </a>{' '}
            for the exact formula.
          </p>
        </section>
      </div>
    </details>
  )
}

function LegendRow({
  swatch,
  term,
  glyph,
  plain = false,
  children,
}: {
  swatch: string
  term: string
  glyph?: string
  plain?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      {plain ? (
        <span className={`w-5 shrink-0 text-center font-bold ${swatch}`}>{term}</span>
      ) : (
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${swatch}`}>
          {glyph ? `${glyph} · ${term}` : term}
        </span>
      )}
      <span className="text-zinc-400">{children}</span>
    </div>
  )
}
