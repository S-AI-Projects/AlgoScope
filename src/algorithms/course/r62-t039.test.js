import { describe, expect, it } from 'vitest'
import { sortDutchNationalFlag } from './dutch-national-flag.js'

describe('Dutch national flag operation-count experiment', () => {
  it('sorts the fixture in one pass and reports bounded work at three sizes', () => {
    const sample = sortDutchNationalFlag([2, 0, 1, 2, 0])
    expect(sample.result).toEqual([0, 0, 1, 2, 2])
    expect(sample.steps).toBeLessThanOrEqual(5)

    const counts = [5, 8, 12].map((size) => {
      const input = Array.from({ length: size }, (_, index) => (index * 7 + 3) % 3)
      const run = sortDutchNationalFlag(input)
      expect(run.result).toEqual([...input].sort())
      expect(run.steps).toBeLessThanOrEqual(size)
      expect(run.comparisons).toBeLessThanOrEqual(size * 2)
      expect(run.swaps).toBeLessThanOrEqual(size)
      return { size, steps: run.steps, comparisons: run.comparisons, swaps: run.swaps }
    })
    expect(counts.map(({ size }) => size)).toEqual([5, 8, 12])
  })

  it('rejects values outside 0, 1, and 2', () => {
    expect(() => sortDutchNationalFlag([2, 0, 3, 1])).toThrow(
      'Dutch national flag input must contain only 0, 1, and 2'
    )
  })
})
