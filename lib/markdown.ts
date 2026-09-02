import type { CategoryData } from './data'
import { evidenceById, groupInOrder, verdictFor } from './data'
import type { Product, Story } from './schemas'
import { strongestEvidence } from './verification'

// Pure markdown renderers backing app/arena/[category]/llms.md and
// app/arena/[category]/product/[id]/llms.md — kept out of the route handlers so they're
// trivially unit-testable without going through Next's request/response machinery.

// MCP is two stories, not one: `agentic-mcp-server` (ships an MCP server for other agents to
// connect to) and `agentic-mcp-client` (consumes MCP servers itself). Showing only the
// `-server` verdict here would repeat the wrong-axis mistake for agent products (the product
// IS the agent, so "does it ship a server" is often correctly `na`) — so this mark shows
// whichever of the two verdicts is stronger. See components/AgentAccessGlyphs.tsx for the
// on-site equivalent of this same logic.
const AGENT_ACCESS_STORIES = {
  mcp: ['agentic-mcp-server', 'agentic-mcp-client'],
  cli: ['agentic-official-cli'],
  api: ['agentic-public-api'],
} as const

const VERDICT_RANK: Record<string, number> = { full: 3, partial: 2, disputed: 1, none: 0, na: 0 }

function glyph(verdict: string): string {
  if (verdict === 'full') return '✓'
  if (verdict === 'partial') return '~'
  return '—'
}

function agentAccessMarks(data: CategoryData, productId: string): string {
  return (Object.keys(AGENT_ACCESS_STORIES) as Array<keyof typeof AGENT_ACCESS_STORIES>)
    .map((key) => {
      const storyIds = AGENT_ACCESS_STORIES[key].filter((id) => data.stories.some((s) => s.id === id))
      if (storyIds.length === 0) return `${key.toUpperCase()}:n/a`
      const best = storyIds
        .map((id) => verdictFor(data, productId, id))
        .reduce((a, b) => (VERDICT_RANK[b.verdict] > VERDICT_RANK[a.verdict] ? b : a))
      return `${key.toUpperCase()}:${glyph(best.verdict)}`
    })
    .join(' ')
}

function fmtNum(n: number | null): string {
  return n === null ? 'n/a' : String(n)
}

function businessModelLine(product: Product): string {
  const bm = product.businessModel
  if (!bm) return '_no business model curated_'
  return `${bm.models.join(', ')} — ${bm.summary} ([pricing](${bm.url}))`
}

// Full-arena markdown: leaderboard table, business models, then the grouped story matrix with
// verdicts and each cell's strongest-evidence proof URL.
export function renderArenaMarkdown(data: CategoryData, siteUrl: string): string {
  const { category, products, rankings } = data
  const productById = new Map(products.map((p) => [p.id, p]))
  const evidence = evidenceById(data)

  const lines: string[] = []
  lines.push(`# ${category.name} Arena`)
  lines.push('')
  lines.push(category.description)
  lines.push('')
  lines.push(
    `${data.stories.length} user stories · ${data.verdicts.length} judged cells · updated ${rankings.generatedAt.slice(0, 10)}. Full methodology: ${siteUrl}/methodology`,
  )
  lines.push('')

  lines.push('## Leaderboard')
  lines.push('')
  lines.push('| Rank | Product | INIT | Score | Agentreadyness | API quality | MCP | CLI | API |')
  lines.push('|---|---|---|---|---|---|---|---|---|')
  rankings.leaderboard.forEach((entry, i) => {
    const product = productById.get(entry.productId)!
    const marks = agentAccessMarks(data, entry.productId)
    const markOf = (key: string) => marks.split(' ').find((m) => m.startsWith(`${key}:`))?.split(':')[1] ?? 'n/a'
    lines.push(
      `| ${i + 1} | [${product.name}](${siteUrl}/arena/${category.id}/product/${product.id}) | ${fmtNum(entry.aiEra)} | ${fmtNum(entry.score)} | ${fmtNum(entry.agentReady)} | ${fmtNum(entry.apiQuality)} | ${markOf('MCP')} | ${markOf('CLI')} | ${markOf('API')} |`,
    )
  })
  lines.push('')
  lines.push('Per-product markdown deep-dive: `' + `${siteUrl}/arena/${category.id}/product/{productId}/llms.md` + '`')
  lines.push('')

  lines.push('## Business models')
  lines.push('')
  for (const p of products) {
    lines.push(`- **${p.name}**: ${businessModelLine(p)}`)
  }
  lines.push('')

  lines.push('## Story matrix')
  lines.push('')
  const byTheme = groupInOrder(data.stories, (s) => s.theme)
  for (const [theme, storiesInTheme] of byTheme) {
    lines.push(`### ${theme}`)
    const byGroup = groupInOrder(storiesInTheme, (s) => s.group)
    for (const [group, stories] of byGroup) {
      if (group !== theme) {
        lines.push('')
        lines.push(`#### ${group}`)
      }
      for (const s of stories) {
        lines.push('')
        lines.push(`**${s.title}** (weight ${s.weight})`)
        for (const p of products) {
          const v = verdictFor(data, p.id, s.id)
          const proof = strongestEvidence(v, evidence)
          const proofText = proof ? ` — [proof](${proof.url}) (${proof.tier})` : ''
          const quality = v.verdict === 'na' ? '' : ` q${v.quality}/10`
          lines.push(`- ${p.name}: ${v.verdict}${quality}${proofText}`)
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}

// Product deep-dive markdown: every verdict, rationale, and proof URL for one product.
export function renderProductMarkdown(data: CategoryData, productId: string, siteUrl: string): string {
  const product = data.products.find((p) => p.id === productId)
  if (!product) throw new Error(`renderProductMarkdown: unknown product ${productId}`)
  const entry = data.rankings.leaderboard.find((e) => e.productId === productId)!
  const rank = data.rankings.leaderboard.indexOf(entry) + 1
  const evidence = evidenceById(data)

  const lines: string[] = []
  lines.push(`# ${product.name} — ${data.category.name} Arena`)
  lines.push('')
  lines.push(
    `${product.vendor} · ${product.type === 'oss' ? 'open source' : 'commercial'} · [site](${product.urls.site}) · [full arena](${siteUrl}/arena/${data.category.id}/llms.md)`,
  )
  lines.push('')
  lines.push(
    `Rank #${rank} · INIT ${fmtNum(entry.aiEra)} · Score ${fmtNum(entry.score)} · Agentreadyness ${fmtNum(entry.agentReady)} · Agentic-app ${fmtNum(entry.agenticApp)} · API quality ${fmtNum(entry.apiQuality)} · ${entry.applicable}/${entry.total} stories applicable`,
  )
  lines.push('')
  lines.push(`Business model: ${businessModelLine(product)}`)
  lines.push('')

  const linkPairs = Object.entries(product.links ?? {}).filter(([, v]) => v)
  if (linkPairs.length > 0) {
    lines.push(`Links: ${linkPairs.map(([k, v]) => `[${k}](${v})`).join(' · ')}`)
    lines.push('')
  }

  lines.push('## Story verdicts')
  const byTheme = groupInOrder<Story>(data.stories, (s) => s.theme)
  for (const [theme, storiesInTheme] of byTheme) {
    lines.push('')
    lines.push(`### ${theme}`)
    const byGroup = groupInOrder<Story>(storiesInTheme, (s) => s.group)
    for (const [group, stories] of byGroup) {
      if (group !== theme) {
        lines.push('')
        lines.push(`#### ${group}`)
      }
      for (const s of stories) {
        const v = verdictFor(data, productId, s.id)
        const proof = strongestEvidence(v, evidence)
        lines.push('')
        lines.push(`**${s.title}**`)
        const quality = v.verdict === 'na' ? '' : ` — quality ${v.quality}/10`
        lines.push(`- Verdict: ${v.verdict}${quality} (confidence: ${v.confidence})`)
        lines.push(`- Rationale: ${v.rationale}`)
        if (proof) lines.push(`- Proof: [${proof.tier}](${proof.url})`)
        if (v.evidenceIds.length > 0) {
          const cites = v.evidenceIds
            .map((id) => evidence.get(id))
            .filter((e): e is NonNullable<typeof e> => e !== undefined)
            .map((e) => `[${e.tier}](${e.url})`)
            .join(', ')
          lines.push(`- Cited evidence: ${cites}`)
        }
      }
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}
