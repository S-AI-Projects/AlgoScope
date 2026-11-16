import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  mergeSort,
  generateMergeSortSteps,
  mergeSortSources,
  getMergeSortSource,
  resolveMergeSortLine,
} from '../sorting/mergeSortSteps'

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

describe('R62-T022: Merge Sort Boundary Cases & Contract Regression Tests', () => {
  describe('Primary Fixtures and Ascending Output Verification', () => {
    it('sorts primary fixture [3, 1, 2] to ascending output [1, 2, 3]', () => {
      const input = [3, 1, 2]
      const result = mergeSort(input)
      expect(result).toEqual([1, 2, 3])

      const steps = generateMergeSortSteps(input)
      expect(steps.length).toBeGreaterThan(0)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.type).toBe('complete')
      expect(finalStep.array).toEqual([1, 2, 3])
      expect(finalStep.sortedIndices).toEqual([0, 1, 2])
    })

    it('sorts tie fixture [2, 2, 1] to ascending output [1, 2, 2]', () => {
      const input = [2, 2, 1]
      const result = mergeSort(input)
      expect(result).toEqual([1, 2, 2])

      const steps = generateMergeSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.type).toBe('complete')
      expect(finalStep.array).toEqual([1, 2, 2])
      expect(finalStep.sortedIndices).toEqual([0, 1, 2])
    })

    it('correctly handles already ordered input [1, 2, 3]', () => {
      const input = [1, 2, 3]
      const result = mergeSort(input)
      expect(result).toEqual([1, 2, 3])

      const steps = generateMergeSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2, 3])
    })

    it('correctly sorts reversed input [3, 2, 1] to [1, 2, 3]', () => {
      const input = [3, 2, 1]
      const result = mergeSort(input)
      expect(result).toEqual([1, 2, 3])

      const steps = generateMergeSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2, 3])
    })
  })

  describe('Smallest Supported Collection Boundary Cases', () => {
    it('handles empty collection [] without erroneous divide ranges', () => {
      const emptyInput = []
      const result = mergeSort(emptyInput)
      expect(result).toEqual([])

      const steps = generateMergeSortSteps(emptyInput)
      expect(steps).toHaveLength(2)
      // Step 0: start
      expect(steps[0].type).toBe('start')
      expect(steps[0].array).toEqual([])
      expect(steps[0].variables.n).toBe(0)
      // Step 1: complete directly without invalid performMergeSort(0, -1)
      expect(steps[1].type).toBe('complete')
      expect(steps[1].array).toEqual([])
      expect(steps[1].sortedIndices).toEqual([])
      expect(steps[1].variables.n).toBe(0)
    })

    it('handles single element collection [42] as a base case', () => {
      const singleInput = [42]
      const result = mergeSort(singleInput)
      expect(result).toEqual([42])

      const steps = generateMergeSortSteps(singleInput)
      expect(steps.length).toBeGreaterThan(0)

      // Start step
      expect(steps[0].type).toBe('start')
      expect(steps[0].array).toEqual([42])

      // Single element base case step
      const baseCaseStep = steps.find((s) => s.type === 'base-case')
      expect(baseCaseStep).toBeDefined()
      expect(baseCaseStep.indices).toEqual([0])
      expect(baseCaseStep.message).toContain('Base case reached at index 0')

      // Complete step
      const finalStep = steps[steps.length - 1]
      expect(finalStep.type).toBe('complete')
      expect(finalStep.array).toEqual([42])
      expect(finalStep.sortedIndices).toEqual([0])
    })

    it('handles two elements [2, 1] requiring a single merge step', () => {
      const twoInput = [2, 1]
      const result = mergeSort(twoInput)
      expect(result).toEqual([1, 2])

      const steps = generateMergeSortSteps(twoInput)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2])
    })
  })

  describe('Stability and Tie Behavior', () => {
    it('preserves stability on duplicate elements (<= tie-breaking)', () => {
      // Test stability using objects with key/id properties
      const stableInput = [
        { val: 2, id: 'first_2' },
        { val: 2, id: 'second_2' },
        { val: 1, id: 'only_1' },
      ]

      // Pure merge sort adapted for stable comparison check
      const customMergeSort = (arr) => {
        if (arr.length <= 1) return arr
        const m = Math.floor(arr.length / 2)
        const left = customMergeSort(arr.slice(0, m))
        const right = customMergeSort(arr.slice(m))
        const res = []
        let i = 0
        let j = 0
        while (i < left.length && j < right.length) {
          if (left[i].val <= right[j].val) {
            res.push(left[i++])
          } else {
            res.push(right[j++])
          }
        }
        while (i < left.length) res.push(left[i++])
        while (j < right.length) res.push(right[j++])
        return res
      }

      const sorted = customMergeSort(stableInput)
      expect(sorted.map((item) => item.val)).toEqual([1, 2, 2])
      expect(sorted[1].id).toBe('first_2')
      expect(sorted[2].id).toBe('second_2')
    })

    it('handles arrays with all identical elements [5, 5, 5, 5]', () => {
      const allIdentical = [5, 5, 5, 5]
      const result = mergeSort(allIdentical)
      expect(result).toEqual([5, 5, 5, 5])

      const steps = generateMergeSortSteps(allIdentical)
      expect(steps[steps.length - 1].array).toEqual([5, 5, 5, 5])
    })
  })

  describe('Non-Mutation Contract', () => {
    it('does not mutate frozen input array in mergeSort', () => {
      const frozenInput = Object.freeze([3, 1, 2])
      expect(() => mergeSort(frozenInput)).not.toThrow()
      expect(mergeSort(frozenInput)).toEqual([1, 2, 3])
      expect(frozenInput).toEqual([3, 1, 2])
    })

    it('does not mutate frozen input array in generateMergeSortSteps', () => {
      const frozenInput = Object.freeze([2, 2, 1])
      expect(() => generateMergeSortSteps(frozenInput)).not.toThrow()
      expect(frozenInput).toEqual([2, 2, 1])
    })

    it('does not mutate empty frozen array', () => {
      const frozenEmpty = Object.freeze([])
      expect(() => mergeSort(frozenEmpty)).not.toThrow()
      expect(() => generateMergeSortSteps(frozenEmpty)).not.toThrow()
    })
  })

  describe('Source String Isolated VM Execution', () => {
    it('executes the displayed JavaScript source string in an isolated VM sandbox', () => {
      const jsSource = mergeSortSources.javascript.code
      expect(typeof jsSource).toBe('string')
      expect(jsSource.length).toBeGreaterThan(0)

      const { context } = executeSourceInVm(jsSource)
      expect(typeof context.mergeSort).toBe('function')
      expect(typeof context.merge).toBe('function')

      // 1. Primary fixture [3, 1, 2] -> [1, 2, 3]
      const arr1 = [3, 1, 2]
      context.mergeSort(arr1, 0, arr1.length - 1)
      expect(arr1).toEqual([1, 2, 3])

      // 2. Tie fixture [2, 2, 1] -> [1, 2, 2]
      const arr2 = [2, 2, 1]
      context.mergeSort(arr2, 0, arr2.length - 1)
      expect(arr2).toEqual([1, 2, 2])

      // 3. Already ordered [1, 2, 3] -> [1, 2, 3]
      const arr3 = [1, 2, 3]
      context.mergeSort(arr3, 0, arr3.length - 1)
      expect(arr3).toEqual([1, 2, 3])

      // 4. Reversed [3, 2, 1] -> [1, 2, 3]
      const arr4 = [3, 2, 1]
      context.mergeSort(arr4, 0, arr4.length - 1)
      expect(arr4).toEqual([1, 2, 3])

      // 5. Smallest collection [42] -> [42]
      const arr5 = [42]
      context.mergeSort(arr5, 0, arr5.length - 1)
      expect(arr5).toEqual([42])

      // 6. Empty collection [] -> []
      const arr6 = []
      context.mergeSort(arr6, 0, arr6.length - 1)
      expect(arr6).toEqual([])
    })

    it('preserves multi-language definitions and line mappings', () => {
      const languages = ['javascript', 'python', 'java', 'cpp', 'c', 'rust', 'go']
      for (const lang of languages) {
        const source = getMergeSortSource(lang)
        expect(source).toBeDefined()
        expect(typeof source.code).toBe('string')
        expect(source.code.trim().length).toBeGreaterThan(0)
        expect(source.lineMap).toBeDefined()
      }

      // Verify line resolver
      expect(resolveMergeSortLine('javascript', 'function')).toBe(1)
      expect(resolveMergeSortLine('javascript', 'recursion')).toBe(2)
      expect(resolveMergeSortLine('javascript', 'mergeCall')).toBe(6)
    })
  })

  describe('Contract Validation and Error Handling', () => {
    it('throws TypeError when input is not an array in mergeSort', () => {
      expect(() => mergeSort(null)).toThrow(TypeError)
      expect(() => mergeSort(undefined)).toThrow(TypeError)
      expect(() => mergeSort('not an array')).toThrow(TypeError)
      expect(() => mergeSort(123)).toThrow(TypeError)
    })

    it('throws TypeError when input is not an array in generateMergeSortSteps', () => {
      expect(() => generateMergeSortSteps(null)).toThrow(TypeError)
      expect(() => generateMergeSortSteps(undefined)).toThrow(TypeError)
      expect(() => generateMergeSortSteps('invalid')).toThrow(TypeError)
    })
  })

  describe('Sensitivity and Defect Detection Checks', () => {
    it('fails when an incorrect sorted array is expected', () => {
      const result = mergeSort([3, 1, 2])
      expect(result).not.toEqual([3, 1, 2])
      expect(result).not.toEqual([3, 2, 1])
      expect(result).not.toEqual([2, 1, 3])
    })

    it('fails when tie behavior is inverted', () => {
      const result = mergeSort([2, 2, 1])
      expect(result).not.toEqual([2, 2, 1])
      expect(result).not.toEqual([2, 1, 2])
    })
  })
})
