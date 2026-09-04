import Anthropic from '@anthropic-ai/sdk'
import type { z } from 'zod'

const MODEL = process.env.PA_MODEL ?? 'claude-sonnet-5'
const MAX_RETRIES = 2

let client: Anthropic | undefined

export function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

export function setClientForTests(fake: Anthropic): void {
  client = fake
}

export function extractJson(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/g, '')
  const start = unfenced.search(/[[{]/)
  if (start === -1) return undefined
  // walk back from the end until a parse succeeds
  for (let end = unfenced.length; end > start; end--) {
    const candidate = unfenced.slice(start, end).trim()
    if (!candidate.endsWith('}') && !candidate.endsWith(']')) continue
    try {
      return JSON.parse(candidate)
    } catch {
      /* keep walking */
    }
  }
  return undefined
}

export async function llmJson<T>(opts: {
  schema: z.ZodType<T>
  system: string
  prompt: string
  maxTokens?: number
}): Promise<T> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.prompt }]
  let lastError = ''
  // A response cut off by max_tokens can never parse — retrying at the same cap just burns
  // attempts (observed under prompt v3, whose rubric rationales run longer). Escalate the cap
  // on truncation and retry the ORIGINAL prompt (appending half a JSON object only confuses
  // the model).
  let maxTokens = opts.maxTokens ?? 4096
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: opts.system,
      messages,
    })
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    if (res.stop_reason === 'max_tokens' && maxTokens < 16384) {
      maxTokens = Math.min(maxTokens * 2, 16384)
      lastError = `response truncated at max_tokens; retrying with ${maxTokens}`
      continue
    }
    const json = extractJson(text)
    const parsed = json === undefined ? undefined : opts.schema.safeParse(json)
    if (parsed?.success) return parsed.data
    lastError = json === undefined ? 'response contained no parseable JSON' : JSON.stringify(parsed?.error.issues)
    messages.push(
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `Your response failed validation: ${lastError}\nReply with ONLY the corrected JSON. No prose, no code fences.`,
      },
    )
  }
  throw new Error(`LLM output failed validation after ${MAX_RETRIES + 1} attempts: ${lastError}`)
}
