// Cloudflare Worker: serves ProductArena at ultrametric.ai/productarena/* by transparently
// proxying to the Vercel deployment (which is built with basePath '/productarena', so paths
// pass through unchanged). Route: ultrametric.ai/productarena*
const ORIGIN = 'https://productarena.vercel.app'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const upstream = new URL(url.pathname + url.search, ORIGIN)
    const resp = await fetch(upstream, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    })
    // Rewrite any absolute redirects back onto ultrametric.ai
    const headers = new Headers(resp.headers)
    const loc = headers.get('location')
    if (loc && loc.startsWith(ORIGIN)) {
      headers.set('location', loc.replace(ORIGIN, 'https://ultrametric.ai'))
    }
    return new Response(resp.body, { status: resp.status, headers })
  },
}
