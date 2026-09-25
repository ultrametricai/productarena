// Generic manual churn settle (spike-engine steps 3-4) for products whose passes ran the
// stages outside the engine (e.g. 9950X3D, whose bot-walled crawl surface requires the
// browser-UA prefetch path, making `cli.ts crawl` fail before the engine reaches judge).
// Usage: pnpm tsx .pa-tmp-depth/settle-churn-generic.ts <arena> <productId> [<productId>...]
// OLD baseline = HEAD versions of verdicts.json + evidence/<pid>.json.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { churnDecision } from '../pipeline/scripts/spike-engine'

const ROOT = path.resolve(__dirname, '..')
const [arena, ...products] = process.argv.slice(2)
if (!arena || products.length === 0) throw new Error('usage: settle-churn-generic.ts <arena> <pid>...')

type Verdict = {
  productId: string
  storyId: string
  verdict: 'full' | 'partial' | 'none' | 'disputed' | 'na'
  quality: number
  evidenceIds: string[]
}

const verdictsFile = path.join(ROOT, 'data', arena, 'verdicts.json')
const newVerdicts: Verdict[] = JSON.parse(fs.readFileSync(verdictsFile, 'utf8'))
const oldVerdicts: Verdict[] = JSON.parse(
  execSync(`git show HEAD:data/${arena}/verdicts.json`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'),
)

for (const productId of products) {
  const oldEvidence = JSON.parse(
    execSync(`git show HEAD:data/${arena}/evidence/${productId}.json`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'),
  ) as Array<{ id: string }>
  const oldEvidenceIds = new Set<string>(oldEvidence.map((e) => e.id))
  const currentEvidence = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', arena, 'evidence', `${productId}.json`), 'utf8'),
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
      `REVERT ${arena}/${productId}:${v.storyId} ${v.verdict}/q${v.quality} -> ${old!.verdict}/q${old!.quality} (no new citation)`,
    )
    const cacheFile = path.join(ROOT, 'pipeline', 'cache', 'judge', arena, productId, `${v.storyId}.json`)
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
