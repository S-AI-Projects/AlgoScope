import { describe, expect, it } from 'vitest'
import { generateShellSortSteps } from '../sorting/shellSortSteps.js'

const finalArray = (input) => {
  const steps = generateShellSortSteps(input)
  return { steps, result: steps.at(-1).array }
}

describe('Shell Sort step generator', () => {
  it.each([
    [[3, 1, 2], [1, 2, 3]],
    [[2, 2, 1], [1, 2, 2]],
    [[1, 2, 3], [1, 2, 3]],
    [[3, 2, 1], [1, 2, 3]],
    [[], []],
  ])('sorts %j to %j and completes with a truthful state', (input, expected) => {
    const original = [...input]
    const { steps, result } = finalArray(input)

    expect(result).toEqual(expected)
    expect(input).toEqual(original)
    expect(steps[0]).toMatchObject({ type: 'start', array: original })
    expect(steps.at(-1)).toMatchObject({
      type: 'complete',
      array: expected,
      sortedIndices: expected.map((_, index) => index),
    })
    expect(steps.every((step) => step.array.length === input.length)).toBe(true)
  })

  it.each([
    [[1], { steps: 2, comparisons: 0, shifts: 0 }],
    [[2, 1], { steps: 7, comparisons: 1, shifts: 1 }],
    [[3, 2, 1], { steps: 13, comparisons: 3, shifts: 3 }],
  ])('records deterministic operation counts for bounded input %j', (input, expected) => {
    const { steps } = finalArray(input)

    expect({
      steps: steps.length,
      comparisons: steps.filter((step) => step.type === 'compare').length,
      shifts: steps.filter((step) => step.type === 'swap').length,
    }).toEqual(expected)
  })
})
