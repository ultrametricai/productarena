// @vitest-environment jsdom
// StepMethodPicker + StepMethodDefault — the method-variant selector (founder 2026-09-30:
// "multiple methods depending on context"). Load-bearing assertions:
//   1. SSR-equivalence: the static HTML renders the DEFAULT method — the selector shows
//      "Default", no variant panel, and the default-method content (StepMethodDefault children)
//      is present;
//   2. selecting a variant swaps the step's displayed route/vendors/calls/time: the panel shows
//      the variant's route badge, chips, honest time, the indented sub-DAG, and the honestly
//      relabeled "with this method" ceiling — while the default content hides;
//   3. geo auto-preselect: a non-US geo selection picks the matching geo method; clearing it
//      returns to the default; a manual click wins over later geo changes.
import { render, fireEvent, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StepMethodDefault from '@/components/StepMethodDefault'
import StepMethodPicker from '@/components/StepMethodPicker'
import { setGeoSelection } from '@/lib/geoPreference'
import { resetMethodSelections, stepMethodNodeKey, type StepMethodView } from '@/lib/stepMethods'

const NODE_KEY = stepMethodNodeKey('startup_001', 'n2')

const chip = (over: Partial<StepMethodView['chips'][number]>): StepMethodView['chips'][number] => ({
  vendor: 'lovable',
  label: 'Lovable',
  productId: 'lovable',
  arenaId: 'vibe-coding',
  arenaName: 'Vibe coding',
  agentReady: 80,
  rank: 1,
  signupUrl: null,
  hasLogo: false,
  ...over,
})

const defaultView: StepMethodView = {
  id: 'default',
  label: 'Generate a landing-page smoke test',
  summary: null,
  context: null,
  route: 'agent',
  estimatedMinutes: 20,
  calls: [],
  chips: [chip({})],
  subSteps: [],
  actionUrl: null,
  actionLabel: null,
  ceiling: { agentSteps: 5, totalSteps: 7, pct: 71 },
}

const interviewSprint: StepMethodView = {
  id: 'customer-interview-sprint',
  label: 'Customer-interview sprint',
  summary: 'Interviews over clicks.',
  context: { kind: 'situational', when: 'B2B / enterprise', countries: [] },
  route: 'person',
  estimatedMinutes: 585,
  calls: [],
  chips: [],
  subSteps: [
    {
      id: 'ci1',
      label: 'Draft the interview discussion guide',
      route: 'agent',
      legalSignature: false,
      async: false,
      estimatedMinutes: 15,
      calls: [],
      actionUrl: null,
      actionLabel: null,
      chips: [chip({ vendor: 'chatgpt', label: 'ChatGPT', productId: 'chatgpt', arenaId: 'ai-assistants', arenaName: 'AI assistants' })],
    },
    {
      id: 'ci3',
      label: 'Run the interviews',
      route: 'person',
      legalSignature: false,
      async: true,
      estimatedMinutes: 300,
      calls: [],
      actionUrl: null,
      actionLabel: null,
      chips: [],
    },
  ],
  actionUrl: null,
  actionLabel: null,
  ceiling: { agentSteps: 6, totalSteps: 10, pct: 60 },
}

const ukFiling: StepMethodView = {
  id: 'uk-companies-house',
  label: 'UK - Companies House filing',
  summary: 'Register with Companies House.',
  context: { kind: 'geo', when: 'Incorporating in the United Kingdom', countries: ['UK'] },
  route: 'form',
  estimatedMinutes: null,
  calls: [],
  chips: [],
  subSteps: [],
  actionUrl: 'https://www.gov.uk/limited-company-formation',
  actionLabel: 'Companies House',
  ceiling: { agentSteps: 5, totalSteps: 7, pct: 71 },
}

const methods = [interviewSprint, ukFiling]

function Harness() {
  return (
    <div>
      <StepMethodPicker nodeKey={NODE_KEY} defaultView={defaultView} methods={methods} />
      <StepMethodDefault nodeKey={NODE_KEY}>
        <p>DEFAULT-METHOD-CONTENT</p>
      </StepMethodDefault>
    </div>
  )
}

beforeEach(() => {
  resetMethodSelections()
  setGeoSelection(null)
})

afterEach(() => {
  resetMethodSelections()
  setGeoSelection(null)
})

describe('StepMethodPicker', () => {
  it('SSR renders the default method: selector on "Default", default content visible, no variant panel', () => {
    const html = renderToString(<Harness />)
    expect(html).toContain('Default')
    expect(html).toContain('3 ways')
    expect(html).toContain('DEFAULT-METHOD-CONTENT')
    expect(html).not.toContain('Agentic % with this method')
    expect(html).not.toContain('Customer-interview sprint')
  })

  it('selecting a variant swaps the displayed route/vendors/time, expands the sub-DAG, and relabels the ceiling', () => {
    const { getByRole, getByText, queryByText, getAllByText } = render(<Harness />)
    fireEvent.click(getByRole('button', { name: /Default/ }))
    fireEvent.click(getByRole('option', { name: /Customer-interview sprint/ }))
    // The variant's route badge and honest (sub-step-derived) time.
    expect(getAllByText('human or computer use').length).toBeGreaterThan(0)
    expect(getByText(/~/).textContent).toContain('9.8 h')
    // The indented mini-DAG with its own route-coded sub-steps and market chips.
    expect(getByText('Draft the interview discussion guide')).toBeTruthy()
    expect(getByText('Run the interviews')).toBeTruthy()
    expect(getByText('ChatGPT')).toBeTruthy()
    // The relabeled ceiling names both numbers, defaults alongside.
    expect(getByText(/Agentic % with this method/)).toBeTruthy()
    expect(getByText('60%')).toBeTruthy()
    expect(getByText(/default method: 71%/)).toBeTruthy()
    // The default-method content hid.
    expect(queryByText('DEFAULT-METHOD-CONTENT')).toBeNull()
    // Switching back restores the default view exactly.
    fireEvent.click(getByRole('button', { name: /Customer-interview sprint/ }))
    fireEvent.click(getByRole('option', { name: /^Default/ }))
    expect(getByText('DEFAULT-METHOD-CONTENT')).toBeTruthy()
    expect(queryByText(/Ceiling with this method/)).toBeNull()
  })

  it('geo auto-preselect: a UK geo selection picks the UK method, clearing it restores the default', () => {
    const { getByText, queryByText } = render(<Harness />)
    act(() => setGeoSelection('UK'))
    expect(getByText(/Incorporating in the United Kingdom/)).toBeTruthy()
    expect(queryByText('DEFAULT-METHOD-CONTENT')).toBeNull()
    // A geo no method covers → default (IN has no method here).
    act(() => setGeoSelection('IN'))
    expect(queryByText(/Incorporating in the United Kingdom/)).toBeNull()
    expect(getByText('DEFAULT-METHOD-CONTENT')).toBeTruthy()
    act(() => setGeoSelection('UK'))
    expect(queryByText('DEFAULT-METHOD-CONTENT')).toBeNull()
    act(() => setGeoSelection(null))
    expect(getByText('DEFAULT-METHOD-CONTENT')).toBeTruthy()
  })

  it('a manual pick wins over later geo changes', () => {
    const { getByRole, getByText, queryByText } = render(<Harness />)
    fireEvent.click(getByRole('button', { name: /Default/ }))
    fireEvent.click(getByRole('option', { name: /Customer-interview sprint/ }))
    act(() => setGeoSelection('UK'))
    // Still the manual pick — geo does not clobber an explicit choice.
    expect(getByText(/Agentic % with this method/)).toBeTruthy()
    expect(queryByText(/Incorporating in the United Kingdom/)).toBeNull()
  })
})
