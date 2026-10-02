// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadSharedProcesses } from '../shared-processes/load'
import ProcessSummary, { processSummary } from '@/components/shared-processes/ProcessSummary'

const records = loadSharedProcesses()
const corporation = records.find(record => record.id === 'form_001')!
const contractor = records.find(record => record.id === 'opp_002')!

describe('shared process summary', () => {
  it('counts default-path source classifications, keeping known unverified work distinct', () => {
    expect(processSummary(corporation)).toMatchObject({ automation: null, completionTime: null, cost: null, steps: 10, agent: null, unverified: 1, approvals: null })
    expect(processSummary(contractor).agent).toBe(2)
    expect(processSummary(contractor).approvals).toBeNull() // missing is not false or an approval count
    const misleading = { ...contractor, metadata: { activeMinutes: 82, totalEstimatedMinutes: 2977, agentReady: 99, processScore: 75, cost: 500 } }
    expect(processSummary(misleading)).toEqual(processSummary(contractor))
    expect(processSummary(records.find(record => record.id === 'first-hire')!).agent).toBeNull()
  })
  it('omits unsupported summaries and does not sum alternative methods', () => {
    expect(renderToStaticMarkup(<ProcessSummary record={{ ...corporation, metadata: {}, parts: [] }} />)).toBe('')
    const changed = structuredClone(contractor)
    changed.parts[1].options[1].metadata.route = 'agent'
    changed.parts[1].options[1].metadata.approvalRequired = true
    expect(processSummary(changed).agent).toBe(2)
    expect(processSummary(changed).approvals).toBeNull()
    changed.parts[0].metadata.approvalRequired = true
    expect(processSummary(changed).approvals).toBe(1)
  })
})
