/**
 * R62-T016 — Regression tests for the Longest Increasing Subsequence (LIS)
 * pure-algorithm module.
 *
 * Covers:
 *  - Standard case: [10, 9, 2, 5, 3, 7, 101, 18]  → length 4  (classic LIS)
 *  - Strict increasing: repeated value [5, 5, 5]   → length 1
 *  - Empty input  []                               → length 0, empty result
 *  - Single element [42]                           → length 1
 *  - Replay module: generateLISSteps produces valid step objects
 */

import { describe, it, expect } from 'vitest'
import { computeLIS, generateLISSteps } from './lisAlgorithm'

// ─── computeLIS ───────────────────────────────────────────────────────────────

describe('computeLIS — pure algorithm', () => {
  it('[10, 9, 2, 5, 3, 7, 101, 18] has LIS length 4', () => {
    const { length, subsequence, dp } = computeLIS([10, 9, 2, 5, 3, 7, 101, 18])

    // Length must be exactly 4 — fails on a wrong implementation
    expect(length).toBe(4)

    // The dp table must have the same length as the input
    expect(dp).toHaveLength(8)

    // The reconstructed subsequence must be strictly increasing and have the
    // correct length.
    expect(subsequence).toHaveLength(4)
    for (let i = 1; i < subsequence.length; i++) {
      expect(subsequence[i]).toBeGreaterThan(subsequence[i - 1])
    }
  })

  it('[3, 10, 2, 1, 20] has LIS length 3', () => {
    const { length, subsequence } = computeLIS([3, 10, 2, 1, 20])

    expect(length).toBe(3)
    expect(subsequence).toHaveLength(3)
    // Verify strict increase
    for (let i = 1; i < subsequence.length; i++) {
      expect(subsequence[i]).toBeGreaterThan(subsequence[i - 1])
    }
  })

  it('repeated [5, 5, 5] has LIS length 1 under strict increasing semantics', () => {
    const { length, subsequence, dp } = computeLIS([5, 5, 5])

    // Strict increasing: equal elements do NOT extend the LIS
    expect(length).toBe(1)
    expect(subsequence).toHaveLength(1)
    expect(subsequence[0]).toBe(5)

    // Every dp entry must be 1 (no pair satisfies arr[j] < arr[i])
    expect(dp).toEqual([1, 1, 1])
  })

  it('empty input [] returns length 0 and empty subsequence', () => {
    const { length, subsequence, dp } = computeLIS([])

    expect(length).toBe(0)
    expect(subsequence).toEqual([])
    expect(dp).toEqual([])
  })

  it('single-element [42] returns length 1 with that element', () => {
    const { length, subsequence, dp } = computeLIS([42])

    expect(length).toBe(1)
    expect(subsequence).toEqual([42])
    expect(dp).toEqual([1])
  })

  it('already sorted [1, 2, 3, 4, 5] has LIS length equal to full array', () => {
    const arr = [1, 2, 3, 4, 5]
    const { length, subsequence } = computeLIS(arr)

    expect(length).toBe(arr.length)
    expect(subsequence).toEqual(arr)
  })

  it('strictly decreasing [5, 4, 3, 2, 1] has LIS length 1', () => {
    const { length, dp } = computeLIS([5, 4, 3, 2, 1])

    expect(length).toBe(1)
    // Every dp entry is 1 — no element can extend another
    expect(dp.every((v) => v === 1)).toBe(true)
  })
})

// ─── generateLISSteps (replay module) ────────────────────────────────────────

describe('generateLISSteps — replay module', () => {
  it('returns an object with steps, dp, and arr', () => {
    const result = generateLISSteps([3, 1, 4, 1, 5])

    expect(result).toHaveProperty('steps')
    expect(result).toHaveProperty('dp')
    expect(result).toHaveProperty('arr')
  })

  it('produces at least one step for a non-trivial input', () => {
    const { steps } = generateLISSteps([10, 9, 2, 5, 3, 7, 101, 18])

    expect(steps.length).toBeGreaterThan(0)
  })

  it('every step carries the required fields', () => {
    const { steps } = generateLISSteps([2, 3, 1, 4])

    for (const step of steps) {
      expect(step).toHaveProperty('dp')
      expect(step).toHaveProperty('arr')
      expect(step).toHaveProperty('phase')
      expect(Array.isArray(step.dp)).toBe(true)
      expect(Array.isArray(step.arr)).toBe(true)
    }
  })

  it('returns empty steps and a dp of [1] for a single-element array', () => {
    const { steps, dp } = generateLISSteps([7])

    // A single element has no pair to compare, so no steps are emitted
    expect(steps).toEqual([])
    expect(dp).toEqual([1])
  })

  it('returns empty steps and an empty dp for an empty array', () => {
    const { steps, dp } = generateLISSteps([])

    expect(steps).toEqual([])
    expect(dp).toEqual([])
  })
})

