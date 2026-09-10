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

// Hand-written tooltips for the high-level (global/cross-arena) themes; everything else gets an
// honest generic line. Tooltips are REQUIRED wherever a theme icon renders — founder rule.
const THEME_DESCRIPTIONS: Record<string, string> = {
  'privacy-posture': 'data-handling and privacy stories',
  agenticness: 'how well agents can access and operate the product',
  'agent-access': 'MCP, CLI, and API access for agents',
  'agentic-features': 'AI/agent features built into the product',
  'api-quality': 'depth and reliability of the public API',
  openness: 'open source, data portability, and self-hosting stories',
  'automation-depth': 'how much of the product can run unattended',
  onboarding: 'getting started and time-to-first-value stories',
  ecosystem: 'integrations, plugins, and third-party ecosystem stories',
  security: 'security posture and hardening stories',
}

export function themeTooltip(theme: string): string {
  const detail = THEME_DESCRIPTIONS[theme] ?? 'user stories judged under this theme'
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
