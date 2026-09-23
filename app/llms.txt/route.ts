import { battleSlug, leadingBattle, loadAll, loadCategories } from '@/lib/data'
import { loadChains, loadProcesses, processSlug } from '@/lib/processes'
import { provenanceLine } from '@/lib/provenance'
import { REPO, SITE_URL as SITE } from '@/lib/site'

// Static export safety: no dynamic segments, categories.json is bundled at build time.
export const dynamic = 'force-static'

// llms.txt convention (https://llmstxt.org): an H1 title, a blockquote one-line summary, then
// H2 sections of markdown link lists. This is the top-level index an agent should read first —
// every arena's own /llms.md is the thing agents should actually read for content; this file
// just points at them plus the machine-readable data surfaces.
export async function GET() {
  const categories = loadCategories()

  const arenaLinks = categories
    .map((c) => `- [${c.name}](${SITE}/arena/${c.id}/llms.md): full leaderboard, business models, and story-verdict matrix for "${c.id}" as markdown.`)
    .join('\n')

  // One concrete example per arena (its #1-vs-#2 battle) so an agent sees the /vs/{slug}
  // pattern in action, not just a description of it — same picks as the homepage's "Leading
  // battles" section (see lib/data-helpers.ts's leadingBattle).
  const all = loadAll()
  const leadingBattleLinks = all
    .map((data) => {
      const battle = leadingBattle(data)
      if (!battle) return null
      const a = data.products.find((p) => p.id === battle.a)!
      const b = data.products.find((p) => p.id === battle.b)!
      return `- [${a.name} vs ${b.name}](${SITE}/vs/${battleSlug(battle.a, battle.b)}) (${data.category.name}'s #1 vs #2)`
    })
    .filter((l): l is string => l !== null)
    .join('\n')

  const body = `<!-- ${provenanceLine()} -->

# ProductArena (${SITE})

> Evidence-graded, head-to-head rankings of software products against a shared taxonomy of user stories. Every score traces back to cited evidence (vendor docs, GitHub, community sources, or a hands-on probe) — never opinion. See /methodology for the full scoring writeup.

ProductArena crawls vendor docs, GitHub, and community sources for ${categories.length} product categories ("arenas"), extracts per-product evidence, and has an LLM judge every product against a shared set of user stories (weight 1-3, tiered verdicts full/partial/none/disputed/na). The result is a coverage score, a PA Score, and a head-to-head battle log per arena — all reproducible from the cited evidence.

## Arenas (markdown, one per category)

${arenaLinks}

## Head-to-head comparisons (\`/vs/\` pages)

Every battle between two products in the same arena also has its own top-level page:
\`${SITE}/vs/{productA}-vs-{productB}\` (product ids are globally unique, so no category segment
is needed). Rich side-by-side layout — PA Score, AGENT-READY, MCP/CLI/API access, business
model, claims-verified — followed by every judged round. Full list in \`${SITE}/sitemap.xml\`;
one example per arena below.

${leadingBattleLinks}

## Global rankings (every product, every arena, one flat list)

- [Most agentic](${SITE}/rankings/agentic): every product ranked by AGENT-READY (can an agent reach and operate it at all).
- [Best built-in AI](${SITE}/rankings/ai-native): every product ranked by BUILT-IN AI (does the product act agentically on its own behalf).
- [Claims vs reality](${SITE}/rankings/claims-integrity): every product ranked by how well its own website claims survive independent verification.
- [Most connected](${SITE}/rankings/most-connected): products ranked by verified integration edges (every edge carries a verbatim evidence quote).
- [Most tested](${SITE}/rankings/most-tested): products ranked by the share of verdicts backed by tested evidence (hands-on probe or inspectable source) rather than vendor claims.
- [Rising & falling](${SITE}/rankings/rising): the biggest 30-day PA Score gains and falls, derived from the committed score history.
- [Most popular](${SITE}/rankings/popular): popularity measured fairly in segments (GitHub stars, weekly npm/PyPI installs, curated no-public-counter products) plus a 🔥 "hot right now" section with measured reasons; never blended into one number and never part of the PA Score.
- [Most open](${SITE}/rankings/most-open): products ranked by evidence-graded openness (self-hosting, full export, open license, API parity).
- [Best API](${SITE}/rankings/best-api): products ranked by API quality (machine-readable specs, sandboxes, versioning, interactive docs); untested APIs are unscored, never zero.

## Processes (startup operations, step by step)

${loadProcesses().length} founder operating processes — each mapped as a DAG of steps routed
agent / manual form / human (legally-required signatures flagged), with evidence-ranked vendors
per step, grounded per-vendor API calls, computer-use feasibility audits, and a simulated dry
run. Index: [${SITE}/processes](${SITE}/processes). End-to-end playbooks
(${loadChains().length} chains): [${SITE}/processes/chains](${SITE}/processes). Process
rankings: most-automatable, best-covered, riskiest, most-annoying, growth-drivers under
\`${SITE}/rankings/processes/\`. The full story↔step↔process graph is machine-readable at
[${SITE}/data/graph.json](${SITE}/data/graph.json); per-process run manifests for executors are
linked from every process page. Example:
[${SITE}/processes/${processSlug(loadProcesses()[0].title)}](${SITE}/processes/${processSlug(loadProcesses()[0].title)}).

## Data API (JSON, no auth)

- [Categories](${SITE}/data/categories.json): every arena's id/name/description/personas/themes.
- Per-category JSON (replace \`{category}\` with an id from categories.json above): \`/data/{category}/products.json\`, \`/data/{category}/stories.json\`, \`/data/{category}/verdicts.json\`, \`/data/{category}/rankings.json\`, \`/data/{category}/evidence/{product}.json\`.
- [OpenAPI 3.1 spec](${SITE}/openapi.json): machine-readable schema for every endpoint above.

## Per-product deep dives (markdown)

Every product also has an \`llms.md\` deep-dive with all of its verdicts, rationale, and proof URLs: \`/arena/{category}/product/{productId}/llms.md\` (see a category's own llms.md above for the exact product ids and links).

## Reference

- [Methodology](${SITE}/methodology): evidence tiers, judging rules, scoring formula, PA Score weights, story provenance, re-judge stability policy, bias disclosure.
- [README](https://github.com/${REPO}/blob/main/README.md): full methodology writeup and data layout (source of truth; /methodology is a tighter summary of this).
- [CONTRIBUTING](https://github.com/${REPO}/blob/main/CONTRIBUTING.md): how to contest a verdict or add evidence.
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
