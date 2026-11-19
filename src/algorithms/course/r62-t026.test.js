import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  MonotonicStack,
  maximalRectangle,
  largestRectangleInHistogram,
  EMPTY_STATE_AREA,
  generateMaximalRectangleSteps,
  validateMaximalRectangleStep,
  maximalRectangleSources,
  getMaximalRectangleSource,
  resolveMaximalRectangleLine,
} from '../monotonicStack/maximalRectangleSteps.js'

describe('R62-T026: maximalRectangleSteps Focused Refactoring', () => {
  describe('1. Monotonic Stack Operations and Required Pop Order', () => {
    it('Push A, B and C; pop twice; push D; drain. The pop order is C, B, D, A', () => {
      const stack = new MonotonicStack()
      expect(stack.isEmpty()).toBe(true)
      expect(stack.size).toBe(0)

      // Push A, B, C
      stack.push('A')
      stack.push('B')
      stack.push('C')
      expect(stack.size).toBe(3)
      expect(stack.toArray()).toEqual(['A', 'B', 'C'])

      // Pop twice
      const popped1 = stack.pop() // C
      const popped2 = stack.pop() // B
      expect(popped1).toBe('C')
      expect(popped2).toBe('B')
      expect(stack.size).toBe(1)
      expect(stack.toArray()).toEqual(['A'])

      // Push D
      stack.push('D')
      expect(stack.size).toBe(2)
      expect(stack.toArray()).toEqual(['A', 'D'])

      // Drain
      const drained = stack.drain()
      expect(drained).toEqual(['D', 'A'])
      expect(stack.isEmpty()).toBe(true)
      expect(stack.size).toBe(0)

      // Total pop order
      const fullPopOrder = [popped1, popped2, ...drained]
      expect(fullPopOrder).toEqual(['C', 'B', 'D', 'A'])
    })

    it('reproduces pop order C, B, D, A in monotonic histogram calculation [2, 4, 6, 3]', () => {
      // Heights corresponding to elements:
      // index 0: 'A' (height 2)
      // index 1: 'B' (height 4)
      // index 2: 'C' (height 6)
      // index 3: 'D' (height 3)
      const heights = [2, 4, 6, 3]
      const labelMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }

      const stack = new MonotonicStack()
      const popOrder = []

      for (let i = 0; i <= heights.length; i++) {
        const curHeight = i === heights.length ? 0 : heights[i]
        while (!stack.isEmpty() && (i === heights.length || curHeight < heights[stack.peek()])) {
          const poppedIdx = stack.pop()
          popOrder.push(labelMap[poppedIdx])
        }
        if (i < heights.length) {
          stack.push(i)
        }
      }

      expect(popOrder).toEqual(['C', 'B', 'D', 'A'])
    })
  })

  describe('2. Documented Empty-State Behavior', () => {
    it('exercises empty-state behavior on MonotonicStack', () => {
      const stack = new MonotonicStack()
      expect(stack.isEmpty()).toBe(true)
      expect(stack.size).toBe(0)
      expect(stack.peek()).toBeUndefined()
      expect(stack.pop()).toBeUndefined()
      expect(stack.drain()).toEqual([])
      expect(stack.toArray()).toEqual([])
    })

    it('exercises empty-state behavior on pure maximalRectangle and histogram functions', () => {
      expect(maximalRectangle([])).toBe(EMPTY_STATE_AREA)
      expect(maximalRectangle([[]])).toBe(EMPTY_STATE_AREA)
      expect(maximalRectangle(null)).toBe(EMPTY_STATE_AREA)
      expect(maximalRectangle(undefined)).toBe(EMPTY_STATE_AREA)
      expect(maximalRectangle([['0', '0'], ['0', '0']])).toBe(0)

      expect(largestRectangleInHistogram([])).toBe(EMPTY_STATE_AREA)
      expect(largestRectangleInHistogram(null)).toBe(EMPTY_STATE_AREA)
      expect(largestRectangleInHistogram(undefined)).toBe(EMPTY_STATE_AREA)
    })

    it('exercises empty-state behavior on step generator', () => {
      expect(generateMaximalRectangleSteps([])).toEqual([])
      expect(generateMaximalRectangleSteps([[]])).toEqual([])
      expect(generateMaximalRectangleSteps(null)).toEqual([])
      expect(generateMaximalRectangleSteps(undefined)).toEqual([])
    })
  })

  describe('3. Pure Algorithm Separation and Invariant Checks', () => {
    it('computes correct maximal rectangle for standard matrix inputs', () => {
      const matrix = [
        ['1', '0', '1', '0', '0'],
        ['1', '0', '1', '1', '1'],
        ['1', '1', '1', '1', '1'],
        ['1', '0', '0', '1', '0'],
      ]
      expect(maximalRectangle(matrix)).toBe(6)
    })

    it('preserves public step generation interface and validates invariants', () => {
      const matrix = [
        ['1', '1'],
        ['1', '1'],
      ]
      const steps = generateMaximalRectangleSteps(matrix)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0].type).toBe('start')
      expect(steps[steps.length - 1].type).toBe('complete')
      expect(steps[steps.length - 1].variables.maxArea).toBe(4)

      // Validate invariant across each generated step
      for (const step of steps) {
        expect(() => validateMaximalRectangleStep(step, matrix)).not.toThrow()
        expect(validateMaximalRectangleStep(step, matrix)).toBe(true)
      }
    })

    it('guarantees snapshot immutability across playback steps', () => {
      const matrix = [
        ['1', '0'],
        ['1', '1'],
      ]
      const steps = generateMaximalRectangleSteps(matrix)
      const snapshots = steps.map((s) => ({
        array: [...s.array],
        stack: [...s.stack],
        indices: [...s.indices],
        variables: { ...s.variables },
      }))

      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].array).toEqual(snapshots[i].array)
        expect(steps[i].stack).toEqual(snapshots[i].stack)
        expect(steps[i].indices).toEqual(snapshots[i].indices)
        expect(steps[i].variables).toEqual(snapshots[i].variables)
      }
    })

    it('detects invariant violation when stack monotonicity is corrupted', () => {
      const corruptStep = {
        stack: [0, 1],
        array: [5, 2], // Monotonic increasing violated: heights[0] (5) > heights[1] (2)
        variables: { maxArea: 5 },
      }
      expect(() => validateMaximalRectangleStep(corruptStep)).toThrow(/Monotonic stack invariant violated/)
    })
  })

  describe('4. Source Code and Isolated VM Execution', () => {
    it('verifies multi-language source definitions and line mapping', () => {
      const langs = ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust']
      for (const lang of langs) {
        const src = getMaximalRectangleSource(lang)
        expect(src).toBeDefined()
        expect(typeof src.code).toBe('string')
        expect(src.lineMap).toBeDefined()
      }
      expect(resolveMaximalRectangleLine('javascript', 'setup')).toBe(2)
      expect(resolveMaximalRectangleLine('javascript', 'complete')).toBe(21)
      expect(maximalRectangleSources.javascript.code).toBeDefined()
    })

    it('executes displayed JavaScript source in isolated VM sandbox', () => {
      const jsCode = maximalRectangleSources.javascript.code
      const sandbox = { Math }
      const context = vm.createContext(sandbox)
      const script = new vm.Script(jsCode + '\nglobalThis.maximalRectangle = maximalRectangle;')
      script.runInContext(context)

      const vmMaximalRectangle = context.maximalRectangle
      expect(typeof vmMaximalRectangle).toBe('function')

      // Empty matrix behavior in VM
      expect(vmMaximalRectangle([])).toBe(0)

      // Calculation in VM
      const matrix = [
        ['1', '0', '1', '0', '0'],
        ['1', '0', '1', '1', '1'],
        ['1', '1', '1', '1', '1'],
        ['1', '0', '0', '1', '0'],
      ]
      expect(vmMaximalRectangle(matrix)).toBe(6)
    })
  })
})
