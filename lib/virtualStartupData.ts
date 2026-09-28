// Server-side payload builders for the Virtual Startup v3 run layer (lib/virtualStartupRun.ts is
// the pure client-safe half; this file owns the node:fs-backed resolution, same split convention
// as lib/processes.ts vs lib/processSim.ts). Everything built here is a serialization of already-
// judged/committed data — canonical agent-access verdicts (lib/accessGlyphs.ts), verbatim
// published-pricing facts (lib/pricing.ts), and the corpus risk axis (processes/corpus.json) —
// never a new judgment.
import { ACCESS_COLUMNS, bestAccessVerdict } from './accessGlyphs'
import { loadCategory } from './data'
import { ENTRY_PLAN_UNIT, isPricingUnavailable, loadPricing, PRICING_ARENAS, formatFactAmount, type PricingFact } from './pricing'
import { loadProcesses } from './processes'
import type { VendorRole } from './processSim'
import type { VsAccessMap, VsAccessSurface, VsPricingInfo, VsPricingMap, VsVerdictKind } from './virtualStartupRun'

// The canonical MCP/CLI agent-access verdicts for every swap option of every role — the exact
// verdicts components/AgentAccessGlyphs.tsx renders, reduced to their kind strings so the client
// outcome model can read them without dragging CategoryData across the boundary.
export function buildVsAccess(roles: VendorRole[], dir?: string): VsAccessMap {
  const mcpStories = ACCESS_COLUMNS.find((c) => c.label === 'MCP')!.storyIds
  const cliStories = ACCESS_COLUMNS.find((c) => c.label === 'CLI')!.storyIds
  const out: VsAccessMap = {}
  for (const role of roles) {
    const data = loadCategory(role.arenaId, dir)
    const verdictOf = (productId: string, storyIds: string[]): VsVerdictKind => {
      // bestAccessVerdict reduces over the stories present in the arena — an arena carrying
      // none of them has nothing to say, which is honestly 'na', never a guess.
      if (!storyIds.some((id) => data.stories.some((s) => s.id === id))) return 'na'
      return bestAccessVerdict(data, productId, storyIds).verdict
    }
    const byProduct: Record<string, VsAccessSurface> = {}
    for (const option of role.alternatives) {
      byProduct[option.id] = {
        mcp: verdictOf(option.id, mcpStories),
        cli: verdictOf(option.id, cliStories),
      }
    }
    out[role.arenaId] = byProduct
  }
  return out
}

// Deterministic headline fact for one product — the same selection order as lib/pricing.ts
// pricingCellFor (cheapest usage fact in the arena's primary unit, else cheapest usage fact,
// else cheapest entry plan, else the free tier), kept here because the scorecard needs the raw
// amount (for the entry-plan sum) alongside the display label. Selection only — never
// arithmetic on the extracted figures.
function headlineFact(facts: PricingFact[], primary: string | undefined): PricingFact | undefined {
  const cost = (f: PricingFact) => f.amountUsd + (f.percent ?? 0)
  const byCost = (a: PricingFact, b: PricingFact) => cost(a) - cost(b)
  const usage = facts.filter((f) => f.tier === 'usage').sort(byCost)
  return (
    usage.find((f) => f.unit === primary) ??
    usage[0] ??
    facts.filter((f) => f.tier === 'entry-paid').sort(byCost)[0] ??
    facts.find((f) => f.tier === 'free')
  )
}

// Published-pricing headlines for every swap option of every price-covered role arena
// (lib/pricing.ts PRICING_ARENAS) — verbatim-extracted facts with their source URL and fetch
// date, or the honest { unclear } record. Products the pricing stage hasn't touched get no
// entry at all; the scorecard renders that as "no published pricing".
export function buildVsPricing(roles: VendorRole[], dir?: string): VsPricingMap {
  const out: VsPricingMap = {}
  for (const role of roles) {
    const arena = PRICING_ARENAS[role.arenaId]
    if (!arena) continue
    const map = loadPricing(role.arenaId, dir)
    const byProduct: Record<string, VsPricingInfo> = {}
    for (const option of role.alternatives) {
      const entry = map[option.id]
      if (!entry) continue
      if (isPricingUnavailable(entry)) {
        byProduct[option.id] = { kind: 'unclear', reason: entry.reason }
        continue
      }
      const fact = headlineFact(entry.facts, arena.primary)
      if (!fact) continue
      byProduct[option.id] = {
        kind: 'fact',
        label: fact.tier === 'free' ? 'free tier' : formatFactAmount(fact),
        unit: fact.unit,
        tier: fact.tier,
        amountUsd: fact.amountUsd,
        ...(fact.percent !== undefined ? { percent: fact.percent } : {}),
        // The only facts the scorecard may sum: sticker prices the page itself states per month.
        monthly: fact.tier === 'entry-paid' && fact.unit === ENTRY_PLAN_UNIT,
        sourceUrl: fact.sourceUrl,
        asOf: fact.fetchedAt.slice(0, 10),
      }
    }
    if (Object.keys(byProduct).length > 0) out[role.arenaId] = byProduct
  }
  return out
}

// The corpus risk axis (processes/corpus.json `risk`, 1–5) keyed by task id — the event engine's
// plausibility gate reads it client-side.
export function buildVsTaskRisks(dir?: string): Record<string, number> {
  return Object.fromEntries(loadProcesses(dir).map((t) => [t.id, t.risk]))
}
