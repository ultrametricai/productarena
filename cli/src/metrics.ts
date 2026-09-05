// Metric-name normalization shared by `top` and `pick`. The data files call the Arena Score
// `aiEra` (its old name) — user-facing names accept both spellings plus kebab-case variants.
import type { LeaderboardEntry } from './types.js'

export const METRICS = ['agentReady', 'arenaScore', 'agenticApp', 'apiQuality', 'score'] as const
export type Metric = (typeof METRICS)[number]

const METRIC_ALIASES: Record<string, Metric> = {
  agentready: 'agentReady',
  'agent-ready': 'agentReady',
  arenascore: 'arenaScore',
  'arena-score': 'arenaScore',
  aiera: 'arenaScore',
  'ai-era': 'arenaScore',
  agenticapp: 'agenticApp',
  'agentic-app': 'agenticApp',
  agentic: 'agenticApp',
  apiquality: 'apiQuality',
  'api-quality': 'apiQuality',
  api: 'apiQuality',
  score: 'score',
  coverage: 'score',
}

export function normalizeMetric(raw: string): Metric | null {
  return METRIC_ALIASES[raw.trim().toLowerCase()] ?? null
}

// Human label for tables/why-lines: agentReady -> "agent-ready", arenaScore -> "Arena Score".
export const METRIC_LABELS: Record<Metric, string> = {
  agentReady: 'agent-ready',
  arenaScore: 'Arena Score',
  agenticApp: 'agentic app',
  apiQuality: 'API quality',
  score: 'coverage score',
}

// The leaderboard field a metric reads from ("arenaScore" is stored as `aiEra`).
export function metricValue(entry: LeaderboardEntry, metric: Metric): number | null {
  return metric === 'arenaScore' ? entry.aiEra : entry[metric]
}
