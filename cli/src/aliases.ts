// Role -> arena alias map for `productarena pick <role>`. Every live arena id (from
// data/categories.json) is always accepted verbatim; this map adds the short names a human
// actually types ("banking", "git", "pm", "vector-db", ...). Aliases only ever point at ids
// that exist in categories.json — resolveRole() double-checks against the live list so a
// stale alias degrades into a suggestion instead of a broken fetch.

export const ROLE_ALIASES: Record<string, string> = {
  // money
  banking: 'startup-banking',
  bank: 'startup-banking',
  neobank: 'startup-banking',
  payments: 'payments',
  pay: 'payments',
  checkout: 'payments',
  pos: 'mobile-payments',
  'in-person-payments': 'mobile-payments',
  payroll: 'payroll',
  hr: 'payroll',
  accounting: 'accounting',
  bookkeeping: 'accounting',
  legal: 'legal-ops',
  incorporation: 'legal-ops',
  // build & ship
  pm: 'project-management',
  'project-management': 'project-management',
  projects: 'project-management',
  git: 'code-hosting',
  'code-hosting': 'code-hosting',
  hosting: 'code-hosting',
  'coding-agent': 'ai-coding',
  coding: 'ai-coding',
  'ai-coding': 'ai-coding',
  vibe: 'vibe-coding',
  'app-builder': 'vibe-coding',
  factory: 'software-factory',
  edge: 'edge-platforms',
  deploy: 'edge-platforms',
  frontend: 'frontend-frameworks',
  framework: 'frontend-frameworks',
  mobile: 'mobile-dev',
  iac: 'infra-as-code',
  terraform: 'infra-as-code',
  packages: 'package-managers',
  'package-manager': 'package-managers',
  toolchain: 'package-managers',
  terminal: 'terminals',
  os: 'desktop-os',
  desktop: 'desktop-os',
  security: 'security-scanners',
  scanner: 'security-scanners',
  // backend & data
  baas: 'backend-as-a-service',
  backend: 'backend-as-a-service',
  api: 'api-platforms',
  auth: 'auth-platforms',
  identity: 'auth-platforms',
  sso: 'auth-platforms',
  'vector-db': 'vector-databases',
  vector: 'vector-databases',
  vectors: 'vector-databases',
  memory: 'vector-databases',
  scraping: 'web-scraping',
  scraper: 'web-scraping',
  crawl: 'web-scraping',
  // AI plumbing
  gateway: 'model-gateways',
  router: 'model-gateways',
  'llm-gateway': 'model-gateways',
  inference: 'inference-providers',
  'local-llm': 'local-llm-runtimes',
  'llm-runtime': 'local-llm-runtimes',
  evals: 'llm-evals-observability',
  observability: 'llm-evals-observability',
  search: 'ai-search-apis',
  'ai-search': 'ai-search-apis',
  agents: 'agent-frameworks',
  'agent-framework': 'agent-frameworks',
  sandbox: 'agent-sandboxes',
  sandboxes: 'agent-sandboxes',
  'code-execution': 'agent-sandboxes',
  assistant: 'ai-assistants',
  assistants: 'ai-assistants',
  research: 'ai-research-agents',
  'deep-research': 'ai-research-agents',
  robotics: 'robotics-platforms',
  // go-to-market
  chat: 'team-chat',
  messaging: 'team-chat',
  analytics: 'product-analytics',
  crm: 'crm',
  sales: 'crm',
  feedback: 'product-feedback',
  surveys: 'product-feedback',
}

function normalize(role: string): string {
  return role.trim().toLowerCase().replace(/[\s_]+/g, '-')
}

export interface RoleResolution {
  arena: string | null
  suggestions: string[]
}

// Resolution order: live arena id, alias, then unique substring match against ids and aliases.
// On a miss, `suggestions` carries the closest roles for the error message.
export function resolveRole(role: string, arenaIds: string[]): RoleResolution {
  const q = normalize(role)
  if (!q) return { arena: null, suggestions: [] }
  const live = new Set(arenaIds)

  if (live.has(q)) return { arena: q, suggestions: [] }
  const aliased = ROLE_ALIASES[q]
  if (aliased && live.has(aliased)) return { arena: aliased, suggestions: [] }

  // Substring fallback: "vector" -> vector-databases, "bank" -> startup-banking. Only commit
  // when it's unambiguous (exactly one distinct arena).
  const hits = new Set<string>()
  for (const id of arenaIds) if (id.includes(q)) hits.add(id)
  for (const [alias, target] of Object.entries(ROLE_ALIASES)) {
    if (alias.includes(q) && live.has(target)) hits.add(target)
  }
  const distinct = [...hits]
  if (distinct.length === 1) return { arena: distinct[0], suggestions: [] }
  return { arena: null, suggestions: distinct.sort().slice(0, 6) }
}

// The alias table grouped by target arena — the shape `pick --help`/errors print.
export function aliasesByArena(arenaIds: string[]): Array<[string, string[]]> {
  const byArena = new Map<string, string[]>()
  const live = new Set(arenaIds)
  for (const [alias, arena] of Object.entries(ROLE_ALIASES)) {
    if (!live.has(arena) || alias === arena) continue
    const list = byArena.get(arena) ?? []
    list.push(alias)
    byArena.set(arena, list)
  }
  return [...byArena.entries()].sort(([a], [b]) => a.localeCompare(b))
}
