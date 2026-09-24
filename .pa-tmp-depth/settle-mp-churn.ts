// One-off settle: apply the spike-engine churn policy for marketplace-payments
// mangopay + rainforest, whose passes died between judge and the engine's own
// churn-settle step (transient DNS outage killed the runStage chain; a later
// tilled pass reassembled coherent verdicts without churn filtering for these
// two). OLD baseline = HEAD (last commit before this arena's wave).
// Mirrors spike-engine.ts steps 3-4 exactly, including the judge-cache patch.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { churnDecision } from '../pipeline/scripts/spike-engine'

const ROOT = path.resolve(__dirname, '..')
const ARENA = 'marketplace-payments'
const PRODUCTS = ['mangopay', 'rainforest']

type Verdict = {
  productId: string
  storyId: string
  verdict: 'full' | 'partial' | 'none' | 'disputed' | 'na'
  quality: number
  evidenceIds: string[]
}

const verdictsFile = path.join(ROOT, 'data', ARENA, 'verdicts.json')
const newVerdicts: Verdict[] = JSON.parse(fs.readFileSync(verdictsFile, 'utf8'))

for (const productId of PRODUCTS) {
  const oldVerdicts: Verdict[] = JSON.parse(
    execSync(`git show HEAD:data/${ARENA}/verdicts.json`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'),
  )
  const oldEvidence = JSON.parse(
    execSync(`git show HEAD:data/${ARENA}/evidence/${productId}.json`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'),
  ) as Array<{ id: string }>
  const oldEvidenceIds = new Set<string>(oldEvidence.map((e) => e.id))
  const currentEvidence = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', ARENA, 'evidence', `${productId}.json`), 'utf8'),
  ) as Array<{ id: string }>
  const currentEvidenceIds = new Set<string>(currentEvidence.map((e) => e.id))
  const oldByStory = new Map(oldVerdicts.filter((v) => v.productId === productId).map((v) => [v.storyId, v]))

  let kept = 0
  let reverted = 0
  let moved = 0
  for (let i = 0; i < newVerdicts.length; i++) {
    const v = newVerdicts[i]
    if (v.productId !== productId) continue
    const old = oldByStory.get(v.storyId)
    const decision = churnDecision(old as never, v as never, oldEvidenceIds, currentEvidenceIds)
    if (decision === 'unchanged') continue
    moved++
    if (decision === 'keep') {
      kept++
      continue
    }
    reverted++
    console.log(
      `REVERT ${ARENA}/${productId}:${v.storyId} ${v.verdict}/q${v.quality} -> ${old!.verdict}/q${old!.quality} (no new citation)`,
    )
    const cacheFile = path.join(ROOT, 'pipeline', 'cache', 'judge', ARENA, productId, `${v.storyId}.json`)
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as { hash: string }
      fs.writeFileSync(cacheFile, JSON.stringify({ hash: cached.hash, verdict: old }, null, 2) + '\n')
    }
    newVerdicts[i] = old as Verdict
  }
  console.log(`${productId}: ${moved} cells moved (${kept} kept, ${reverted} reverted)`)
}

fs.writeFileSync(verdictsFile, JSON.stringify(newVerdicts, null, 2) + '\n')
console.log('settled verdicts written')
