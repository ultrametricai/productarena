// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { buildProcessProviderChoice } from '../shared-processes/provider-choice'
import { buildComposedComparisons } from '../shared-processes/composed-preview'
import { loadSharedProcesses } from '../shared-processes/load'
import { aggregateStepCoverage } from '../processRankings'
import type { StepComparisonProduct } from '../shared-processes/step-comparisons'
import SharedProcessReader from '@/components/shared-processes/SharedProcessReader'
const records = loadSharedProcesses()
afterEach(cleanup)
it('shares the existing coverage formula and preserves missing versus zero across category-scoped steps', () => {
  const record = records.find(record => record.id === 'get-paid')!
  const product = (id: string, score: number): StepComparisonProduct => ({ id: `payments/${id}`, productId: id, name: id, href: `/arena/payments/product/${id}`, hasLogo: false, score, stories: [] })
  const choice = buildProcessProviderChoice(record, {
    a: { title: 'First', storyCount: 100, products: [product('one', 80), product('zero', 0)] },
    b: { title: 'Second', storyCount: 1, products: [product('one', 40)] },
    c: { title: 'Other category', storyCount: 1, products: [{ ...product('bank', 100), id: 'banking/bank' }] },
  })!
  const group = choice.groups.find(group => group.arenaId === 'payments')!
  expect(group.stepCount).toBe(2)
  expect(group.scores['payments/one'].score).toBe(aggregateStepCoverage([80, 40], 2))
  expect(group.scores['payments/one'].score).toBe(60)
  expect(group.scores['payments/zero'].assessedSteps).toBe(1)
  expect(group.scores['payments/zero'].steps.map(step => step.score)).toEqual([0, null])
  expect(group.scores['payments/zero'].score).toBe(0)
  expect(buildProcessProviderChoice(records.find(record => record.id === 'form_001')!, {})).toBeUndefined()
})
it('shows scoped aggregate evidence independently of selection and preserves linked graph headings', () => {
  const record = records.find(record => record.id === 'get-paid')!
  const comparisons = buildComposedComparisons(record, records)
  const choice = buildProcessProviderChoice(record, comparisons)!
  const payments = choice.groups.find(group => group.arenaId === 'payments')!
  expect(payments.stepCount).toBe(12)
  expect(payments.scores['payments/stripe'].score).toBe(68.8)
  const el = render(<SharedProcessReader record={record} records={records} comparisons={comparisons} processChoice={choice} />)
  const providers = within(el.getByRole('region', { name: 'Process providers' }))
  fireEvent.click(providers.getByRole('button', { name: 'Show Stripe process coverage' }))
  expect(providers.getByRole('region', { name: 'Stripe process coverage' }).textContent).toContain('Assessed on 12 of 12')
  expect(providers.getByRole('button', { name: 'Use Stripe' }).getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(providers.getByRole('button', { name: 'Use Stripe' }))
  fireEvent.click(el.getByRole('button', { name: 'Graph' }))
  const graph = within(el.getByRole('region', { name: 'Process graph' }))
  expect(graph.getByRole('heading', { name: 'Get paid' }).className).toContain('text-xl')
  const link = graph.getByRole('link', { name: 'Bookkeeping close' })
  expect(link.getAttribute('href')).toBe('/processes/preview/bookkeeping-close')
  fireEvent.click(el.getByRole('button', { name: 'Details' }))
  expect(providers.getByRole('button', { name: 'Use Stripe' }).getAttribute('aria-pressed')).toBe('true')
})

it('labels existing aggregate scores as default-scope when a regional option changes', () => {
  const record = records.find(record => record.id === 'sales_002')!
  const comparisons = buildComposedComparisons(record, records)
  const choice = buildProcessProviderChoice(record, comparisons)!
  const el = render(<SharedProcessReader record={record} records={records} comparisons={comparisons} processChoice={choice} />)
  const selector = el.getByRole('combobox', { name: 'Regional variant' }) as HTMLSelectElement
  const alternate = [...selector.options].find(option => option.value !== 'default')!
  fireEvent.change(selector, { target: { value: alternate.value } })
  const providers = within(el.getByRole('region', { name: 'Process providers' }))
  expect(providers.getAllByText('These scores do not assess the selected regional variant.').length).toBeGreaterThan(0)
  expect(providers.getAllByText(/Default-scope coverage across/).length).toBeGreaterThan(0)
})
