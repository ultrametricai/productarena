const STAGES = ['crawl', 'extract', 'normalize', 'collect-community', 'probe', 'probe-record', 'judge', 'claims', 'derive', 'logos', 'popularity'] as const
type Stage = (typeof STAGES)[number]

async function main() {
  const [stage, ...rest] = process.argv.slice(2)
  const productFlag = rest.indexOf('--product')
  const product = productFlag >= 0 ? rest[productFlag + 1] : undefined
  const categoryFlag = rest.indexOf('--category')
  const category = categoryFlag >= 0 ? rest[categoryFlag + 1] : undefined

  if (!STAGES.includes(stage as Stage)) {
    console.error(`usage: pnpm pipeline <${STAGES.join('|')}> [--category <id>] [--product <id>]`)
    process.exit(1)
  }

  if (stage === 'normalize' && !category) {
    console.error('usage: pnpm pipeline normalize --category <id>')
    process.exit(1)
  }

  const opts = { category, product }

  switch (stage as Stage) {
    case 'derive':
      return (await import('./stages/derive')).runDerive(opts)
    case 'crawl':
      return (await import('./stages/crawl')).runCrawl(opts)
    case 'extract':
      return (await import('./stages/extract')).runExtract(opts)
    case 'normalize':
      return (await import('./stages/normalize')).runNormalize(opts)
    case 'collect-community':
      return (await import('./stages/collect-community')).runCollectCommunity(opts)
    case 'probe':
      return (await import('./stages/probe')).runProbe(opts)
    case 'probe-record':
      return (await import('./stages/probe-record')).runProbeRecord(opts)
    case 'judge':
      return (await import('./stages/judge')).runJudge(opts)
    case 'claims':
      return (await import('./stages/claims')).runClaims(opts)
    case 'logos':
      return (await import('./stages/logos')).runLogos(opts)
    case 'popularity':
      return (await import('./stages/popularity')).runPopularity(opts)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
