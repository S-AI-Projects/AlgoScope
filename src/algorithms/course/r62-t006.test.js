import { describe, expect, it } from 'vitest'
import {
  generateInterpolationSearchSteps,
  interpolationSearch,
  runInterpolationSearch,
} from './interpolation-search'

describe('interpolation search', () => {
  it('finds a target in a sorted numeric array and records replay state', () => {
    const input = [10, 20, 30, 40]
    const { index, steps } = runInterpolationSearch(input, 30)

    expect(index).toBe(2)
    expect(interpolationSearch(input, 30)).toBe(2)
    expect(steps.at(-1)).toMatchObject({
      lineKey: 'found',
      type: 'found',
      foundIndex: 2,
      indices: [2, 0, 3],
      variables: { index: 2, target: 30 },
    })
    expect(steps.some((step) => step.type === 'probe')).toBe(true)
    expect(steps.every((step) => step.array)).toBe(true)
    expect(input).toEqual([10, 20, 30, 40])
  })

  it('does not divide by zero when all values are equal', () => {
    const absent = runInterpolationSearch([7, 7, 7], 9)
    const present = runInterpolationSearch([7, 7, 7], 7)

    expect(absent.index).toBe(-1)
    expect(absent.steps.at(-1)).toMatchObject({
      lineKey: 'notFound',
      type: 'not-found',
      foundIndex: null,
      indices: [-1, 0, 2],
    })
    expect(present.index).toBe(0)
    expect(present.steps.at(-1)).toMatchObject({
      lineKey: 'found',
      type: 'found',
      foundIndex: 0,
      indices: [0, 0, 2],
    })
    expect(absent.steps.every((step) =>
      Object.values(step.variables).every(
        (value) => typeof value !== 'number' || Number.isFinite(value)
      )
    )).toBe(true)
  })

  it('returns not found for empty arrays and targets outside the range', () => {
    expect(interpolationSearch([], 1)).toBe(-1)
    expect(interpolationSearch([10, 20, 30], 5)).toBe(-1)
    expect(interpolationSearch([10, 20, 30], 35)).toBe(-1)
  })

  it('returns only replay steps from the step generator interface', () => {
    const steps = generateInterpolationSearchSteps([10, 20, 30, 40], 30)

    expect(Array.isArray(steps)).toBe(true)
    expect(steps[0]).toMatchObject({ lineKey: 'function', type: 'start' })
    expect(steps.at(-1)).toMatchObject({ type: 'found', foundIndex: 2 })
  })
})
