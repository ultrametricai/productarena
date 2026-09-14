// Debug: probe-shaped fetches for the remaining error-tracking products.
const urls = [
  'https://docs.bugsnag.com/llms.txt',
  'https://docs.bugsnag.com/openapi.json',
  'https://docs.bugsnag.com/swagger.json',
  'https://docs.rollbar.com/openapi.json',
  'https://docs.honeybadger.io/llms.txt',
  'https://docs.honeybadger.io/openapi.json',
  'https://glitchtip.com/openapi.json',
  'https://glitchtip.com/llms.txt',
  'https://raygun.com/llms.txt',
  'https://raygun.com/openapi.json',
  'https://raygun.com/documentation/.well-known/openapi.json',
  'https://github.com/SmartBear/smartbear-mcp',
  'https://github.com/MindscapeHQ/mcp-server-raygun',
]

async function main() {
  for (const u of urls) {
    const t = Date.now()
    try {
      const res = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://ultrametric.ai/productarena)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60_000),
      })
      const text = res.status === 200 ? await res.text() : ''
      console.log(u, res.status, `${Date.now() - t}ms`, `${text.length}b`)
    } catch (e) {
      console.log(u, 'ERR', `${Date.now() - t}ms`, (e as Error).message)
    }
  }
}
main()
