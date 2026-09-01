import { loadCategories } from '@/lib/data'
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

  const body = `# INIT (init.dog)

> Evidence-graded, head-to-head rankings of software products against a shared taxonomy of user stories. Every score traces back to cited evidence (vendor docs, GitHub, community sources, or a hands-on probe) — never opinion. See /methodology for the full scoring writeup.

INIT crawls vendor docs, GitHub, and community sources for ${categories.length} product categories ("arenas"), extracts per-product evidence, and has an LLM judge every product against a shared set of user stories (weight 1-3, tiered verdicts full/partial/none/disputed/na). The result is a coverage score, an INIT Score, and a head-to-head battle log per arena — all reproducible from the cited evidence.

## Arenas (markdown, one per category)

${arenaLinks}

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
