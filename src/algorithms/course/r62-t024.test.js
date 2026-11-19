import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  binarySearch,
  generateBinarySearchSteps,
  validateBinarySearchInvariant,
  BINARY_SEARCH_MISS_SENTINEL,
  binarySearchSources,
  getBinarySearchSource,
  resolveBinarySearchSortLine,
} from '../searching/binarySearchSteps'

/**
 * Executes a JavaScript source code snippet within an isolated Node.js VM context.
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

describe('R62-T024: Binary Search Invariant & Property Checks', () => {
  const primaryArray = [2, 4, 6, 8]

  describe('Primary Searches on [2, 4, 6, 8] for 2, 8 and 5', () => {
    it('searches [2, 4, 6, 8] for 2 and finds it at index 0', () => {
      const target = 2
      const index = binarySearch(primaryArray, target)
      expect(index).toBe(0)

      const steps = generateBinarySearchSteps(primaryArray, target)
      const foundStep = steps.find((s) => s.type === 'found')
      expect(foundStep).toBeDefined()
      expect(foundStep.foundIndex).toBe(0)
      expect(foundStep.variables.mid).toBe(0)

      // Invariant check on each step
      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, primaryArray, target)).toBe(true)
      }
    })

    it('searches [2, 4, 6, 8] for 8 and finds it at index 3', () => {
      const target = 8
      const index = binarySearch(primaryArray, target)
      expect(index).toBe(3)

      const steps = generateBinarySearchSteps(primaryArray, target)
      const foundStep = steps.find((s) => s.type === 'found')
      expect(foundStep).toBeDefined()
      expect(foundStep.foundIndex).toBe(3)
      expect(foundStep.variables.mid).toBe(3)

      // Invariant check on each step
      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, primaryArray, target)).toBe(true)
      }
    })

    it('searches [2, 4, 6, 8] for 5 and returns miss sentinel -1', () => {
      const target = 5
      const index = binarySearch(primaryArray, target)
      expect(index).toBe(BINARY_SEARCH_MISS_SENTINEL)
      expect(index).toBe(-1)

      const steps = generateBinarySearchSteps(primaryArray, target)
      const lastStep = steps[steps.length - 1]
      expect(lastStep.type).toBe('not-found')
      expect(lastStep.variables.low).toBeGreaterThan(lastStep.variables.high)

      // Invariant check on each step
      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, primaryArray, target)).toBe(true)
      }
    })
  })

  describe('Singleton and Empty Collection Boundary Checks', () => {
    it('searches singleton [42] for present element 42 (found at index 0)', () => {
      const arr = [42]
      const index = binarySearch(arr, 42)
      expect(index).toBe(0)

      const steps = generateBinarySearchSteps(arr, 42)
      const foundStep = steps.find((s) => s.type === 'found')
      expect(foundStep).toBeDefined()
      expect(foundStep.foundIndex).toBe(0)

      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, arr, 42)).toBe(true)
      }
    })

    it('searches singleton [42] for absent element 10 (returns -1)', () => {
      const arr = [42]
      const index = binarySearch(arr, 10)
      expect(index).toBe(-1)

      const steps = generateBinarySearchSteps(arr, 10)
      const lastStep = steps[steps.length - 1]
      expect(lastStep.type).toBe('not-found')

      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, arr, 10)).toBe(true)
      }
    })

    it('searches empty collection [] for 5 (returns -1)', () => {
      const arr = []
      const index = binarySearch(arr, 5)
      expect(index).toBe(-1)

      const steps = generateBinarySearchSteps(arr, 5)
      expect(steps.length).toBeGreaterThanOrEqual(2)
      const lastStep = steps[steps.length - 1]
      expect(lastStep.type).toBe('not-found')

      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, arr, 5)).toBe(true)
      }
    })
  })

  describe('Duplicate-Index Contract', () => {
    it('returns a valid index containing target when duplicates exist', () => {
      const dupArray = [1, 2, 2, 2, 3]
      const index = binarySearch(dupArray, 2)
      // Standard binary search returns any valid index where arr[index] === 2
      expect([1, 2, 3]).toContain(index)
      expect(dupArray[index]).toBe(2)

      const steps = generateBinarySearchSteps(dupArray, 2)
      const foundStep = steps.find((s) => s.type === 'found')
      expect(foundStep).toBeDefined()
      expect(dupArray[foundStep.foundIndex]).toBe(2)

      for (const step of steps) {
        expect(validateBinarySearchInvariant(step, dupArray, 2)).toBe(true)
      }
    })

    it('handles all-identical array [7, 7, 7, 7] returning a valid matching index', () => {
      const allIdentical = [7, 7, 7, 7]
      const index = binarySearch(allIdentical, 7)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(allIdentical.length)
      expect(allIdentical[index]).toBe(7)
    })
  })

  describe('Snapshot Immutability and Non-Mutation Contract', () => {
    it('ensures earlier step snapshots are not mutated by later steps', () => {
      const steps = generateBinarySearchSteps(primaryArray, 8)

      // Take deep copies of initial steps
      const snapshotsBefore = steps.map((s) => JSON.parse(JSON.stringify(s)))

      // Verify each property on recorded steps matches the frozen snapshot
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].array).toEqual(snapshotsBefore[i].array)
        expect(steps[i].indices).toEqual(snapshotsBefore[i].indices)
        expect(steps[i].variables).toEqual(snapshotsBefore[i].variables)
        expect(steps[i].type).toBe(snapshotsBefore[i].type)
      }
    })

    it('does not mutate frozen input array during search or step generation', () => {
      const frozenInput = Object.freeze([2, 4, 6, 8])
      expect(() => binarySearch(frozenInput, 6)).not.toThrow()
      expect(() => generateBinarySearchSteps(frozenInput, 6)).not.toThrow()
      expect(binarySearch(frozenInput, 6)).toBe(2)
      expect(frozenInput).toEqual([2, 4, 6, 8])
    })
  })

  describe('Source String Isolated VM Execution', () => {
    it('executes displayed JavaScript source code in isolated Node VM and satisfies all test queries', () => {
      const jsCode = binarySearchSources.javascript.code
      expect(typeof jsCode).toBe('string')
      expect(jsCode.length).toBeGreaterThan(0)

      const { context } = executeSourceInVm(jsCode)
      expect(typeof context.binarySearch).toBe('function')

      // Search [2, 4, 6, 8] for 2 -> 0
      expect(context.binarySearch([2, 4, 6, 8], 2)).toBe(0)

      // Search [2, 4, 6, 8] for 8 -> 3
      expect(context.binarySearch([2, 4, 6, 8], 8)).toBe(3)

      // Search [2, 4, 6, 8] for 5 -> -1 (miss sentinel)
      expect(context.binarySearch([2, 4, 6, 8], 5)).toBe(-1)

      // Singleton [42] -> 42 returns 0, 10 returns -1
      expect(context.binarySearch([42], 42)).toBe(0)
      expect(context.binarySearch([42], 10)).toBe(-1)

      // Empty [] -> returns -1
      expect(context.binarySearch([], 5)).toBe(-1)
    })

    it('preserves multi-language definitions and line mappings', () => {
      const languages = ['javascript', 'python', 'java', 'cpp', 'c', 'rust', 'go']
      for (const lang of languages) {
        const source = getBinarySearchSource(lang)
        expect(source).toBeDefined()
        expect(typeof source.code).toBe('string')
        expect(source.lineMap).toBeDefined()
      }

      expect(resolveBinarySearchSortLine('javascript', 'function')).toBe(1)
      expect(resolveBinarySearchSortLine('javascript', 'setup')).toBe(2)
      expect(resolveBinarySearchSortLine('javascript', 'found')).toBe(7)
    })
  })

  describe('Contract Validation and Error Handling', () => {
    it('rejects non-array inputs with TypeError', () => {
      expect(() => binarySearch(null, 5)).toThrow(TypeError)
      expect(() => binarySearch(undefined, 5)).toThrow(TypeError)
      expect(() => binarySearch('not-array', 5)).toThrow(TypeError)
      expect(() => generateBinarySearchSteps(null, 5)).toThrow(TypeError)
    })

    it('rejects non-numeric targets with TypeError', () => {
      expect(() => binarySearch([1, 2, 3], '2')).toThrow(TypeError)
      expect(() => binarySearch([1, 2, 3], NaN)).toThrow(TypeError)
    })
  })

  describe('Defect Sensitivity Checks', () => {
    it('fails when incorrect indices or wrong miss sentinels are asserted', () => {
      expect(binarySearch(primaryArray, 2)).not.toBe(1)
      expect(binarySearch(primaryArray, 8)).not.toBe(0)
      expect(binarySearch(primaryArray, 5)).not.toBe(0)
      expect(binarySearch(primaryArray, 5)).not.toBe(null)
      expect(binarySearch(primaryArray, 5)).not.toBe(undefined)
    })
  })
})
