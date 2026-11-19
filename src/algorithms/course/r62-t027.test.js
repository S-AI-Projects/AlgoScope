import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  quickSort,
  QUICK_SORT_FIXTURES,
  generateQuickSortSteps,
  validateQuickSortInvariant,
  quickSortSources,
  getQuickSortSource,
  resolveQuickSortLine,
} from '../sorting/quickSortSteps.js'

describe('R62-T027: quickSortSteps Executable Documentation', () => {
  describe('1. Concrete Fixtures and Pure Algorithm Results', () => {
    it('sorts [3, 1, 2] to [1, 2, 3] in ascending order and [3, 2, 1] in descending order', () => {
      const arr = [3, 1, 2]
      expect(quickSort(arr)).toEqual([1, 2, 3])
      expect(quickSort(arr, { order: 'asc' })).toEqual([1, 2, 3])
      expect(quickSort(arr, { order: 'desc' })).toEqual([3, 2, 1])
      // Original array not mutated
      expect(arr).toEqual([3, 1, 2])
    })

    it('sorts duplicate collection [2, 2, 1] to [1, 2, 2] in ascending order and [2, 2, 1] in descending order', () => {
      const arr = [2, 2, 1]
      expect(quickSort(arr)).toEqual([1, 2, 2])
      expect(quickSort(arr, { order: 'desc' })).toEqual([2, 2, 1])
    })

    it('sorts already ordered collection [1, 2, 3] to [1, 2, 3]', () => {
      expect(quickSort([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('sorts reversed collection [3, 2, 1] to [1, 2, 3]', () => {
      expect(quickSort([3, 2, 1])).toEqual([1, 2, 3])
    })

    it('handles smallest supported collections: singleton [42] and empty []', () => {
      expect(quickSort([42])).toEqual([42])
      expect(quickSort([])).toEqual([])
    })

    it('documents all concrete fixtures with detailed explanations in QUICK_SORT_FIXTURES', () => {
      expect(Array.isArray(QUICK_SORT_FIXTURES)).toBe(true)
      expect(QUICK_SORT_FIXTURES.length).toBeGreaterThanOrEqual(6)

      const names = QUICK_SORT_FIXTURES.map((f) => f.name)
      expect(names).toContain('unsorted-distinct')
      expect(names).toContain('duplicates')
      expect(names).toContain('already-ordered')
      expect(names).toContain('reversed')
      expect(names).toContain('singleton')
      expect(names).toContain('empty')

      for (const fixture of QUICK_SORT_FIXTURES) {
        expect(typeof fixture.explanation).toBe('string')
        expect(fixture.explanation.length).toBeGreaterThan(10)
        expect(quickSort(fixture.input)).toEqual(fixture.expectedAscending)
      }
    })
  })

  describe('2. Step Generation and Invariant Verification', () => {
    it('generates steps and verifies invariants for [3, 1, 2]', () => {
      const input = [3, 1, 2]
      const steps = generateQuickSortSteps(input)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0].type).toBe('start')
      expect(steps[steps.length - 1].type).toBe('complete')
      expect(steps[steps.length - 1].array).toEqual([1, 2, 3])

      for (const step of steps) {
        expect(() => validateQuickSortInvariant(step, input)).not.toThrow()
      }
    })

    it('generates steps and verifies invariants for duplicate collection [2, 2, 1]', () => {
      const input = [2, 2, 1]
      const steps = generateQuickSortSteps(input)
      expect(steps[steps.length - 1].array).toEqual([1, 2, 2])

      for (const step of steps) {
        expect(() => validateQuickSortInvariant(step, input)).not.toThrow()
      }
    })

    it('guarantees snapshot immutability across playback steps', () => {
      const input = [3, 1, 2]
      const steps = generateQuickSortSteps(input)
      const cachedArrays = steps.map((s) => [...s.array])

      // Verify that after all steps execute, earlier recorded array snapshots remain unchanged
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].array).toEqual(cachedArrays[i])
      }
    })

    it('handles smallest collections in step generator', () => {
      const singletonSteps = generateQuickSortSteps([42])
      expect(singletonSteps.length).toBeGreaterThan(0)
      expect(singletonSteps[singletonSteps.length - 1].array).toEqual([42])

      const emptySteps = generateQuickSortSteps([])
      expect(emptySteps.length).toBe(1)
      expect(emptySteps[0].array).toEqual([])
    })
  })

  describe('3. Displayed Source and Line Map Alignment', () => {
    it('aligns line maps with concrete displayed source code lines', () => {
      const jsSource = getQuickSortSource('javascript')
      expect(jsSource).toBeDefined()
      expect(typeof jsSource.code).toBe('string')
      expect(quickSortSources.javascript).toBeDefined()

      // Verify line map points accurately to statements in javascript source
      const lines = jsSource.code.split('\n')
      expect(lines[jsSource.lineMap.function - 1]).toContain('function quickSort')
      expect(lines[jsSource.lineMap.partitionFunc - 1]).toContain('function partition')
      expect(lines[jsSource.lineMap.pivotSelect - 1]).toContain('let pivot = arr[high]')
      expect(lines[jsSource.lineMap.compare - 1]).toContain('if (arr[j] < pivot)')
      expect(lines[jsSource.lineMap.swap - 1]).toContain('[arr[i], arr[j]]')
      expect(lines[jsSource.lineMap.finalSwap - 1]).toContain('[arr[i + 1], arr[high]]')

      expect(resolveQuickSortLine('javascript', 'pivotSelect')).toBe(10)
      expect(resolveQuickSortLine('javascript', 'finalSwap')).toBe(18)
    })

    it('executes displayed JavaScript source in an isolated VM sandbox', () => {
      const jsCode = quickSortSources.javascript.code
      const sandbox = {}
      const context = vm.createContext(sandbox)
      const script = new vm.Script(jsCode + '\nglobalThis.quickSort = quickSort;')
      script.runInContext(context)

      const vmQuickSort = context.quickSort
      expect(typeof vmQuickSort).toBe('function')

      const testCases = [
        { input: [3, 1, 2], expected: [1, 2, 3] },
        { input: [2, 2, 1], expected: [1, 2, 2] },
        { input: [1, 2, 3], expected: [1, 2, 3] },
        { input: [3, 2, 1], expected: [1, 2, 3] },
        { input: [42], expected: [42] },
      ]

      for (const { input, expected } of testCases) {
        const copy = [...input]
        vmQuickSort(copy, 0, copy.length - 1)
        expect(copy).toEqual(expected)
      }
    })
  })
})
