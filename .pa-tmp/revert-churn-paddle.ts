// One-off churn settlement for the interrupted paddle spike pass (the engine errored before
// its churn step; the judge later completed from cache). Same rule as
// revert-churn-api-quality-wave.ts / spike-engine.churnDecision: keep flips citing evidence
// ids that did not exist at OLD_REF, revert the rest in BOTH verdicts.json and the judge
// cache. Usage: pnpm tsx .pa-tmp/revert-churn-paddle.ts --write
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { churnDecision } from '../pipeline/scripts/spike-engine'
import type { Verdict } from '../lib/schemas'

const ROOT = path.resolve(__dirname, '..')
const OLD_REF = process.env.OLD_REF ?? 'HEAD'
const WRITE = process.argv.includes('--write')
const ARENA = 'payments'
const PID = 'paddle'

const gitShow = (p: string) => JSON.parse(execSync(`git show ${OLD_REF}:${p}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString())
const oldVerdicts = gitShow(`data/${ARENA}/verdicts.json`) as Verdict[]
const oldEvidence = gitShow(`data/${ARENA}/evidence/${PID}.json`) as Array<{ id: string }>
const oldIds = new Set(oldEvidence.map((e) => e.id))
const oldByStory = new Map(oldVerdicts.filter((v) => v.productId === PID).map((v) => [v.storyId, v]))

const currentEvidence = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', ARENA, 'evidence', `${PID}.json`), 'utf8'),
) as Array<{ id: string }>
const currentIds = new Set(currentEvidence.map((e) => e.id))

const verdictsFile = path.join(ROOT, 'data', ARENA, 'verdicts.json')
const current = JSON.parse(fs.readFileSync(verdictsFile, 'utf8')) as Verdict[]
let kept = 0
let reverted = 0
const settled = current.map((v) => {
  if (v.productId !== PID) return v
  const old = oldByStory.get(v.storyId)
  const decision = churnDecision(old, v, oldIds, currentIds)
  if (decision === 'unchanged') return v
  if (decision === 'keep') {
    kept++
    return v
  }
  reverted++
  console.log(`REVERT ${ARENA}/${PID}:${v.storyId} ${v.verdict}/q${v.quality} -> ${old!.verdict}/q${old!.quality} (no new citation)`)
  if (WRITE) {
    const cacheFile = path.join(ROOT, 'pipeline', 'cache', 'judge', ARENA, PID, `${v.storyId}.json`)
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string }
      fs.writeFileSync(cacheFile, JSON.stringify({ hash: cached.hash, verdict: old }, null, 2) + '\n')
    }
  }
  return old!
})
console.log(`paddle churn: ${kept} kept, ${reverted} reverted${WRITE ? ' (written)' : ' (dry run — pass --write)'}`)
if (WRITE) fs.writeFileSync(verdictsFile, JSON.stringify(settled, null, 2) + '\n')
