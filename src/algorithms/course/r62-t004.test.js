import { describe, expect, it } from 'vitest'
import {
  BIT_MAX,
  BIT_WIDTH,
  countSetBits,
} from '../mathTheory/bitManipulation'
import { generatePopulationCountSteps } from '../mathTheory/mathTheorySteps'
import { bitManipSources } from '../mathTheory/mathTheorySources'

const referencePopulationCount = (value) =>
  value.toString(2).replaceAll('0', '').length

describe('8-bit population count trace', () => {
  it('counts 12 (binary 00001100) and preserves the invariant in every step', () => {
    const input = 12
    const expectedCount = 2
    const steps = generatePopulationCountSteps(input)
    const expectedArrays = [
      [0, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
    ]

    expect(BIT_WIDTH).toBe(8)
    expect(BIT_MAX).toBe(255)
    expect(countSetBits(input)).toBe(expectedCount)
    expect(steps.map((step) => step.type)).toEqual([
      'start',
      'compare',
      'compare',
      'complete',
    ])
    expect(steps.map((step) => step.array)).toEqual(expectedArrays)
    expect(new Set(steps.map((step) => step.array)).size).toBe(steps.length)

    for (const step of steps) {
      const { count, remaining, invariant } = step.variables
      expect(count + referencePopulationCount(remaining)).toBe(
        referencePopulationCount(input)
      )
      expect(invariant).toBe(expectedCount)
      expect(remaining).toBeGreaterThanOrEqual(0)
      expect(remaining).toBeLessThanOrEqual(BIT_MAX)
    }

    expect(steps.at(-1).variables).toMatchObject({
      input,
      remaining: 0,
      count: expectedCount,
      result: expectedCount,
    })
  })

  it('returns zero for input zero and does not alter earlier snapshots on a later run', () => {
    const firstRun = generatePopulationCountSteps(12)
    const firstRunSnapshots = firstRun.map((step) => [...step.array])
    const zeroSteps = generatePopulationCountSteps(0)

    expect(countSetBits(0)).toBe(0)
    expect(zeroSteps.map((step) => step.type)).toEqual(['start', 'complete'])
    expect(zeroSteps.map((step) => step.array)).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ])
    expect(zeroSteps.at(-1).variables).toMatchObject({
      input: 0,
      remaining: 0,
      count: 0,
      result: 0,
      invariant: 0,
    })
    for (const step of zeroSteps) {
      expect(
        step.variables.count +
          referencePopulationCount(step.variables.remaining)
      ).toBe(referencePopulationCount(0))
      expect(step.variables.invariant).toBe(0)
    }
    expect(firstRun.map((step) => step.array)).toEqual(firstRunSnapshots)
    expect(new Set(zeroSteps.map((step) => step.array)).size).toBe(
      zeroSteps.length
    )
  })

  it('rejects values outside the declared unsigned 8-bit range', () => {
    expect(() => countSetBits(-1)).toThrow(RangeError)
    expect(() => countSetBits(256)).toThrow(RangeError)
    expect(() => countSetBits(1.5)).toThrow(RangeError)
  })

  it('maps each displayed language source to its population-count operation and example', () => {
    for (const [language, source] of Object.entries(bitManipSources)) {
      const lines = source.code.split('\n')
      expect(lines[source.lineMap.popcount - 1], language).toMatch(
        /value\s*&=\s*value\s*-\s*1|remaining\s*&=\s*remaining\s*-\s*1/
      )
      expect(lines[source.lineMap.popcountResult - 1], language).toContain('12')
    }
  })
})
