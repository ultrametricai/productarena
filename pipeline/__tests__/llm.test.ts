import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { extractJson, llmJson, setClientForTests } from '@/pipeline/llm'

const textResponse = (text: string) => ({ content: [{ type: 'text', text }] })

describe('extractJson', () => {
  it('parses fenced json', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('parses json embedded in prose', () => {
    expect(extractJson('Here you go: [1,2,3] hope that helps')).toEqual([1, 2, 3])
  })
  it('returns undefined for garbage', () => {
    expect(extractJson('no json here')).toBeUndefined()
  })
})

describe('llmJson', () => {
  const schema = z.object({ name: z.string() })

  it('returns validated output on first success', async () => {
    const create = vi.fn().mockResolvedValue(textResponse('{"name":"ok"}'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).resolves.toEqual({ name: 'ok' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('feeds validation errors back and retries', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(textResponse('{"name":42}'))
      .mockResolvedValueOnce(textResponse('{"name":"fixed"}'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).resolves.toEqual({ name: 'fixed' })
    expect(create).toHaveBeenCalledTimes(2)
    const secondCallMessages = create.mock.calls[1][0].messages
    expect(secondCallMessages).toHaveLength(3) // user, assistant, correction
    expect(JSON.stringify(secondCallMessages[2])).toMatch(/expected string/i)
  })

  it('throws after max retries', async () => {
    const create = vi.fn().mockResolvedValue(textResponse('still not json'))
    setClientForTests({ messages: { create } } as never)
    await expect(llmJson({ schema, system: 's', prompt: 'p' })).rejects.toThrow(/failed validation/)
    expect(create).toHaveBeenCalledTimes(3)
  })
})
