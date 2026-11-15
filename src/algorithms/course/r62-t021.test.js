import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  computePrefixSums,
  queryRange,
  rangeSum,
  prefixSums,
  generatePrefixSumSteps,
  replayTrace,
  replayOperations,
  prefixSumSources,
  prefixSumMetadata,
} from './prefix-sums'

/**
 * Executes a JavaScript source code snippet within an isolated Node.js VM context,
 * capturing console output while preventing stdout pollution.
 *
 * @param {string} sourceCode - Raw JavaScript source string to execute.
 * @param {number} [timeoutMs=2000] - Execution timeout in milliseconds.
 * @returns {{ logs: Array<any>, context: Object }} Captured logs and execution context.
 */
function executeSourceInVm(sourceCode, timeoutMs = 2000) {
  const logs = []
  const sandbox = {
    console: {
      log: (...args) => {
        logs.push(args.length === 1 ? args[0] : args)
      },
      error: () => {},
      warn: () => {},
      info: () => {},
    },
    Math,
  }

  const context = vm.createContext(sandbox)
  const script = new vm.Script(sourceCode)
  script.runInContext(context, { timeout: timeoutMs })

  return { logs, context }
}

describe('R62-T021: Prefix Sums Contract & Regression Tests', () => {
  describe('Primary Fixture Contract', () => {
    const fixtureInput = [2, -1, 3]

    it('[2,-1,3] has exclusive prefix array [0,2,1,4]; range[1,3) sums to 2', () => {
      const prefix = computePrefixSums(fixtureInput)
      expect(prefix).toEqual([0, 2, 1, 4])

      const sum1to3 = queryRange(prefix, 1, 3)
      expect(sum1to3).toBe(2)

      // Verify via convenience helper rangeSum
      expect(rangeSum(fixtureInput, 1, 3)).toBe(2)
    })

    it('verifies all subranges of the primary fixture [2, -1, 3]', () => {
      const prefix = computePrefixSums(fixtureInput)

      // range [0, 0) is empty -> sum 0
      expect(queryRange(prefix, 0, 0)).toBe(0)
      // range [0, 1) -> elements [2] -> 2
      expect(queryRange(prefix, 0, 1)).toBe(2)
      // range [0, 2) -> elements [2, -1] -> 1
      expect(queryRange(prefix, 0, 2)).toBe(1)
      // range [0, 3) -> elements [2, -1, 3] -> 4
      expect(queryRange(prefix, 0, 3)).toBe(4)
      // range [1, 2) -> elements [-1] -> -1
      expect(queryRange(prefix, 1, 2)).toBe(-1)
      // range [1, 3) -> elements [-1, 3] -> 2
      expect(queryRange(prefix, 1, 3)).toBe(2)
      // range [2, 3) -> elements [3] -> 3
      expect(queryRange(prefix, 2, 3)).toBe(3)
      // range [3, 3) is empty -> sum 0
      expect(queryRange(prefix, 3, 3)).toBe(0)
    })

    it('preserves input non-mutation (frozen array contract)', () => {
      const frozenInput = Object.freeze([2, -1, 3])
      expect(() => computePrefixSums(frozenInput)).not.toThrow()
      expect(computePrefixSums(frozenInput)).toEqual([0, 2, 1, 4])
      expect(frozenInput).toEqual([2, -1, 3])
    })
  })

  describe('Pure Algorithm Runner Wrapper', () => {
    it('returns original array snapshot, prefix array, query closure, and trace steps', () => {
      const result = prefixSums([2, -1, 3])

      expect(result.original).toEqual([2, -1, 3])
      expect(result.original).not.toBe(result.prefix)
      expect(result.prefix).toEqual([0, 2, 1, 4])
      expect(typeof result.query).toBe('function')
      expect(result.query(1, 3)).toBe(2)
      expect(result.query(0, 3)).toBe(4)
      expect(Array.isArray(result.steps)).toBe(true)
      expect(result.steps.length).toBeGreaterThan(0)
    })
  })

  describe('Replay Trace & Animation Step Generators', () => {
    const input = [2, -1, 3]

    it('generates intermediate prefix array snapshots matching replayTrace', () => {
      const trace = replayTrace(input)
      expect(trace).toEqual([
        [0],
        [0, 2],
        [0, 2, 1],
        [0, 2, 1, 4],
      ])
    })

    it('generates structured visualizer steps preserving step distinctions', () => {
      const steps = generatePrefixSumSteps(input, [[1, 3]])

      // Step 0: init
      expect(steps[0]).toMatchObject({
        type: 'init',
        array: [2, -1, 3],
        prefix: [0],
        currentIndex: -1,
      })

      // Step 1: accumulate index 0
      expect(steps[1]).toMatchObject({
        type: 'accumulate',
        currentIndex: 0,
        indices: [0],
        prefix: [0, 2],
        variables: { i: 0, element: 2, prevSum: 0, nextSum: 2 },
      })

      // Step 2: accumulate index 1
      expect(steps[2]).toMatchObject({
        type: 'accumulate',
        currentIndex: 1,
        indices: [1],
        prefix: [0, 2, 1],
        variables: { i: 1, element: -1, prevSum: 2, nextSum: 1 },
      })

      // Step 3: accumulate index 2
      expect(steps[3]).toMatchObject({
        type: 'accumulate',
        currentIndex: 2,
        indices: [2],
        prefix: [0, 2, 1, 4],
        variables: { i: 2, element: 3, prevSum: 1, nextSum: 4 },
      })

      // Step 4: complete
      expect(steps[4]).toMatchObject({
        type: 'complete',
        prefix: [0, 2, 1, 4],
      })

      // Step 5: range query [1, 3)
      expect(steps[5]).toMatchObject({
        type: 'query',
        query: { left: 1, right: 3, sum: 2 },
        indices: [1, 3],
        variables: { left: 1, right: 3, prefixRight: 4, prefixLeft: 2, sum: 2 },
      })
    })

    it('replays batch range queries accurately', () => {
      const queries = [
        [1, 3],
        [0, 2],
        [0, 3],
        [2, 3],
      ]
      const results = replayOperations(input, queries)
      expect(results).toEqual([2, 1, 4, 3])
    })
  })

  describe('Source String Execution & Multi-Language Separation', () => {
    it('executes the displayed JavaScript source string in an isolated VM', () => {
      const jsSource = prefixSumSources.prefixSums.javascript.code
      expect(typeof jsSource).toBe('string')
      expect(jsSource.length).toBeGreaterThan(0)

      const { logs, context } = executeSourceInVm(jsSource)

      expect(logs).toHaveLength(2)
      // logs[0]: prefix array [0, 2, 1, 4]
      expect(Array.from(logs[0])).toEqual([0, 2, 1, 4])
      // logs[1]: range [1, 3) query result 2
      expect(logs[1]).toBe(2)

      // Direct VM context verification
      expect(typeof context.computePrefixSums).toBe('function')
      expect(typeof context.queryRange).toBe('function')
      expect(context.computePrefixSums([2, -1, 3])).toEqual([0, 2, 1, 4])
      expect(context.queryRange([0, 2, 1, 4], 1, 3)).toBe(2)
    })

    it('preserves multi-language source definitions for Python, C++, Java, C, Rust, Go', () => {
      const languages = ['python', 'cpp', 'java', 'c', 'rust', 'go']
      for (const lang of languages) {
        const entry = prefixSumSources.prefixSums[lang]
        expect(entry).toBeDefined()
        expect(typeof entry.code).toBe('string')
        expect(entry.code.trim().length).toBeGreaterThan(0)
        expect(entry.code).toContain('2')
        expect(entry.code).toContain('-1')
        expect(entry.code).toContain('3')
      }
    })

    it('preserves metadata contract and complexity guarantees', () => {
      expect(prefixSumMetadata.name).toBe('Prefix Sums')
      expect(prefixSumMetadata.timeComplexity.preprocessing).toBe('O(n)')
      expect(prefixSumMetadata.timeComplexity.query).toBe('O(1)')
      expect(prefixSumMetadata.spaceComplexity).toBe('O(n)')
      expect(prefixSumMetadata.invariants.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles empty input array []', () => {
      const prefix = computePrefixSums([])
      expect(prefix).toEqual([0])
      expect(queryRange(prefix, 0, 0)).toBe(0)
      expect(replayTrace([])).toEqual([[0]])
    })

    it('handles single element array [42]', () => {
      const prefix = computePrefixSums([42])
      expect(prefix).toEqual([0, 42])
      expect(queryRange(prefix, 0, 1)).toBe(42)
      expect(queryRange(prefix, 0, 0)).toBe(0)
      expect(queryRange(prefix, 1, 1)).toBe(0)
    })

    it('handles all-negative values [-5, -10, -15]', () => {
      const prefix = computePrefixSums([-5, -10, -15])
      expect(prefix).toEqual([0, -5, -15, -30])
      expect(queryRange(prefix, 0, 3)).toBe(-30)
      expect(queryRange(prefix, 1, 3)).toBe(-25)
      expect(queryRange(prefix, 1, 2)).toBe(-10)
    })

    it('handles all zeros [0, 0, 0, 0]', () => {
      const prefix = computePrefixSums([0, 0, 0, 0])
      expect(prefix).toEqual([0, 0, 0, 0, 0])
      expect(queryRange(prefix, 1, 4)).toBe(0)
    })

    it('handles large random array and compares against reference sum', () => {
      const randomArr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const prefix = computePrefixSums(randomArr)

      for (let left = 0; left < randomArr.length; left++) {
        for (let right = left; right <= randomArr.length; right++) {
          const expected = randomArr.slice(left, right).reduce((a, b) => a + b, 0)
          expect(queryRange(prefix, left, right)).toBe(expected)
        }
      }
    })
  })

  describe('Contract Validation and Error Handling', () => {
    it('throws TypeError when input is not an array', () => {
      expect(() => computePrefixSums(null)).toThrow(TypeError)
      expect(() => computePrefixSums(undefined)).toThrow(TypeError)
      expect(() => computePrefixSums('not an array')).toThrow(TypeError)
      expect(() => computePrefixSums(123)).toThrow(TypeError)
    })

    it('throws TypeError when array elements are not finite numbers', () => {
      expect(() => computePrefixSums([1, '2', 3])).toThrow(TypeError)
      expect(() => computePrefixSums([1, NaN, 3])).toThrow(TypeError)
      expect(() => computePrefixSums([1, Infinity, 3])).toThrow(TypeError)
      expect(() => computePrefixSums([1, null, 3])).toThrow(TypeError)
    })

    it('throws RangeError or TypeError on invalid query boundaries', () => {
      const validPrefix = [0, 2, 1, 4]

      // Non-array prefix
      expect(() => queryRange(null, 0, 1)).toThrow(TypeError)

      // Empty prefix
      expect(() => queryRange([], 0, 0)).toThrow(RangeError)

      // Non-integer bounds
      expect(() => queryRange(validPrefix, 0.5, 2)).toThrow(TypeError)
      expect(() => queryRange(validPrefix, 0, '2')).toThrow(TypeError)

      // Negative left bound
      expect(() => queryRange(validPrefix, -1, 2)).toThrow(RangeError)

      // right < left
      expect(() => queryRange(validPrefix, 2, 1)).toThrow(RangeError)

      // right exceeds prefix length - 1
      expect(() => queryRange(validPrefix, 1, 4)).toThrow(RangeError)
      expect(() => queryRange(validPrefix, 0, 5)).toThrow(RangeError)
    })
  })

  describe('Sensitivity and Defect Detection Checks', () => {
    it('fails when an incorrect prefix array is expected', () => {
      const prefix = computePrefixSums([2, -1, 3])
      expect(prefix).not.toEqual([2, -1, 3])
      expect(prefix).not.toEqual([0, 2, 1])
      expect(prefix).not.toEqual([0, 2, 1, 5])
    })

    it('fails when an incorrect range sum is expected', () => {
      const prefix = computePrefixSums([2, -1, 3])
      expect(queryRange(prefix, 1, 3)).not.toBe(4)
      expect(queryRange(prefix, 1, 3)).not.toBe(0)
      expect(queryRange(prefix, 1, 3)).not.toBe(-1)
    })
  })
})
