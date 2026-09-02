import { battleSlug, leadingBattle, loadAll, loadCategories } from '@/lib/data'
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

  const body = `# INIT (init.dog)

> Evidence-graded, head-to-head rankings of software products against a shared taxonomy of user stories. Every score traces back to cited evidence (vendor docs, GitHub, community sources, or a hands-on probe) — never opinion. See /methodology for the full scoring writeup.

INIT crawls vendor docs, GitHub, and community sources for ${categories.length} product categories ("arenas"), extracts per-product evidence, and has an LLM judge every product against a shared set of user stories (weight 1-3, tiered verdicts full/partial/none/disputed/na). The result is a coverage score, an INIT Score, and a head-to-head battle log per arena — all reproducible from the cited evidence.

## Arenas (markdown, one per category)

${arenaLinks}

## Head-to-head comparisons (\`/vs/\` pages)

Every battle between two products in the same arena also has its own top-level page:
\`${SITE}/vs/{productA}-vs-{productB}\` (product ids are globally unique, so no category segment
is needed). Rich side-by-side layout — INIT Score, AGENTREADYNESS, MCP/CLI/API access, business
model, claims-verified — followed by every judged round. Full list in \`${SITE}/sitemap.xml\`;
one example per arena below.

${leadingBattleLinks}

## Global rankings (every product, every arena, one flat list)

- [Most agentic](${SITE}/rankings/agentic): every product ranked by AGENTREADYNESS (can an agent reach it at all).
- [Most AI-native](${SITE}/rankings/ai-native): every product ranked by AGENTIC (does the product act agentically on its own behalf).

## Data API (JSON, no auth)

- [Categories](${SITE}/data/categories.json): every arena's id/name/description/personas/themes.
- Per-category JSON (replace \`{category}\` with an id from categories.json above): \`/data/{category}/products.json\`, \`/data/{category}/stories.json\`, \`/data/{category}/verdicts.json\`, \`/data/{category}/rankings.json\`, \`/data/{category}/evidence/{product}.json\`.
- [OpenAPI 3.1 spec](${SITE}/openapi.json): machine-readable schema for every endpoint above.

## Per-product deep dives (markdown)

Every product also has an \`llms.md\` deep-dive with all of its verdicts, rationale, and proof URLs: \`/arena/{category}/product/{productId}/llms.md\` (see a category's own llms.md above for the exact product ids and links).

## Reference

- [Methodology](${SITE}/methodology): evidence tiers, judging rules, scoring formula, INIT Score weights, story provenance, re-judge stability policy, bias disclosure.
- [README](https://github.com/${REPO}/blob/main/README.md): full methodology writeup and data layout (source of truth; /methodology is a tighter summary of this).
- [CONTRIBUTING](https://github.com/${REPO}/blob/main/CONTRIBUTING.md): how to contest a verdict or add evidence.
- [MCP server](https://github.com/${REPO}/blob/main/mcp/README.md): a stdio MCP server exposing this same data as tools (list_arenas, get_rankings, get_product, get_battle, search_products, get_story_verdicts).
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
