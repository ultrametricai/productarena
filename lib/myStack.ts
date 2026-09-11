// Pure, client-safe engine for /my-stack (components/MyStackBuilder.tsx): the reader enters
// the stack they already run and gets typed, evidence-cited recommendations — upgrades,
// adjacent additions, possible overlaps, vendor consolidations, and break-outs. Same split as
// lib/stackBuilder.ts vs lib/aiStacks.ts: this file must stay free of node builtins (the
// browser computes recommendations from a server-serialized catalog — the selection lives in
// `?s=` and localStorage, so no server ever sees it); the catalog builder that DOES read
// CategoryData lives in lib/myStackData.ts.
//
// Honesty contract:
//   - Every recommendation is one sentence WITH the numbers it rests on, plus links to the
//     product pages where the evidence lives. No number here is ever invented — every score is
//     the same leaderboard value the arenas publish.
//   - Overlap recs say "possible overlap", never "remove X" — two products in one arena can be
//     a deliberate choice (regions, teams, migration in flight).
//   - A score gap where either side's confidence grade is D (lib/confidence.ts: a substantial
//     share of the score rests on no evidence) is NOT actionable — upgrade/break-out recs are
//     suppressed rather than recommending on footing we've said is thin.
import { stackPairKey } from './stackBuilder'

// One catalog row — the lean serialized shape both /my-stack and /stacks/battle receive as a
// prop (built server-side by lib/myStackData.ts). A product ranked in two arenas (e.g. square
// in payments AND mobile-payments) has one row per arena; pick resolution takes the first row
// (categories order), the same canonical-arena convention as lib/alternatives.ts.
export interface MyStackProduct {
  id: string
  name: string
  vendor: string
  arenaId: string
  arenaName: string
  type: 'oss' | 'commercial'
  /** PA Score from the arena leaderboard (null = not scored yet). */
  aiEra: number | null
  agentReady: number | null
  /** Evidence-confidence grade for the score's footing — see lib/confidence.ts. */
  confidence: 'A' | 'B' | 'C' | 'D'
  /** 1-based position in the arena leaderboard (its canonical order) and the field size. */
  rank: number
  fieldSize: number
  hasLogo: boolean
}

// Everything the engine needs besides the reader's picks. adjacency/curatedStackArenas carry
// the arena-id vocabulary of data/adjacent-arenas.json clusters and data/ai-stacks.json slot
// patterns; verifiedPairs is lib/integrations.ts's verifiedPairKeys output ('a|b' sorted keys).
export interface MyStackInputs {
  products: MyStackProduct[]
  adjacency: string[][]
  curatedStackArenas: string[][]
  verifiedPairs: ReadonlyArray<string>
}

export type RecommendationKind = 'upgrade' | 'add' | 'overlap' | 'group' | 'breakout'

export const RECOMMENDATION_KIND_LABELS: Record<RecommendationKind, string> = {
  upgrade: 'UPGRADE',
  add: 'ADD',
  overlap: 'OVERLAP',
  group: 'GROUP',
  breakout: 'BREAK OUT',
}

export interface EvidenceLink {
  label: string
  /** Product page URL — where the cited scores' evidence actually lives. */
  href: string
}

export interface Recommendation {
  kind: RecommendationKind
  /** One honest sentence carrying the numbers the recommendation rests on. */
  reason: string
  links: EvidenceLink[]
  /** Ordering score (see impact formulas below) — never displayed, only sorted on. */
  impact: number
}

export interface RecommendationResult {
  recommendations: Recommendation[]
  /** How many recs beyond MAX_RECOMMENDATIONS were dropped — the UI must say so, not hide it. */
  truncated: number
}

// PA Score gap below which a same-arena alternative is noise, not an upgrade. Aligned with the
// spirit of lib/aiStacks.ts's CLOSE_CALL_DELTA (Δ3 = too close to call): Δ8 is far enough
// outside the close-call band to be a material, defensible difference.
export const UPGRADE_DELTA = 8
// The "specialists lead by a wide margin" bar for break-out recs — roughly two upgrade deltas.
export const BREAKOUT_DELTA = 15
export const MAX_RECOMMENDATIONS = 10

const round1 = (n: number) => Math.round(n * 10) / 10

// Arena weight for impact ordering: log2(1 + fieldSize). A Δ10 lead over 12 rivals says more
// than a Δ10 lead over 2 — bigger fields are more contested, so the same delta carries more
// signal. Logarithmic so a huge arena doesn't drown every other recommendation.
export function arenaWeight(fieldSize: number): number {
  return Math.log2(1 + Math.max(0, fieldSize))
}

const productHref = (p: MyStackProduct) => `/arena/${p.arenaId}/product/${p.id}`
const linkTo = (p: MyStackProduct): EvidenceLink => ({ label: p.name, href: productHref(p) })
const score = (n: number) => `${n.toFixed(0)}/100`

// Resolve pick ids against the catalog: first row per id (canonical arena), unknown ids
// dropped silently (stale share links degrade, same contract as lib/compare.ts).
export function resolvePicks(ids: string[], products: MyStackProduct[]): MyStackProduct[] {
  const byId = new Map<string, MyStackProduct>()
  for (const p of products) {
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  return ids.flatMap((id) => {
    const p = byId.get(id)
    return p ? [p] : []
  })
}

// A same-arena score gap is only actionable when NEITHER side's score rests on D-grade
// footing: a D challenger's lead may be inflated by unevidenced cells, and a D incumbent's
// deficit may be understated the same way. Either way the gap itself is the thin part.
function gapIsConfident(a: MyStackProduct, b: MyStackProduct): boolean {
  return a.confidence !== 'D' && b.confidence !== 'D'
}

const agentReadyClause = (challenger: MyStackProduct, pick: MyStackProduct): string =>
  challenger.agentReady !== null && pick.agentReady !== null
    ? `; agent-ready ${score(challenger.agentReady)} vs ${score(pick.agentReady)}`
    : ''

// ---- rule 1 + 5: UPGRADE / BREAK OUT (one rec per pick, break-out wins when both apply) ----

function upgradeAndBreakoutRecs(picks: MyStackProduct[], byArena: Map<string, MyStackProduct[]>): Recommendation[] {
  const out: Recommendation[] = []
  const pickIds = new Set(picks.map((p) => p.id))
  for (const pick of picks) {
    if (pick.aiEra === null) continue
    const field = byArena.get(pick.arenaId) ?? []
    // Best confident challenger: highest PA Score, must clear UPGRADE_DELTA, must not be
    // another of the reader's own picks (that pair is rule 3's overlap, not an upgrade).
    const challenger = field
      .filter(
        (c) =>
          c.id !== pick.id &&
          !pickIds.has(c.id) &&
          c.aiEra !== null &&
          c.aiEra - (pick.aiEra as number) >= UPGRADE_DELTA &&
          gapIsConfident(c, pick),
      )
      .sort((a, b) => (b.aiEra as number) - (a.aiEra as number) || a.rank - b.rank)[0]
    if (!challenger) continue
    const delta = (challenger.aiEra as number) - pick.aiEra
    const impact = round1(delta * arenaWeight(pick.fieldSize))
    const bottomThird = pick.fieldSize >= 3 && pick.rank > (2 * pick.fieldSize) / 3
    if (bottomThird && delta >= BREAKOUT_DELTA) {
      out.push({
        kind: 'breakout',
        reason:
          `${pick.name} sits #${pick.rank} of ${pick.fieldSize} in ${pick.arenaName} at ${score(pick.aiEra)} while the specialist ${challenger.name} leads at ${score(challenger.aiEra as number)} (Δ${delta.toFixed(0)}${agentReadyClause(challenger, pick)}; confidence ${challenger.confidence} vs ${pick.confidence}) — worth splitting this job out to the specialist.`,
        links: [linkTo(pick), linkTo(challenger)],
        impact,
      })
    } else {
      out.push({
        kind: 'upgrade',
        reason:
          `${challenger.name} scores ${score(challenger.aiEra as number)} vs ${pick.name}'s ${score(pick.aiEra)} in ${pick.arenaName} (Δ${delta.toFixed(0)}${agentReadyClause(challenger, pick)}; confidence ${challenger.confidence} vs ${pick.confidence}).`,
        links: [linkTo(challenger), linkTo(pick)],
        impact,
      })
    }
  }
  return out
}

// ---- rule 2: ADD (adjacent arenas with nothing in the stack → suggest the arena leader) ----

// Impact bases — deliberately below a solid upgrade's delta so speculative additions rank
// under concrete same-arena evidence gaps.
const ADD_BASE = 5
const CURATED_ADD_BONUS = 2
const OVERLAP_BASE = 4
const GROUP_BASE = 4

// A well-connected stack borders MANY arenas (against the live adjacency data a 4-product
// stack can border 20+), and a wall of "you could also add…" would drown the concrete
// same-arena findings — so ADD keeps only its strongest few, and the overflow is counted in
// the result's truncated total rather than silently dropped.
export const MAX_ADD_RECS = 4

function addRecs(picks: MyStackProduct[], inputs: MyStackInputs, byArena: Map<string, MyStackProduct[]>): Recommendation[] {
  const covered = new Set(picks.map((p) => p.arenaId))
  if (covered.size === 0) return []
  // Candidate arenas: every uncovered arena sharing an adjacency cluster with a covered one,
  // plus uncovered slots of any curated stack pattern the reader already half-runs (≥2 of its
  // arenas covered — one shared arena is coincidence, two is a pattern).
  const candidates = new Map<string, { via: Set<string>; curated: boolean }>()
  const noteCandidate = (arenaId: string, via: string[], curated: boolean) => {
    if (covered.has(arenaId)) return
    const entry = candidates.get(arenaId) ?? { via: new Set<string>(), curated: false }
    for (const v of via) entry.via.add(v)
    entry.curated ||= curated
    candidates.set(arenaId, entry)
  }
  for (const cluster of inputs.adjacency) {
    const overlap = cluster.filter((id) => covered.has(id))
    if (overlap.length === 0) continue
    for (const id of cluster) noteCandidate(id, overlap, false)
  }
  for (const pattern of inputs.curatedStackArenas) {
    const overlap = pattern.filter((id) => covered.has(id))
    if (overlap.length < 2) continue
    for (const id of pattern) noteCandidate(id, overlap, true)
  }

  const arenaNameOf = (arenaId: string) =>
    byArena.get(arenaId)?.[0]?.arenaName ?? arenaId
  const pickNamesIn = (arenaIds: Set<string>) =>
    picks.filter((p) => arenaIds.has(p.arenaId)).map((p) => p.name)

  const out: Recommendation[] = []
  for (const [arenaId, { via, curated }] of [...candidates.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const field = byArena.get(arenaId)
    if (!field) continue // adjacency names an arena that isn't live — nothing honest to suggest
    const leader = field.filter((p) => p.aiEra !== null).sort((a, b) => a.rank - b.rank)[0]
    if (!leader) continue
    const neighbors = pickNamesIn(via)
    const viaClause = neighbors.length > 0 ? `sits next to your ${neighbors.slice(0, 3).join(', ')} pick${neighbors.length === 1 ? '' : 's'}` : 'is adjacent to your stack'
    out.push({
      kind: 'add',
      reason:
        `You have nothing in ${arenaNameOf(arenaId)}, which ${viaClause}${curated ? ' (and fills a slot in a curated stack pattern you already half-run)' : ''} — the arena leader is ${leader.name} at ${score(leader.aiEra as number)} (confidence ${leader.confidence}).`,
      links: [linkTo(leader)],
      // Base × arena weight, scaled by how strong the arena's leader actually is (leader/50):
      // an adjacent arena whose best option scores 30/100 is a weaker suggestion than one led
      // at 60/100, and the ordering should say so.
      impact: round1(
        (ADD_BASE + (curated ? CURATED_ADD_BONUS : 0)) * arenaWeight(leader.fieldSize) * ((leader.aiEra as number) / 50),
      ),
    })
  }
  return out.sort((a, b) => b.impact - a.impact || a.reason.localeCompare(b.reason))
}

// ---- rule 3: OVERLAP (possible redundancy — phrased as a question, never a command) ----

function overlapRecs(picks: MyStackProduct[], products: MyStackProduct[]): Recommendation[] {
  const out: Recommendation[] = []
  // (a) Two or more picks in the same arena.
  const byPickArena = new Map<string, MyStackProduct[]>()
  for (const p of picks) {
    const list = byPickArena.get(p.arenaId) ?? []
    list.push(p)
    byPickArena.set(p.arenaId, list)
  }
  for (const [, group] of [...byPickArena.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (group.length < 2) continue
    const names = group.map((p) => `${p.name} (${p.aiEra !== null ? score(p.aiEra) : 'unscored'})`)
    out.push({
      kind: 'overlap',
      reason:
        `${names.join(' and ')} both sit in the ${group[0].arenaName} arena — possible overlap; keeping both can be deliberate, but one may be redundant.`,
      links: group.map(linkTo),
      impact: round1(OVERLAP_BASE * arenaWeight(group[0].fieldSize)),
    })
  }
  // (b) Cross-arena coverage: pick Y is ALSO ranked in pick X's arena at or above X — the
  // catalog itself says Y already covers X's job. (Chosen over integration-neighbor heuristics
  // deliberately: a verified integration edge means "connects to", not "replaces" — inferring
  // redundancy from it would overclaim what the evidence says.)
  for (const x of picks) {
    if (x.aiEra === null) continue
    for (const y of picks) {
      if (y.id === x.id || y.arenaId === x.arenaId) continue
      const yInXArena = products.find((r) => r.id === y.id && r.arenaId === x.arenaId && r.aiEra !== null)
      if (!yInXArena || (yInXArena.aiEra as number) < x.aiEra) continue
      out.push({
        kind: 'overlap',
        reason:
          `${y.name} is also ranked in ${x.arenaName} at ${score(yInXArena.aiEra as number)} — at or above ${x.name}'s ${score(x.aiEra)} — possible overlap between the two.`,
        links: [linkTo(y), linkTo(x)],
        impact: round1((OVERLAP_BASE + ((yInXArena.aiEra as number) - x.aiEra) / 4) * arenaWeight(x.fieldSize)),
      })
    }
  }
  return out
}

// ---- rule 4: GROUP (one vendor family could cover two slots, evidence permitting) ----

function groupRecs(picks: MyStackProduct[], products: MyStackProduct[], verifiedPairs: ReadonlyArray<string>): Recommendation[] {
  const verified = new Set(verifiedPairs)
  const byVendorArena = new Map<string, MyStackProduct[]>()
  for (const p of products) {
    const key = `${p.vendor}::${p.arenaId}`
    const list = byVendorArena.get(key) ?? []
    list.push(p)
    byVendorArena.set(key, list)
  }
  const vendors = [...new Set(products.map((p) => p.vendor))].sort()

  const out: Recommendation[] = []
  const seen = new Set<string>()
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      const p = picks[i]
      const q = picks[j]
      if (p.arenaId === q.arenaId || p.aiEra === null || q.aiEra === null) continue
      for (const vendor of vendors) {
        if (vendor === p.vendor && vendor === q.vendor) continue // already one family
        const bestIn = (arenaId: string, floor: number) =>
          (byVendorArena.get(`${vendor}::${arenaId}`) ?? [])
            .filter((r) => r.aiEra !== null && r.aiEra >= floor)
            .sort((a, b) => (b.aiEra as number) - (a.aiEra as number))[0]
        const rp = bestIn(p.arenaId, p.aiEra)
        const rq = bestIn(q.arenaId, q.aiEra)
        if (!rp || !rq) continue
        const samePick = rp.id === p.id && rq.id === q.id
        if (samePick) continue // that "consolidation" is the stack the reader already has
        const oneProduct = rp.id === rq.id
        // Consolidation only makes sense when the family actually interconnects: one product
        // covering both arenas, or a verified integration edge between the two family members.
        if (!oneProduct && !verified.has(stackPairKey(rp.id, rq.id))) continue
        const dedupeKey = `${vendor}::${[p.arenaId, q.arenaId].sort().join('|')}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        const meanDelta = ((rp.aiEra as number) - p.aiEra + ((rq.aiEra as number) - q.aiEra)) / 2
        const meanWeight = (arenaWeight(p.fieldSize) + arenaWeight(q.fieldSize)) / 2
        const reason = oneProduct
          ? `${vendor}'s ${rp.name} is ranked in both ${p.arenaName} (${score(rp.aiEra as number)}) and ${q.arenaName} (${score(rq.aiEra as number)}), at or above your ${p.name} (${score(p.aiEra)}) and ${q.name} (${score(q.aiEra)}) — one product could cover both slots.`
          : `${vendor} covers both slots: ${rp.name} (${score(rp.aiEra as number)} in ${p.arenaName}) and ${rq.name} (${score(rq.aiEra as number)} in ${q.arenaName}) score at or above your ${p.name} (${score(p.aiEra)}) and ${q.name} (${score(q.aiEra)}), with a verified integration between them.`
        out.push({
          kind: 'group',
          reason,
          links: oneProduct ? [linkTo(rp), linkTo(p), linkTo(q)] : [linkTo(rp), linkTo(rq), linkTo(p), linkTo(q)],
          impact: round1((GROUP_BASE + meanDelta) * meanWeight),
        })
      }
    }
  }
  return out
}

// ---- the engine ----

export function recommend(pickIds: string[], inputs: MyStackInputs): RecommendationResult {
  const picks = resolvePicks(pickIds, inputs.products)
  if (picks.length === 0) return { recommendations: [], truncated: 0 }

  const byArena = new Map<string, MyStackProduct[]>()
  for (const p of inputs.products) {
    const list = byArena.get(p.arenaId) ?? []
    list.push(p)
    byArena.set(p.arenaId, list)
  }

  const adds = addRecs(picks, inputs, byArena)
  const addOverflow = Math.max(0, adds.length - MAX_ADD_RECS)
  const all = [
    ...upgradeAndBreakoutRecs(picks, byArena),
    ...adds.slice(0, MAX_ADD_RECS),
    ...overlapRecs(picks, inputs.products),
    ...groupRecs(picks, inputs.products, inputs.verifiedPairs),
  ].sort((a, b) => b.impact - a.impact || a.kind.localeCompare(b.kind) || a.reason.localeCompare(b.reason))

  return {
    recommendations: all.slice(0, MAX_RECOMMENDATIONS),
    truncated: Math.max(0, all.length - MAX_RECOMMENDATIONS) + addOverflow,
  }
}

// ---- share-URL state (?s=id1,id2) + device-local persistence ----

// Same silent-degrade contract as lib/compare.ts's parseCompareParam: unknown ids (stale
// links, typos) are dropped, dupes collapse, and the list caps at MAX_MY_STACK.
export const MAX_MY_STACK = 24

export function parseMyStackParam(raw: string | null | undefined, validIds: ReadonlySet<string>): string[] {
  if (!raw) return []
  const out: string[] = []
  for (const piece of raw.split(',')) {
    const id = piece.trim()
    if (id === '' || !validIds.has(id) || out.includes(id)) continue
    out.push(id)
    if (out.length === MAX_MY_STACK) break
  }
  return out
}

export function encodeMyStackParam(ids: string[]): string {
  return ids.join(',')
}

// localStorage persistence — same device-local, tolerant-parse contract as lib/watchlist.ts
// (the UI must carry the same "stored in this browser only" honesty note).
export const MY_STACK_KEY = 'pa-my-stack'

export function parseStoredStack(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && id !== ''))].slice(0, MAX_MY_STACK)
  } catch {
    return []
  }
}
