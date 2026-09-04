import { describe, expect, it } from 'vitest'
import { sparklinePath, sparklinePoints } from '@/lib/sparkline'

describe('sparklinePoints', () => {
  it('is null with fewer than 2 points (a single measurement is not a trend)', () => {
    expect(sparklinePoints([], 90, 24)).toBeNull()
    expect(sparklinePoints([50], 90, 24)).toBeNull()
  })

  it('spaces x evenly across the padded width and scales y to the value range (inverted)', () => {
    const points = sparklinePoints([0, 50, 100], 90, 24, 2)
    expect(points).toEqual([
      { x: 2, y: 22 }, // min value → bottom (pad + full innerHeight)
      { x: 45, y: 12 }, // midpoint both ways
      { x: 88, y: 2 }, // max value → top (pad)
    ])
  })

  it('renders a flat series as a horizontal midline instead of dividing by zero', () => {
    const points = sparklinePoints([42, 42, 42], 90, 24)!
    expect(points.every((p) => p.y === 12)).toBe(true)
    expect(points[0].x).toBe(2)
    expect(points[2].x).toBe(88)
  })
})

describe('sparklinePath', () => {
  it('emits an M-then-L path over the same coordinates', () => {
    expect(sparklinePath([0, 50, 100], 90, 24)).toBe('M2,22 L45,12 L88,2')
  })

  it('is null with fewer than 2 points', () => {
    expect(sparklinePath([100], 90, 24)).toBeNull()
  })
})
