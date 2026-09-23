// Sequential spike runner for the A-L never-spiked backlog (evidence-depth lane).
// One spike at a time; 15-min hard timeout per attempt; <=3 attempts per product;
// per-spike git commit on success (clean revert point); git reset --hard on final failure.
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'

const ROOT = '/Users/judegomila/Documents/GitHub/productarena/.claude/worktrees/agent-a5c37b44e1c188e7b'
const TIMEOUT_MS = 15 * 60 * 1000
const TARGETS = JSON.parse(fs.readFileSync(`${ROOT}/.pa-tmp/spike-targets.json`, 'utf8'))

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' })
}

function runOnce(arena, product, logFile) {
  return new Promise((resolve) => {
    const out = fs.openSync(logFile, 'a')
    const child = spawn(
      'pnpm',
      ['tsx', 'pipeline/scripts/spike-engine.ts', '--process', '--category', arena, '--product', product, '--budget-urls', '20'],
      { cwd: ROOT, stdio: ['ignore', out, out] },
    )
    const timer = setTimeout(() => {
      fs.writeSync(out, `\n[runner] TIMEOUT >15min — killing\n`)
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 5000).unref()
    }, TIMEOUT_MS)
    child.on('exit', (code) => {
      clearTimeout(timer)
      fs.closeSync(out)
      resolve(code)
    })
  })
}

const results = []
for (const { arena, product } of TARGETS) {
  const logFile = `${ROOT}/.pa-tmp/spike-${arena}-${product}.log`
  let ok = false
  let attempts = 0
  for (attempts = 1; attempts <= 3; attempts++) {
    console.log(`SPIKE ${arena}/${product} attempt ${attempts}`)
    const code = await runOnce(arena, product, logFile)
    if (code === 0) { ok = true; break }
    console.log(`SPIKE ${arena}/${product} attempt ${attempts} FAILED exit=${code} — reverting working tree`)
    try { sh('git reset --hard HEAD >/dev/null && git clean -fd data pipeline/cache/judge >/dev/null') } catch (e) { console.log(`revert error: ${e.message}`) }
  }
  if (ok) {
    const log = fs.readFileSync(logFile, 'utf8')
    const summary = (log.match(/spike-engine: \S+ — .*$/m) ?? ['spike complete'])[0].replace(/"/g, "'")
    try {
      sh('git add -A')
      const msg = `Spike ${arena}/${product}: never-spiked backlog depth pass (budget 20 URLs)\n\n${summary}\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
      fs.writeFileSync(`${ROOT}/.pa-tmp/commit-msg.txt`, msg)
      sh('git commit -q -F .pa-tmp/commit-msg.txt')
      console.log(`SPIKE ${arena}/${product} OK — committed. ${summary}`)
    } catch (e) {
      console.log(`SPIKE ${arena}/${product} OK but commit failed: ${e.message}`)
    }
    results.push({ arena, product, ok: true, attempts, summary })
  } else {
    console.log(`SPIKE ${arena}/${product} GAVE UP after 3 attempts`)
    results.push({ arena, product, ok: false, attempts: 3 })
  }
}
fs.writeFileSync(`${ROOT}/.pa-tmp/spike-results.json`, JSON.stringify(results, null, 2))
console.log('RUNNER DONE')
