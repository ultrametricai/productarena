// The site's one emoji icon system for concepts (arena icons live in data/arena-icons.json and
// are consumed as-is — see app/layout.tsx / components/ArenaMenu.tsx). Client-safe and pure (no
// node builtins, no React): imported from both server pages and client components
// (CompareBuilder, StoryVerdictsTable via components/ThemeIcon.tsx).
//
// Consistency rule: same concept = same icon everywhere. Themes resolve through ONE ordered
// keyword-rule list (privacy is 🔒 in every arena's taxonomy), and metrics through ONE map —
// never a per-page emoji. Every functional icon must ship with a tooltip naming the concept:
// use themeTooltip()/metricTooltip() (or components/IconChip.tsx, which enforces a title).

// ---------- Theme names ----------

// 'privacy-posture' → 'Privacy posture' — the ONLY user-facing spelling of a kebab-case
// theme/group id (dashes never reach the UI). First word capitalized, the rest left as-is.
export function humanizeTheme(theme: string): string {
  const words = theme.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// ---------- Theme icons ----------

// Fallback for a theme no rule matches. Exported so the unit test can assert every LIVE theme
// resolves to a real icon — a new theme id that falls through to this is a test failure, which
// is the point: extend THEME_RULES when the taxonomy grows.
export const THEME_FALLBACK_ICON = '🏷️'

// Ordered keyword rules over the kebab-case theme id — first match wins, so more specific
// concepts (privacy, security, payments) sit above broad catch-alls (data, workflow, platform).
// Bucketing by keyword keeps ~400 live theme ids covered by ~60 rules and gives new themes a
// sensible icon for free whenever they reuse existing vocabulary.
const THEME_RULES: Array<[RegExp, string]> = [
  // Trust & safety
  [/privacy|consent|cookieless|tracking/, '🔒'],
  [/security|guardrails|safety|anti-bot|stealth|isolation|secret|sast|scanning|supply-chain|dependency|vulnerab/, '🛡️'],
  [/auth|sso|mfa|passwordless|credential|rbac|permission|tenan|key-management|session-management/, '🔑'],
  [/compliance|governance|audit|policy|licensing|trust|legal|pci/, '⚖️'],
  [/contract|esignature|document-automation|incorporation|registered-agent/, '📜'],
  // Agents & AI
  [/agent|autonom|human-in-the-loop|human-oversight|orchestration|nl-task|copilot/, '🤖'],
  [/memory|recall|graph-entity|context/, '🧠'],
  [/prompt|ai-|-ai$|llm|model|fine-tune|quantization|multimodal|embedding|vector|rag|openai-compat/, '✨'],
  [/evals|guardrail/, '🧪'],
  [/mcp|tools-function|structured-tool|tool-curation|action-primitives|skill/, '🛠️'],
  // Money
  [/payment|checkout|payout|cards|spend|disputes|refund|accept/, '💳'],
  [/banking|treasury|yield|equity|fundraising/, '🏦'],
  [/payroll|benefits|contractor|hiring|onboarding-hiring/, '💰'],
  [/invoic|billing|bills|ledger|accounting|reconciliation|statements|coa|close-collaboration/, '🧾'],
  [/pricing|cost|economics/, '💲'],
  [/tax|currency/, '🌐'],
  // Commerce & CRM
  [/catalog|inventory|storefront|commerce|b2b|wholesale|shipping|receipts/, '🛒'],
  [/crm|contacts|pipeline-management|audiences|identity-resolution|cdp/, '📇'],
  // Comms & scheduling
  [/email|composing|inbox|triage/, '✉️'],
  [/chat|channel|thread|calls|huddles|bots|telephony|voice|tts|latency-turntaking/, '💬'],
  [/calendar|scheduling|booking|time-pto|capacity|availability|on-call/, '📅'],
  [/meeting|transcription|recording|notes-summaries/, '🎙️'],
  [/capture|video|media|images/, '🎥'],
  // Search & knowledge
  [/search|discovery|retrieval|relevance|indexing|freshness|coverage|extraction|citations|research|literature|answers|files-analysis/, '🔎'],
  [/docs|documentation|api-reference|knowledge|learning|reference/, '📚'],
  [/notes|writing|authoring|editing|templates|versioning|localization|linking/, '📝'],
  // Data
  [/analytics|insights|dashboards|reporting|funnels|retention|experiment|flags|metrics|semantic-layer|report-output/, '📊'],
  [/data|warehouse|sql|etl|dbt|ingestion|event|schema|migration|database|storage|sync|replication|import|export|backup|snapshot|state|durability|lifecycle/, '🗄️'],
  [/streaming|realtime|batch|async|queue/, '🔁'],
  // Build & ship
  [/code|git|repo|ci-|-ci$|ide|terminal|shell|typescript|monorepo|branching|scripting|dev-experience|developer|dx|debugging|replay|local-dev|dev-handoff/, '💻'],
  [/deploy|hosting|publish|serverless|edge|infra|cluster|provisioning|plan-apply|providers|self-host|ota|rollout|release/, '🚀'],
  [/install|setup|toolchain|bring-up|reproducibility/, '📥'],
  [/performance|latency|speed|caching|scale|parallelism|hardware|gpu|dedicated-capacity/, '⚡'],
  [/reliability|errors|recovery|status|incident|alerting|slos|postmortem|escalation|offline|noise/, '🚨'],
  [/observability|tracing|telemetry|monitoring|otel|instrumentation|logs|slo/, '📡'],
  [/testing|quality|validation|mocking|review|simulation|accuracy/, '🧪'],
  [/workflow|automation|runbooks|triggers|orchestr|daily|processes|planning|tracking|roadmap|prioritization|tasks|projects/, '⚙️'],
  // Platform & ecosystem
  [/api|sdk|webhook|connector|integration|ecosystem|plugin|extensib|marketplace|apps|embed|platform|headless|unified|registry|gateway|routing|protocols|clients|destinations|hosted-servers|serving|endpoints|functions|edge-compute/, '🔌'],
  [/open|oss|portability|ownership|local-first|standards/, '🔓'],
  [/collab|team|sharing|multiplayer|workspace|multi-tenancy|orgs|multi-entity|community/, '👥'],
  // Product surface
  [/design|theming|visual|vector-editing|components|prototyping|ui|ux|ergonomics|customization|config|window|panes|keyboard|filters|controls|output-formats/, '🎨'],
  [/mobile|devices|cross-platform|desktop|fleet|teleoperation/, '📱'],
  [/onboarding|migration|adoption|learning-curve|intake|feedback|support/, '🧭'],
  [/network|connectivity|access|remote|ssh|vpn|pooling/, '🌐'],
  [/js-rendering|ssr|fullstack|reactivity|framework|spec-design|intent-to-spec|codebase|generation|execution|implementation|building/, '💻'],
  [/operations|admin|management|control|governance/, '⚙️'],
]

// Exact overrides checked BEFORE the keyword rules — the few ids where a keyword would land on
// the wrong bucket ('api-quality' contains "quality" but is the apiQuality metric's theme twin,
// so it must share that metric's plug, not the testing flask).
const THEME_EXACT: Record<string, string> = {
  'api-quality': '🔌',
}

// Emoji for a story theme id — every live theme in data/*/stories.json must resolve to a
// non-fallback icon (enforced by lib/__tests__/icons.test.ts).
export function themeIcon(theme: string): string {
  const exact = THEME_EXACT[theme]
  if (exact) return exact
  for (const [test, icon] of THEME_RULES) {
    if (test.test(theme)) return icon
  }
  return THEME_FALLBACK_ICON
}

// Hand-written one-liners for the themes buyers actually meet: every global/cross-arena theme
// plus the most common category themes across arenas (everything appearing in ≥7 stories in
// data/*/stories.json — enforced for the top 40 by lib/__tests__/icons.test.ts). Arena-specific
// niche ids get an honest generic instead. Tooltips are REQUIRED wherever a theme icon renders —
// founder rule — and the same text renders VISIBLY as a subtitle under theme group headers.
// Style: lowercase fragment (it follows "Name — " in tooltips; themeExplanation() capitalizes).
const THEME_DESCRIPTIONS: Record<string, string> = {
  // Global themes — scored on every product, comparable across all arenas.
  agenticness: 'how well agents can access and operate the product',
  'agent-access': 'MCP, CLI, and API access for agents',
  'agentic-features': 'AI/agent features built into the product',
  'api-quality': 'depth and reliability of the public API — machine specs, docs, versioning discipline',
  'privacy-posture': 'data-handling and privacy stories',
  openness: 'open source, data portability, and self-hosting stories',
  'automation-depth': 'how much of the product can run unattended',
  // Common category themes, ordered roughly by how many stories carry them.
  'pricing-limits': 'free-tier ceilings, usage caps, and rate limits before you have to pay',
  'dev-experience': 'day-to-day developer experience — setup friction, docs, debugging, iteration speed',
  security: 'security posture and hardening stories',
  'performance-hardware': 'raw speed and hardware efficiency — throughput, latency, resource use',
  'pricing-plans': 'plan structure and value — what each tier costs and what it unlocks',
  'automation-workflows': 'building automations — triggers, actions, branching, scheduling',
  'accounts-payments': 'opening accounts and moving money — setup, transfers, payment rails',
  ecosystem: 'integrations, plugins, and third-party ecosystem stories',
  'scale-reliability': 'behavior under load — scaling limits, uptime, failure handling',
  'edge-compute': 'running code at the edge — regions, cold starts, runtime limits',
  'git-code': 'core git and code operations — cloning, branching, pushing, code browsing',
  'ecosystem-tooling': 'surrounding tooling — plugins, templates, community packages',
  'deploy-workflow': 'the commit-to-production path — builds, previews, rollbacks',
  'planning-tracking': 'planning and tracking work — issues, sprints, boards, status',
  onboarding: 'getting started and time-to-first-value stories',
  'components-reactivity': 'the component model — state, reactivity, rendering, composition',
  'cards-spend': 'issuing cards and controlling spend — limits, approvals, expense capture',
  'ux-tooling': 'the working surface itself — layout, ergonomics, quality-of-life tooling',
  'serving-api': 'serving models over an API — endpoints, compatibility, reliability',
  integrations: 'connecting to other tools — breadth and depth of built-in integrations',
  'extraction-quality': 'how faithfully content is extracted — structure, fidelity, edge cases',
  'terminal-ssh': 'terminal and SSH workflows — shells, sessions, remote access',
  'repos-collaboration': 'working on repos together — pull requests, reviews, permissions',
  'networking-security': 'network controls and isolation — private access, firewalls, encryption',
  'storage-data': 'storing and moving data — persistence, formats, durability',
  'review-quality-gates': 'quality gates on changes — review flow, required checks, merge protection',
  performance: 'speed in practice — latency, throughput, responsiveness',
  observability: 'seeing what the system is doing — logs, metrics, traces, alerts',
  customization: 'bending the product to your needs — settings, theming, extension points',
  collaboration: 'working as a team — sharing, comments, roles, simultaneous editing',
  'capture-intake': 'getting things in fast — capture, import, inbox flows',
  'tracing-instrumentation': 'instrumenting code and tracing requests end to end',
  'review-safety': 'keeping generated changes safe — diffs, approvals, guardrails',
  'model-support': 'which models run and how well — coverage, formats, update cadence',
  'js-rendering': 'handling JavaScript-heavy pages — rendering, waiting, dynamic content',
  'install-setup': 'getting it installed and running — prerequisites, packaging, first run',
  'evals-datasets': 'measuring quality — datasets, eval runs, regression tracking',
  'ci-cd': 'continuous integration and delivery — pipelines, runners, caching',
  'autonomous-implementation': 'end-to-end implementation by the agent — multi-file changes, task completion',
  'scale-parallelism': 'running many jobs at once — concurrency, fleets, queueing',
  'running-agents': 'operating agents in production — sessions, persistence, recovery',
  'provisioning-lifecycle': 'creating, updating, and tearing down resources across their lifecycle',
  'plan-apply': 'the plan/apply loop — previewing infrastructure changes and applying them safely',
  'ide-terminal-integration': 'meeting you in the IDE and terminal — extensions, inline flows, context',
  'human-oversight': 'keeping a human in the loop — approvals, checkpoints, interrupts',
  'ecosystem-integrations': 'the surrounding ecosystem — integrations, marketplaces, community packages',
  'database-realtime': 'database and realtime features — queries, subscriptions, live sync',
  'code-generation': 'quality of generated code — correctness, style, fit to the codebase',
  'anti-bot': 'getting past bot defenses — CAPTCHAs, fingerprinting, blocks',
  'agent-building': 'building agents — abstractions, tool wiring, control flow',
}

// Honest fallback for an arena-specific niche theme no bespoke line covers.
function genericThemeDetail(theme: string): string {
  return `stories about ${humanizeTheme(theme).toLowerCase()} in this arena`
}

// True when a theme has a bespoke hand-written explanation (vs the generic fallback) — the
// coverage test asserts this for the top-40 most-used themes across data/*/stories.json.
export function hasBespokeThemeExplanation(theme: string): boolean {
  return theme in THEME_DESCRIPTIONS
}

// One-line explanation of a theme WITHOUT the theme name — for visible subtitles under group
// titles that already print the name (product-page "By theme" cards, checklist/report group
// headers, battle sections). Sentence-cased for standalone display.
export function themeExplanation(theme: string): string {
  const detail = THEME_DESCRIPTIONS[theme] ?? genericThemeDetail(theme)
  return detail.charAt(0).toUpperCase() + detail.slice(1)
}

// Name + explanation, for hover tooltips in compact spots (matrix headers, icon chips) where a
// visible subtitle wouldn't fit.
export function themeTooltip(theme: string): string {
  const detail = THEME_DESCRIPTIONS[theme] ?? genericThemeDetail(theme)
  return `${humanizeTheme(theme)} — ${detail}`
}

// ---------- Metric icons ----------

// The comparison/leaderboard metrics. One entry per CONCEPT; aliases below map the various
// field spellings (aiEra/paScore, agenticApp/aiNative, …) onto them.
const METRICS: Record<string, { icon: string; tooltip: string }> = {
  paScore: { icon: '🏆', tooltip: 'PA Score — overall evidence-graded score for the AI era (0–100)' },
  agentReady: { icon: '🤖', tooltip: 'Agent-ready — how well AI agents can access and operate the product' },
  aiNative: { icon: '✨', tooltip: 'AI-native — how agentic the product experience itself is' },
  apiQuality: { icon: '🔌', tooltip: 'API quality — depth and reliability of the public API' },
  openness: { icon: '🔓', tooltip: 'Openness — open source, data portability, and self-hosting' },
  automation: { icon: '⚙️', tooltip: 'Automation — how much of the product can run unattended' },
  privacy: { icon: '🔒', tooltip: 'Privacy — data-handling and privacy posture' },
  popularity: { icon: '⭐', tooltip: 'Popularity — GitHub stars and adoption signals' },
  confidence: { icon: '🎯', tooltip: 'Confidence — how solid the evidence behind the score is' },
  access: { icon: '🛠️', tooltip: 'Agent access — MCP, CLI, and API availability' },
  coverage: { icon: '📊', tooltip: 'Coverage — share of judged stories with real evidence' },
}

const METRIC_ALIASES: Record<string, keyof typeof METRICS> = {
  aiEra: 'paScore',
  score: 'coverage',
  arenaScore: 'paScore',
  'agent-ready': 'agentReady',
  agenticApp: 'aiNative',
  'ai-native': 'aiNative',
  'api-quality': 'apiQuality',
  openSource: 'openness',
  stars: 'popularity',
}

function metricEntry(metric: string): { icon: string; tooltip: string } | null {
  return METRICS[metric] ?? METRICS[METRIC_ALIASES[metric] ?? ''] ?? null
}

// Emoji for a comparison metric key ('' for an unknown key — callers render nothing rather
// than a wrong icon).
export function metricIcon(metric: string): string {
  return metricEntry(metric)?.icon ?? ''
}

// The REQUIRED tooltip for a metric icon — naming the concept, per the site-wide rule.
export function metricTooltip(metric: string): string {
  return metricEntry(metric)?.tooltip ?? ''
}
