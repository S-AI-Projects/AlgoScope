import { describe, expect, it } from 'vitest'
import { generateLinearSearchSteps } from '../searching/linearSearchSteps.js'

const types = (steps) => steps.map((step) => step.type)

describe('generateLinearSearchSteps contract', () => {
  it('finds the first fixture value at the beginning', () => {
    const input = [2, 4, 6, 8]
    const steps = generateLinearSearchSteps(input, 2)

    expect(types(steps)).toEqual(['start', 'loop', 'compare', 'found'])
    expect(steps.at(-1)).toMatchObject({ indices: [0], foundIndex: 0, variables: { i: 0, target: 2 } })
    expect(input).toEqual([2, 4, 6, 8])
  })

  it('checks each earlier value before finding the last fixture value', () => {
    const steps = generateLinearSearchSteps([2, 4, 6, 8], 8)

    expect(types(steps)).toEqual([
      'start', 'loop', 'compare', 'loop', 'compare',
      'loop', 'compare', 'loop', 'compare', 'found',
    ])
    expect(steps.at(-1)).toMatchObject({ indices: [3], foundIndex: 3, variables: { i: 3, target: 8 } })
  })

  it('uses the source miss result after checking every fixture value', () => {
    const steps = generateLinearSearchSteps([2, 4, 6, 8], 5)
    const last = steps.at(-1)

    expect(steps.filter((step) => step.type === 'compare')).toHaveLength(4)
    expect(last).toMatchObject({ type: 'not-found', indices: [], foundIndex: null, variables: { target: 5 } })
    expect(last.message).toContain('Returning -1')
  })

  it('returns the first matching index when the target is duplicated', () => {
    const steps = generateLinearSearchSteps([2, 4, 2, 8], 2)

    expect(steps.at(-1)).toMatchObject({ type: 'found', indices: [0], foundIndex: 0 })
    expect(steps.filter((step) => step.type === 'compare')).toHaveLength(1)
  })

  it('handles a singleton and the empty collection boundary', () => {
    const singleton = generateLinearSearchSteps([7], 7)
    const empty = generateLinearSearchSteps([], 7)

    expect(singleton.at(-1)).toMatchObject({ type: 'found', indices: [0], foundIndex: 0 })
    expect(types(empty)).toEqual(['start', 'not-found'])
    expect(empty.at(-1)).toMatchObject({ indices: [], foundIndex: null, variables: { target: 7 } })
    expect(empty.at(-1).message).toContain('Returning -1')
  })
})
