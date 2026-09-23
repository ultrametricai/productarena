// Virtual Startup (founder ask 2026-09-23): a synthetic company run through the REAL process
// corpus. The reader picks a handful of starting decisions; each decision selects which real
// processes/chains (data/processes.json + data/process-chains.json) make up the journey, and the
// timeline replays them with clearly-labeled synthetic artifacts ("what each step produces").
//
// Client-safe and pure (no node builtins) — same split convention as lib/processSim.ts: the
// server page (app/virtual-startup/page.tsx) resolves the corpus + judged rankings and hands
// serializable payloads to components/VirtualStartup.tsx, which calls the pure functions here.
//
// Honesty rules (the site's whole brand):
//   - the journey is COMPOSED of real corpus processes — every task id here must exist in
//     data/processes.json (lib/__tests__/virtualStartup.test.ts enforces it against the live
//     corpus; journeyPhases throws on an unknown chain rather than inventing one);
//   - vendor picks are the judged rankings (lib/processRankings.ts stepRanking), resolved
//     server-side — nothing here fabricates a score;
//   - every synthetic artifact is born labeled: SyntheticArtifact.simulated is the literal
//     `true`, stamped centrally by buildJourneyArtifacts so no generator can forget it, and the
//     UI renders a visible SIMULATED chip off that flag (component tests enforce the rendering);
//   - artifacts are deterministic from the decision combo (seeded PRNG, no LLM calls, no server
//     state) — the same choices replay identically;
//   - fake identifiers are constructed to be impossible-real: EIN "00-0000000" (no real EIN
//     starts 00), domains on the RFC 2606-reserved .example TLD, all-zero file/routing numbers.

import type { SimStep } from './processSim'

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export type EntityChoice = 'c-corp' | 'llc'
export type FundingChoice = 'bootstrap' | 'seed'
export type ProductChoice = 'subscriptions' | 'invoices'
export type TeamChoice = 'solo' | 'cofounders'

export interface Choices {
  entity: EntityChoice
  funding: FundingChoice
  product: ProductChoice
  team: TeamChoice
}

export const DEFAULT_CHOICES: Choices = {
  entity: 'c-corp',
  funding: 'seed',
  product: 'subscriptions',
  team: 'cofounders',
}

export interface DecisionOption {
  value: string
  label: string
  // Names the REAL corpus process/chain the option maps to — the mapping is visible, not vibes.
  detail: string
}

export interface DecisionDef {
  id: keyof Choices
  title: string
  options: DecisionOption[]
}

// The decision tree, derived from what the corpus actually contains (no marketplace/other
// entity processes exist, so no such options are offered):
//   entity  — form_001 "Incorporate C-Corp" vs form_011 "Set up an LLC"
//   team    — startup_002 "Founder agreement & equity split" included only with cofounders
//   funding — the raise-a-seed-round chain (fund_005, fund_001, qs_052) included only on raise
//   product — the get-paid chain forked: growth_001 "Set up subscription billing" (SaaS) vs
//             sales_002 "Send an invoice" (invoice-billed services)
export const DECISIONS: DecisionDef[] = [
  {
    id: 'entity',
    title: 'Entity',
    options: [
      { value: 'c-corp', label: 'Delaware C-Corp', detail: 'runs the real "Incorporate C-Corp" process (form_001)' },
      { value: 'llc', label: 'LLC', detail: 'runs the real "Set up an LLC" process (form_011)' },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    options: [
      { value: 'cofounders', label: 'Cofounders', detail: 'adds "Founder agreement & equity split" (startup_002)' },
      { value: 'solo', label: 'Solo founder', detail: 'no founder equity split to paper — startup_002 is skipped' },
    ],
  },
  {
    id: 'funding',
    title: 'Funding',
    options: [
      { value: 'seed', label: 'Raise a seed', detail: 'adds the real "Raise a seed round" playbook (data room, SAFEs, cap table)' },
      { value: 'bootstrap', label: 'Bootstrap', detail: 'no fundraise phase — straight from formation to shipping' },
    ],
  },
  {
    id: 'product',
    title: 'Business model',
    options: [
      { value: 'subscriptions', label: 'SaaS subscriptions', detail: 'turns on revenue via "Set up subscription billing" (growth_001)' },
      { value: 'invoices', label: 'Invoice-billed services', detail: 'turns on revenue via "Send an invoice" (sales_002)' },
    ],
  },
]

export function comboKey(c: Choices): string {
  return `${c.entity}|${c.funding}|${c.product}|${c.team}`
}

export function allChoiceCombos(): Choices[] {
  const combos: Choices[] = []
  for (const entity of ['c-corp', 'llc'] as const)
    for (const funding of ['bootstrap', 'seed'] as const)
      for (const product of ['subscriptions', 'invoices'] as const)
        for (const team of ['solo', 'cofounders'] as const)
          combos.push({ entity, funding, product, team })
  return combos
}

// ---------------------------------------------------------------------------
// Decision → journey mapping (real chains from data/process-chains.json only)
// ---------------------------------------------------------------------------

// The chains the journey is composed from — each id must exist in data/process-chains.json
// (journeyPhases throws otherwise; the test suite checks against the committed file).
export const VS_CHAIN_IDS = [
  'name-the-company',
  'company-launch',
  'raise-a-seed-round',
  'ship-v1',
  'launch-website',
  'get-paid',
  'launch-on-product-hunt',
] as const

export interface VsChain {
  id: string
  name: string
  taskIds: string[]
}

export interface JourneyPhase {
  id: string
  title: string
  chainId: string
  chainName: string
  taskIds: string[]
  // Names the decision effect applied to this phase's chain, when one applies.
  note: string | null
}

function chainOrThrow(chains: VsChain[], id: string): VsChain {
  const hit = chains.find((c) => c.id === id)
  if (!hit) throw new Error(`virtual-startup journey references unknown chain "${id}"`)
  return hit
}

// The whole journey for one decision combo: time-ordered phases, each seeded by a REAL curated
// chain's taskIds with the decision transforms applied — a task id is only ever swapped for
// another real corpus task (form_001 → form_011) or dropped, never invented. Tasks appearing in
// several chains (domain_002, prod_005) run once: first occurrence wins, later phases lose them.
export function journeyPhases(choices: Choices, chains: VsChain[]): JourneyPhase[] {
  const phases: JourneyPhase[] = []
  const push = (id: string, title: string, chainId: string, transform?: (ids: string[]) => string[], note?: string | null) => {
    const chain = chainOrThrow(chains, chainId)
    const taskIds = transform ? transform([...chain.taskIds]) : [...chain.taskIds]
    phases.push({ id, title, chainId, chainName: chain.name, taskIds, note: note ?? null })
  }

  push('name', 'Name & brand', 'name-the-company')
  push(
    'form',
    'Form the company',
    'company-launch',
    (ids) =>
      ids
        .map((id) => (id === 'form_001' && choices.entity === 'llc' ? 'form_011' : id))
        .filter((id) => id !== 'startup_002' || choices.team === 'cofounders'),
    choices.entity === 'llc'
      ? 'LLC path — "Set up an LLC" (form_011) replaces the C-Corp filing'
      : choices.team === 'solo'
        ? 'solo founder — the founder equity split (startup_002) is skipped'
        : null,
  )
  if (choices.funding === 'seed') {
    push('raise', 'Raise the seed', 'raise-a-seed-round')
  }
  push('build', 'Build & ship v1', 'ship-v1')
  push('website', 'Launch the website', 'launch-website')
  push(
    'revenue',
    'Turn on revenue',
    'get-paid',
    (ids) =>
      ids.filter((id) =>
        id === 'growth_001' ? choices.product === 'subscriptions'
        : id === 'sales_002' ? choices.product === 'invoices'
        : true,
      ),
    choices.product === 'subscriptions'
      ? 'SaaS — subscription billing (growth_001); the invoice path (sales_002) is skipped'
      : 'services — invoicing (sales_002); subscription billing (growth_001) is skipped',
  )
  push('launch', 'Launch day', 'launch-on-product-hunt')

  // Dedupe across phases — first occurrence wins.
  const seen = new Set<string>()
  return phases
    .map((p) => ({
      ...p,
      taskIds: p.taskIds.filter((id) => {
        if (seen.has(id)) return false
        seen.add(id)
        return true
      }),
    }))
    .filter((p) => p.taskIds.length > 0)
}

export function journeyTaskIds(choices: Choices, chains: VsChain[]): string[] {
  return journeyPhases(choices, chains).flatMap((p) => p.taskIds)
}

// Every task id any decision combo can reach — the server page precomputes payloads for exactly
// this set (order-stable: first combo that reaches a task places it).
export function unionTaskIds(chains: VsChain[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const combo of allChoiceCombos()) {
    for (const id of journeyTaskIds(combo, chains)) {
      if (!seen.has(id)) {
        seen.add(id)
        out.push(id)
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Serializable payload shapes (built server-side by app/virtual-startup/page.tsx)
// ---------------------------------------------------------------------------

// The top JUDGED vendor for one step — lib/processRankings.ts stepRanking()'s #1, carried with
// its arena so the UI can link the judged product page. null when the step has no committed
// story mapping / judged ranking (the UI then shows nothing rather than a guess).
export interface TopVendorPick {
  productId: string
  name: string
  score: number
  arenaId: string
  arenaName: string
}

export interface VirtualTaskPayload {
  id: string
  title: string
  slug: string
  phase: string
  description: string
  steps: SimStep[]
  // Parallel to steps: the step's top judged vendor, or null.
  tops: (TopVendorPick | null)[]
}

// ---------------------------------------------------------------------------
// Deterministic synthetic artifacts — the "virtual data" each step produces
// ---------------------------------------------------------------------------

export interface SyntheticArtifact {
  taskId: string
  label: string
  value: string
  // Literal true — a synthetic artifact cannot exist unlabeled. buildJourneyArtifacts stamps
  // it centrally; the UI renders the visible SIMULATED chip off this flag; tests enforce both.
  simulated: true
}

// fnv-1a string hash → 32-bit seed.
function hashSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32 — tiny deterministic PRNG, plenty for demo data.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length]
}

const NAME_ROOTS = ['Quant', 'Vanta', 'Lume', 'Arc', 'Drift', 'Fathom', 'Nova', 'Tan', 'Hex', 'Onset', 'Mica', 'Bram', 'Cinder', 'Sable', 'Perch', 'Ostra'] as const
const NAME_TAILS = ['leaf', 'forge', 'grid', 'flow', 'stack', 'port', 'byte', 'loop', 'works', 'base', 'line', 'harbor'] as const

export interface SynthCompany {
  name: string // "Quantforge"
  display: string // "Quantforge, Inc." / "Quantforge LLC" — follows the entity decision
  slug: string // "quantforge"
}

// The virtual company's identity, deterministic from the decision combo. Its own seed stream so
// the name never shifts when the artifact set changes.
export function synthCompany(choices: Choices): SynthCompany {
  const rng = mulberry32(hashSeed(`vs:name:${comboKey(choices)}`))
  const name = `${pick(rng, NAME_ROOTS)}${pick(rng, NAME_TAILS)}`
  return {
    name,
    display: choices.entity === 'llc' ? `${name} LLC` : `${name}, Inc.`,
    slug: name.toLowerCase(),
  }
}

interface ArtifactCtx {
  rng: () => number
  choices: Choices
  co: SynthCompany
}

type Draft = { label: string; value: string }

// One generator per corpus task id that produces a visible artifact. Values are constructed to
// be impossible-real (see module header) — the SIMULATED chip is belt, these are braces.
const ARTIFACT_GENERATORS: Record<string, (ctx: ArtifactCtx) => Draft[]> = {
  brand_001: ({ co }) => [{ label: 'Company name', value: co.display }],
  domain_002: ({ co }) => [{ label: 'Domain', value: `${co.slug}.example (reserved demo TLD)` }],
  brand_002: ({ co }) => [{ label: 'Logo', value: `wordmark "${co.name}" generated` }],
  brand_003: ({ rng }) => {
    const hex = () => `#${Math.floor(rng() * 0xffffff).toString(16).padStart(6, '0')}`
    return [{ label: 'Brand palette', value: `${hex()} / ${hex()}` }]
  },
  legal_002: ({ co }) => [{ label: 'Trademark filing', value: `"${co.name}" — USPTO serial 00000000 (placeholder)` }],
  form_001: ({ co }) => [{ label: 'Certificate of Incorporation', value: `${co.display} — DE file no. 0000000` }],
  form_011: ({ co }) => [{ label: 'Certificate of Formation', value: `${co.display} — DE file no. 0000000` }],
  // No real EIN starts 00 — the canonical impossible-real placeholder.
  form_002: () => [{ label: 'EIN', value: '00-0000000' }],
  startup_002: () => [{ label: 'Founder equity', value: '50 / 50 split · 4-year vest, 1-year cliff' }],
  qs_051: ({ choices }) => [{
    label: 'Cap table',
    value: `10,000,000 authorized · ${choices.team === 'cofounders' ? '2 founder holders' : '1 founder holder'}`,
  }],
  qs_023: () => [{ label: 'Bank account', value: 'checking ····0000 · routing 000000000' }],
  qs_063: () => [{ label: 'Payroll', value: 'first run $0.00 — no employees yet' }],
  qs_073: () => [{ label: 'Books', value: 'chart of accounts seeded · 0 transactions' }],
  fund_005: ({ rng }) => [{ label: 'Data room', value: `${8 + Math.floor(rng() * 13)} documents indexed` }],
  fund_001: ({ rng }) => [{
    label: 'SAFE round',
    value: `$${pick(rng, ['250,000', '500,000', '750,000', '1,000,000'])} on a $${pick(rng, ['4M', '5M', '6M', '8M', '10M'])} post-money cap`,
  }],
  qs_052: () => [{ label: 'Cap table update', value: 'SAFEs recorded · fully-diluted view refreshed' }],
  prod_006: ({ co }) => [{ label: 'Repo', value: `code.example/${co.slug}/app` }],
  sw_010: () => [{ label: 'Agent readiness', value: 'AGENTS.md + CI checks committed' }],
  prod_001: ({ co }) => [{ label: 'Cloud', value: `project ${co.slug}-prod provisioned` }],
  prod_002: () => [{ label: 'CI/CD', value: 'pipeline #1 green · deploy on merge' }],
  prod_004: () => [{ label: 'Error tracking', value: 'DSN wired · 0 open issues' }],
  prod_005: () => [{ label: 'Analytics', value: 'first event captured: $pageview' }],
  site_001: ({ co }) => [{ label: 'Website', value: `https://${co.slug}.example live` }],
  prod_003: ({ co }) => [{ label: 'DNS', value: `${co.slug}.example → apex A record set` }],
  qs_021: () => [{ label: 'Payments', value: 'account acct_SIM0000000 activated (test mode)' }],
  growth_001: ({ rng }) => [{
    label: 'First subscription',
    value: `Pro — $${pick(rng, ['19', '29', '49', '99'])}/mo · sub_SIM0001 active`,
  }],
  sales_002: ({ rng }) => [{
    label: 'First invoice',
    value: `INV-0001 — $${pick(rng, ['900.00', '1,200.00', '2,400.00', '4,800.00'])} · net 30`,
  }],
  fin_002: () => [{ label: 'First close', value: 'month 1 reconciled · payout matched' }],
  growth_003: ({ co }) => [{ label: 'Email list', value: `1 subscriber — founder@${co.slug}.example` }],
  growth_010: ({ co }) => [{ label: 'Launch day', value: `"${co.name}" queued on the directories · assets uploaded` }],
}

// The task ids that produce artifacts — exported so tests can enforce that every generator key
// is a real corpus task reachable by some decision combo (no dead or invented demo data).
export const ARTIFACT_TASK_IDS: readonly string[] = Object.keys(ARTIFACT_GENERATORS)

// Every artifact for one journey, keyed by task id. Deterministic: the rng stream is seeded by
// the decision combo and consumed in journey (taskIds) order — the same choices replay the same
// artifacts, byte for byte. The `simulated: true` stamp happens HERE, once, for every artifact.
export function buildJourneyArtifacts(choices: Choices, taskIds: string[]): Record<string, SyntheticArtifact[]> {
  const co = synthCompany(choices)
  const rng = mulberry32(hashSeed(`vs:artifacts:${comboKey(choices)}`))
  const out: Record<string, SyntheticArtifact[]> = {}
  for (const taskId of taskIds) {
    const gen = ARTIFACT_GENERATORS[taskId]
    if (!gen) continue
    out[taskId] = gen({ rng, choices, co }).map((d) => ({ taskId, ...d, simulated: true as const }))
  }
  return out
}

// ---------------------------------------------------------------------------
// Journey stats & elapsed time (all from corpus estimatedMinutes — no invented durations)
// ---------------------------------------------------------------------------

export interface JourneyStats {
  totalSteps: number
  agentSteps: number
  formSteps: number
  personSteps: number
  legalSignatures: number
  approvals: number
  asyncSteps: number
  totalMinutes: number
}

export function journeyStats(steps: SimStep[]): JourneyStats {
  const s: JourneyStats = {
    totalSteps: steps.length,
    agentSteps: 0,
    formSteps: 0,
    personSteps: 0,
    legalSignatures: 0,
    approvals: 0,
    asyncSteps: 0,
    totalMinutes: 0,
  }
  for (const step of steps) {
    if (step.route === 'agent') s.agentSteps += 1
    else if (step.route === 'form') s.formSteps += 1
    else s.personSteps += 1
    if (step.legalSignature) s.legalSignatures += 1
    if (step.approvalRequired) s.approvals += 1
    if (step.async) s.asyncSteps += 1
    s.totalMinutes += step.estimatedMinutes
  }
  return s
}

// 1-based simulation day for a cumulative elapsed-minutes reading (corpus estimates summed).
export function dayOf(cumulativeMinutes: number): number {
  return Math.floor(cumulativeMinutes / (60 * 24)) + 1
}
