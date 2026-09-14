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

// The founder-process corpus (data/processes.json): 106 real startup operating processes, each
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
  // Companies that can perform this step — the market for a "choose/sign up" step. Tracked
  // vendors render as chips linking to their judged product page; untracked ones (e.g. doola)
  // render as honest unlinked chips. Distinct from `vendor` (the canonical call target).
  vendorOptions: z.string().min(1).array().optional(),
  toolCall: z.string().min(1).optional(),
  // The canonical external page a HUMAN uses to do this step themselves (the IRS EIN
  // application, Delaware's filing portal, USPTO search…) — rendered as a small
  // "do it yourself ↗" link on the step block, distinct from the evidence-y vendor chips
  // (which link to OUR judged product pages). Only ever populated with a verified-live
  // canonical URL; steps with no canonical page simply have no link.
  actionUrl: z.string().url().optional(),
  // Short human label for actionUrl, e.g. "IRS EIN application". Falls back to the hostname.
  actionLabel: z.string().min(1).optional(),
  functionCalls: FunctionCallSchema.array().optional(),
  approvalRequired: z.boolean().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  estimatedMinutes: z.number().min(0),
  async: z.boolean().optional(),
})

// An old URL slug that must keep working after a rename (founder rule: processes are named
// vendor-neutral — "Send an invoice", not "Send Stripe invoice" — but old vendor-flavored
// slugs are indexed and shared). Static export means no server redirects, so each alias
// prerenders the full page with a canonical link + a pointer line naming the old flavor
// (`label` = the old title).
export const SlugAliasSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'alias slug must be kebab-case'),
  label: z.string().min(1),
})

export type SlugAlias = z.infer<typeof SlugAliasSchema>

export const ProcessTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slugAliases: SlugAliasSchema.array().optional(),
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
  'startup', 'formation', 'fundraising', 'legal', 'compliance', 'finance', 'hr',
  'operations', 'product', 'software', 'sales', 'growth',
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
    // Canonical slug and every alias share one namespace — /processes/[slug] routing stays
    // collision-free by construction across renames.
    for (const slug of [processSlug(t.title), ...(t.slugAliases ?? []).map((a) => a.slug)]) {
      const clash = seen.get(slug)
      if (clash) throw new Error(`process slug collision: ${clash} and ${t.id} both slug to "${slug}"`)
      seen.set(slug, t.id)
    }
  }
  processesCache.set(dir, tasks)
  return tasks
}

export function findProcessBySlug(slug: string, dir: string = DEFAULT_DIR()): ProcessTask | null {
  return loadProcesses(dir).find(
    (t) => processSlug(t.title) === slug || (t.slugAliases ?? []).some((a) => a.slug === slug),
  ) ?? null
}

// The alias entry a given (task, slug) pair landed on, or null when slug is the canonical one —
// lets /processes/[slug] render alias pages with a pointer to the canonical page.
export function slugAliasFor(task: ProcessTask, slug: string): SlugAlias | null {
  return (task.slugAliases ?? []).find((a) => a.slug === slug) ?? null
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
// product id is vendorProductId(key) — usually the key itself, snake_case normalized to the
// site's kebab-case product ids (stripe_atlas → stripe-atlas), verified against real product ids
// by lib/__tests__/processes tests — so the DAG's canonical vendor resolves to a product page.
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
  // Formation & legal paperwork — judged in legal-ops.
  clerky: 'legal-ops',
  stripe_atlas: 'legal-ops',
  firstbase: 'legal-ops',
  docusign: 'legal-ops',
  // Cap table & option grants.
  carta: 'equity-management',
  pulley: 'equity-management',
  // Ops tooling that founder processes lean on.
  calendly: 'scheduling',
  sentry: 'observability',
  pagerduty: 'incident-management',
  segment: 'customer-data-platforms',
  snowflake: 'data-warehouses',
  intercom: 'ai-support-agents',
  // Site generation options (launch-website chain).
  lovable: 'vibe-coding',
  v0: 'vibe-coding',
  bolt: 'vibe-coding',
  // The software-making loop (ship-a-feature / cut-a-release processes).
  claude_code: 'ai-coding',
  codex: 'ai-coding',
  cursor: 'ai-coding',
  coderabbit: 'ai-code-review',
  greptile: 'ai-code-review',
  cursor_bugbot: 'ai-code-review',
  datadog: 'observability',
}

// Vendor keys whose judged product id differs beyond snake_case → kebab-case normalization.
const VENDOR_PRODUCT_ID: Record<string, string> = {
  intercom: 'intercom-fin', // Fin is Intercom's judged support-agent product
}

// The judged product id for a corpus vendor key: explicit override, else the key with
// snake_case normalized to the site's kebab-case product-id convention.
export function vendorProductId(vendor: string): string {
  return VENDOR_PRODUCT_ID[vendor] ?? vendor.replace(/_/g, '-')
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
  google_workspace: 'Google Workspace',
  name_com: 'Name.com',
  v0: 'v0',
  legalzoom: 'LegalZoom',
  northwest: 'Northwest Registered Agent',
  producthunt: 'Product Hunt',
  betalist: 'BetaList',
  hackernews: 'Hacker News',
  google_search_console: 'Google Search Console',
  iubenda: 'iubenda',
  coderabbit: 'CodeRabbit',
}

// The vendor's own start-here page (signup / product start), for steps whose action lives
// inside a chosen vendor — "run payroll" happens in Gusto, so the Gusto OPTION carries the
// start URL rather than the step carrying an actionUrl. Rendered as a small ↗ beside the
// vendor chip; the chip itself keeps linking to OUR judged product page. Every URL verified
// reachable before listing; vendors without a verified canonical start page aren't listed
// (no link fabricated). Keyed by corpus vendor key (snake_case), like VENDOR_ARENA.
export const VENDOR_SIGNUP_URL: Record<string, string> = {
  clerky: 'https://www.clerky.com/',
  stripe_atlas: 'https://stripe.com/atlas',
  firstbase: 'https://firstbase.io/',
  doola: 'https://www.doola.com/',
  mercury: 'https://mercury.com/',
  brex: 'https://www.brex.com/',
  relay: 'https://relayfi.com/',
  ramp: 'https://ramp.com/',
  gusto: 'https://gusto.com/',
  rippling: 'https://www.rippling.com/',
  deel: 'https://www.deel.com/',
  justworks: 'https://www.justworks.com/',
  quickbooks: 'https://quickbooks.intuit.com/',
  xero: 'https://www.xero.com/',
  pilot: 'https://pilot.com/',
  carta: 'https://carta.com/',
  pulley: 'https://pulley.com/',
  stripe: 'https://dashboard.stripe.com/register',
  docusign: 'https://www.docusign.com/',
  google_workspace: 'https://workspace.google.com/',
  name_com: 'https://www.name.com/domain/search',
  namecheap: 'https://www.namecheap.com/domains/',
  lovable: 'https://lovable.dev/',
  v0: 'https://v0.app/',
  bolt: 'https://bolt.new/',
  cloudflare: 'https://www.cloudflare.com/',
  vercel: 'https://vercel.com/',
  posthog: 'https://posthog.com/',
  slack: 'https://slack.com/',
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

// Top arena alternatives for one mapped vendor — the same live leaderboard the swap options
// use, minus the canonical vendor itself. Powers the "or:" row on DAG vendor blocks. Unmapped
// vendors (irs, clerky, docusign…) have no arena, so they yield [] and the block shows only
// the canonical chip.
export interface VendorAlternative extends SwapOption {
  arenaId: string
}

export function vendorAlternatives(vendor: string, limit = 2, dir?: string): VendorAlternative[] {
  const arenaId = VENDOR_ARENA[vendor]
  if (!arenaId || !isPopulated(arenaId, dir)) return []
  const productId = vendorProductId(vendor)
  return arenaSwapOptions(arenaId, dir)
    .filter((o) => o.id !== productId)
    .slice(0, limit)
    .map((o) => ({ ...o, arenaId }))
}

// One vendor rendered as a DAG chip, resolved against the live market. Tracked vendors carry
// their judged product id, arena, agent-readiness and 1-based rank on the arena's
// agent-readiness ladder (the same ordering the "or:" row and swap options use); untracked
// vendors resolve with productId null and render as honest unlinked chips.
export interface VendorChipInfo {
  vendor: string
  label: string
  productId: string | null
  arenaId: string | null
  arenaName: string | null
  agentReady: number | null
  rank: number | null
  // The vendor's own start-here page (VENDOR_SIGNUP_URL) — a small external ↗ beside the chip.
  signupUrl: string | null
}

export function vendorChipInfo(vendor: string, dir?: string): VendorChipInfo {
  const signupUrl = VENDOR_SIGNUP_URL[vendor] ?? null
  const untracked: VendorChipInfo = {
    vendor, label: vendorLabel(vendor),
    productId: null, arenaId: null, arenaName: null, agentReady: null, rank: null, signupUrl,
  }
  const arenaId = VENDOR_ARENA[vendor]
  if (!arenaId || !isPopulated(arenaId, dir)) return untracked
  const productId = vendorProductId(vendor)
  const options = arenaSwapOptions(arenaId, dir)
  const i = options.findIndex((o) => o.id === productId)
  if (i === -1) return untracked
  return {
    vendor,
    label: options[i].name,
    productId,
    arenaId,
    arenaName: loadCategory(arenaId, dir).category.name,
    agentReady: options[i].agentReady,
    rank: i + 1,
    signupUrl,
  }
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
    for (const n of task.dag.nodes) {
      if (n.vendor) claim(n.vendor, 1)
      for (const v of n.vendorOptions ?? []) claim(v, 1)
    }
  }
  for (const task of tasks) {
    for (const v of task.vendors) claim(v, 0)
  }

  const roles: VendorRole[] = []
  for (const [arenaId, { canonical, stepCount }] of byArena) {
    const data = loadCategory(arenaId, dir)
    const alternatives = arenaSwapOptions(arenaId, dir)
    const canonicalId = vendorProductId(canonical)
    const def = alternatives.find((o) => o.id === canonicalId) ?? alternatives[0]
    if (!def) continue
    roles.push({
      arenaId,
      arenaName: data.category.name,
      canonicalVendor: canonicalId,
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
