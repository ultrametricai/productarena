import { loadCategory } from '../data'
import { buildProcessCheckSteps } from '../processCheckData'
import { functionMappingFor, stepVendorScore } from '../processRankings'
import { loadProcesses } from '../processes'
import type { SharedRecord } from './schema'

export interface StepComparisonProduct {
  id: string
  productId: string
  name: string
  href: string
  hasLogo: boolean
  score: number
  stories: Array<{
    id: string; title: string; verdict: string; quality: number; weight: number
    confidence: string; rationale: string
    evidence: Array<{ id: string; url: string; excerpt: string; fetchedAt: string; tier: string }>
  }>
}
export interface StepComparison {
  title?: string
  storyCount: number
  products: StepComparisonProduct[]
}
export type StepComparisons = Record<string, StepComparison>

// Read-only bridge from existing FUNCTION mappings to their preserved canonical scope.
// A migrated method node's original mapping describes its default option only. Nested
// alternatives and linked processes need their own authored mappings, never inheritance.
export function buildStepComparisons(record: SharedRecord): StepComparisons {
  const task = loadProcesses().find(task => task.id === record.id)
  if (!task) return {}
  const result: StepComparisons = {}
  for (const step of buildProcessCheckSteps(task)) {
    const part = record.parts.find(part => part.id === step.nodeId)
    if (!part || part.kind === 'reference') continue
    const node = task.dag.nodes.find(node => node.id === step.nodeId)!
    if (node.methods?.length && (part.kind !== 'decision' || !part.options.some(option => option.id === 'default'))) continue
    if (!node.methods?.length && part.kind !== 'step') continue
    const mapping = functionMappingFor(task.id, node)
    const arena = step.arenas.find(arena => arena.kind === 'function')
    if (!mapping || !arena) continue
    const data = loadCategory(arena.arenaId)
    const scope = `${record.id}:${part.id}${node.methods?.length ? ':default' : ''}`
    const products = arena.vendors.filter(vendor => !vendor.shutdown).flatMap(vendor => {
      const score = stepVendorScore(arena.arenaId, mapping.storyIds, vendor.productId)
      if (!score) return []
      return [{
        id: `${arena.arenaId}/${vendor.productId}`, productId: vendor.productId, name: vendor.name,
        href: `/arena/${arena.arenaId}/product/${vendor.productId}`, hasLogo: vendor.hasLogo === true, score: score.score,
        stories: score.cites.map(cite => {
          const verdict = data.verdicts.find(item => item.productId === vendor.productId && item.storyId === cite.storyId)!
          return {
            id: cite.storyId, title: cite.storyTitle, verdict: cite.verdict, quality: cite.quality, weight: cite.weight,
            confidence: verdict.confidence, rationale: verdict.rationale,
            evidence: (data.evidence[vendor.productId] ?? []).filter(evidence => verdict.evidenceIds.includes(evidence.id)).map(evidence => ({ id: evidence.id, url: evidence.url, excerpt: evidence.excerpt, fetchedAt: evidence.fetchedAt, tier: evidence.tier })),
          }
        }),
      }]
    })
    if (products.length) result[scope] = { title: part.title ?? part.id, storyCount: step.storyCount, products }
  }
  return result
}
