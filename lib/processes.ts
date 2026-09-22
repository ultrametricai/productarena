import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { isPopulated, loadCategory } from './data'
import { resolveGapStep } from './gapClosers'
import { isShutdown } from './shutdown'
import type { Cadence, GapResolution, SimStep, StepRoute, SwapOption, VendorRole } from './processSim'
import { DECISION_STEP_RE, formatMinutes, gapWhy } from './processSim'

// Client-safe prop shapes + display helpers live in lib/processSim.ts (no node:fs) so the
// simulator client component can import them; re-exported here for server-side callers.
export { formatMinutes, gapWhy }
export type { Cadence, GapResolution, SimStep, StepRoute, SwapOption, VendorRole }

// The founder-process corpus (data/processes.json): 119 real startup operating processes, each
// mapped as a DAG whose nodes are routed 'agent' (an agent can drive the step via a recorded
// API/tool call), 'form' (manual form/portal work — no public API path), or 'person' (a human
// or a computer-use agent does it: meetings, judgment, waiting on a third party — with
// legally required signature acts flagged legalSignature, the true human floor). The feature's
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

// One explicit cross-arena vendor for a step: a judged product in an arena OTHER than the
// step's covering arena that genuinely performs this move ("generate a website" is served by
// ChatGPT from ai-assistants and Framer from design-tools, not just the vibe-coding roster).
// Display-only, and evidence-gated downstream: lib/processRankings.ts surfaces a ref only when
// the committed (step, extra-arena) story mapping exists and the product has at least one
// judged full/partial verdict on the mapped stories — a ref is a candidate, never a claim.
export const ExtraOptionRefSchema = z.object({
  arenaId: z.string().min(1),
  productId: z.string().min(1),
})

export type ExtraOptionRef = z.infer<typeof ExtraOptionRefSchema>

export const DagNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  route: z.enum(['agent', 'form', 'person']),
  vendor: z.string().min(1).optional(),
  // Companies that can perform this step — the market for a "choose/sign up" step. Tracked
  // vendors render as chips linking to their judged product page; untracked ones (e.g. doola)
  // render as honest unlinked chips. Distinct from `vendor` (the canonical call target).
  vendorOptions: z.string().min(1).array().optional(),
  // The arena (categories.json id) covering this step's GENERAL FUNCTION — "run payroll" →
  // payroll, "choose a bank" → startup-banking. Display-only: stepVendorOptions() DERIVES the
  // step's supplier list from this arena's live leaderboard at build time (top products by
  // PA Score, capped), so roster changes flow through automatically instead of freezing
  // product lists here. vendorOptions stays the hand-curated set; entries not in the arena
  // are appended after the derived roster. Steps whose function is narrower than any arena
  // (formation services inside legal-ops) or has no arena yet (SEO tools, cloud file storage,
  // launch platforms) omit this and keep their curated options frozen.
  optionsArenaId: z.string().min(1).optional(),
  // ADDITIONAL covering arenas whose whole market genuinely performs this move — "install SDK
  // in codebase" is served by every ai-coding agent, not just the step's own arena. Like
  // optionsArenaId these are display-only, but stricter: cross-arena vendors surface ONLY via
  // the story-derived ranking (lib/processRankings.ts crossArenaStepRankings) — the committed
  // (step, extra-arena) mapping plus a judged full/partial verdict — never as an ungated roster.
  extraOptionArenas: z.string().min(1).array().optional(),
  // Explicit cross-arena vendor candidates (see ExtraOptionRefSchema) for steps where only
  // SPECIFIC products of another arena do the move (Framer/Figma/Canva build sites; the rest of
  // design-tools doesn't). Same evidence gate as extraOptionArenas.
  extraOptionRefs: ExtraOptionRefSchema.array().optional(),
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
  // Vendor signup page for manifest consumers (lib/processManifest.ts) — actionUrl/actionLabel
  // above are the canonical declarations; this is the remaining forward-compat field.
  signupUrl: z.string().min(1).optional(),
  approvalRequired: z.boolean().optional(),
  // The founder's "true human floor" (2026-09-21): this step IS a legally required human
  // signature/attestation act — a statute or counterparty genuinely requires a human to sign
  // or swear (board/stockholder consents, 83(b) elections, notarized USPS 1583, I-9/W-4
  // attestations, tax-return jurats). Only meaningful on route 'person'. Judgment calls that
  // merely FEEL human (go/no-go decisions, reviews, meetings) are NOT legalSignature — they
  // present as "human or computer use". Combined prep+signature steps are split in the corpus
  // so this flag marks only the signature act itself.
  legalSignature: z.boolean().optional(),
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
  // How often this process actually recurs in a running company — the operating-rhythm axis
  // (/processes/operating-rhythm). Curated per process, honestly: setup/formation work is
  // 'once', trigger-driven work (a hire, a cancellation, a new vendor) is 'event-driven',
  // and the rest is the real calendar (payroll runs monthly per the corpus DAG, books close
  // monthly, boards meet quarterly, franchise tax is annual).
  cadence: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'event-driven', 'once']),
  // Display-only jurisdiction marker (founder 2026-09-18): 'us' renders a 🇺🇸 flag on the
  // processes index + detail page for flows written around US law/agencies (DE franchise tax,
  // 409A, 1099s, EIN prerequisites, IRS/83(b) references). Absent = jurisdiction-neutral.
  region: z.enum(['us']).optional(),
  // The five founder orderings (founder ask 2026-09-18) — curated, display-only rank axes for
  // the /processes table. All four are REQUIRED so coverage is total by construction:
  //   timeOrder   — unique position in the sequence a founder actually hits these processes
  //                 (incorporation first, then banking, payroll, … — the founder timeline).
  //   annoyance   — 1–5 drudgery score: how much of a toil this is to do by hand.
  //   risk        — 1–5 cost of getting it wrong: legal / tax / security exposure
  //                 (DE franchise tax and the federal return sit at 5; naming a brand at 1).
  //   growthImpact— 1–5 how directly the process drives revenue/user growth (daily feature
  //                 shipping and outbound at 5; compliance filings at 1).
  // The regularity ordering reuses `cadence` (daily → once) — no extra field needed.
  timeOrder: z.number().int().min(1),
  annoyance: z.number().int().min(1).max(5),
  risk: z.number().int().min(1).max(5),
  growthImpact: z.number().int().min(1).max(5),
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

// Display order for the operating-rhythm board: tightest loop first, then the trigger-driven
// work, then the one-time setup tail. This is the "what really happens in a company" axis.
export const CADENCE_ORDER = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'event-driven', 'once'] as const

export const CADENCE_META: Record<Cadence, { label: string; blurb: string }> = {
  daily: { label: 'Daily', blurb: 'The loop that never stops — code ships, issues move, email goes out.' },
  weekly: { label: 'Weekly', blurb: 'The week-shaped rituals: releases, content, outbound, goal check-ins.' },
  monthly: { label: 'Monthly', blurb: 'The money drumbeat: payroll runs, books close, invoices go out, runway gets read.' },
  quarterly: { label: 'Quarterly', blurb: 'Governance season: board meetings, minutes, OKRs, review cycles.' },
  annual: { label: 'Annual', blurb: 'The filing calendar: franchise tax, returns, 1099s, insurance, 409A.' },
  'event-driven': { label: 'When it happens', blurb: 'No calendar — a hire, a cancellation, a new vendor, a round sets these off.' },
  once: { label: 'Once', blurb: 'Setup and formation — done once, then the company runs on everything above.' },
}

export function cadenceRank(cadence: Cadence): number {
  return (CADENCE_ORDER as readonly string[]).indexOf(cadence)
}

// The rhythm board: every process grouped by cadence, in CADENCE_ORDER, phases preserved
// within each bucket so the groups read in company-lifecycle order.
export function processesByCadence(tasks: ProcessTask[]): Array<{ cadence: Cadence; tasks: ProcessTask[] }> {
  return CADENCE_ORDER.map((cadence) => ({
    cadence,
    tasks: tasks
      .filter((t) => t.cadence === cadence)
      .sort((a, b) => phaseRank(a.phase) - phaseRank(b.phase) || a.title.localeCompare(b.title)),
  })).filter((g) => g.tasks.length > 0)
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
  legalzoom: 'legal-ops',
  docusign: 'legal-ops',
  // Lifecycle email to users — judged in email-marketing.
  mailchimp: 'email-marketing',
  // Domain email + connect-a-vendor steps (founder 2026-09-18 vendor-cell fill).
  fastmail: 'email',
  composio: 'mcp-infrastructure',
  smithery: 'mcp-infrastructure',
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
  // Sales-tax nexus & registration (tax_011) — judged in tax-automation.
  stripe_tax: 'tax-automation',
  avalara: 'tax-automation',
  taxjar: 'tax-automation',
  anrok: 'tax-automation',
  // Incident postmortems & status pages (prod_010 / prod_011).
  incident_io: 'incident-management',
  betterstack: 'incident-management',
  // Lifecycle email for pricing-change / win-back campaigns (growth_014 / growth_015).
  loops: 'email-marketing',
  customer_io: 'email-marketing',
  // Billing plan changes (growth_014) — judged in billing-subscriptions.
  stripe_billing: 'billing-subscriptions',
  chargebee: 'billing-subscriptions',
  recurly: 'billing-subscriptions',
  // Make-the-repo-agent-ready (sw_010) — the agent-skills market.
  superpowers: 'agent-skills',
  gstack: 'agent-skills',
  skills_cli: 'agent-skills',
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
  porkbun: 'Porkbun',
  v0: 'v0',
  legalzoom: 'LegalZoom',
  northwest: 'Northwest Registered Agent',
  producthunt: 'Product Hunt',
  betalist: 'BetaList',
  hackernews: 'Hacker News',
  google_search_console: 'Google Search Console',
  iubenda: 'iubenda',
  coderabbit: 'CodeRabbit',
  // 2026-09-22 corpus expansion vendors.
  stripe_tax: 'Stripe Tax',
  stripe_billing: 'Stripe Billing',
  taxjar: 'TaxJar',
  incident_io: 'incident.io',
  betterstack: 'Better Stack',
  customer_io: 'Customer.io',
  skills_cli: 'skills.sh',
  gstack: 'gstack',
  neo_tax: 'Neo.Tax',
  human_interest: 'Human Interest',
  statuspage: 'Statuspage',
  fastlane: 'fastlane',
  // Contextual vendor selection (vendor_011): our own evidence-comparison surface, disclosed as
  // ours — same honest-affiliation posture as Ultrametric products judged in their arenas.
  productarena: 'ProductArena (ours)',
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
  porkbun: 'https://porkbun.com/products/domains',
  lovable: 'https://lovable.dev/',
  v0: 'https://v0.app/',
  bolt: 'https://bolt.new/',
  cloudflare: 'https://www.cloudflare.com/',
  vercel: 'https://vercel.com/',
  posthog: 'https://posthog.com/',
  slack: 'https://slack.com/',
  // 2026-09-22 corpus expansion — every URL curl-verified reachable before listing.
  stripe_tax: 'https://stripe.com/tax',
  avalara: 'https://www.avalara.com/',
  taxjar: 'https://www.taxjar.com/',
  anrok: 'https://www.anrok.com/',
  incident_io: 'https://incident.io/',
  betterstack: 'https://betterstack.com/',
  statuspage: 'https://www.statuspage.io/',
  loops: 'https://loops.so/',
  customer_io: 'https://customer.io/',
  guideline: 'https://www.guideline.com/',
  human_interest: 'https://humaninterest.com/',
  kandji: 'https://www.kandji.io/',
  jamf: 'https://www.jamf.com/',
  remote: 'https://remote.com/',
  cobalt: 'https://www.cobalt.io/',
  oneleet: 'https://www.oneleet.com/',
  conveyor: 'https://www.conveyor.com/',
  neo_tax: 'https://neo.tax/',
  fondo: 'https://www.tryfondo.com/',
  fastlane: 'https://www.fastlane.tools/',
  expo: 'https://expo.dev/',
  // Our own compare-against-your-stack page (vendor_011) — verified live; the chip label
  // discloses the affiliation.
  productarena: 'https://ultrametric.ai/productarena/my-stack',
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

// Product ids of one arena whose vendor announced a shutdown (lib/shutdown.ts founder rule):
// excluded from every OFFER surface below (derived rosters, alternatives, swap options) while
// the canonical vendor chip (vendorChipInfo) keeps resolving — a process that names the vendor
// still shows it, we just never suggest it.
function shutdownIdsFor(arenaId: string, dir?: string): Set<string> {
  return new Set(loadCategory(arenaId, dir).products.filter((p) => isShutdown(p)).map((p) => p.id))
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
  const shutdown = shutdownIdsFor(arenaId, dir)
  return arenaSwapOptions(arenaId, dir)
    .filter((o) => o.id !== productId && !shutdown.has(o.id))
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

// Cap on arena-derived supplier chips per step — the roster's top-N by PA Score. Keeps a
// "via:" row readable even for deep arenas (ai-coding judges 13 products); curated extras
// appended by stepVendorOptions can push a step slightly past this, which is fine.
export const STEP_OPTIONS_CAP = 8

// Every product of one arena as a VendorChipInfo, in LEADERBOARD ORDER (the arena's PA-Score
// rank — rankings.json is already sorted). Chip rank/agentReady keep vendorChipInfo semantics
// (position on the agent-readiness ladder) so derived and curated chips read identically.
function arenaOptionChips(arenaId: string, dir?: string): VendorChipInfo[] {
  const data = loadCategory(arenaId, dir)
  const ladder = arenaSwapOptions(arenaId, dir)
  const rankOf = new Map(ladder.map((o, i) => [o.id, i + 1]))
  // A derived roster is an OFFER — shutdown products drop out and the rest keep their ladder
  // ranks (positions are identity, not a re-count).
  const shutdown = shutdownIdsFor(arenaId, dir)
  return data.rankings.leaderboard.filter((e) => !shutdown.has(e.productId)).map((e) => ({
    vendor: e.productId,
    label: data.products.find((p) => p.id === e.productId)?.name ?? e.productId,
    productId: e.productId,
    arenaId,
    arenaName: data.category.name,
    agentReady: e.agentReady ?? null,
    rank: rankOf.get(e.productId) ?? null,
    // Product ids are the kebab-case of the snake_case vendor keys VENDOR_SIGNUP_URL uses.
    signupUrl: VENDOR_SIGNUP_URL[e.productId.replace(/-/g, '_')] ?? VENDOR_SIGNUP_URL[e.productId] ?? null,
  }))
}

// The full supplier list for one step, resolved against the live market — every key supplier a
// founder could genuinely pick for the step's general function. Cross-arena vendors
// (extraOptionArenas / extraOptionRefs) are deliberately NOT appended here: they only surface
// through lib/processRankings.ts crossArenaStepRankings, which gates each one on the committed
// step→story mapping and a judged full/partial verdict. When the step declares
// optionsArenaId, the list is DERIVED from that arena's current leaderboard (top
// STEP_OPTIONS_CAP by PA Score, in arena-rank order) so roster changes flow through on the
// next build; hand-curated vendorOptions not already in the derived roster are appended after
// it — tracked-elsewhere vendors keep their own arena chip, untracked ones render as honest
// unlinked "not yet judged" chips. Steps without an optionsArenaId keep their curated options.
export function stepVendorOptions(
  node: Pick<DagNode, 'vendorOptions' | 'optionsArenaId'>,
  dir?: string,
): VendorChipInfo[] {
  // A supplier roster is an OFFER (lib/shutdown.ts founder rule): tracked curated vendors whose
  // product announced a shutdown are dropped alongside the derived-roster filter in
  // arenaOptionChips. Untracked chips (no judged product) can't be checked and stay.
  const curated = (node.vendorOptions ?? [])
    .map((v) => vendorChipInfo(v, dir))
    .filter((c) => !c.productId || !c.arenaId || !shutdownIdsFor(c.arenaId, dir).has(c.productId))
  const arenaId = node.optionsArenaId
  if (!arenaId || !isPopulated(arenaId, dir)) return curated
  const derived = arenaOptionChips(arenaId, dir).slice(0, STEP_OPTIONS_CAP)
  const derivedIds = new Set(derived.map((c) => c.productId))
  return [...derived, ...curated.filter((c) => !c.productId || !derivedIds.has(c.productId))]
}

// The swappable market roles of one or more tasks: every mapped vendor (from DAG nodes first —
// the canonical call targets — then the task's own vendors list) collapsed per arena. The
// default pick is the DAG's canonical vendor; alternatives are the arena's live leaderboard.
// An unmapped vendor (irs, clerky, docusign…) is not a role — there's no arena to swap within.
export function vendorRoles(tasks: ProcessTask[], dir?: string): VendorRole[] {
  const byArena = new Map<string, { canonical: string | null; stepCount: number }>()
  const claimArena = (arenaId: string, canonical: string | null, steps: number) => {
    if (!isPopulated(arenaId, dir)) return
    const existing = byArena.get(arenaId)
    if (existing) existing.stepCount += steps
    else byArena.set(arenaId, { canonical, stepCount: steps })
  }
  const claim = (vendor: string, steps: number) => {
    const arenaId = VENDOR_ARENA[vendor]
    if (arenaId) claimArena(arenaId, vendor, steps)
  }
  for (const task of tasks) {
    for (const n of task.dag.nodes) {
      if (n.vendor) claim(n.vendor, 1)
      for (const v of n.vendorOptions ?? []) claim(v, 1)
      // Derived-market steps make their covering arena a role even when no curated vendor maps
      // there (corporate cards → expense-management). No canonical vendor: the role defaults to
      // the arena's agent-readiness leader below.
      if (n.optionsArenaId) claimArena(n.optionsArenaId, null, 1)
    }
  }
  for (const task of tasks) {
    for (const v of task.vendors) claim(v, 0)
  }

  const roles: VendorRole[] = []
  for (const [arenaId, { canonical, stepCount }] of byArena) {
    const data = loadCategory(arenaId, dir)
    // Swap options are OFFERS — shutdown products drop out; a canonical vendor that announced
    // a shutdown falls through to the arena's agent-readiness leader as the default pick.
    const shutdown = shutdownIdsFor(arenaId, dir)
    const alternatives = arenaSwapOptions(arenaId, dir).filter((o) => !shutdown.has(o.id))
    const canonicalId = canonical ? vendorProductId(canonical) : null
    const def = (canonicalId && alternatives.find((o) => o.id === canonicalId)) || alternatives[0]
    if (!def) continue
    roles.push({
      arenaId,
      arenaName: data.category.name,
      // Arena-only claims (optionsArenaId with no mapped curated vendor) treat the default —
      // the agent-readiness leader — as canonical.
      canonicalVendor: canonicalId ?? def.id,
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
      // A "Choose/Select/Pick …" step over a derived market IS the vendor decision the simulator
      // asks for up front — carrying the arena lets the transcript mark it decided instead of
      // declaring a human gap for a choice the user already made (the Mercury bank case).
      choiceArenaId: n.optionsArenaId && DECISION_STEP_RE.test(n.label) ? n.optionsArenaId : null,
      calls: (n.functionCalls ?? []).map((fc) => fc.method),
      toolCall: n.toolCall ?? null,
      approvalRequired: n.approvalRequired ?? false,
      legalSignature: n.legalSignature ?? false,
      riskLevel: n.riskLevel ?? null,
      estimatedMinutes: n.estimatedMinutes,
      async: n.async ?? false,
      // Pre-resolved server-side so the client simulator never touches the rule engine or disk.
      gap: resolveGapStep(n, dir),
    })),
  )
}
