import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  gcd,
  euclidGCD,
  generateEuclidGCDSteps,
  replayTrace,
  independentReferenceGCD,
  naiveSubtractionGCD,
  ZERO_INPUT_POLICY,
  euclidGCDSources,
  euclidGCDMetadata,
} from './euclid-gcd-steps'

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

describe('R62-T023: Euclid GCD Steps & Independent Reference Comparison', () => {
  describe('Primary Fixture Contract (54, 24)', () => {
    it('(54, 24) produces remainders [6, 0] and GCD 6', () => {
      const result = euclidGCD(54, 24)

      // Expected remainders sequence: 54 % 24 = 6, 24 % 6 = 0
      expect(result.remainders).toEqual([6, 0])
      expect(result.quotients).toEqual([2, 4])
      expect(result.gcd).toBe(6)
      expect(gcd(54, 24)).toBe(6)

      // Step verification
      const finalStep = result.steps[result.steps.length - 1]
      expect(finalStep.type).toBe('complete')
      expect(finalStep.variables.result).toBe(6)
    })

    it('matches hand-calculated step-by-step Euclidean division', () => {
      // Hand calculation:
      // Round 1: 54 = 2 * 24 + 6
      // Round 2: 24 = 4 * 6 + 0
      const trace = replayTrace(54, 24)
      expect(trace).toHaveLength(2)

      expect(trace[0]).toEqual({ x: 54, y: 24, remainder: 6 })
      expect(trace[1]).toEqual({ x: 24, y: 6, remainder: 0 })
    })

    it('reverses argument order (24, 54) to reach same remainders and GCD', () => {
      const result = euclidGCD(24, 54)
      // 24 % 54 = 24, then 54 % 24 = 6, then 24 % 6 = 0
      expect(result.remainders).toEqual([24, 6, 0])
      expect(result.gcd).toBe(6)
    })
  })

  describe('Zero-Input Policy', () => {
    it('evaluates gcd(a, 0) = |a| and gcd(0, b) = |b|', () => {
      expect(gcd(54, 0)).toBe(54)
      expect(gcd(0, 24)).toBe(24)
      expect(gcd(-42, 0)).toBe(42)
      expect(gcd(0, -99)).toBe(99)

      const resA = euclidGCD(54, 0)
      expect(resA.gcd).toBe(54)
      expect(resA.remainders).toEqual([])

      const resB = euclidGCD(0, 24)
      expect(resB.gcd).toBe(24)
    })

    it('evaluates gcd(0, 0) = 0 according to standard policy', () => {
      expect(gcd(0, 0)).toBe(0)
      expect(euclidGCD(0, 0).gcd).toBe(0)
      expect(ZERO_INPUT_POLICY.evaluateZero(0, 0)).toBe(0)
    })

    it('evaluates negative inputs using absolute values', () => {
      expect(gcd(-54, 24)).toBe(6)
      expect(gcd(54, -24)).toBe(6)
      expect(gcd(-54, -24)).toBe(6)
      expect(euclidGCD(-54, 24).gcd).toBe(6)
    })
  })

  describe('Independent Reference Comparison', () => {
    const testCases = [
      [54, 24],
      [48, 18],
      [100, 25],
      [35, 64], // coprime
      [17, 19], // both prime
      [1, 1],
      [270, 192],
      [1071, 462],
      [123456, 7890],
      [0, 15],
      [15, 0],
      [0, 0],
    ]

    it('agrees with independent brute-force common divisor search across all test pairs', () => {
      for (const [a, b] of testCases) {
        const euclidResult = gcd(a, b)
        const refResult = independentReferenceGCD(a, b)
        expect(euclidResult).toBe(refResult)
      }
    })

    it('agrees with naive subtraction-based Euclidean GCD across non-zero pairs', () => {
      const nonZeroCases = testCases.filter(([a, b]) => a !== 0 && b !== 0)
      for (const [a, b] of nonZeroCases) {
        const euclidResult = gcd(a, b)
        const naiveResult = naiveSubtractionGCD(a, b)
        expect(euclidResult).toBe(naiveResult)
      }
    })

    it('verifies randomized integer pairs against independent reference', () => {
      for (let i = 0; i < 20; i++) {
        const a = Math.floor(Math.random() * 1000)
        const b = Math.floor(Math.random() * 1000)
        expect(gcd(a, b)).toBe(independentReferenceGCD(a, b))
      }
    })
  })

  describe('Trace and Step Player Contract', () => {
    it('generates structured step objects matching AlgoScope convention', () => {
      const steps = generateEuclidGCDSteps(54, 24)

      // Start step
      expect(steps[0]).toMatchObject({
        type: 'start',
        array: [54, 24],
        variables: { a: 54, b: 24 },
      })

      // Modulo comparison step (54 % 24 = 6)
      expect(steps[1]).toMatchObject({
        type: 'compare',
        lineKey: 'modulo',
        variables: { a: 54, b: 24, quotient: 2, remainder: 6 },
      })

      // Swap / assign step -> (24, 6)
      expect(steps[2]).toMatchObject({
        type: 'swap',
        lineKey: 'assign',
        array: [24, 6],
      })

      // Complete step
      const finalStep = steps[steps.length - 1]
      expect(finalStep).toMatchObject({
        type: 'complete',
        lineKey: 'result',
        variables: { result: 6 },
      })
    })
  })

  describe('Source String Isolated VM Execution', () => {
    it('executes the displayed JavaScript source string in an isolated VM sandbox', () => {
      const jsSource = euclidGCDSources.javascript.code
      expect(typeof jsSource).toBe('string')
      expect(jsSource.length).toBeGreaterThan(0)

      const { logs, context } = executeSourceInVm(jsSource)

      // Script logs result of gcd(54, 24) -> 6
      expect(logs).toHaveLength(1)
      expect(logs[0]).toBe(6)

      // Function in VM context directly callable
      expect(typeof context.gcd).toBe('function')
      expect(context.gcd(54, 24)).toBe(6)
      expect(context.gcd(48, 18)).toBe(6)
      expect(context.gcd(35, 64)).toBe(1)
    })

    it('preserves multi-language definitions (python, cpp, java, c, rust, go)', () => {
      const languages = ['python', 'cpp', 'java', 'c', 'rust', 'go']
      for (const lang of languages) {
        const entry = euclidGCDSources[lang]
        expect(entry).toBeDefined()
        expect(typeof entry.code).toBe('string')
        expect(entry.code.trim().length).toBeGreaterThan(0)
        expect(entry.code).toContain('54')
        expect(entry.code).toContain('24')
      }
    })

    it('preserves metadata contract and complexity guarantees', () => {
      expect(euclidGCDMetadata.name).toBe('Euclidean GCD Algorithm')
      expect(euclidGCDMetadata.timeComplexity).toBe('O(log(min(a, b)))')
      expect(euclidGCDMetadata.spaceComplexity).toBe('O(1)')
      expect(euclidGCDMetadata.zeroInputPolicy).toBeDefined()
    })
  })

  describe('Contract Validation and Error Handling', () => {
    it('rejects non-numeric inputs with TypeError', () => {
      expect(() => gcd('54', 24)).toThrow(TypeError)
      expect(() => gcd(54, null)).toThrow(TypeError)
      expect(() => gcd(undefined, 24)).toThrow(TypeError)
      expect(() => euclidGCD(NaN, 24)).toThrow(TypeError)
    })

    it('rejects non-integer inputs with TypeError', () => {
      expect(() => gcd(54.5, 24)).toThrow(TypeError)
      expect(() => gcd(54, 24.1)).toThrow(TypeError)
      expect(() => euclidGCD(3.14, 2)).toThrow(TypeError)
    })
  })

  describe('Sensitivity and Defect Detection Checks', () => {
    it('fails when incorrect GCD value is expected', () => {
      expect(gcd(54, 24)).not.toBe(12)
      expect(gcd(54, 24)).not.toBe(3)
      expect(gcd(54, 24)).not.toBe(24)
    })

    it('fails when incorrect remainders are expected', () => {
      const result = euclidGCD(54, 24)
      expect(result.remainders).not.toEqual([24, 6])
      expect(result.remainders).not.toEqual([6])
      expect(result.remainders).not.toEqual([6, 1])
    })
  })
})
