import TurndownService from 'turndown'

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
turndown.remove(['script', 'style', 'nav', 'footer', 'iframe'])

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html)
}

export async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductArena/1.0; +https://productarena.dev)' },
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return await res.text()
    } catch (err) {
      if (attempt >= retries) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}
