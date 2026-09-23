import { execFileSync } from 'node:child_process'
import { probes } from '../pipeline/probes/cloud-platforms'

let fail = 0
for (const p of probes) {
  let out = ''
  try {
    out = execFileSync(p.argv[0], p.argv.slice(1), { timeout: p.timeoutMs, encoding: 'utf8' })
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string }
    out = String(err.stdout ?? '') + String(err.stderr ?? '')
  }
  const ok = p.expect.test(out)
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${p.productId}/${p.probeId}${ok ? '' : ` :: ${out.slice(0, 200)}`}`)
}
console.log(`${probes.length - fail}/${probes.length} passing`)
if (fail) process.exit(1)
