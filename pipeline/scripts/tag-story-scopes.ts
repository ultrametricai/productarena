// Deterministic story-scope tagger: stamps `scope` (global | category | product — see
// lib/schemas.ts's StorySchema) onto every story in every category's stories.json. No LLM —
// pure keyword/structure rules so every assignment is reproducible and reviewable (the run
// prints one line per story: `<arena> <scope> [<rule>] <id>`). Re-runnable and idempotent.
//
// Rule ladder, first match wins (anything ambiguous falls through to 'category'):
//   1. canonical        → global   the 29 canonical lens ids (pipeline/agentic-stories.ts) are
//                                  cross-arena by definition; they also carry scope at the
//                                  source, this just backfills committed data files.
//   2. claims-probe     → product  claims-derived depth-mine stories (origin kind 'normalized',
//                                  promptVersion 'v2-depth' — distilled from ONE vendor's
//                                  unmapped claims, see pipeline/scripts/depth-mine.ts) where
//                                  exactly one product in the arena holds a positive (full/
//                                  partial) verdict: effectively a probe of that product's
//                                  specific claim, however neutrally the title is phrased.
//   3. strong-global    → global   concepts unambiguously meaningful for ANY software product
//                                  even when domain nouns appear nearby: 2FA/SSO/RBAC/audit
//                                  logs, pricing transparency (overage/seat/free tier), uptime
//                                  SLA/status page, documented rate limits, accessibility,
//                                  CVE track record.
//   4. domain-vocabulary→ category the arena's own nouns (treasury, payroll, proxy, kernel…):
//                                  a story speaking the domain's language is compared within
//                                  the domain, even if it also mentions a webhook or a CLI.
//   5. weak-global      → global   generic capabilities (CLI, webhooks, SDK, API keys/tokens,
//                                  self-host, offline, export/import, mobile app, docs/upgrade
//                                  guides, localization) that only count as global when NOT
//                                  phrased in domain vocabulary.
//   6. default          → category
//
// Cache safety: judge.ts's cellHash hashes only storyId + title + evidence + promptVersion —
// never the whole story object — so stamping `scope` can never bust the judge cache or trigger
// a re-judge (same contract as `origin`, see migrate-story-origin.ts).
import fs from 'node:fs'
import path from 'node:path'
import { stripPersonaPrefix } from '../../lib/data-helpers'
import { type Story, StorySchema, VerdictBaseSchema } from '../../lib/schemas'
import {
  AGENTIC_FEATURE_STORIES,
  AGENTIC_STORIES,
  API_QUALITY_STORIES,
  AUTOMATION_STORIES,
  OPENNESS_STORIES,
  PRIVACY_STORIES,
} from '../agentic-stories'
import { categoryDir, readCategories, writeJson } from '../paths'

export type StoryScope = NonNullable<Story['scope']>

export const CANONICAL_IDS = new Set(
  [
    ...AGENTIC_STORIES,
    ...AGENTIC_FEATURE_STORIES,
    ...API_QUALITY_STORIES,
    ...OPENNESS_STORIES,
    ...AUTOMATION_STORIES,
    ...PRIVACY_STORIES,
  ].map((s) => s.id),
)

// Tier 3: cross-software concepts that stay global even next to domain nouns. Matched against
// lowercased `id title group`.
export const STRONG_GLOBAL_PATTERNS: { rule: string; pattern: RegExp }[] = [
  { rule: 'auth', pattern: /\b(2fa|two[- ]factor|mfa\b|multi[- ]factor|single sign[- ]on|sso\b|saml|passkey|passwordless)/ },
  { rule: 'credentials', pattern: /\b(identity provider|enterprise identity|service account)/ },
  { rule: 'access-control', pattern: /\b(granular (user )?(permission|role)|role[- ]based|roles and permissions|permissions and roles|audit log)/ },
  { rule: 'pricing-transparency', pattern: /\b(pricing|overage|billing|billed|free tier|paid license|plan tier|usage cap|quota|seat[- s]|per[- ]seat|spending (cap|limit)|spend cap)/ },
  { rule: 'reliability', pattern: /\b(status page|uptime|incident (history|postmortem|status)|postmortem)/ },
  { rule: 'support-quality', pattern: /\b(customer support|support response|commercial support)/ },
  { rule: 'rate-limit-disclosure', pattern: /\b(documented rate limit|rate[- ]limit disclosure|rate limits and concurrency|concurrency cap)/ },
  { rule: 'accessibility', pattern: /\b(accessibilit|screen reader)/ },
  { rule: 'security-track-record', pattern: /\b(cve\b|security advisor|vulnerability disclos)/ },
]

// Tier 5: generic capabilities that are global only when the story is NOT phrased in the
// arena's domain vocabulary (a "payroll lifecycle events webhook" story is a payroll story).
export const WEAK_GLOBAL_PATTERNS: { rule: string; pattern: RegExp }[] = [
  { rule: 'cli', pattern: /\b(cli\b|command[- ]line)/ },
  { rule: 'webhooks', pattern: /\bwebhooks?\b/ },
  { rule: 'sdk', pattern: /\bsdks?\b/ },
  { rule: 'credentials', pattern: /\b(api key|access token|ssh key)/ },
  { rule: 'self-host', pattern: /\bself[- ]host/ },
  { rule: 'offline', pattern: /\boffline\b/ },
  { rule: 'export-import', pattern: /\b(export|import)\b|portable format|data portability/ },
  { rule: 'mobile-app', pattern: /\bmobile (app|device)\b/ },
  { rule: 'docs-quality', pattern: /\b(documentation|upgrade guide|migration guide|interactive tutorial|learning resources)\b/ },
  { rule: 'localization', pattern: /\b(localization|localized|translation|my own language)\b/ },
  { rule: 'open-source', pattern: /\bopen[- ]source\b|open license/ },
]

// Tier 4: each arena's own nouns — deliberately tight lists of strong domain words (matched
// against lowercased `id title group`), not exhaustive vocabularies. A word here means "this
// story is speaking the domain's language"; generic words (work, tool, platform, data) never
// belong here or they would swallow the genuinely global stories.
export const DOMAIN_VOCAB: Record<string, string[]> = {
  'agent-frameworks': ['agent', 'tool', 'orchestrat', 'workflow', 'handoff', 'llm', 'model', 'guardrail', 'checkpoint', 'human-in-the-loop', 'human approval', 'memory', 'trace', 'eval', 'structured output', 'streaming', 'multi-agent', 'context window', 'scaffold'],
  'agent-sandboxes': ['sandbox', 'isolat', 'untrusted', 'code execution', 'microvm', 'container', 'snapshot', 'cold start', 'egress', 'runtime', 'vcpu', 'gpu', 'per-second', 'fleet', 'agent', 'browser', 'filesystem', 'teardown', 'provision'],
  'desktop-os': ['desktop', 'kernel', 'driver', 'boot', 'hardware', 'window', 'disk', 'firewall', 'distro', 'wallpaper', 'clipboard', 'phone', 'tablet', 'virtual machine', 'app store', 'app catalog', 'operating system', 'linux', 'tpm', 'gpu'],
  'startup-banking': ['bank', 'payment', 'card', 'invoice', 'treasury', 'yield', 'currenc', 'ach', 'wire', 'deposit', 'accounting', 'ledger', 'vendor', 'spend', 'cash', 'fdic', 'transaction', 'bill', 'procurement', 'financ', 'exchange rate', 'money'],
  'project-management': ['task', 'sprint', 'issue', 'roadmap', 'project', 'initiative', 'backlog', 'kanban', 'whiteboard', 'portfolio', 'time.tracking', 'dependenc', 'agent'],
  'web-scraping': ['scrap', 'crawl', 'proxy', 'captcha', 'selector', 'html', 'extract', 'browser', 'page', 'url', 'robots', 'headless', 'anti-bot', 'residential', 'screenshot'],
  'mobile-dev': ['ssh', 'terminal', 'git', 'repo', 'phone', 'mobile', 'device', 'commit', 'host', 'mosh', 'shell', 'unix', 'agent'],
  'code-hosting': ['repositor', 'repo\\b', 'git\\b', 'commit', 'merge', 'branch', 'pull request', 'pipeline', 'ci/cd', 'code', 'package registr', 'runner', 'issue'],
  'ai-coding': ['code', 'coding', 'agent', 'ide\\b', 'model', 'repo', 'diff', 'terminal', 'session', 'codebase', 'pull request', 'lint'],
  'edge-platforms': ['deploy', 'edge', 'serverless', 'cdn', 'dns', 'domain', 'traffic', 'runtime', 'infra', 'scaling', 'autoscal', 'container', 'function', 'tls', 'ddos', 'waf', 'postgres', 'database', 'preview', 'rollback', 'log'],
  'frontend-frameworks': ['component', 'dom\\b', 'framework', 'render', 'hydration', 'bundle', 'reactiv', 'template', 'routing', 'state management', 'scaffold', 'browser', 'polyfill', 'typescript', 'ssr'],
  'local-llm-runtimes': ['model', 'inference', 'gpu', 'quantiz', 'llm', 'token', 'cpu', 'runtime', 'vram', 'gguf', 'lora', 'decoding', 'serving', 'chat'],
  payroll: ['payroll', 'employee', 'contractor', 'tax', 'w-2', 'w-4', '1099', 'i-9', 'pay\\b', 'hire', 'benefit', 'pto', 'onboard', 'deposit', 'wage'],
  'product-feedback': ['feedback', 'changelog', 'roadmap', 'portal', 'customer', 'release note', 'widget', 'vote', 'request', 'initiative'],
  'software-factory': ['agent', 'code', 'repo', 'pull request', 'task', 'ci\\b', 'build', 'diff', 'model'],
  'api-platforms': ['api\\b', 'collection', 'request', 'spec', 'gateway', 'mock', 'endpoint', 'openapi', 'contract'],
  'team-chat': ['channel', 'message', 'thread', 'topic', 'huddle', 'meeting', 'call\\b', 'workspace', 'chat', 'bot\\b', 'emoji', 'dm\\b', 'notification', 'guest', 'slash command', 'workflow'],
  'backend-as-a-service': ['database', 'schema', 'auth', 'storage', 'function', 'realtime', 'migration', 'row-level', 'vector', 'embedding', 'quer', 'backend', 'emulator', 'bucket', 'sign-in', 'postgres', 'sync', 'backup'],
  'llm-evals-observability': ['trace', 'tracing', 'span', 'eval', 'llm\\b', 'prompt', 'dataset', 'experiment', 'scorer', 'judge', 'annotation', 'token', 'guardrail', 'playground', 'model', 'latency', 'observab'],
  'ai-search-apis': ['search', 'query', 'result', 'index', 'snippet', 'citation', 'crawl', 'extract', 'news', 'domain', 'web\\b', 'page', 'answer', 'rag\\b', 'serp', 'retrieval', 'freshness'],
  terminals: ['terminal', 'shell', 'scrollback', 'pane', 'tab\\b', 'multiplex', 'tmux', 'prompt', 'command', 'ssh', 'rendering', 'gpu', 'font', 'ligature', 'color scheme', 'theme', 'dotfile', 'quake', 'graphics protocol', 'terminfo', 'kitten'],
  'package-managers': ['package', 'dependenc', 'lockfile', 'install', 'registr', 'manifest', 'workspace', 'monorepo', 'toolchain', 'runtime', 'version', 'pin\\b', 'binar', 'cache', 'formula', 'tap\\b', 'overlay', 'mirror', 'vulnerab', 'supply.chain', 'node_modules', 'bootstrap'],
  'vector-databases': ['vector', 'embedding', 'index', 'collection', 'similarity', 'ann\\b', 'hnsw', 'recall', 'rerank', 'hybrid', 'sparse', 'dense', 'metadata', 'namespace', 'tenant', 'shard', 'replica', 'quantiz', 'upsert', 'rag\\b', 'semantic', 'latency', 'serverless'],
  'inference-providers': ['model', 'inference', 'token', 'llm', 'gpu', 'serverless', 'endpoint', 'fine-tun', 'lora', 'batch', 'throughput', 'latenc', 'openai', 'chat completion', 'completions', 'embedding', 'quantiz', 'serving', 'stream', 'tokens/s'],
  'auth-platforms': ['auth', 'login', 'sign-in', 'sign-up', 'session', 'mfa', 'passkey', 'passwordless', 'sso\\b', 'saml', 'oidc', 'oauth', 'token', 'user', 'organization', 'tenant', 'rbac', 'permission', 'identity', 'scim', 'jwt', 'credential', 'idp\\b', 'consent'],
}

export function domainPattern(categoryId: string): RegExp | null {
  const words = DOMAIN_VOCAB[categoryId]
  if (!words || words.length === 0) return null
  return new RegExp(`\\b(${words.join('|')})`, 'i')
}

export interface ScopeContext {
  // Compiled domain vocabulary for the story's arena (null → no domain veto).
  domain: RegExp | null
  // How many products in the arena hold a positive (full/partial) verdict on this story.
  positiveVerdicts: number
}

export function scopeForStory(story: Story, ctx: ScopeContext): { scope: StoryScope; rule: string } {
  // 1. Canon is global by definition (also tagged at the source in pipeline/agentic-stories.ts).
  if (CANONICAL_IDS.has(story.id) || story.origin?.kind === 'canonical') {
    return { scope: 'global', rule: 'canonical' }
  }

  // 2. Claims-derived depth-mine story that only one product actually holds: an effective
  //    product-specific probe, however neutrally depth-mine.ts phrased it.
  if (
    story.origin?.kind === 'normalized' &&
    story.origin.promptVersion === 'v2-depth' &&
    ctx.positiveVerdicts === 1
  ) {
    return { scope: 'product', rule: 'claims-probe' }
  }

  // Persona clause stripped so a persona like "open-source-maintainer" never triggers a
  // capability pattern — only the capability text, the id, and the group are matched.
  const text = `${story.id} ${stripPersonaPrefix(story.title)} ${story.group}`.toLowerCase()

  // 3. Strong global concepts survive domain phrasing (2FA is 2FA even in a banking arena).
  for (const { rule, pattern } of STRONG_GLOBAL_PATTERNS) {
    if (pattern.test(text)) return { scope: 'global', rule: `global:${rule}` }
  }

  // 4. Domain vocabulary → this arena's own comparison, not a cross-software one.
  const domainMatch = ctx.domain?.exec(text)
  if (domainMatch) return { scope: 'category', rule: `domain:${domainMatch[1]}` }

  // 5. Generic capability phrased outside the domain's vocabulary.
  for (const { rule, pattern } of WEAK_GLOBAL_PATTERNS) {
    if (pattern.test(text)) return { scope: 'global', rule: `global:${rule}` }
  }

  // 6. Ambiguous defaults to category — the honest middle.
  return { scope: 'category', rule: 'default' }
}

function main(): void {
  const totals: Record<StoryScope, number> = { global: 0, category: 0, product: 0 }
  for (const cat of readCategories()) {
    const dataDir = categoryDir(cat.id)
    const storiesPath = path.join(dataDir, 'stories.json')
    if (!fs.existsSync(storiesPath)) continue

    const stories = StorySchema.array().parse(JSON.parse(fs.readFileSync(storiesPath, 'utf8')))
    const verdictsPath = path.join(dataDir, 'verdicts.json')
    const verdicts = fs.existsSync(verdictsPath)
      ? VerdictBaseSchema.array().parse(JSON.parse(fs.readFileSync(verdictsPath, 'utf8')))
      : []
    const positiveByStory = new Map<string, number>()
    for (const v of verdicts) {
      if (v.verdict === 'full' || v.verdict === 'partial') {
        positiveByStory.set(v.storyId, (positiveByStory.get(v.storyId) ?? 0) + 1)
      }
    }
    const domain = domainPattern(cat.id)

    const counts: Record<StoryScope, number> = { global: 0, category: 0, product: 0 }
    const tagged = stories.map((s) => {
      const { scope, rule } = scopeForStory(s, { domain, positiveVerdicts: positiveByStory.get(s.id) ?? 0 })
      counts[scope] += 1
      totals[scope] += 1
      console.log(`${cat.id} ${scope.padEnd(8)} [${rule}] ${s.id}`)
      return { ...s, scope }
    })
    writeJson(storiesPath, tagged)
    console.log(
      `tag-story-scopes: ${cat.id} — ${counts.global} global, ${counts.category} category, ${counts.product} product\n`,
    )
  }
  console.log(
    `tag-story-scopes: TOTAL — ${totals.global} global, ${totals.category} category, ${totals.product} product`,
  )
}

if (require.main === module) {
  main()
}
