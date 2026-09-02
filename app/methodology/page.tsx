import type { Metadata } from 'next'
import { REPO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Methodology — INIT',
  description: 'Evidence tiers, judging, scoring, the INIT Score, story provenance, and bias disclosure — full writeup on GitHub.',
}

// Static page — no data dependency, no dynamic segments.
export const dynamic = 'force-static'

const PILL = 'rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400'
const CODE = 'text-zinc-500'

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Methodology</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">How INIT scores products</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Evidence in, rankings out. Every claim traces back to a cited evidence item — vendor docs, GitHub, an
          independent community source, or a hands-on probe — and an LLM judge scores every (product, story) cell
          from that evidence alone, never outside knowledge.
        </p>
      </div>

      <a
        href={`https://github.com/${REPO}/blob/main/METHODOLOGY.md`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-400/10 px-6 py-4 text-center text-lg font-semibold text-amber-300 transition hover:bg-amber-400/20"
      >
        Read the full methodology on GitHub ★
      </a>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={PILL}>
          <p className="font-semibold text-zinc-300">Evidence tiers</p>
          <p className="mt-1">
            <span className={CODE}>probe</span> (tested) &gt; <span className={CODE}>github</span> (code) &gt;{' '}
            <span className={CODE}>community</span> (independent) &gt; <span className={CODE}>claimed-docs</span>{' '}
            (vendor claim)
          </p>
        </div>
        <div className={PILL}>
          <p className="font-semibold text-zinc-300">Verdicts</p>
          <p className="mt-1">
            <span className={CODE}>full</span> / <span className={CODE}>partial</span> /{' '}
            <span className={CODE}>disputed</span> / <span className={CODE}>none</span> /{' '}
            <span className={CODE}>na</span>, each with a 0–10 quality score and cited evidence ids.
          </p>
        </div>
        <div className={PILL}>
          <p className="font-semibold text-zinc-300">Scoring</p>
          <p className="mt-1">
            <span className={CODE}>score = story.weight × quality × verdictFactor</span>, summed over applicable
            (non-<span className={CODE}>na</span>) cells only.
          </p>
        </div>
        <div className={PILL}>
          <p className="font-semibold text-zinc-300">Bias disclosure</p>
          <p className="mt-1">
            The judge model is made by Anthropic; the <span className={CODE}>ai-coding</span> arena includes its own
            product. Full adversarial audit writeup on GitHub.
          </p>
        </div>
      </div>

      <section id="ai-era" className="rounded-xl border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">The INIT Score</h2>
        <p className="mt-1 text-sm text-zinc-500">Formerly displayed as the &quot;AI-Era Index&quot; — same formula, new name.</p>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Every leaderboard entry carries an INIT Score (0–100, <span className={CODE}>aiEra</span> internally) — a
          weighted, renormalized blend of five components:
        </p>
        <table className="mt-3 w-full max-w-2xl border-collapse text-sm">
          <tbody className="divide-y divide-zinc-800/70">
            <tr><td className="py-1.5 pr-3 text-zinc-500">agent-ready</td><td className="py-1.5 text-zinc-300">×0.30 — can an agent reach the product</td></tr>
            <tr><td className="py-1.5 pr-3 text-zinc-500">API quality</td><td className="py-1.5 text-zinc-300">×0.20 — how good is that API surface</td></tr>
            <tr><td className="py-1.5 pr-3 text-zinc-500">openness</td><td className="py-1.5 text-zinc-300">×0.20 — self-host, export, read the source</td></tr>
            <tr><td className="py-1.5 pr-3 text-zinc-500">agentic app</td><td className="py-1.5 text-zinc-300">×0.15 — does the product act agentically itself</td></tr>
            <tr><td className="py-1.5 pr-3 text-zinc-500">automation</td><td className="py-1.5 text-zinc-300">×0.15 — depth of rules/scheduling/bulk primitives</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-zinc-600">
          n/a components are excluded and weights renormalized over the rest. See the full methodology (link above)
          for the exact formula and the case for leading with this number over raw coverage.
        </p>
      </section>

      <a
        href={`https://github.com/${REPO}/blob/main/docs/SCORING.md`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-amber-400/60 hover:text-amber-300"
      >
        New here? Read the plain-language scoring guide →
      </a>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/llms.txt" className="underline decoration-zinc-700 hover:text-amber-300">
          /llms.txt
        </a>
        <a href="/openapi.json" className="underline decoration-zinc-700 hover:text-amber-300">
          /openapi.json
        </a>
        <a href={`https://github.com/${REPO}/blob/main/CONTRIBUTING.md`} className="underline decoration-zinc-700 hover:text-amber-300">
          CONTRIBUTING.md
        </a>
      </div>
    </div>
  )
}
