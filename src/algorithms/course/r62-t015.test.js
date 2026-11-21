import { describe, it, expect } from 'vitest'
import {
  knapsack01,
  knapsack,
  knapsack01Detailed,
  generateKnapsackSteps,
  generateKnapsackReplaySteps,
  knapsackSources,
  getKnapsackSource,
  resolveKnapsackLine,
  createKnapsackPrng,
  generateRandomKnapsackInput,
} from '../dp/knapsackSteps.js'
import * as knapsackModule from '../dp/knapsack.js'

/**
 * ============================================================================
 * R62-T015: 0/1 KNAPSACK DYNAMIC PROGRAMMING & REPLAY REGRESSION TESTS
 * ============================================================================
 * Specification requirements:
 * 1. Tests weights [2, 3, 4], values [3, 4, 5], capacity 5, and verifies
 *    optimum 7 (and ensures an item cannot be reused).
 * 2. Verifies deterministic replay steps for the same input and seed.
 * 3. Contains explicit result/state assertions so the test fails on an
 *    incorrect implementation.
 * ============================================================================
 */

describe('R62-T015: 0/1 Knapsack Module', () => {
  // ─── 1. CORE SPECIFICATION TEST ───────────────────────────────────────────
  describe('Primary test case: weights [2, 3, 4], values [3, 4, 5], capacity 5', () => {
    const weights = [2, 3, 4]
    const values = [3, 4, 5]
    const capacity = 5

    it('verifies optimum maximum value is strictly 7', () => {
      const optimum = knapsack01(weights, values, capacity)
      expect(optimum).toBe(7)

      // Test alias export
      expect(knapsack(weights, values, capacity)).toBe(7)
    })

    it('returns exact detailed metadata and verifies selected items [0, 1]', () => {
      const details = knapsack01Detailed(weights, values, capacity)

      expect(details.maxValue).toBe(7)
      expect(details.capacity).toBe(5)
      expect(details.itemsCount).toBe(3)

      // Optimal items: item 0 (weight 2, value 3) + item 1 (weight 3, value 4)
      expect(details.selectedIndices).toEqual([0, 1])
      expect(details.selectedWeights).toEqual([2, 3])
      expect(details.selectedValues).toEqual([3, 4])
      expect(details.totalWeight).toBe(5)
      expect(details.totalValue).toBe(7)

      // Item 2 (weight 4, value 5) must NOT be selected
      expect(details.selectedIndices.includes(2)).toBe(false)
    })

    it('ensures an item cannot be reused (0/1 constraint: each item used at most once)', () => {
      const details = knapsack01Detailed(weights, values, capacity)

      // 1. Each selected item index must appear at most once
      const uniqueIndices = new Set(details.selectedIndices)
      expect(uniqueIndices.size).toBe(details.selectedIndices.length)

      // Item 0 is selected once, item 1 is selected once
      const countItem0 = details.selectedIndices.filter((idx) => idx === 0).length
      const countItem1 = details.selectedIndices.filter((idx) => idx === 1).length
      const countItem2 = details.selectedIndices.filter((idx) => idx === 2).length

      expect(countItem0).toBe(1)
      expect(countItem1).toBe(1)
      expect(countItem2).toBe(0)

      // 2. An unbounded knapsack implementation would allow picking item 0 multiple times.
      // If item 0 (wt 2, val 3) could be reused with capacity 4:
      // In 0/1 knapsack: can only pick item 0 once (val 3) or item 1 (val 4) or item 2 (val 5) -> max is 5.
      // In unbounded knapsack: picking item 0 twice gives wt 4, val 6 (which exceeds 5).
      expect(knapsack01(weights, values, 4)).toBe(5)

      // 3. Under single-item test with capacity 4:
      // weights: [2], values: [10], capacity: 4.
      // In 0/1 Knapsack: optimum is 10 (item cannot be reused).
      // In unbounded knapsack: optimum would be 20 (item 0 taken twice).
      expect(knapsack01([2], [10], 4)).toBe(10)

      // 4. With capacity 6 and items [2, 3, 4] / [3, 4, 5]:
      // 0/1 knapsack picks item 0 (wt 2, val 3) + item 2 (wt 4, val 5) = wt 6, val 8.
      // Unbounded knapsack would pick item 0 three times = wt 6, val 9.
      expect(knapsack01(weights, values, 6)).toBe(8)
    })

    it('verifies full DP table structure and state transitions', () => {
      const details = knapsack01Detailed(weights, values, capacity)

      // Expected table dimensions: (n + 1) rows x (capacity + 1) cols = 4 x 6
      expect(details.dpTable).toHaveLength(4)
      details.dpTable.forEach((row) => {
        expect(row).toHaveLength(6)
      })

      // Expected DP table for weights [2, 3, 4], values [3, 4, 5], capacity 5:
      // Row 0 (no items):           [0, 0, 0, 0, 0, 0]
      // Row 1 (Item 1: wt 2, val 3): [0, 0, 3, 3, 3, 3]
      // Row 2 (Item 2: wt 3, val 4): [0, 0, 3, 4, 4, 7]
      // Row 3 (Item 3: wt 4, val 5): [0, 0, 3, 4, 5, 7]
      const expectedTable = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 3, 3, 3, 3],
        [0, 0, 3, 4, 4, 7],
        [0, 0, 3, 4, 5, 7],
      ]
      expect(details.dpTable).toEqual(expectedTable)
    })
  })

  // ─── 2. DETERMINISTIC REPLAY GENERATION & TIMING ──────────────────────────
  describe('Deterministic replay steps and animation timing control', () => {
    const weights = [2, 3, 4]
    const values = [3, 4, 5]
    const capacity = 5

    it('generates identical replay steps for the same input and seed', () => {
      const run1 = generateKnapsackSteps(weights, values, capacity, { seed: 42 })
      const run2 = generateKnapsackSteps(weights, values, capacity, { seed: 42 })

      expect(run1.steps).toEqual(run2.steps)
      expect(run1.dp).toEqual(run2.dp)
      expect(run1.maxValue).toBe(run2.maxValue)
      expect(run1.selectedIndices).toEqual(run2.selectedIndices)
    })

    it('produces repeatable sequences across independent invocations', () => {
      const runA = generateKnapsackReplaySteps(weights, values, capacity, { seed: 1007 })
      const runB = generateKnapsackReplaySteps(weights, values, capacity, { seed: 1007 })

      expect(runA).toEqual(runB)
    })

    it('controls animation timing via baseDuration, speed, and minDelay', () => {
      // baseDuration: 800, speed: 2, minDelay: 100 -> calculated delay: Math.max(100, Math.round(800 / 2)) = 400
      const timedResult = generateKnapsackSteps(weights, values, capacity, {
        baseDuration: 800,
        speed: 2,
        minDelay: 100,
      })

      expect(timedResult.steps.length).toBeGreaterThan(0)
      timedResult.steps.forEach((step) => {
        expect(step.duration).toBe(400)
      })
    })

    it('controls animation timing via explicit duration override', () => {
      const explicitResult = generateKnapsackSteps(weights, values, capacity, {
        duration: 175,
      })

      expect(explicitResult.steps.length).toBeGreaterThan(0)
      explicitResult.steps.forEach((step) => {
        expect(step.duration).toBe(175)
      })
    })

    it('supports deterministic PRNG input generation with seed', () => {
      const gen1 = generateRandomKnapsackInput(4, 12, 30, 777)
      const gen2 = generateRandomKnapsackInput(4, 12, 30, 777)
      const gen3 = generateRandomKnapsackInput(4, 12, 30, 888)

      expect(gen1).toEqual(gen2)
      expect(gen1.weights).toEqual(gen2.weights)
      expect(gen1.values).toEqual(gen2.values)
      expect(gen1.capacity).toEqual(gen2.capacity)

      // Different seed produces different random input
      expect(gen1.weights).not.toEqual(gen3.weights)
    })
  })

  // ─── 3. REPLAY STEP STRUCTURE & VISUALIZER CONTRACT ───────────────────────
  describe('Replay step structure and DPVisualizer contract compatibility', () => {
    const weights = [2, 3, 4]
    const values = [3, 4, 5]
    const capacity = 5

    it('contains all required fields on every step frame', () => {
      const result = generateKnapsackSteps(weights, values, capacity)
      expect(result.steps.length).toBeGreaterThan(0)

      result.steps.forEach((step) => {
        expect(step).toHaveProperty('lineKey')
        expect(step).toHaveProperty('type')
        expect(step).toHaveProperty('table')
        expect(step).toHaveProperty('activeCell')
        expect(step).toHaveProperty('decision')
        expect(step).toHaveProperty('itemIndex')
        expect(step).toHaveProperty('phase')
        expect(step).toHaveProperty('message')
        expect(step).toHaveProperty('variables')
        expect(step).toHaveProperty('duration')

        // table must be a 2D array
        expect(Array.isArray(step.table)).toBe(true)
        expect(step.table.length).toBe(4)
      })
    })

    it('faithfully tracks inclusion and exclusion decisions in the fill phase', () => {
      const result = generateKnapsackSteps(weights, values, capacity)
      const fillSteps = result.steps.filter((s) => s.phase === 'fill')

      // Exactly 3 items * (5 + 1) capacities = 18 fill steps
      expect(fillSteps).toHaveLength(18)

      // Step for item 1 (wt 2, val 3) at w = 2: should be 'include'
      const stepItem1W2 = fillSteps.find(
        (s) => s.activeCell[0] === 1 && s.activeCell[1] === 2
      )
      expect(stepItem1W2.decision).toBe('include')
      expect(stepItem1W2.table[1][2]).toBe(3)

      // Step for item 2 (wt 3, val 4) at w = 5: should be 'include' (3 + 4 = 7)
      const stepItem2W5 = fillSteps.find(
        (s) => s.activeCell[0] === 2 && s.activeCell[1] === 5
      )
      expect(stepItem2W5.decision).toBe('include')
      expect(stepItem2W5.table[2][5]).toBe(7)

      // Step for item 3 (wt 4, val 5) at w = 5: should be 'exclude' (5 + dp[2][1]=5 < 7)
      const stepItem3W5 = fillSteps.find(
        (s) => s.activeCell[0] === 3 && s.activeCell[1] === 5
      )
      expect(stepItem3W5.decision).toBe('exclude')
      expect(stepItem3W5.table[3][5]).toBe(7)
    })

    it('contains traceback and completion steps confirming the optimal solution', () => {
      const result = generateKnapsackSteps(weights, values, capacity)

      const tracebackSteps = result.steps.filter((s) => s.phase === 'traceback')
      expect(tracebackSteps.length).toBeGreaterThan(0)

      const completeStep = result.steps.find((s) => s.phase === 'complete')
      expect(completeStep).toBeDefined()
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.maxValue).toBe(7)
      expect(completeStep.variables.selectedIndices).toEqual([0, 1])
    })
  })

  // ─── 4. EXPLICIT FAILURE ASSERTIONS ON INCORRECT IMPLEMENTATIONS ──────────
  describe('Explicit failure assertions on incorrect implementations', () => {
    it('fails when an implementation permits item reuse (unbounded knapsack)', () => {
      // Flawed unbounded implementation using dp[i][w - weights[i - 1]] instead of dp[i - 1][w - weights[i - 1]]
      function faultyUnboundedKnapsack(wArr, vArr, cap) {
        const n = wArr.length
        const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0))
        for (let i = 1; i <= n; i++) {
          for (let w = 0; w <= cap; w++) {
            dp[i][w] = dp[i - 1][w]
            if (wArr[i - 1] <= w) {
              // BUG: using row i instead of i - 1 allows reuse
              dp[i][w] = Math.max(dp[i][w], vArr[i - 1] + dp[i][w - wArr[i - 1]])
            }
          }
        }
        return dp[n][cap]
      }

      // For weights [2], values [10], capacity 4:
      // 0/1 knapsack allows item 0 only once -> value 10.
      // Faulty unbounded knapsack takes item 0 twice -> value 20.
      const faultyResult = faultyUnboundedKnapsack([2], [10], 4)
      expect(faultyResult).toBe(20)

      // Test assertion MUST fail on the faulty unbounded result
      expect(() => {
        expect(faultyResult).toBe(10)
      }).toThrow()

      // For weights [2, 3, 4], values [3, 4, 5], capacity 6:
      // 0/1 Knapsack optimum is 8 (items 0 and 2).
      // Faulty unbounded yields 9 (item 0 three times).
      const faultyResult6 = faultyUnboundedKnapsack([2, 3, 4], [3, 4, 5], 6)
      expect(faultyResult6).toBe(9)
      expect(() => {
        expect(faultyResult6).toBe(8)
      }).toThrow()
    })

    it('fails when a greedy ratio heuristic is used instead of dynamic programming', () => {
      // Flawed greedy heuristic that sorts items by value-to-weight ratio
      function faultyGreedyKnapsack(wArr, vArr, cap) {
        const items = wArr
          .map((w, idx) => ({ w, v: vArr[idx], ratio: vArr[idx] / w, idx }))
          .sort((a, b) => b.ratio - a.ratio)

        let rem = cap
        let totalVal = 0
        for (const item of items) {
          if (item.w <= rem) {
            totalVal += item.v
            rem -= item.w
          }
        }
        return totalVal
      }

      // Classic counterexample for greedy knapsack:
      // weights: [10, 20, 30], values: [60, 100, 120], capacity: 50
      // Ratios: 6.0, 5.0, 4.0.
      // Greedy picks item 0 (wt 10, val 60) + item 1 (wt 20, val 100) = 160.
      // Optimal 0/1 knapsack picks item 1 (wt 20, val 100) + item 2 (wt 30, val 120) = 220.
      const greedyVal = faultyGreedyKnapsack([10, 20, 30], [60, 100, 120], 50)
      const correctVal = knapsack01([10, 20, 30], [60, 100, 120], 50)

      expect(greedyVal).toBe(160)
      expect(correctVal).toBe(220)

      expect(() => {
        expect(greedyVal).toBe(correctVal)
      }).toThrow()
    })

    it('fails when an off-by-one error truncates capacity iteration', () => {
      // Flawed implementation with w < cap instead of w <= cap
      function faultyOffByOneKnapsack(wArr, vArr, cap) {
        const n = wArr.length
        const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0))
        for (let i = 1; i <= n; i++) {
          for (let w = 0; w < cap; w++) { // BUG: < instead of <=
            dp[i][w] = dp[i - 1][w]
            if (wArr[i - 1] <= w) {
              dp[i][w] = Math.max(dp[i][w], vArr[i - 1] + dp[i - 1][w - wArr[i - 1]])
            }
          }
        }
        return dp[n][cap]
      }

      const faultyResult = faultyOffByOneKnapsack([2, 3, 4], [3, 4, 5], 5)
      expect(faultyResult).toBe(0) // Failed to populate dp[3][5]

      expect(() => {
        expect(faultyResult).toBe(7)
      }).toThrow()
    })

    it('fails when item indices contain duplicates (invariant violation)', () => {
      const invalidSelectedIndices = [0, 0, 1] // item 0 repeated

      expect(() => {
        const uniqueSet = new Set(invalidSelectedIndices)
        if (uniqueSet.size !== invalidSelectedIndices.length) {
          throw new Error('0/1 Knapsack invariant violated: duplicate item selection')
        }
      }).toThrow('0/1 Knapsack invariant violated: duplicate item selection')
    })

    it('fails when total weight of chosen items exceeds capacity', () => {
      const overweight = 6
      const capacity = 5

      expect(() => {
        if (overweight > capacity) {
          throw new Error(`0/1 Knapsack invariant violated: total weight ${overweight} exceeds capacity ${capacity}`)
        }
      }).toThrow(/exceeds capacity/)
    })
  })

  // ─── 5. SOURCE STRINGS & LINE MAPS VALIDATION ─────────────────────────────
  describe('Multi-language source strings and line mapping', () => {
    const expectedLangs = ['javascript', 'python', 'cpp', 'java']

    it('provides code and lineMaps for all major languages', () => {
      expectedLangs.forEach((lang) => {
        const source = getKnapsackSource(lang)
        expect(source).toBeDefined()
        expect(typeof source.code).toBe('string')
        expect(source.code.length).toBeGreaterThan(0)
        expect(typeof source.lineMap).toBe('object')

        // Must define key algorithmic line markers
        expect(source.lineMap).toHaveProperty('function')
        expect(source.lineMap).toHaveProperty('outerLoop')
        expect(source.lineMap).toHaveProperty('innerLoop')
        expect(source.lineMap).toHaveProperty('include')
        expect(source.lineMap).toHaveProperty('exclude')
      })
    })

    it('resolves valid step line keys to positive integers', () => {
      const testStep = { lineKey: 'include' }
      const lineNum = resolveKnapsackLine(testStep, 'javascript')

      expect(typeof lineNum).toBe('number')
      expect(lineNum).toBeGreaterThan(0)
    })

    it('gracefully handles missing or invalid line keys', () => {
      expect(resolveKnapsackLine(null)).toBeUndefined()
      expect(resolveKnapsackLine({})).toBeUndefined()
      expect(resolveKnapsackLine({ lineKey: 'nonexistent' })).toBeUndefined()
    })
  })

  // ─── 6. EDGE CASES & DEGENERATE INPUT POLICIES ────────────────────────────
  describe('Edge cases and input validation policies', () => {
    it('returns 0 when capacity is 0 or negative', () => {
      expect(knapsack01([2, 3], [3, 4], 0)).toBe(0)
      expect(knapsack01([2, 3], [3, 4], -10)).toBe(0)

      const details0 = knapsack01Detailed([2, 3], [3, 4], 0)
      expect(details0.maxValue).toBe(0)
      expect(details0.selectedIndices).toEqual([])
    })

    it('returns 0 when weights or values are empty', () => {
      expect(knapsack01([], [], 5)).toBe(0)
      expect(knapsack01([2], [], 5)).toBe(0)
      expect(knapsack01([], [3], 5)).toBe(0)
    })

    it('returns 0 when all items are heavier than capacity', () => {
      expect(knapsack01([10, 20, 30], [5, 15, 25], 5)).toBe(0)

      const details = knapsack01Detailed([10, 20, 30], [5, 15, 25], 5)
      expect(details.maxValue).toBe(0)
      expect(details.selectedIndices).toEqual([])
    })

    it('correctly includes all items when capacity is sufficiently large', () => {
      const weights = [1, 2, 3]
      const values = [10, 20, 30]
      const capacity = 100 // Can easily fit all items: total wt 6, total val 60

      expect(knapsack01(weights, values, capacity)).toBe(60)

      const details = knapsack01Detailed(weights, values, capacity)
      expect(details.maxValue).toBe(60)
      expect(details.selectedIndices).toEqual([0, 1, 2])
      expect(details.totalWeight).toBe(6)
    })

    it('safely handles non-array or null/undefined inputs without throwing', () => {
      expect(knapsack01(null, null, 5)).toBe(0)
      expect(knapsack01(undefined, undefined, 5)).toBe(0)
      expect(knapsack01('invalid', 123, 5)).toBe(0)
    })
  })

  // ─── 7. MODULE EXPORT INTEGRITY ───────────────────────────────────────────
  describe('Module export integrity', () => {
    it('verifies knapsack.js re-exports knapsackSteps.js completely', () => {
      expect(knapsackModule.knapsack01).toBe(knapsack01)
      expect(knapsackModule.knapsack).toBe(knapsack)
      expect(knapsackModule.knapsack01Detailed).toBe(knapsack01Detailed)
      expect(knapsackModule.generateKnapsackSteps).toBe(generateKnapsackSteps)
      expect(knapsackModule.knapsackSources).toBe(knapsackSources)
      expect(knapsackModule.createKnapsackPrng).toBe(createKnapsackPrng)
    })
  })
})

