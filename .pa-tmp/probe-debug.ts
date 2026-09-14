// Debug: which URL does the probe stage hang on for sentry?
const urls = [
  'https://docs.sentry.io/llms.txt',
  'https://docs.sentry.io.md',
  'https://docs.sentry.io/openapi.json',
  'https://docs.sentry.io/swagger.json',
  'https://docs.sentry.io/api/openapi.json',
  'https://docs.sentry.io/.well-known/openapi.json',
  'https://mcp.sentry.dev/',
  'https://docs.sentry.io/cli/',
]

async function main() {
  for (const u of urls) {
    const t = Date.now()
    try {
      const res = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://ultrametric.ai/productarena)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
      })
      const text = res.status === 200 ? await res.text() : ''
      console.log(u, res.status, `${Date.now() - t}ms`, `${text.length}b`)
    } catch (e) {
      console.log(u, 'ERR', `${Date.now() - t}ms`, (e as Error).message)
    }
  }
}
main()
