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
  { name: 'get_rankings', args: 'arena', description: 'One arena’s full leaderboard (coverage score, PA Score, agent-readiness, per-theme scores) plus its head-to-head battle log.' },
  { name: 'get_product', args: 'arena, product', description: 'One product: metadata, leaderboard entry with rank, verdict counts, and a per-story verdict summary.' },
  { name: 'get_verdict', args: 'arena, product, story', description: 'The full judged verdict for one (product, story) cell: tier, quality, confidence, rationale, and cited evidence URLs.' },
  { name: 'search_products', args: 'query', description: 'Find products by id/name/vendor substring across every arena.' },
  { name: 'compare', args: 'products[]', description: 'Cross-arena score comparison: rank, coverage score, PA Score, agent-readiness, AI-native, API quality per product.' },
  { name: 'get_stacks', args: '—', description: 'Curated cross-arena AI stacks with every scored slot resolved live from current leaderboards.' },
  { name: 'top_products', args: 'metric, limit?', description: 'Cross-arena top-N by one metric: score, paScore, agentReady, agenticApp, or apiQuality.' },
]

const CODE_BLOCK =
  'mt-2 whitespace-pre-wrap break-all rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300'

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
        <p className="mt-3 text-sm text-zinc-400">Or try it with plain curl:</p>
        <pre className={CODE_BLOCK}>{`curl -X POST ${MCP_ENDPOINT} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"top_products","arguments":{"metric":"agentReady","limit":5}}}'`}</pre>
      </section>

      {/* Per-client setup, hosted endpoint first (nothing to install). Every snippet below was
          verified against the client's own current docs on 2026-09-14 — the shapes genuinely
          differ (Cursor: mcpServers+url; VS Code: servers+type:http; Windsurf: serverUrl;
          Codex: TOML [mcp_servers.*]; Gemini CLI: httpUrl, NOT url which means SSE there):
          - Cursor:    https://cursor.com/docs/context/mcp
          - VS Code:   https://code.visualstudio.com/docs/copilot/chat/mcp-servers
          - Windsurf:  https://docs.windsurf.com/windsurf/cascade/mcp
          - Codex CLI: https://developers.openai.com/codex/mcp
          - Gemini:    https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html */}
      <section id="clients" className="scroll-mt-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">Set it up in your client</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Same hosted endpoint, each client&rsquo;s own config shape (they differ — these match each
          tool&rsquo;s current docs).
        </p>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">Claude Code</h3>
        <pre className={CODE_BLOCK}>{`claude mcp add --transport http productarena ${MCP_ENDPOINT}`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">Cursor</h3>
        <p className="mt-1 text-xs text-zinc-500"><code className="text-zinc-400">~/.cursor/mcp.json</code> (or <code className="text-zinc-400">.cursor/mcp.json</code> per project):</p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">VS Code / GitHub Copilot</h3>
        <p className="mt-1 text-xs text-zinc-500"><code className="text-zinc-400">.vscode/mcp.json</code> (or the user-level file via &ldquo;MCP: Open User Configuration&rdquo;) — note the top-level key is <code className="text-zinc-400">servers</code>:</p>
        <pre className={CODE_BLOCK}>{`{
  "servers": {
    "productarena": {
      "type": "http",
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">Windsurf</h3>
        <p className="mt-1 text-xs text-zinc-500"><code className="text-zinc-400">~/.codeium/windsurf/mcp_config.json</code> — remote servers use <code className="text-zinc-400">serverUrl</code>:</p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "serverUrl": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">OpenAI Codex CLI</h3>
        <p className="mt-1 text-xs text-zinc-500"><code className="text-zinc-400">~/.codex/config.toml</code>:</p>
        <pre className={CODE_BLOCK}>{`[mcp_servers.productarena]
url = "${MCP_ENDPOINT}"`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">Gemini CLI</h3>
        <p className="mt-1 text-xs text-zinc-500"><code className="text-zinc-400">~/.gemini/settings.json</code> — streamable HTTP is <code className="text-zinc-400">httpUrl</code> (<code className="text-zinc-400">url</code> means SSE there):</p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "httpUrl": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>

        <h3 className="mt-5 text-sm font-semibold text-zinc-200">Anything else</h3>
        <p className="mt-1 text-xs text-zinc-500">Any client with an HTTP-transport MCP config:</p>
        <pre className={CODE_BLOCK}>{`{
  "mcpServers": {
    "productarena": {
      "type": "http",
      "url": "${MCP_ENDPOINT}"
    }
  }
}`}</pre>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight">npm package (stdio)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Prefer a local process? <code className="text-zinc-300">productarena-mcp</code> runs over
          stdio and fetches the same live data with a 5-minute cache. Claude Code:
        </p>
        <pre className={CODE_BLOCK}>{`claude mcp add productarena -- npx -y productarena-mcp`}</pre>
        <p className="mt-3 text-sm text-zinc-400">
          Claude Desktop (<code className="text-zinc-300">claude_desktop_config.json</code>), Cursor,
          Windsurf, Gemini CLI, or any stdio client — same shape, in each client&rsquo;s config file
          from the section above:
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
          OpenAI Codex CLI (<code className="text-zinc-300">~/.codex/config.toml</code>):
        </p>
        <pre className={CODE_BLOCK}>{`[mcp_servers.productarena]
command = "npx"
args = ["-y", "productarena-mcp"]`}</pre>
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

      {/* id: deep-link target for /everything's link index ("CLI — npx productarena"). */}
      <section id="cli" className="scroll-mt-4">
        <h2 className="font-display text-xl font-semibold tracking-tight">CLI</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Prefer a terminal to a protocol? The <code className="text-zinc-300">productarena</code> npm
          package puts the same live data behind one command — rankings, cross-arena compare,{' '}
          <code className="text-zinc-300">pick &lt;role&gt;</code> for a vendor pick with a runner-up and
          close-race flag, live-resolved stacks, and an agent-readiness scan:
        </p>
        <pre className={CODE_BLOCK}>{`npx productarena rankings ai-coding
npx productarena pick payroll
npx productarena top --metric agentReady --oss`}</pre>
        <p className="mt-3 text-sm text-zinc-400">
          Every command takes <code className="text-zinc-300">--json</code> for scripts and agents. Source
          and docs:{' '}
          <a
            href={`https://github.com/${REPO}/blob/main/cli/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            cli/README.md
          </a>
          .
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
