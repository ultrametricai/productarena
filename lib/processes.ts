import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { isPopulated, loadCategory } from './data'
import { resolveGapStep } from './gapClosers'
import type { GapResolution, SimStep, StepRoute, SwapOption, VendorRole } from './processSim'
import { formatMinutes, gapWhy } from './processSim'

// Client-safe prop shapes + display helpers live in lib/processSim.ts (no node:fs) so the
// simulator client component can import them; re-exported here for server-side callers.
export { formatMinutes, gapWhy }
export type { GapResolution, SimStep, StepRoute, SwapOption, VendorRole }

// The founder-process corpus (data/processes.json): 96 real startup operating processes, each
// mapped as a DAG whose nodes are routed 'agent' (an agent can drive the step via a recorded
// API/tool call), 'form' (manual form/portal work — no public API path), or 'person' (genuinely
// needs a human: signatures, meetings, judgment, waiting on a third party). The whole feature's
// thesis lives in that routing: the per-process **agent ceiling** (share of steps an agent can
// run today) and the **gaps** (the non-agent steps) are first-class findings, not footnotes.
//
// Distinct from lib/aiStacks.ts (composes products across arenas) — this maps *processes* onto
// arenas: a DAG vendor that has an arena here resolves to that arena's live leaderboard, so a
// process page can show the canonical vendor, the market alternatives ranked by agent-readiness,
// and let the simulator swap them.

export const FunctionCallSchema = z.object({
  method: z.string().min(1),
  type: z.enum(['rest', 'sdk', 'graphql', 'manual']).optional(),
  description: z.string().optional(),
})

export const DagNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  route: z.enum(['agent', 'form', 'person']),
  vendor: z.string().min(1).optional(),
  toolCall: z.string().min(1).optional(),
  functionCalls: FunctionCallSchema.array().optional(),
  approvalRequired: z.boolean().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  estimatedMinutes: z.number().min(0),
  async: z.boolean().optional(),
})

export const ProcessTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  phase: z.string().min(1),
  complexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']),
  category: z.string().min(1),
  supportLevel: z.enum(['full', 'partial', 'manual_guide']),
  supportReason: z.string(),
  vendors: z.string().array(),
  dag: z.object({
    nodes: DagNodeSchema.array().min(1),
    edges: z.object({ from: z.string(), to: z.string() }).array().optional(),
  }),
  contextNeeded: z.object({
    tool: z.string().min(1),
    query: z.string().optional(),
    tier: z.string().min(1),
    required: z.boolean(),
  }).array(),
  tags: z.string().array(),
  activeMinutes: z.number().min(0),
  totalEstimatedMinutes: z.number().min(0),
  hasAsyncSteps: z.boolean(),
})

export const ProcessChainSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'chain id must be kebab-case'),
  name: z.string().min(1),
  tagline: z.string().min(1),
  taskIds: z.string().min(1).array().min(2),
})

export type ProcessTask = z.infer<typeof ProcessTaskSchema>
export type DagNode = z.infer<typeof DagNodeSchema>
export type ProcessChain = z.infer<typeof ProcessChainSchema>

// Display order for the corpus's phases — grouping on the index page follows the life of the
// company, not the alphabet. Unknown phases (future corpus additions) sort last, alphabetically.
export const PHASE_ORDER = [
  'formation', 'fundraising', 'legal', 'compliance', 'finance', 'hr',
  'operations', 'product', 'sales', 'growth',
] as const

export function phaseRank(phase: string): number {
  const i = (PHASE_ORDER as readonly string[]).indexOf(phase)
  return i === -1 ? PHASE_ORDER.length : i
}

const DEFAULT_DIR = () => path.join(process.cwd(), 'data')

// URL slug for a process — kebab-case of the title, same convention as arena/product ids
// elsewhere on the site (lowercase, hyphen-separated). Uniqueness across the corpus is enforced
// at load time, so /processes/[slug] routing is collision-free by construction.
export function processSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const processesCache = new Map<string, ProcessTask[]>()

export function loadProcesses(dir: string = DEFAULT_DIR()): ProcessTask[] {
  const hit = processesCache.get(dir)
  if (hit) return hit
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'processes.json'), 'utf8'))
  const tasks = ProcessTaskSchema.array().parse(raw)
  const seen = new Map<string, string>()
  for (const t of tasks) {
    const slug = processSlug(t.title)
    const clash = seen.get(slug)
    if (clash) throw new Error(`process slug collision: ${clash} and ${t.id} both slug to "${slug}"`)
    seen.set(slug, t.id)
  }
  processesCache.set(dir, tasks)
  return tasks
}

export function findProcessBySlug(slug: string, dir: string = DEFAULT_DIR()): ProcessTask | null {
  return loadProcesses(dir).find((t) => processSlug(t.title) === slug) ?? null
}

const chainsCache = new Map<string, ProcessChain[]>()

// Curated chained stories (data/process-chains.json): ordered runs of real corpus task ids.
// Integrity-checked at load: every taskId must exist in the corpus, chain ids must be unique.
export function loadChains(dir: string = DEFAULT_DIR()): ProcessChain[] {
  const hit = chainsCache.get(dir)
  if (hit) return hit
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'process-chains.json'), 'utf8'))
  const chains = ProcessChainSchema.array().parse(raw)
  const taskIds = new Set(loadProcesses(dir).map((t) => t.id))
  const chainIds = new Set<string>()
  for (const chain of chains) {
    if (chainIds.has(chain.id)) throw new Error(`duplicate chain id ${chain.id}`)
    chainIds.add(chain.id)
    for (const tid of chain.taskIds) {
      if (!taskIds.has(tid)) throw new Error(`chain ${chain.id} references unknown task ${tid}`)
    }
  }
  chainsCache.set(dir, chains)
  return chains
}

export function chainTasks(chain: ProcessChain, dir: string = DEFAULT_DIR()): ProcessTask[] {
  const byId = new Map(loadProcesses(dir).map((t) => [t.id, t]))
  return chain.taskIds.map((tid) => byId.get(tid)!)
}

// ---------------------------------------------------------------------------
// Agent ceiling & gaps
// ---------------------------------------------------------------------------

export interface ProcessGap {
  label: string
  route: 'form' | 'person'
  why: string
}

export interface ProcessCeiling {
  agentSteps: number
  totalSteps: number
  // % of steps an agent can run today, rounded to a whole number.
  pct: number
  agentMinutes: number
  totalMinutes: number
  // Agent-runnable steps that are human-gated (approvalRequired) — counted inside agentSteps
  // (the agent CAN run them), surfaced separately because a human still has to say yes.
  approvalGates: number
  gaps: ProcessGap[]
}

export function computeCeiling(nodes: DagNode[]): ProcessCeiling {
  let agentSteps = 0
  let agentMinutes = 0
  let totalMinutes = 0
  let approvalGates = 0
  const gaps: ProcessGap[] = []
  for (const n of nodes) {
    totalMinutes += n.estimatedMinutes
    if (n.route === 'agent') {
      agentSteps += 1
      agentMinutes += n.estimatedMinutes
      if (n.approvalRequired) approvalGates += 1
    } else {
      gaps.push({ label: n.label, route: n.route, why: gapWhy(n.route) })
    }
  }
  const totalSteps = nodes.length
  return {
    agentSteps,
    totalSteps,
    pct: totalSteps === 0 ? 0 : Math.round((agentSteps / totalSteps) * 100),
    agentMinutes,
    totalMinutes,
    approvalGates,
    gaps,
  }
}

export function taskCeiling(task: ProcessTask): ProcessCeiling {
  return computeCeiling(task.dag.nodes)
}

// The site-wide headline: the agent ceiling across every step of every process in the corpus.
export function siteCeiling(tasks: ProcessTask[]): ProcessCeiling {
  return computeCeiling(tasks.flatMap((t) => t.dag.nodes))
}

export interface GapTheme {
  id: string
  label: string
  count: number
  examples: string[]
}

// Recurring kinds of non-agent step across the whole corpus — "still human/manual across the
// market". Individual gap labels are mostly unique, so we bucket them into honest themes by
// keyword; the first matching rule wins. Buckets are reported with real example labels so a
// reader can audit the grouping.
const GAP_THEME_RULES: Array<{ id: string; label: string; test: (label: string, node: DagNode) => boolean }> = [
  {
    // Before 'signatures': "sign up" is account creation, not a signature.
    id: 'account-signup',
    label: 'Account signup & identity verification (KYC, portals)',
    test: (l) => /sign ?up|create account|kyc|verify identity|onboard/.test(l),
  },
  {
    id: 'signatures',
    label: 'Signatures & notarization',
    test: (l) => /\bsign\b|signature|notar|counter-?sign|docusign/.test(l),
  },
  {
    id: 'government-filings',
    label: 'Government filings & registrations (IRS, SEC, state portals)',
    test: (l) => /\bfile\b|filing|\birs\b|\bsec\b|uspto|register|registration|\btax\b|annual report/.test(l),
  },
  {
    id: 'waiting',
    label: 'Waiting on a third party (approvals, certificates, review turnaround)',
    test: (l, n) => Boolean(n.async) || /receive|wait|approval from|confirmation|processing/.test(l),
  },
  {
    id: 'meetings',
    label: 'Meetings, interviews & negotiations',
    test: (l) => /meeting|interview|negotiat|conduct|discuss|onboarding call|1:1/.test(l),
  },
]

export function gapThemes(tasks: ProcessTask[]): GapTheme[] {
  const themes = new Map<string, GapTheme>()
  const add = (id: string, label: string, example: string) => {
    const t = themes.get(id) ?? { id, label, count: 0, examples: [] }
    t.count += 1
    if (t.examples.length < 3 && !t.examples.includes(example)) t.examples.push(example)
    themes.set(id, t)
  }
  for (const task of tasks) {
    for (const n of task.dag.nodes) {
      if (n.route === 'agent') continue
      const l = n.label.toLowerCase()
      const rule = GAP_THEME_RULES.find((r) => r.test(l, n))
      if (rule) add(rule.id, rule.label, n.label)
      else if (n.route === 'form') add('manual-portals', 'Manual portal & form work (no API path)', n.label)
      else add('human-judgment', 'Human decisions & hands-on work', n.label)
    }
  }
  return [...themes.values()].sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------
// Vendor -> arena mapping (internal links + swap options)
// ---------------------------------------------------------------------------

// Corpus vendor key -> categories.json arena id, for vendors we actually rank. A mapped vendor's
// product id equals the vendor key in every arena below (verified by lib/__tests__/processes
// tests), so the DAG's canonical vendor resolves straight to a product page.
export const VENDOR_ARENA: Record<string, string> = {
  gusto: 'payroll',
  rippling: 'payroll',
  deel: 'payroll',
  justworks: 'payroll',
  mercury: 'startup-banking',
  brex: 'startup-banking',
  ramp: 'startup-banking',
  relay: 'startup-banking',
  stripe: 'payments',
  quickbooks: 'accounting',
  xero: 'accounting',
  pilot: 'accounting',
  linear: 'project-management',
  asana: 'project-management',
  notion: 'project-management',
  github: 'code-hosting',
  slack: 'team-chat',
  hubspot: 'crm',
  attio: 'crm',
  salesforce: 'crm',
  posthog: 'product-analytics',
  amplitude: 'product-analytics',
  mixpanel: 'product-analytics',
  vercel: 'edge-platforms',
  cloudflare: 'edge-platforms',
  supabase: 'backend-as-a-service',
  firebase: 'backend-as-a-service',
}

// Pretty display names for corpus vendor keys (snake_case, lowercase). Fallback title-cases.
const VENDOR_LABELS: Record<string, string> = {
  irs: 'IRS',
  sec: 'SEC',
  uspto: 'USPTO',
  aws: 'AWS',
  state_sos: 'State Secretary of State',
  stripe_atlas: 'Stripe Atlas',
  google_drive: 'Google Drive',
  google_slides: 'Google Slides',
  onepassword: '1Password',
  docusign: 'DocuSign',
  hubspot: 'HubSpot',
  github: 'GitHub',
  quickbooks: 'QuickBooks',
  posthog: 'PostHog',
  pagerduty: 'PagerDuty',
  sendgrid: 'SendGrid',
  bamboohr: 'BambooHR',
}

export function vendorLabel(vendor: string): string {
  const hit = VENDOR_LABELS[vendor]
  if (hit) return hit
  return vendor
    .split(/[_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function arenaSwapOptions(arenaId: string, dir?: string): SwapOption[] {
  const data = loadCategory(arenaId, dir)
  const nameOf = (pid: string) => data.products.find((p) => p.id === pid)?.name ?? pid
  return [...data.rankings.leaderboard]
    .sort((a, b) => (b.agentReady ?? -1) - (a.agentReady ?? -1))
    .map((e) => ({ id: e.productId, name: nameOf(e.productId), agentReady: e.agentReady }))
}

// The swappable market roles of one or more tasks: every mapped vendor (from DAG nodes first —
// the canonical call targets — then the task's own vendors list) collapsed per arena. The
// default pick is the DAG's canonical vendor; alternatives are the arena's live leaderboard.
// An unmapped vendor (irs, clerky, docusign…) is not a role — there's no arena to swap within.
export function vendorRoles(tasks: ProcessTask[], dir?: string): VendorRole[] {
  const byArena = new Map<string, { canonical: string; stepCount: number }>()
  const claim = (vendor: string, steps: number) => {
    const arenaId = VENDOR_ARENA[vendor]
    if (!arenaId || !isPopulated(arenaId, dir)) return
    const existing = byArena.get(arenaId)
    if (existing) existing.stepCount += steps
    else byArena.set(arenaId, { canonical: vendor, stepCount: steps })
  }
  for (const task of tasks) {
    for (const n of task.dag.nodes) if (n.vendor) claim(n.vendor, 1)
  }
  for (const task of tasks) {
    for (const v of task.vendors) claim(v, 0)
  }

  const roles: VendorRole[] = []
  for (const [arenaId, { canonical, stepCount }] of byArena) {
    const data = loadCategory(arenaId, dir)
    const alternatives = arenaSwapOptions(arenaId, dir)
    const def = alternatives.find((o) => o.id === canonical) ?? alternatives[0]
    if (!def) continue
    roles.push({
      arenaId,
      arenaName: data.category.name,
      canonicalVendor: canonical,
      defaultProductId: def.id,
      defaultProductName: def.name,
      stepCount,
      alternatives,
    })
  }
  return roles.sort((a, b) => b.stepCount - a.stepCount || a.arenaName.localeCompare(b.arenaName))
}

// ---------------------------------------------------------------------------
// Simulator flattening (client-component props — keep these minimal and serializable)
// ---------------------------------------------------------------------------

export function buildSimSteps(tasks: ProcessTask[], dir?: string): SimStep[] {
  return tasks.flatMap((task) =>
    task.dag.nodes.map((n) => ({
      taskId: task.id,
      taskTitle: task.title,
      label: n.label,
      route: n.route,
      vendor: n.vendor ?? null,
      vendorLabel: n.vendor ? vendorLabel(n.vendor) : null,
      arenaId: (n.vendor && VENDOR_ARENA[n.vendor]) || null,
      calls: (n.functionCalls ?? []).map((fc) => fc.method),
      toolCall: n.toolCall ?? null,
      approvalRequired: n.approvalRequired ?? false,
      riskLevel: n.riskLevel ?? null,
      estimatedMinutes: n.estimatedMinutes,
      async: n.async ?? false,
      // Pre-resolved server-side so the client simulator never touches the rule engine or disk.
      gap: resolveGapStep(n, dir),
    })),
  )
}
