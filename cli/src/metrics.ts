// Metric-name normalization shared by `top` and `pick`. The data files call the PA Score
// `aiEra` (its old name) — user-facing names accept both spellings plus kebab-case variants.
import type { LeaderboardEntry } from './types.js'

export const METRICS = ['agentReady', 'paScore', 'agenticApp', 'apiQuality', 'score'] as const
export type Metric = (typeof METRICS)[number]

const METRIC_ALIASES: Record<string, Metric> = {
  agentready: 'agentReady',
  'agent-ready': 'agentReady',
  arenascore: 'paScore',
  'arena-score': 'paScore',
  aiera: 'paScore',
  'ai-era': 'paScore',
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

// Human label for tables/why-lines: agentReady -> "agent-ready", paScore -> "PA Score".
export const METRIC_LABELS: Record<Metric, string> = {
  agentReady: 'agent-ready',
  paScore: 'PA Score',
  agenticApp: 'agentic app',
  apiQuality: 'API quality',
  score: 'coverage score',
}

// The leaderboard field a metric reads from ("paScore" is stored as `aiEra`).
export function metricValue(entry: LeaderboardEntry, metric: Metric): number | null {
  return metric === 'paScore' ? entry.aiEra : entry[metric]
}
