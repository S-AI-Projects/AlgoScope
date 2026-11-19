import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  countingSort,
  generateCountingSortSteps,
  validateCountingSortInvariant,
  countingSortSources,
  getCountingSortSource,
  resolveCountingSortLine,
} from '../sorting/countingSortSteps.js'

describe('R62-T030: countingSortSteps Mutation-Resistant Tests', () => {
  describe('1. Pure Counting Sort Contract & Ascending/Descending Interfaces', () => {
    it('sorts [3, 1, 2] to [1, 2, 3] (ascending) and [3, 2, 1] (descending)', () => {
      const arr = [3, 1, 2]
      expect(countingSort(arr)).toEqual([1, 2, 3])
      expect(countingSort(arr, { order: 'asc' })).toEqual([1, 2, 3])
      expect(countingSort(arr, { order: 'desc' })).toEqual([3, 2, 1])
      // Input array immutability
      expect(arr).toEqual([3, 1, 2])
    })

    it('sorts duplicate collection [2, 2, 1] to [1, 2, 2] (ascending) and [2, 2, 1] (descending)', () => {
      const arr = [2, 2, 1]
      expect(countingSort(arr)).toEqual([1, 2, 2])
      expect(countingSort(arr, { order: 'desc' })).toEqual([2, 2, 1])
    })

    it('sorts already ordered collection [1, 2, 3] to [1, 2, 3]', () => {
      expect(countingSort([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('sorts reversed collection [3, 2, 1] to [1, 2, 3]', () => {
      expect(countingSort([3, 2, 1])).toEqual([1, 2, 3])
    })

    it('handles smallest supported collections: singleton [42] and empty []', () => {
      expect(countingSort([42])).toEqual([42])
      expect(countingSort([])).toEqual([])
    })

    it('validates input: throws TypeError on negative or non-integer elements', () => {
      expect(() => countingSort([-1, 2])).toThrow(TypeError)
      expect(() => countingSort([1.5, 2])).toThrow(TypeError)
      expect(() => countingSort('invalid')).toThrow(TypeError)
    })
  })

  describe('2. Mutation-Resistant Regression: Rejection of Decisive Operation Mutants', () => {
    // Mutant 1: One-condition mutant on decisive placement index:
    // Uses pos = count[val] instead of count[val] - 1
    function mutantDecisiveIndex(arr) {
      const n = arr.length
      if (n <= 1) return [...arr]
      const max = Math.max(...arr)
      const count = new Array(max + 1).fill(0)
      for (let i = 0; i < n; i++) count[arr[i]]++
      for (let i = 1; i <= max; i++) count[i] += count[i - 1]
      const output = new Array(n)
      for (let i = n - 1; i >= 0; i--) {
        const val = arr[i]
        const pos = count[val] // MUTANT: omitted - 1
        output[pos] = val
        count[val]--
      }
      return output
    }

    // Mutant 2: One-condition mutant on prefix sum boundary:
    // Uses i < max instead of i <= max
    function mutantPrefixSumBoundary(arr) {
      const n = arr.length
      if (n <= 1) return [...arr]
      const max = Math.max(...arr)
      const count = new Array(max + 1).fill(0)
      for (let i = 0; i < n; i++) count[arr[i]]++
      for (let i = 1; i < max; i++) count[i] += count[i - 1] // MUTANT: < instead of <=
      const output = new Array(n)
      for (let i = n - 1; i >= 0; i--) {
        const val = arr[i]
        const pos = count[val] - 1
        output[pos] = val
        count[val]--
      }
      return output
    }

    // Mutant 3: Decisive decrement mutant:
    // Omits count[val]-- in placement loop
    function mutantOmittedDecrement(arr) {
      const n = arr.length
      if (n <= 1) return [...arr]
      const max = Math.max(...arr)
      const count = new Array(max + 1).fill(0)
      for (let i = 0; i < n; i++) count[arr[i]]++
      for (let i = 1; i <= max; i++) count[i] += count[i - 1]
      const output = new Array(n)
      for (let i = n - 1; i >= 0; i--) {
        const val = arr[i]
        const pos = count[val] - 1
        output[pos] = val
        // MUTANT: omitted count[val]--
      }
      return output
    }

    it('rejects Mutant 1 (decisive index off-by-one: pos = count[val])', () => {
      const mutatedResult = mutantDecisiveIndex([3, 1, 2])
      // Mutant places elements outside 0..n-1 range, leaving output[0] undefined
      expect(mutatedResult).not.toEqual([1, 2, 3])
      expect(mutatedResult[0]).toBeUndefined()
    })

    it('rejects Mutant 2 (prefix sum boundary: i < max instead of i <= max)', () => {
      const mutatedResult = mutantPrefixSumBoundary([3, 1, 2])
      // Prefix sum for max (3) was never calculated, causing element 3 to be misplaced
      expect(mutatedResult).not.toEqual([1, 2, 3])
    })

    it('rejects Mutant 3 (omitted decrement on decisive count update)', () => {
      const mutatedResult = mutantOmittedDecrement([2, 2, 1])
      // Duplicate 2 overwrites same position, leaving a slot empty/undefined
      expect(mutatedResult).not.toEqual([1, 2, 2])
      expect(mutatedResult.filter((x) => x !== undefined)).not.toHaveLength(3)
    })
  })

  describe('3. Step Generation & Invariant Validation', () => {
    it('generates steps and validates invariants for [3, 1, 2]', () => {
      const input = [3, 1, 2]
      const steps = generateCountingSortSteps(input)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0].type).toBe('start')
      expect(steps[steps.length - 1].type).toBe('complete')
      expect(steps[steps.length - 1].array).toEqual([1, 2, 3])

      for (const step of steps) {
        expect(() => validateCountingSortInvariant(step, input)).not.toThrow()
      }
    })

    it('generates steps and validates invariants for duplicate array [2, 2, 1]', () => {
      const input = [2, 2, 1]
      const steps = generateCountingSortSteps(input)
      expect(steps[steps.length - 1].array).toEqual([1, 2, 2])

      for (const step of steps) {
        expect(() => validateCountingSortInvariant(step, input)).not.toThrow()
      }
    })

    it('guarantees snapshot immutability across playback steps', () => {
      const input = [3, 1, 2]
      const steps = generateCountingSortSteps(input)
      const cached = steps.map((s) => [...s.array])

      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].array).toEqual(cached[i])
      }
    })

    it('handles smallest collections: empty [] and singleton [42]', () => {
      const emptySteps = generateCountingSortSteps([])
      expect(emptySteps.length).toBe(1)
      expect(emptySteps[0].array).toEqual([])

      const singletonSteps = generateCountingSortSteps([42])
      expect(singletonSteps.length).toBeGreaterThan(0)
      expect(singletonSteps[singletonSteps.length - 1].array).toEqual([42])
    })
  })

  describe('4. Displayed Source Strings and Isolated VM Execution', () => {
    it('verifies line map mapping for counting sort sources', () => {
      expect(countingSortSources.javascript).toBeDefined()
      expect(countingSortSources.python).toBeDefined()
      expect(resolveCountingSortLine('javascript', 'prefixSum')).toBe(8)
      expect(resolveCountingSortLine('javascript', 'placeElements')).toBe(12)
      expect(getCountingSortSource('javascript').code).toContain('function countingSort(arr)')
    })

    it('executes displayed JavaScript source in an isolated VM sandbox', () => {
      const jsCode = countingSortSources.javascript.code
      const sandbox = { Math }
      const context = vm.createContext(sandbox)
      const script = new vm.Script(jsCode + '\nglobalThis.countingSort = countingSort;')
      script.runInContext(context)

      const vmCountingSort = context.countingSort
      expect(typeof vmCountingSort).toBe('function')

      const a1 = [3, 1, 2]
      vmCountingSort(a1)
      expect(a1).toEqual([1, 2, 3])

      const a2 = [2, 2, 1]
      vmCountingSort(a2)
      expect(a2).toEqual([1, 2, 2])

      const a3 = [1, 2, 3]
      vmCountingSort(a3)
      expect(a3).toEqual([1, 2, 3])

      const a4 = [3, 2, 1]
      vmCountingSort(a4)
      expect(a4).toEqual([1, 2, 3])
    })
  })
})
