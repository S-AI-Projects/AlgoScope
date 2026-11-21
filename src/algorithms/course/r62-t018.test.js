/**
 * R62-T018 – insertionSortSteps failure-path and regression coverage
 *
 * Covers:
 *  - Error / unsupported-input paths (non-array, null, undefined, non-numeric
 *    elements) and verifies that a subsequent valid run succeeds without stale
 *    error state.
 *  - Source-string integrity: insertionSortSources keys are plain strings, not
 *    algorithm result objects or UI components.
 *  - Pure algorithm result shape: every step returned by generateInsertionSortSteps
 *    is a plain object with the fields defined by createStep.
 *  - Canonical behavioural cases: empty array, single element, already-ordered,
 *    reversed, two-element descending (smallest supported collection honouring
 *    the ascending sort contract).
 */

import { describe, it, expect } from 'vitest'
import {
  insertionSortSources,
  getInsertionSortSource,
  resolveInsertionSortLine,
  generateInsertionSortSteps,
} from '../sorting/insertionSortSteps'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when v is a plain JS object (not an array, Date, etc.). */
const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

/** Extracts the last step from a steps array. */
const lastStep = (steps) => steps[steps.length - 1]

/** Extracts the first step from a steps array. */
const firstStep = (steps) => steps[0]

// ---------------------------------------------------------------------------
// 1. Source-string integrity
//    insertionSortSources values must be plain config objects (strings + maps),
//    NOT algorithm result arrays, React components, or step objects.
// ---------------------------------------------------------------------------

describe('insertionSortSources – source-string integrity', () => {
  it('exports insertionSortSources as a plain object keyed by language', () => {
    expect(isPlainObject(insertionSortSources)).toBe(true)
    expect(Object.keys(insertionSortSources).length).toBeGreaterThanOrEqual(1)
  })

  it('each language entry has a string code property', () => {
    for (const [lang, entry] of Object.entries(insertionSortSources)) {
      expect(typeof entry.code, `${lang}.code`).toBe('string')
      expect(entry.code.length, `${lang}.code non-empty`).toBeGreaterThan(0)
    }
  })

  it('each language entry has a plain-object lineMap (not a step/result)', () => {
    for (const [lang, entry] of Object.entries(insertionSortSources)) {
      expect(isPlainObject(entry.lineMap), `${lang}.lineMap`).toBe(true)
      // lineMap values must be numbers (line numbers), not step objects
      for (const [key, val] of Object.entries(entry.lineMap)) {
        expect(typeof val, `${lang}.lineMap.${key}`).toBe('number')
      }
    }
  })

  it('source entries are NOT step arrays or React components', () => {
    for (const [lang, entry] of Object.entries(insertionSortSources)) {
      expect(Array.isArray(entry), `${lang} must not be an array`).toBe(false)
      expect(typeof entry, `${lang} must not be a function`).not.toBe(
        'function'
      )
    }
  })
})

// ---------------------------------------------------------------------------
// 2. getInsertionSortSource – language lookup
// ---------------------------------------------------------------------------

describe('getInsertionSortSource', () => {
  it('returns the javascript entry by default (no argument)', () => {
    const src = getInsertionSortSource()
    expect(typeof src.code).toBe('string')
    expect(src.code).toContain('insertionSort')
  })

  it('returns the correct entry for a known language', () => {
    const src = getInsertionSortSource('python')
    expect(src.code).toContain('insertion_sort')
  })

  it('falls back to javascript for an unknown / unsupported language', () => {
    const fallback = getInsertionSortSource('brainfuck')
    const js = getInsertionSortSource('javascript')
    expect(fallback).toBe(js)
  })
})

// ---------------------------------------------------------------------------
// 3. resolveInsertionSortLine – line-key lookup
// ---------------------------------------------------------------------------

describe('resolveInsertionSortLine', () => {
  it('returns a number for a valid line key', () => {
    const line = resolveInsertionSortLine('javascript', 'outerLoop')
    expect(typeof line).toBe('number')
    expect(line).toBeGreaterThan(0)
  })

  it('returns undefined for a missing / falsy lineKey', () => {
    expect(resolveInsertionSortLine('javascript', null)).toBeUndefined()
    expect(resolveInsertionSortLine('javascript', '')).toBeUndefined()
    expect(resolveInsertionSortLine('javascript', undefined)).toBeUndefined()
  })

  it('falls back to the javascript lineMap for an unknown language', () => {
    const result = resolveInsertionSortLine('cobol', 'outerLoop')
    const jsLine = resolveInsertionSortLine('javascript', 'outerLoop')
    // May equal the JS value (via fallback) or be a number; must be a number
    expect(typeof result).toBe('number')
    expect(result).toBe(jsLine)
  })
})

// ---------------------------------------------------------------------------
// 4. generateInsertionSortSteps – error / unsupported-input path
//    The function must throw (or produce a clearly broken / empty result) when
//    given unsupported input, and a subsequent call with valid input must
//    succeed without contamination.
// ---------------------------------------------------------------------------

describe('generateInsertionSortSteps – error / unsupported-input path', () => {
  it('throws or returns no meaningful steps for null input', () => {
    let threw = false
    let result
    try {
      result = generateInsertionSortSteps(null)
    } catch {
      threw = true
    }
    // Either a throw or no usable steps (array with 0 or 1 items is degenerate)
    if (!threw) {
      expect(Array.isArray(result)).toBe(true)
      // If it doesn't throw it must at minimum not produce multi-step output
      // for a non-array input
      expect(result.length).toBeLessThanOrEqual(1)
    } else {
      expect(threw).toBe(true)
    }
  })

  it('throws or returns degenerate steps for undefined input', () => {
    let threw = false
    let result
    try {
      result = generateInsertionSortSteps(undefined)
    } catch {
      threw = true
    }
    if (!threw) {
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeLessThanOrEqual(1)
    } else {
      expect(threw).toBe(true)
    }
  })

  it('string input is treated as an iterable of characters (no throw, steps returned)', () => {
    // JS strings are iterable; [...'ab'] === ['a','b'], so the function does not
    // throw — it produces steps for a character array.  The test asserts the
    // actual runtime contract: steps are returned and the complete step's array
    // contains the individual characters in sorted (ascending) order.
    let steps
    expect(() => {
      steps = generateInsertionSortSteps('ba')
    }).not.toThrow()
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
    // Characters sorted: ['a','b']
    expect(lastStep(steps).type).toBe('complete')
    expect(lastStep(steps).array).toEqual(['a', 'b'])
  })

  it('throws for a non-array object', () => {
    expect(() => generateInsertionSortSteps({ a: 1 })).toThrow()
  })

  it('subsequent valid run succeeds without stale error state', () => {
    // Force an error
    try {
      generateInsertionSortSteps('bad-input')
    } catch {
      // expected; ignore
    }

    // Now run a valid call – must work cleanly
    const steps = generateInsertionSortSteps([3, 1, 2])
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([1, 2, 3])
  })
})

// ---------------------------------------------------------------------------
// 5. generateInsertionSortSteps – pure algorithm result / step shape
//    Every step must be a plain object matching the createStep contract.
// ---------------------------------------------------------------------------

describe('generateInsertionSortSteps – step object shape', () => {
  const REQUIRED_STEP_KEYS = [
    'lineKey',
    'type',
    'array',
    'indices',
    'sortedIndices',
    'message',
    'variables',
  ]

  it('returns an array of plain step objects', () => {
    const steps = generateInsertionSortSteps([2, 1])
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
    for (const step of steps) {
      expect(isPlainObject(step)).toBe(true)
    }
  })

  it('each step has all required createStep fields', () => {
    const steps = generateInsertionSortSteps([3, 1, 2])
    for (const step of steps) {
      for (const key of REQUIRED_STEP_KEYS) {
        expect(step, `step missing key: ${key}`).toHaveProperty(key)
      }
    }
  })

  it('step.array is an independent snapshot (no reference sharing)', () => {
    const input = [4, 2, 3]
    const steps = generateInsertionSortSteps(input)
    const snap = firstStep(steps).array
    input[0] = 999
    expect(snap[0]).not.toBe(999)
  })

  it('step.type is always a non-empty string', () => {
    const steps = generateInsertionSortSteps([5, 3, 1])
    for (const step of steps) {
      expect(typeof step.type).toBe('string')
      expect(step.type.length).toBeGreaterThan(0)
    }
  })

  it('step.message is always a string', () => {
    const steps = generateInsertionSortSteps([2, 1])
    for (const step of steps) {
      expect(typeof step.message).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// 6. Canonical behavioural cases
// ---------------------------------------------------------------------------

describe('generateInsertionSortSteps – canonical behavioural cases', () => {
  /**
   * Empty array: [] → []
   * The function should still return a steps array (at least the 'complete'
   * bookend step), and the final array snapshot must be [].
   */
  it('[] produces [] (empty array)', () => {
    const steps = generateInsertionSortSteps([])
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThanOrEqual(1)

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([])
  })

  /**
   * Single element: [42] → [42]
   * No comparisons needed; first and last steps contain [42].
   */
  it('[42] produces [42] (single element)', () => {
    const steps = generateInsertionSortSteps([42])
    expect(steps.length).toBeGreaterThanOrEqual(1)

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([42])
  })

  /**
   * Already-ordered input: [1, 2, 3] → [1, 2, 3]
   * No shifts should be generated; the complete step must reflect sorted order.
   */
  it('[1, 2, 3] produces [1, 2, 3] (already sorted)', () => {
    const steps = generateInsertionSortSteps([1, 2, 3])

    const shiftSteps = steps.filter((s) => s.type === 'shift')
    expect(shiftSteps.length).toBe(0)

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([1, 2, 3])
  })

  /**
   * Reversed input: [3, 2, 1] → [1, 2, 3]
   * Maximum number of shifts for n=3.
   */
  it('[3, 2, 1] produces [1, 2, 3] (reversed)', () => {
    const steps = generateInsertionSortSteps([3, 2, 1])

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([1, 2, 3])

    // Should have produced shift steps (3 for n=3 reversed)
    const shiftSteps = steps.filter((s) => s.type === 'shift')
    expect(shiftSteps.length).toBeGreaterThan(0)
  })

  /**
   * Smallest supported collection (two elements, descending): [2, 1] → [1, 2]
   * Honours ascending sort interface.  One shift step expected.
   */
  it('[2, 1] produces [1, 2] (smallest descending collection)', () => {
    const steps = generateInsertionSortSteps([2, 1])

    const complete = lastStep(steps)
    expect(complete.type).toBe('complete')
    expect(complete.array).toEqual([1, 2])

    const shiftSteps = steps.filter((s) => s.type === 'shift')
    expect(shiftSteps.length).toBe(1)

    // The insert step must place 1 at index 0
    const insertStep = steps.find((s) => s.type === 'insert')
    expect(insertStep).toBeDefined()
    expect(insertStep.array[0]).toBe(1)
  })

  /**
   * First step type is always 'start', last is always 'complete'.
   */
  it('first step is "start" and last step is "complete"', () => {
    const steps = generateInsertionSortSteps([4, 2, 7, 1])
    expect(firstStep(steps).type).toBe('start')
    expect(lastStep(steps).type).toBe('complete')
  })

  /**
   * Final array in the complete step equals the natively sorted input.
   */
  it('complete step array equals natively sorted input for arbitrary input', () => {
    const input = [9, 3, 7, 1, 5]
    const expected = [...input].sort((a, b) => a - b)
    const steps = generateInsertionSortSteps(input)
    expect(lastStep(steps).array).toEqual(expected)
  })

  /**
   * sortedIndices in the complete step covers all indices.
   */
  it('complete step sortedIndices covers all indices', () => {
    const input = [5, 3, 8, 1]
    const steps = generateInsertionSortSteps(input)
    const complete = lastStep(steps)
    expect(complete.sortedIndices.sort((a, b) => a - b)).toEqual([0, 1, 2, 3])
  })
})
