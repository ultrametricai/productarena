const STAGES = ['crawl', 'extract', 'normalize', 'collect-community', 'judge', 'derive'] as const
type Stage = (typeof STAGES)[number]

async function main() {
  const [stage, ...rest] = process.argv.slice(2)
  const productFlag = rest.indexOf('--product')
  const product = productFlag >= 0 ? rest[productFlag + 1] : undefined

  if (!STAGES.includes(stage as Stage)) {
    console.error(`usage: pnpm pipeline <${STAGES.join('|')}> [--product <id>]`)
    process.exit(1)
  }

  switch (stage as Stage) {
    case 'derive':
      return (await import('./stages/derive')).runDerive()
    case 'crawl':
      return (await import('./stages/crawl')).runCrawl({ product })
    case 'extract':
      return (await import('./stages/extract')).runExtract({ product })
    case 'normalize':
      return (await import('./stages/normalize')).runNormalize()
    case 'collect-community':
      return (await import('./stages/collect-community')).runCollectCommunity({ product })
    case 'judge':
      return (await import('./stages/judge')).runJudge({ product })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
