// @vitest-environment jsdom
// StepCanonicalVendor — the canonical vendor chip on steps that HAVE a market (founder
// 2026-09-23: "processes don't start with just one supplier — the first step is to SELECT a
// supplier"). The load-bearing assertions:
//   - static HTML (SSR, empty lens + empty stack snapshots) = the no-pick view: the chip
//     demotes to an "e.g."-prefixed reference chip, hydrating with zero mismatches;
//   - a lens or stack pick that COVERS the step hides the chip entirely — the resolved pick is
//     already pinned first in the ranked row, and the canonical vendor must not keep reading
//     as "the" vendor beside it;
//   - a lens pick with NO evidence on the step (and no stack fallback) does NOT hide it — no
//     supplier actually covers the step, so the honest reference stays.
import { render, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StepCanonicalVendor from '@/components/StepCanonicalVendor'
import { lensStorageKey, serializeLensState } from '@/lib/processLens'
import { STACK_KEY, serializeStackMap } from '@/lib/myStack'
import type { ProcessCheckStep } from '@/lib/processCheck'
import type { VendorChipInfo } from '@/lib/processes'

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

const LENS_KEY = 'task-x'

const INFO: VendorChipInfo = {
  vendor: 'best_bank',
  label: 'Best Bank',
  productId: 'best-bank',
  arenaId: 'startup-banking',
  arenaName: 'Startup banking',
  agentReady: 80,
  rank: 1,
  signupUrl: 'https://bestbank.example/',
}

const CHECK_STEP: ProcessCheckStep = {
  nodeId: 'open',
  label: 'Open the account',
  storyCount: 2,
  arenas: [
    {
      arenaId: 'startup-banking',
      arenaName: 'Startup banking',
      kind: 'function',
      vendors: [
        { productId: 'best-bank', name: 'Best Bank', score: 90, hasLogo: false },
        { productId: 'mid-bank', name: 'Mid Bank', score: 71, hasLogo: false },
      ],
    },
  ],
  best: { productId: 'best-bank', name: 'Best Bank', score: 90, arenaId: 'startup-banking' },
}

const chip = (
  <StepCanonicalVendor
    info={INFO}
    logo={false}
    marketArenaId="startup-banking"
    lensKey={LENS_KEY}
    checkStep={CHECK_STEP}
  />
)

describe('static-HTML contract (SSR ↔ empty client state)', () => {
  beforeEach(() => stubLocalStorage())
  afterEach(() => window.localStorage.clear())

  it('SSR renders the demoted "e.g." reference chip and hydrates with no mismatch', async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    const ssr = renderToString(chip)
    expect(ssr).toContain('e.g.')
    expect(ssr).toContain('Best Bank')
    expect(ssr).toContain("no supplier selected — this is the market&#x27;s reference vendor")
    const container = document.createElement('div')
    container.innerHTML = ssr
    document.body.appendChild(container)
    let root: Root | undefined
    try {
      const hydrationErrors: unknown[] = []
      await act(async () => {
        root = hydrateRoot(container, chip, { onRecoverableError: (e) => hydrationErrors.push(e) })
      })
      expect(hydrationErrors).toEqual([])
      expect(container.textContent).toContain('e.g.')
      expect(container.textContent).toContain('Best Bank')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })

  it('the reference chip keeps the evidence link and the external signup ↗', () => {
    const { container } = render(chip)
    expect(container.querySelector('a[href="/arena/startup-banking/product/best-bank"]')).not.toBeNull()
    expect(container.querySelector('a[href="https://bestbank.example/"]')).not.toBeNull()
  })
})

describe('a covering pick hides the reference chip', () => {
  beforeEach(() => stubLocalStorage())
  afterEach(() => window.localStorage.clear())

  it('a lens pick with step evidence hides it (the ranked row pins the pick instead)', () => {
    window.localStorage.setItem(
      lensStorageKey(LENS_KEY),
      serializeLensState({ picks: { 'startup-banking': 'mid-bank' }, names: { 'mid-bank': 'Mid Bank' } }),
    )
    const { container } = render(chip)
    expect(container.textContent).toBe('')
  })

  it('a stack pick with step evidence hides it too', () => {
    window.localStorage.setItem(STACK_KEY, serializeStackMap({ 'startup-banking': ['mid-bank'] }))
    const { container } = render(chip)
    expect(container.textContent).toBe('')
  })

  it('a lens pick with NO evidence on the step keeps the honest reference chip', () => {
    window.localStorage.setItem(
      lensStorageKey(LENS_KEY),
      serializeLensState({ picks: { 'startup-banking': 'ghost-bank' }, names: { 'ghost-bank': 'Ghost Bank' } }),
    )
    const { container } = render(chip)
    expect(container.textContent).toContain('e.g.')
    expect(container.textContent).toContain('Best Bank')
  })

  it('without a serialized row, any pick for the market arena hides it (fallback check)', () => {
    window.localStorage.setItem(
      lensStorageKey(LENS_KEY),
      serializeLensState({ picks: { 'startup-banking': 'mid-bank' }, names: {} }),
    )
    const { container } = render(
      <StepCanonicalVendor info={INFO} logo={false} marketArenaId="startup-banking" lensKey={LENS_KEY} />,
    )
    expect(container.textContent).toBe('')
  })
})
