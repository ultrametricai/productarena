import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { RankingsSchema } from '@/lib/schemas'

describe('derive stage', () => {
  let tmpDir: string | undefined

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true })
    tmpDir = undefined
  })

  it('writes a valid rankings.json with 6 battles from the CLI', () => {
    const repoRoot = path.resolve(__dirname, '../..')
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-derive-'))
    fs.cpSync(path.join(repoRoot, 'data'), tmpDir, { recursive: true })

    execFileSync('pnpm', ['pipeline', 'derive'], {
      cwd: repoRoot,
      env: { ...process.env, PA_DATA_DIR: tmpDir },
    })

    const raw = JSON.parse(fs.readFileSync(path.join(tmpDir, 'rankings.json'), 'utf8'))
    const rankings = RankingsSchema.parse(raw)
    expect(rankings.battles).toHaveLength(6)
    expect(rankings.leaderboard).toHaveLength(4)
    expect(rankings.leaderboard[0].score).toBeGreaterThanOrEqual(rankings.leaderboard[3].score)
  })
})
