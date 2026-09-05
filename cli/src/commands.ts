// One function per CLI command: fetch via api.ts, render via format.ts, print. Every command
// honors --json (raw data, no color) so scripts and agents can consume the same output.
import {
  UsageError,
  accessSummary,
  compareProducts,
  fetchCategories,
  getProduct,
  getRankings,
  getStacks,
  listArenas,
  topProducts,
} from './api.js'
import { aliasesByArena, resolveRole } from './aliases.js'
import type { ArenaClient } from './client.js'
import { NetworkError } from './client.js'
import { accessLine, fmtScore, palette, renderTable } from './format.js'
import { METRIC_LABELS, normalizeMetric, type Metric } from './metrics.js'
import { CLOSE_CALL_DELTA, pickTop } from './pick.js'
import type { Product, Rankings, ScanResult, Verdict } from './types.js'

export interface Flags {
  json: boolean
  oss: boolean
  metric?: string
  limit?: number
}

export interface Ctx {
  client: ArenaClient
  color: boolean
  out: (line?: string) => void
}

function resolveMetric(flags: Flags, fallback: Metric): Metric {
  if (flags.metric === undefined) return fallback
  const metric = normalizeMetric(flags.metric)
  if (!metric) {
    throw new UsageError(`unknown metric "${flags.metric}" — use agentReady, arenaScore, agenticApp, apiQuality, or score`)
  }
  return metric
}

const json = (data: unknown) => JSON.stringify(data, null, 2)

export async function cmdArenas(ctx: Ctx, flags: Flags): Promise<void> {
  const arenas = await listArenas(ctx.client)
  if (flags.json) return ctx.out(json(arenas.map(({ id, name, productCount }) => ({ id, name, productCount }))))
  ctx.out(renderTable(
    ['ID', 'ARENA', 'PRODUCTS'],
    arenas.map((a) => [a.id, a.name, String(a.productCount)]),
    { align: ['l', 'l', 'r'], color: ctx.color },
  ))
  ctx.out()
  ctx.out(palette(ctx.color).dim(`${arenas.length} arenas · productarena rankings <id> for a leaderboard`))
}

export async function cmdRankings(ctx: Ctx, arena: string, flags: Flags): Promise<void> {
  const view = await getRankings(ctx.client, arena)
  if (flags.json) return ctx.out(json(view))
  const c = palette(ctx.color)
  ctx.out(c.bold(`${arena} — leaderboard`) + c.dim(`  (generated ${view.generatedAt.slice(0, 10)})`))
  ctx.out()
  ctx.out(renderTable(
    ['#', 'PRODUCT', 'ARENA SCORE', 'AGENT-READY', 'AGENTIC', 'API'],
    view.rows.map((r) => [
      String(r.rank),
      r.name + (r.type === 'oss' ? ' *' : ''),
      fmtScore(r.arenaScore),
      fmtScore(r.agentReady),
      fmtScore(r.agenticApp),
      fmtScore(r.apiQuality),
    ]),
    { align: ['r', 'l', 'r', 'r', 'r', 'r'], highlightRow: 0, color: ctx.color },
  ))
  ctx.out()
  ctx.out(c.dim(`* open source · ${ctx.client.baseUrl}/arena/${arena}`))
}

export async function cmdProduct(ctx: Ctx, arena: string, productId: string, flags: Flags): Promise<void> {
  const detail = await getProduct(ctx.client, arena, productId)
  if (flags.json) return ctx.out(json(detail))
  const c = palette(ctx.color)
  const { product, entry, verdictCounts } = detail
  const rank = detail.rank === null ? 'unranked' : `#${detail.rank} of ${detail.fieldSize}`
  ctx.out(`${c.bold(product.name)} — ${arena} ${c.green(rank)}  ${c.dim(`(${product.type}, by ${product.vendor})`)}`)
  ctx.out()
  ctx.out(`  Arena Score     ${fmtScore(entry?.aiEra)}`)
  ctx.out(`  agent-ready     ${fmtScore(entry?.agentReady)}`)
  ctx.out(`  agentic app     ${fmtScore(entry?.agenticApp)}`)
  ctx.out(`  API quality     ${fmtScore(entry?.apiQuality)}`)
  if (entry) ctx.out(`  coverage score  ${fmtScore(entry.score)}  ${c.dim(`(${entry.applicable}/${entry.total} stories applicable)`)}`)
  ctx.out()
  ctx.out(`  Access: ${accessLine(detail.access, ctx.color)}`)
  ctx.out(
    `  Verdicts: ${verdictCounts.full} full · ${verdictCounts.partial} partial · ${verdictCounts.none} none · ` +
      `${verdictCounts.disputed} disputed · ${verdictCounts.na} n/a`,
  )
  if (detail.topFull.length > 0) {
    ctx.out()
    ctx.out(c.bold('  Nails:'))
    for (const s of detail.topFull) ctx.out(`    ${c.green('✓')} ${s.title} ${c.dim(`(w${s.weight})`)}`)
  }
  if (detail.topNone.length > 0) {
    ctx.out()
    ctx.out(c.bold('  Gaps:'))
    for (const s of detail.topNone) ctx.out(`    ${c.dim('—')} ${s.title} ${c.dim(`(w${s.weight})`)}`)
  }
  ctx.out()
  ctx.out(`  Vendor:       ${product.urls.site}`)
  ctx.out(`  ProductArena: ${ctx.client.baseUrl}/arena/${arena}/product/${product.id}`)
}

export async function cmdCompare(ctx: Ctx, ids: string[], flags: Flags): Promise<void> {
  const result = await compareProducts(ctx.client, ids)
  if (flags.json) return ctx.out(json(result))
  const c = palette(ctx.color)
  if (result.products.length > 0) {
    ctx.out(renderTable(
      ['PRODUCT', 'ARENA', 'RANK', 'ARENA SCORE', 'AGENT-READY', 'AGENTIC', 'API'],
      result.products.map((p) => [
        p.name,
        p.arena,
        p.rank === null ? '—' : `#${p.rank}/${p.fieldSize}`,
        fmtScore(p.arenaScore),
        fmtScore(p.agentReady),
        fmtScore(p.agenticApp),
        fmtScore(p.apiQuality),
      ]),
      { align: ['l', 'l', 'r', 'r', 'r', 'r', 'r'], color: ctx.color },
    ))
  }
  if (result.notFound.length > 0) {
    ctx.out()
    ctx.out(c.yellow(`not found: ${result.notFound.join(', ')}`))
  }
  ctx.out()
  ctx.out(c.dim(result.note))
}

export async function cmdTop(ctx: Ctx, flags: Flags): Promise<void> {
  const metric = resolveMetric(flags, 'agentReady')
  const entries = await topProducts(ctx.client, metric, { limit: flags.limit, ossOnly: flags.oss })
  if (flags.json) return ctx.out(json({ metric, ossOnly: flags.oss, entries }))
  const c = palette(ctx.color)
  ctx.out(c.bold(`Top products by ${METRIC_LABELS[metric]}${flags.oss ? ' (open source only)' : ''}`))
  ctx.out()
  ctx.out(renderTable(
    ['#', 'PRODUCT', 'ARENA', METRIC_LABELS[metric].toUpperCase(), 'ARENA SCORE'],
    entries.map((e, i) => [String(i + 1), e.name, e.arena, fmtScore(e.value), fmtScore(e.arenaScore)]),
    { align: ['r', 'l', 'l', 'r', 'r'], highlightRow: 0, color: ctx.color },
  ))
}

export async function cmdPick(ctx: Ctx, role: string, flags: Flags): Promise<void> {
  const metric = resolveMetric(flags, 'agentReady')
  const categories = await fetchCategories(ctx.client)
  const { arena, suggestions } = resolveRole(role, categories.map((cat) => cat.id))
  if (!arena) {
    const hint = suggestions.length > 0
      ? `did you mean: ${suggestions.join(', ')}?`
      : 'run `productarena arenas` for the full list'
    throw new UsageError(`no arena matches role "${role}" — ${hint}`)
  }
  const category = categories.find((cat) => cat.id === arena)!

  const [rankings, products, verdicts] = await Promise.all([
    ctx.client.fetchJson<Rankings>(`/data/${arena}/rankings.json`),
    ctx.client.fetchJson<Product[]>(`/data/${arena}/products.json`),
    ctx.client.fetchJson<Verdict[]>(`/data/${arena}/verdicts.json`),
  ])
  const result = pickTop(rankings.leaderboard, products, metric, { ossOnly: flags.oss })
  if (!result.top) {
    throw new UsageError(
      `no products ranked on ${METRIC_LABELS[metric]}${flags.oss ? ' among open-source products' : ''} in "${arena}"`,
    )
  }

  const access = accessSummary(verdicts, result.top.productId)
  if (flags.json) {
    return ctx.out(json({ role, arena, arenaName: category.name, ...result, access, closeCallDelta: CLOSE_CALL_DELTA }))
  }
  const c = palette(ctx.color)
  const label = METRIC_LABELS[metric]
  ctx.out(`${c.dim(`${role} →`)} ${c.bold(category.name)} ${c.dim(`(${arena})`)}`)
  ctx.out()
  ctx.out(
    `  ${c.green(c.bold(`Pick: ${result.top.name}`))} — #1 of ${result.fieldSize} by ${label} ` +
      `(${fmtScore(result.top.value)})${flags.oss ? ' [oss]' : ''}   ${accessLine(access, ctx.color)}`,
  )
  if (result.runnerUp) {
    ctx.out(`  Runner-up: ${result.runnerUp.name} — ${label} ${fmtScore(result.runnerUp.value)} (Δ${fmtScore(result.delta)})`)
  }
  if (result.tooClose) {
    ctx.out()
    ctx.out(`  ${c.yellow(`Too close to call, Δ${fmtScore(result.delta)} (threshold ${CLOSE_CALL_DELTA.toFixed(1)}) — treat the top two as a tie.`)}`)
  }
  ctx.out()
  ctx.out(c.dim(`  ${ctx.client.baseUrl}/arena/${arena}`))
}

export async function cmdStacks(ctx: Ctx, stackId: string | undefined, flags: Flags): Promise<void> {
  const stacks = await getStacks(ctx.client)
  const c = palette(ctx.color)
  if (!stackId) {
    if (flags.json) return ctx.out(json(stacks.map(({ id, name, tagline, audience, slots }) => ({ id, name, tagline, audience, slotCount: slots.length }))))
    ctx.out(renderTable(
      ['ID', 'STACK', 'SLOTS', 'FOR'],
      stacks.map((s) => [s.id, s.name, String(s.slots.length), s.audience]),
      { align: ['l', 'l', 'r', 'l'], color: ctx.color },
    ))
    ctx.out()
    ctx.out(c.dim('productarena stacks <id> to resolve one live'))
    return
  }
  const stack = stacks.find((s) => s.id === stackId)
  if (!stack) {
    throw new UsageError(`unknown stack "${stackId}" — valid ids: ${stacks.map((s) => s.id).join(', ')}`)
  }
  if (flags.json) return ctx.out(json(stack))
  ctx.out(`${c.bold(stack.name)} — ${stack.tagline}`)
  ctx.out(c.dim(`For: ${stack.audience}`))
  ctx.out()
  for (const slot of stack.slots) {
    if (slot.kind === 'editorial') {
      ctx.out(`  ${c.bold(slot.role)}: ${slot.productName ?? '—'} ${c.dim(`(editorial — ${slot.note ?? ''})`)}`)
    } else {
      const live = slot.kind === 'arena-top' ? ` — live #${slot.rank} of ${slot.arena}` : ` — #${slot.rank} of ${slot.arena}`
      const metricLabel = slot.metric === 'aiEra' ? 'Arena Score' : slot.metric
      ctx.out(`  ${c.bold(slot.role)}: ${c.green(slot.productName ?? '')}${c.dim(`${live} by ${metricLabel} (${fmtScore(slot.metricValue)})`)}`)
    }
    ctx.out(c.dim(`    ${slot.why}`))
  }
  ctx.out()
  ctx.out(c.dim(`  ${ctx.client.baseUrl}/stacks`))
}

const check = (pass: boolean, color: boolean) => (pass ? palette(color).green('✓') : palette(color).dim('—'))

export async function cmdScan(ctx: Ctx, url: string, flags: Flags): Promise<void> {
  const endpoint = `${ctx.client.baseUrl}/api/scan`
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    })
  } catch (err) {
    throw new NetworkError(`scanner not deployed yet (could not reach ${endpoint}: ${err instanceof Error ? err.message : String(err)})`)
  }
  if (res.status === 404 || res.status === 405) {
    throw new NetworkError(`scanner not deployed yet (${endpoint} -> HTTP ${res.status}) — try the web scan at ${ctx.client.baseUrl}/submit`)
  }
  let body: ScanResult & { error?: string }
  try {
    body = (await res.json()) as ScanResult & { error?: string }
  } catch {
    throw new NetworkError(`scanner returned a non-JSON response (HTTP ${res.status})`)
  }
  if (!res.ok) {
    const message = body.error ?? `scan failed (HTTP ${res.status})`
    if (res.status >= 500) throw new NetworkError(message)
    throw new UsageError(message)
  }
  if (flags.json) return ctx.out(json(body))
  const c = palette(ctx.color)
  if (!body.ok || !body.checks) {
    ctx.out(c.yellow(`Could not scan ${body.host ?? url} — the site may block automated requests.`))
    return
  }
  const ch = body.checks
  ctx.out(c.bold(`Agent-readiness quick scan: ${body.host}`) + c.dim(`  (${body.scannedAt ?? ''})`))
  ctx.out()
  ctx.out(`  ${check(ch.llmsTxt.found, ctx.color)} llms.txt        ${ch.llmsTxt.found ? `served (${ch.llmsTxt.bytes.toLocaleString('en-US')} bytes)` : 'not served — the #1 quick win for agent visibility'}`)
  ctx.out(`  ${check(ch.openapi.found, ctx.color)} OpenAPI spec    ${ch.openapi.found ? 'machine-readable spec at /openapi.json' : 'no spec at /openapi.json'}`)
  ctx.out(`  ${check(ch.homepage.mentionsMcp, ctx.color)} MCP mentioned   ${ch.homepage.mentionsMcp ? 'homepage references the Model Context Protocol' : 'no MCP mention on the homepage'}`)
  const signals = [ch.homepage.mentionsApi && 'API', ch.homepage.mentionsCli && 'CLI', ch.homepage.mentionsDocs && 'docs'].filter(Boolean).join(' · ')
  ctx.out(`  ${check(Boolean(signals), ctx.color)} API/CLI/docs    ${signals || 'none detected on the homepage'}`)
  const agentsAllowed = ch.robots.found && !ch.robots.blocksAllAgents
  ctx.out(`  ${check(agentsAllowed, ctx.color)} Agents allowed  ${!ch.robots.found ? 'no robots.txt found' : ch.robots.blocksAllAgents ? 'robots.txt disallows everything' : 'robots.txt does not block all agents'}`)
  ctx.out()
  ctx.out(c.dim(`  Surface scan of well-known paths only — submit for a full evaluation: ${ctx.client.baseUrl}/submit`))
}

// Compact alias-map dump for `pick` errors and --help curiosity; exposed as `pick --list`.
export async function cmdPickList(ctx: Ctx, flags: Flags): Promise<void> {
  const categories = await fetchCategories(ctx.client)
  const grouped = aliasesByArena(categories.map((c) => c.id))
  if (flags.json) return ctx.out(json(Object.fromEntries(grouped)))
  const c = palette(ctx.color)
  ctx.out(renderTable(
    ['ARENA', 'ALIASES'],
    grouped.map(([arena, aliases]) => [arena, aliases.join(', ')]),
    { color: ctx.color },
  ))
  ctx.out()
  ctx.out(c.dim('every arena id also works as a role verbatim'))
}
