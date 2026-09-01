// Minimal, hand-maintained mirror of the shapes in ../../lib/schemas.ts. Deliberately not
// imported from the Next app (this package is meant to be standalone/publishable and fetches
// JSON over HTTP rather than reading the repo's data/ directly) — keep in sync by hand if
// lib/schemas.ts changes shape.

export interface Category {
  id: string
  name: string
  description: string
  personas: string[]
  themes?: string[]
}

export interface Product {
  id: string
  name: string
  vendor: string
  type: 'oss' | 'commercial'
  urls: { site: string; docs?: string; changelog?: string; github?: string; extra?: string[] }
  logo?: string
  links?: { app?: string; api?: string; cli?: string; mcp?: string }
  businessModel?: { models: string[]; summary: string; url: string }
}

export interface StoryOrigin {
  kind: 'normalized' | 'canonical' | 'contest' | 'manual'
  promptVersion?: string
  recordedAt?: string
}

export interface Story {
  id: string
  persona: string
  title: string
  theme: string
  group: string
  weight: number
  origin?: StoryOrigin
}

export interface Evidence {
  id: string
  tier: 'claimed-docs' | 'github' | 'community' | 'probe'
  url: string
  excerpt: string
  fetchedAt: string
}

export interface Verdict {
  productId: string
  storyId: string
  verdict: 'full' | 'partial' | 'none' | 'disputed' | 'na'
  quality: number
  confidence: 'high' | 'medium' | 'low'
  rationale: string
  evidenceIds: string[]
}

export interface LeaderboardEntry {
  productId: string
  score: number
  agentReady: number | null
  agenticApp: number | null
  apiQuality: number | null
  aiEra: number | null
  applicable: number
  total: number
  themeScores: Record<string, number | null>
}

export interface Battle {
  a: string
  b: string
  winner: string
  record: { aWins: number; bWins: number; draws: number }
  rounds: Array<{ storyId: string; winner: 'a' | 'b' | 'draw' | 'na'; margin: number }>
}

export interface Rankings {
  generatedAt: string
  leaderboard: LeaderboardEntry[]
  battles: Battle[]
}
