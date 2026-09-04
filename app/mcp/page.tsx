import type { Metadata } from 'next'
import Link from 'next/link'
import { loadCategories } from '@/lib/data'
import { REPO, SITE_URL as SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'MCP — use ProductArena from your agent — ProductArena',
  description:
    'Query evidence-graded product rankings from any MCP client: a hosted remote endpoint at /productarena/mcp and the productarena-mcp npm package, exposing eight tools over the same public data API.',
}

// Static page — no dynamic segments; categories.json is bundled at build time (count only).
export const dynamic = 'force-static'

const MCP_ENDPOINT = 'https://ultrametric.ai/productarena/mcp'

// Keep in sync with mcp/src/server.ts and infra/cloudflare-proxy/worker.js (the two servers).
const TOOLS: Array<{ name: string; args: string; description: string }> = [
  { name: 'list_arenas', args: '—', description: 'Every arena/category: id, name, description, personas, themes.' },
  { name: 'get_rankings', args: 'arena', description: 'One arena’s full leaderboard (coverage score, Arena Score, agent-readiness, per-theme scores) plus its head-to-head battle log.' },
  { name: 'get_product', args: 'arena, product', description: 'One product: metadata, leaderboard entry with rank, verdict counts, and a per-story verdict summary.' },
  { name: 'get_verdict', args: 'arena, product, story', description: 'The full judged verdict for one (product, story) cell: tier, quality, confidence, rationale, and cited evidence URLs.' },
  { name: 'search_products', args: 'query', description: 'Find products by id/name/vendor substring across every arena.' },
  { name: 'compare', args: 'products[]', description: 'Cross-arena score comparison: rank, coverage score, Arena Score, agent-readiness, AI-native, API quality per product.' },
  { name: 'get_stacks', args: '—', description: 'Curated cross-arena AI stacks with every scored slot resolved live from current leaderboards.' },
  { name: 'top_products', args: 'metric, limit?', description: 'Cross-arena top-N by one metric: score, arenaScore, agentReady, agenticApp, or apiQuality.' },
]

const CODE_BLOCK =
  'mt-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300'

export default function McpPage() {
  const arenaCount = loadCategories().length

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-400">MCP</p>
        <h1 className="font-display leading-[1.1] mt-1 text-3xl font-bold tracking-tight">
          Use ProductArena from your agent
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Every ranking, verdict, and evidence citation across {arenaCount} arenas is queryable over the{' '}
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline">
            Model Context Protocol
          </a>
          {' '}— either through the hosted remote endpoint (nothing to install) or the{' '}
          <code className="text-zinc-300">productarena-mcp</code> npm package over stdio. Both expose the same
          eight tools on the same public data behind{' '}
          <Link href="/openapi.json" className="text-emerald-300 hover:underline">/openapi.json</Link>.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">Remote endpoint (no install)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Streamable HTTP, keyless, rate-limited (60 requests / 5 minutes per IP). POST JSON-RPC to:
        </p>
        <pre className={CODE_BLOCK}>{MCP_ENDPOINT}</pre>
        <p className="mt-3 text-sm text-zinc-400">Claude Code:</p>
        <pre className={CODE_BLOCK}>{`claude mcp add --transport http productarena ${MCP_ENDPOINT}`}</pre>
        <p className="mt-3 text-sm text-zinc-400">Any client with an HTTP-transport MCP config:</p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "type": "http",
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>
        <p className="mt-3 text-sm text-zinc-400">Or try it with plain curl:</p>
        <pre className={CODE_BLOCK}>{`curl -X POST ${MCP_ENDPOINT} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"top_products","arguments":{"metric":"agentReady","limit":5}}}'`}</pre>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">npm package (stdio)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Runs locally, fetches the same live data with a 5-minute cache. Claude Code:
        </p>
        <pre className={CODE_BLOCK}>{`claude mcp add productarena -- npx -y productarena-mcp`}</pre>
        <p className="mt-3 text-sm text-zinc-400">
          Claude Desktop (<code className="text-zinc-300">claude_desktop_config.json</code>) or any stdio client:
        </p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "command": "npx",
      "args": ["-y", "productarena-mcp"]
    }
  }
}`}</pre>
        <p className="mt-3 text-sm text-zinc-400">
          Source and full docs live in the repo:{' '}
          <a
            href={`https://github.com/${REPO}/blob/main/mcp/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            mcp/README.md
          </a>
          . Set <code className="text-zinc-300">PA_BASE_URL</code> to point it at a local checkout.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">Tool catalog</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-400">
                <th scope="col" className="px-3 py-2 font-normal">Tool</th>
                <th scope="col" className="px-3 py-2 font-normal">Arguments</th>
                <th scope="col" className="px-3 py-2 font-normal">Returns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {TOOLS.map((tool) => (
                <tr key={tool.name} className="transition hover:bg-zinc-900/50">
                  <td className="whitespace-nowrap px-3 py-2.5 align-top font-mono text-emerald-300">{tool.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 align-top font-mono text-xs text-zinc-400">{tool.args}</td>
                  <td className="px-3 py-2.5 align-top text-zinc-400">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Prefer raw HTTP? The same data is plain JSON under{' '}
          <code className="text-zinc-400">{SITE}/data/…</code> (see{' '}
          <Link href="/openapi.json" className="text-emerald-300 hover:underline">/openapi.json</Link>), and every
          arena has a markdown rendering indexed from{' '}
          <Link href="/llms.txt" className="text-emerald-300 hover:underline">/llms.txt</Link>.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-300">Data license</p>
        <p className="mt-1">
          Everything these tools return is the ProductArena dataset, © Ultrametric Inc. Querying it and briefly
          quoting individual verdicts, scores, or evidence excerpts is welcome <em>with attribution</em> to
          &ldquo;ProductArena by Ultrametric Inc (ultrametric.ai/productarena)&rdquo;. Bulk copying, redistribution,
          or use to build or train competing products or datasets requires written permission — see{' '}
          <a
            href={`https://github.com/${REPO}/blob/main/DATA-LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            DATA-LICENSE
          </a>
          .
        </p>
      </section>
    </div>
  )
}
