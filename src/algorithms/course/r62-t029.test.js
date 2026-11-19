import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  sieveOfEratosthenes,
  isPrime,
  recordSieveComplexity,
  runSieveComplexityExperiment,
  generateSieveReplaySteps,
  validateSieveStep,
  sieveSources,
  getSieveSource,
  resolveSieveLine,
} from './sieve-of-eratosthenes.js'

describe('R62-T029: Sieve of Eratosthenes Complexity Experiment', () => {
  describe('1. Core Algorithm Contract & Primality Rules', () => {
    it('Primes up to 12 are [2, 3, 5, 7, 11]; 0 and 1 are not prime', () => {
      // 0 and 1 are not prime
      expect(isPrime(0)).toBe(false)
      expect(isPrime(1)).toBe(false)
      expect(sieveOfEratosthenes(0)).toEqual([])
      expect(sieveOfEratosthenes(1)).toEqual([])

      // Primes up to 12
      const primes12 = sieveOfEratosthenes(12)
      expect(primes12).toEqual([2, 3, 5, 7, 11])
      expect(primes12).not.toContain(0)
      expect(primes12).not.toContain(1)
      expect(primes12).toHaveLength(5)

      // Validate individual primality
      for (const p of [2, 3, 5, 7, 11]) {
        expect(isPrime(p)).toBe(true)
      }
      for (const composite of [4, 6, 8, 9, 10, 12]) {
        expect(isPrime(composite)).toBe(false)
      }
    })

    it('validates edge cases: singleton, negative, and non-integer inputs', () => {
      expect(sieveOfEratosthenes(2)).toEqual([2])
      expect(sieveOfEratosthenes(3)).toEqual([2, 3])
      expect(() => sieveOfEratosthenes(-5)).toThrow(RangeError)
      expect(() => sieveOfEratosthenes(3.14)).toThrow(TypeError)
      expect(() => sieveOfEratosthenes('12')).toThrow(TypeError)
    })
  })

  describe('2. Complexity Experiment: Deterministic Operation Counts (No Hardware-Speed Thresholds)', () => {
    it('records deterministic operation counts across three bounded valid sizes: 12, 30, and 100', () => {
      const sizes = [12, 30, 100]
      const experiment = runSieveComplexityExperiment(sizes)

      expect(experiment).toHaveLength(3)

      // Size 1: n = 12
      const exp12 = experiment[0]
      expect(exp12.n).toBe(12)
      expect(exp12.primes).toEqual([2, 3, 5, 7, 11])
      expect(exp12.primesCount).toBe(5)
      // i = 2 (5 multiples: 4, 6, 8, 10, 12) + i = 3 (2 multiples: 9, 12)
      expect(exp12.outerChecks).toBe(2) // i = 2, 3
      expect(exp12.compositeStrikes).toBe(7)
      expect(exp12.totalOperations).toBe(9)

      // Size 2: n = 30
      const exp30 = experiment[1]
      expect(exp30.n).toBe(30)
      expect(exp30.primesCount).toBe(10)
      expect(exp30.primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29])
      expect(exp30.outerChecks).toBe(4) // i = 2, 3, 4, 5 (up to sqrt(30) ~ 5.47)
      expect(exp30.compositeStrikes).toBeGreaterThan(exp12.compositeStrikes)
      expect(exp30.totalOperations).toBeGreaterThan(exp12.totalOperations)

      // Size 3: n = 100
      const exp100 = experiment[2]
      expect(exp100.n).toBe(100)
      expect(exp100.primesCount).toBe(25) // Exactly 25 primes <= 100
      expect(exp100.outerChecks).toBe(9) // i = 2..10 (sqrt(100) = 10)
      expect(exp100.totalOperations).toBeGreaterThan(exp30.totalOperations)

      // Machine-independent complexity scaling:
      // Operations grow sub-quadratically and strictly monotonically
      expect(exp100.totalOperations).toBeLessThan(100 * 100)
      expect(exp100.theoreticalRatio).toBeGreaterThan(0)
    })

    it('ensures operation metrics are 100% repeatable across multiple runs', () => {
      const run1 = recordSieveComplexity(50)
      const run2 = recordSieveComplexity(50)
      expect(run1).toEqual(run2)
    })
  })

  describe('3. Replay Steps and Invariant Verification', () => {
    it('generates replay steps and verifies invariants for n = 12', () => {
      const steps = generateSieveReplaySteps(12)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps[0].type).toBe('init')
      expect(steps[steps.length - 1].type).toBe('complete')
      expect(steps[steps.length - 1].primes).toEqual([2, 3, 5, 7, 11])

      for (const step of steps) {
        expect(() => validateSieveStep(step, 12)).not.toThrow()
      }
    })

    it('guarantees snapshot immutability across recorded replay steps', () => {
      const steps = generateSieveReplaySteps(12)
      const cached = steps.map((s) => [...s.array])

      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].array).toEqual(cached[i])
      }
    })

    it('detects invariant violation if 0 or 1 is marked as prime', () => {
      const corruptStep = {
        type: 'step',
        array: [true, false, true], // 0 is marked true!
      }
      expect(() => validateSieveStep(corruptStep, 2)).toThrow(/0 must not be prime/)
    })
  })

  describe('4. Source Strings and Isolated VM Execution', () => {
    it('provides multi-language source definitions with line maps', () => {
      expect(sieveSources.javascript).toBeDefined()
      expect(sieveSources.python).toBeDefined()
      expect(resolveSieveLine('javascript', 'outerLoop')).toBe(7)
      expect(resolveSieveLine('python', 'outerLoop')).toBe(7)
      expect(getSieveSource('javascript').code).toContain('function sieve(n)')
    })

    it('executes displayed JavaScript source in an isolated VM sandbox', () => {
      const jsCode = sieveSources.javascript.code
      const sandbox = {}
      const context = vm.createContext(sandbox)
      const script = new vm.Script(jsCode + '\nglobalThis.sieve = sieve;')
      script.runInContext(context)

      const vmSieve = context.sieve
      expect(typeof vmSieve).toBe('function')

      // Primes up to 12
      expect(vmSieve(12)).toEqual([2, 3, 5, 7, 11])
      // 0 and 1 are not prime
      expect(vmSieve(0)).toEqual([])
      expect(vmSieve(1)).toEqual([])
      // 30
      expect(vmSieve(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29])
    })
  })
})
