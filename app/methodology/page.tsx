import type { Metadata } from 'next'

const REPO = 'ultrametricai/productarena'

export const metadata: Metadata = {
  title: 'Methodology — Product Arena',
  description: 'Evidence tiers, judging, scoring, the AI-Era Index, story provenance, and bias disclosure.',
}

// Static page — no data dependency, no dynamic segments.
export const dynamic = 'force-static'

const SECTION_H2 = 'text-xl font-semibold text-zinc-100'
const SECTION_H3 = 'mt-4 text-sm font-semibold uppercase tracking-widest text-amber-400'
const P = 'mt-2 text-sm text-zinc-400'
const TABLE_TH = 'px-3 py-1.5 text-left font-normal text-zinc-500'
const TABLE_TD = 'px-3 py-1.5 text-zinc-300'

export default function MethodologyPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-widest text-amber-400">Methodology</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">How Product Arena scores products</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          A tight summary of the full writeup in{' '}
          <a href={`https://github.com/${REPO}/blob/main/README.md`} className="underline decoration-zinc-700 hover:text-amber-300">
            README.md
          </a>{' '}
          — read that for depth; this page won&apos;t contradict it. Agents: see also{' '}
          <a href="/llms.txt" className="underline decoration-zinc-700 hover:text-amber-300">
            /llms.txt
          </a>
          .
        </p>
      </div>

      <section>
        <h2 className={SECTION_H2}>Evidence tiers</h2>
        <p className={P}>
          Every claim about a product is backed by an evidence item with one of four tiers, ranked strongest
          first:
        </p>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className={TABLE_TH}>Tier</th>
              <th className={TABLE_TH}>What it is</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            <tr><td className={TABLE_TD}>probe</td><td className={TABLE_TD}>direct, hands-on observation of the product (tested)</td></tr>
            <tr><td className={TABLE_TD}>github</td><td className={TABLE_TD}>README/repo content (code)</td></tr>
            <tr><td className={TABLE_TD}>community</td><td className={TABLE_TD}>independent forums/reviews/social posts (independent)</td></tr>
            <tr><td className={TABLE_TD}>claimed-docs</td><td className={TABLE_TD}>vendor site/docs/changelog copy (vendor claim)</td></tr>
          </tbody>
        </table>
        <p className={P}>
          <code className="text-zinc-500">strongestEvidence()</code> (<code className="text-zinc-500">lib/verification.ts</code>) walks a
          verdict&apos;s cited evidence down this ladder and returns the single best-supported item — the
          source behind every &quot;proof ↗&quot; link on the site.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>Judging</h2>
        <p className={P}>
          For every (product, story) pair, an LLM judge reads only that product&apos;s evidence pack for that
          story and returns a verdict: <code className="text-zinc-500">full</code>,{' '}
          <code className="text-zinc-500">partial</code>, <code className="text-zinc-500">none</code>,{' '}
          <code className="text-zinc-500">disputed</code> (cites contradicting evidence from two tiers), or{' '}
          <code className="text-zinc-500">na</code> (the story&apos;s axis doesn&apos;t apply to this product at
          all). Each verdict also carries a 0–10 <code className="text-zinc-500">quality</code> score, a
          confidence level, a rationale, and the specific evidence ids relied on. The judge uses only the
          evidence pack — never outside/training knowledge — so absence of evidence for a well-known
          capability still yields <code className="text-zinc-500">none</code>, never a guess.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>Scoring formula</h2>
        <p className={P}>
          A cell&apos;s score is <code className="text-zinc-500">story.weight × quality × verdictFactor</code>{' '}
          (factor: full=1.0, partial=0.6, disputed=0.3, none=0, na=excluded). A product&apos;s overall score
          (and each per-theme score) is the weighted percentage across all applicable (non-na) cells. Battles
          use the same per-cell scores: each story is a &quot;round&quot; won by whichever product scores
          higher on it.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>AI-Era weights</h2>
        <p className={P}>
          Every leaderboard entry carries an AI-Era Index (<code className="text-zinc-500">aiEra</code>) — a
          weighted, renormalized blend of five components, computed in{' '}
          <code className="text-zinc-500">AI_ERA_WEIGHTS</code> (<code className="text-zinc-500">lib/scoring.ts</code>):
        </p>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className={TABLE_TH}>Component</th>
              <th className={TABLE_TH}>Weight</th>
              <th className={TABLE_TH}>What it measures</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            <tr><td className={TABLE_TD}>agentReady</td><td className={TABLE_TD}>0.30</td><td className={TABLE_TD}>can an agent reach the product (API/CLI/MCP/webhooks/SDKs/docs)</td></tr>
            <tr><td className={TABLE_TD}>apiQuality</td><td className={TABLE_TD}>0.20</td><td className={TABLE_TD}>how good is that API surface (docs, spec, versioning, sandbox)</td></tr>
            <tr><td className={TABLE_TD}>openness</td><td className={TABLE_TD}>0.20</td><td className={TABLE_TD}>can you self-host, export your data, and read the source</td></tr>
            <tr><td className={TABLE_TD}>agenticApp</td><td className={TABLE_TD}>0.15</td><td className={TABLE_TD}>does the product act agentically on its own behalf</td></tr>
            <tr><td className={TABLE_TD}>automation</td><td className={TABLE_TD}>0.15</td><td className={TABLE_TD}>how deep are its rules/scheduling/bulk/versioned-automation primitives</td></tr>
          </tbody>
        </table>
        <p className={P}>
          Weights are renormalized over whichever components are non-null for a given product, so a missing
          axis isn&apos;t penalized twice. These weights are a starting position, not a verdict — contest them
          like any other call, via CONTRIBUTING.md.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>Story provenance</h2>
        <p className={P}>
          Every story optionally carries an <code className="text-zinc-500">origin</code> — where it came
          from and when:
        </p>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className={TABLE_TH}>Kind</th>
              <th className={TABLE_TH}>Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            <tr><td className={TABLE_TD}>canonical</td><td className={TABLE_TD}>one of the 28 fixed agenticness/openness/automation-depth/privacy-posture stories, injected verbatim into every category — never LLM-authored</td></tr>
            <tr><td className={TABLE_TD}>normalized</td><td className={TABLE_TD}>LLM-assembled into the category&apos;s taxonomy (carries the judge <code className="text-zinc-500">promptVersion</code> in force at the time)</td></tr>
            <tr><td className={TABLE_TD}>contest</td><td className={TABLE_TD}>added or adjusted via a contest issue</td></tr>
            <tr><td className={TABLE_TD}>manual</td><td className={TABLE_TD}>hand-edited</td></tr>
          </tbody>
        </table>
        <p className={P}>
          Hover a story title or matrix cell on any product page to see its origin (e.g. &quot;canonical&quot;
          or &quot;normalized · v2&quot;) in the tooltip.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>Re-judge stability policy</h2>
        <p className={P}>
          Verdicts are cached on a hash of (story id, story title, evidence ids+excerpts, prompt version) —
          re-running <code className="text-zinc-500">judge</code> is a no-op unless the story or evidence
          actually changed. LLM judging still has measurable re-roll variance (~9% of cells can change verdict
          or quality on a re-judge with no relevant evidence change), so large re-judge waves are reviewed
          against the prior state and pure churn is reverted under audited rules: applicability
          (<code className="text-zinc-500">na</code>↔<code className="text-zinc-500">none</code>) never flips
          without new evidence, verdicts citing nothing new don&apos;t move close races, and negative
          mechanical probe results only affect the story axis they actually test.
        </p>
      </section>

      <section>
        <h2 className={SECTION_H2}>Bias disclosure</h2>
        <p className={P}>
          The judge model is made by Anthropic, and the <code className="text-zinc-500">ai-coding</code> arena
          includes Anthropic&apos;s own product, Claude Code — a real conflict of interest. We ran an
          adversarial bias audit of every <code className="text-zinc-500">claude-code</code> verdict scored
          full in that arena, made corrections in both directions (one against Claude Code&apos;s favor, one
          in favor of a competitor), and documented every cell with a caveat. See README.md §8 for the full
          writeup, including the specific cells adjusted and why.
        </p>
      </section>

      <div className={SECTION_H3}>Further reading</div>
      <ul className="mt-2 flex flex-wrap gap-3 text-sm">
        <li>
          <a href={`https://github.com/${REPO}/blob/main/README.md`} className="underline decoration-zinc-700 hover:text-amber-300">
            README.md
          </a>
        </li>
        <li>
          <a href={`https://github.com/${REPO}/blob/main/CONTRIBUTING.md`} className="underline decoration-zinc-700 hover:text-amber-300">
            CONTRIBUTING.md
          </a>
        </li>
        <li>
          <a href="/llms.txt" className="underline decoration-zinc-700 hover:text-amber-300">
            /llms.txt
          </a>
        </li>
        <li>
          <a href="/openapi.json" className="underline decoration-zinc-700 hover:text-amber-300">
            /openapi.json
          </a>
        </li>
      </ul>
    </div>
  )
}
