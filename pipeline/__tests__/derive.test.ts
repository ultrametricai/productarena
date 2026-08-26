import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { RankingsSchema } from '@/lib/schemas'

describe('derive stage', () => {
  it('writes a valid rankings.json with 6 battles from the CLI', () => {
    execFileSync('pnpm', ['pipeline', 'derive'], { cwd: path.resolve(__dirname, '../..') })
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/rankings.json'), 'utf8'))
    const rankings = RankingsSchema.parse(raw)
    expect(rankings.battles).toHaveLength(6)
    expect(rankings.leaderboard).toHaveLength(4)
    expect(rankings.leaderboard[0].score).toBeGreaterThanOrEqual(rankings.leaderboard[3].score)
  })
})
