// @vitest-environment jsdom
// StepPromptBox — the step's "Do it with AI" action row (founder 2026-09-25: the agent prompt
// promoted from a collapsed toggle to the primary per-step affordance). Load-bearing assertions:
//   1. the static-HTML contract — SSR (empty lens + empty stack server snapshots) renders the
//      default top-vendor resolution and hydrates with ZERO mismatches;
//   2. the vendor-resolution contract survives the redesign — copy and the Claude/ChatGPT links
//      carry the prompt resolved via the lens pick, else the stack pick, else vendors[0];
//   3. the open links prefill via ?q= AND copy in the same click (the curl -I check of both
//      endpoints hit a Cloudflare challenge, so prefill is belt-and-braces with the copy).
import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StepPromptBox, {
  chatgptPromptUrl,
  claudePromptUrl,
  type PromptVendor,
} from '@/components/StepPromptBox'
import { lensStorageKey, serializeLensState } from '@/lib/processLens'
import { STACK_KEY, serializeStackMap } from '@/lib/myStack'

// Same in-memory localStorage stand-in as components/__tests__/StepVendorRow.test.tsx.
function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  return writeText
}

const LENS_KEY = 'task-x'
const PROMPT = 'Set up transactional email via {{vendor}}. Then verify {{vendor}} DNS records.'
// Ranked order: Vendor One is the step's top-ranked default.
const VENDORS: PromptVendor[] = [
  { productId: 'v1', arenaId: 'arena-a', name: 'Vendor One' },
  { productId: 'v2', arenaId: 'arena-a', name: 'Vendor Two' },
]

const resolvedFor = (name: string) => PROMPT.replaceAll('{{vendor}}', name)

const box = (
  <StepPromptBox prompt={PROMPT} vendors={VENDORS} lensKey={LENS_KEY} />
)

// jsdom implements no navigation — swallow anchor default actions so clicking the open links
// exercises only the component's onClick (the same-click copy).
const preventNav = (e: Event) => e.preventDefault()

beforeEach(() => {
  stubLocalStorage()
  document.addEventListener('click', preventNav)
})
afterEach(() => {
  document.removeEventListener('click', preventNav)
  window.localStorage.clear()
})

describe('static-HTML contract (SSR ↔ empty client state)', () => {
  it('SSR renders the default top-vendor resolution and hydrates with no mismatch', async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    const ssr = renderToString(box)
    // Default resolution: the top-ranked vendor, no personalization markers.
    expect(ssr).toContain('for Vendor One')
    expect(ssr).not.toContain('✓ via')
    expect(ssr).not.toContain('set for')
    // Both open links carry the DEFAULT resolved prompt in ?q= already in the static HTML.
    const container = document.createElement('div')
    container.innerHTML = ssr
    document.body.appendChild(container)
    let root: Root | undefined
    try {
      const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
      expect(hrefs).toEqual([
        claudePromptUrl(resolvedFor('Vendor One')),
        chatgptPromptUrl(resolvedFor('Vendor One')),
      ])
      const hydrationErrors: unknown[] = []
      await act(async () => {
        root = hydrateRoot(container, box, { onRecoverableError: (e) => hydrationErrors.push(e) })
      })
      expect(hydrationErrors).toEqual([])
      expect(container.textContent).toContain('for Vendor One')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })
})

describe('vendor resolution → copy and open links', () => {
  it('copies the prompt resolved to the LENS pick, tagged ✓ via', async () => {
    window.localStorage.setItem(
      lensStorageKey(LENS_KEY),
      serializeLensState({ picks: { 'arena-a': 'v2' }, names: { v2: 'Vendor Two' } }),
    )
    const writeText = stubClipboard()
    render(box)
    expect(screen.getByText('✓ via Vendor Two')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy agent prompt/ }))
    })
    expect(writeText).toHaveBeenCalledWith(resolvedFor('Vendor Two'))
    expect(screen.getByRole('button', { name: /prompt copied/ })).toBeTruthy()
  })

  it('falls back to the "I\'m using" stack pick, tagged set for', async () => {
    window.localStorage.setItem(STACK_KEY, serializeStackMap({ 'arena-a': ['v2'] }))
    const writeText = stubClipboard()
    render(box)
    expect(screen.getByText('set for Vendor Two')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy agent prompt/ }))
    })
    expect(writeText).toHaveBeenCalledWith(resolvedFor('Vendor Two'))
  })

  it('the Claude and ChatGPT links carry the lens-resolved prompt in ?q= and copy it in the same click', async () => {
    window.localStorage.setItem(
      lensStorageKey(LENS_KEY),
      serializeLensState({ picks: { 'arena-a': 'v2' }, names: { v2: 'Vendor Two' } }),
    )
    const writeText = stubClipboard()
    render(box)
    const resolved = resolvedFor('Vendor Two')
    const claude = screen.getByRole('link', { name: /Open in Claude/ })
    const chatgpt = screen.getByRole('link', { name: /Open in ChatGPT/ })
    expect(claude.getAttribute('href')).toBe(`https://claude.ai/new?q=${encodeURIComponent(resolved)}`)
    expect(chatgpt.getAttribute('href')).toBe(`https://chatgpt.com/?q=${encodeURIComponent(resolved)}`)
    expect(claude.getAttribute('target')).toBe('_blank')
    expect(chatgpt.getAttribute('rel')).toBe('noopener noreferrer')
    await act(async () => {
      fireEvent.click(claude)
    })
    expect(writeText).toHaveBeenCalledWith(resolved)
    await act(async () => {
      fireEvent.click(chatgpt)
    })
    expect(writeText).toHaveBeenCalledTimes(2)
  })
})

describe('preview, signature honesty, and the manual-path children', () => {
  it('the prompt text preview stays available behind the small expand', async () => {
    render(box)
    expect(document.querySelector('pre')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /view prompt/ }))
    expect(document.querySelector('pre')?.textContent).toBe(resolvedFor('Vendor One'))
    fireEvent.click(screen.getByRole('button', { name: /hide prompt/ }))
    expect(document.querySelector('pre')).toBeNull()
  })

  it('legalSignature steps keep the row but say the signature stays human', () => {
    const { container } = render(
      <StepPromptBox prompt={PROMPT} vendors={VENDORS} lensKey={LENS_KEY} legalSignature />,
    )
    expect(screen.getByRole('button', { name: /Copy agent prompt/ })).toBeTruthy()
    expect(container.textContent).toContain('the signature itself is legally yours to give')
  })

  it('renders children AFTER the AI affordances — the manual path comes last in the row', () => {
    const { container } = render(
      <StepPromptBox prompt={PROMPT} vendors={VENDORS} lensKey={LENS_KEY}>
        <a href="https://irs.gov/ein">do it yourself: irs.gov ↗</a>
      </StepPromptBox>,
    )
    const row = container.querySelector('div.flex')
    const labels = [...(row?.children ?? [])].map((el) => el.textContent ?? '')
    const ai = labels.findIndex((t) => t.includes('Copy agent prompt'))
    const manual = labels.findIndex((t) => t.includes('do it yourself'))
    expect(ai).toBeGreaterThanOrEqual(0)
    expect(manual).toBeGreaterThan(ai)
  })
})
