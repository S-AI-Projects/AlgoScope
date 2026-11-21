import { createStep, calculateStepDelay } from '../../lib/utils'

/**
 * ============================================================================
 * 0/1 KNAPSACK DYNAMIC PROGRAMMING MODULE
 * ============================================================================
 * Architectural separation:
 * 1. Source Strings & Line Maps: Multi-language reference implementations
 *    (JavaScript, Python, C++, Java) and line maps for visual code tracing.
 * 2. Pure Algorithm Results: Deterministic 0/1 Knapsack optimization and
 *    traceback guaranteeing optimal values and strictly enforcing that each
 *    item can be used at most once (no item reuse).
 * 3. Replay Steps: Normalized step-by-step execution frames compatible with
 *    `createStep` and `DPVisualizer.jsx`, with deterministic seeding and
 *    controllable animation timing.
 * 4. UI Components: Pure algorithmic module with zero React UI / DOM dependencies.
 * ============================================================================
 */

// ─── 1. SOURCE STRINGS & LINE MAPS ──────────────────────────────────────────

export const knapsackSources = {
  javascript: {
    code: `function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i][w],
          values[i - 1] + dp[i - 1][w - weights[i - 1]]
        );
      }
    }
  }

  return dp[n][W];
}`,
    lineMap: {
      function: 1,
      setup: 2,
      init: 3,
      outerLoop: 5,
      innerLoop: 6,
      exclude: 7,
      checkCapacity: 8,
      include: 9,
      complete: 16,
    },
  },
  python: {
    code: `def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(
                    dp[i][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                )

    return dp[n][W]`,
    lineMap: {
      function: 1,
      setup: 2,
      init: 3,
      outerLoop: 5,
      innerLoop: 6,
      exclude: 7,
      checkCapacity: 8,
      include: 9,
      complete: 15,
    },
  },
  cpp: {
    code: `#include <vector>
#include <algorithm>
using namespace std;

int knapsack(const vector<int>& weights, const vector<int>& values, int W) {
    int n = weights.size();
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];
            if (weights[i - 1] <= w) {
                dp[i][w] = max(
                    dp[i][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            }
        }
    }

    return dp[n][W];
}`,
    lineMap: {
      function: 5,
      setup: 6,
      init: 7,
      outerLoop: 9,
      innerLoop: 10,
      exclude: 11,
      checkCapacity: 12,
      include: 13,
      complete: 21,
    },
  },
  java: {
    code: `public class Knapsack {
    public static int knapsack(int[] weights, int[] values, int W) {
        int n = weights.length;
        int[][] dp = new int[n + 1][W + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= W; w++) {
                dp[i][w] = dp[i - 1][w];
                if (weights[i - 1] <= w) {
                    dp[i][w] = Math.max(
                        dp[i][w],
                        values[i - 1] + dp[i - 1][w - weights[i - 1]]
                    );
                }
            }
        }

        return dp[n][W];
    }
}`,
    lineMap: {
      function: 2,
      setup: 3,
      init: 4,
      outerLoop: 6,
      innerLoop: 7,
      exclude: 8,
      checkCapacity: 9,
      include: 10,
      complete: 18,
    },
  },
}

export function getKnapsackSource(language = 'javascript') {
  return knapsackSources[language] ?? knapsackSources.javascript
}

export function resolveKnapsackLine(step, language = 'javascript') {
  if (!step?.lineKey) return undefined
  const source = getKnapsackSource(language)
  return source.lineMap?.[step.lineKey] ?? knapsackSources.javascript.lineMap?.[step.lineKey]
}

// ─── 2. PURE ALGORITHM RESULTS (0/1 KNAPSACK & TRACEBACK) ───────────────────

/**
 * Normalizes input arrays and capacity, filtering out invalid items.
 *
 * @param {Array<number>} weights
 * @param {Array<number>} values
 * @param {number} capacity
 * @returns {{ cleanWeights: number[], cleanValues: number[], W: number, n: number }}
 */
function sanitizeKnapsackInput(weights, values, capacity) {
  if (!Array.isArray(weights) || !Array.isArray(values)) {
    return { cleanWeights: [], cleanValues: [], W: 0, n: 0 }
  }

  const rawCapacity = Number(capacity)
  const W = !isNaN(rawCapacity) && rawCapacity > 0 ? Math.floor(rawCapacity) : 0
  if (W <= 0) {
    return { cleanWeights: [], cleanValues: [], W: 0, n: 0 }
  }

  const cleanWeights = []
  const cleanValues = []
  const limit = Math.min(weights.length, values.length)

  for (let i = 0; i < limit; i++) {
    const wt = Number(weights[i])
    const val = Number(values[i])
    if (!isNaN(wt) && !isNaN(val) && wt > 0 && val >= 0) {
      cleanWeights.push(Math.floor(wt))
      cleanValues.push(Math.floor(val))
    }
  }

  return { cleanWeights, cleanValues, W, n: cleanWeights.length }
}

/**
 * Pure 0/1 Knapsack optimization algorithm.
 * Returns the maximum achievable value for the given weights, values, and capacity.
 * Strictly guarantees that each item can be selected at most once (no item reuse).
 *
 * @param {Array<number>} weights - Item weights
 * @param {Array<number>} values - Item values
 * @param {number} capacity - Knapsack weight limit
 * @returns {number} Maximum total value
 */
export function knapsack01(weights, values, capacity) {
  const { cleanWeights, cleanValues, W, n } = sanitizeKnapsackInput(weights, values, capacity)
  if (n === 0 || W === 0) return 0

  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    const wt = cleanWeights[i - 1]
    const val = cleanValues[i - 1]
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w]
      if (wt <= w) {
        dp[i][w] = Math.max(dp[i][w], val + dp[i - 1][w - wt])
      }
    }
  }

  return dp[n][W]
}

export const knapsack = knapsack01

/**
 * Pure detailed 0/1 Knapsack algorithm.
 * Returns the maximum value, optimal item indices, weights, values, and complete DP table.
 * Strictly guarantees that each item is picked at most once and total weight does not exceed capacity.
 *
 * @param {Array<number>} weights - Item weights
 * @param {Array<number>} values - Item values
 * @param {number} capacity - Knapsack weight capacity
 * @returns {Object} Detailed 0/1 Knapsack result
 */
export function knapsack01Detailed(weights, values, capacity) {
  const { cleanWeights, cleanValues, W, n } = sanitizeKnapsackInput(weights, values, capacity)

  if (n === 0 || W === 0) {
    return {
      maxValue: 0,
      selectedIndices: [],
      selectedWeights: [],
      selectedValues: [],
      totalWeight: 0,
      totalValue: 0,
      dpTable: Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0)),
      capacity: W,
      itemsCount: n,
    }
  }

  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    const wt = cleanWeights[i - 1]
    const val = cleanValues[i - 1]
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w]
      if (wt <= w) {
        dp[i][w] = Math.max(dp[i][w], val + dp[i - 1][w - wt])
      }
    }
  }

  // Backtracking traceback to identify the exact subset of items chosen
  let currW = W
  const selectedIndices = []
  for (let i = n; i > 0; i--) {
    if (dp[i][currW] !== dp[i - 1][currW]) {
      selectedIndices.push(i - 1)
      currW -= cleanWeights[i - 1]
    }
  }
  selectedIndices.reverse()

  const selectedWeights = selectedIndices.map((idx) => cleanWeights[idx])
  const selectedValues = selectedIndices.map((idx) => cleanValues[idx])
  const totalWeight = selectedWeights.reduce((sum, wt) => sum + wt, 0)
  const totalValue = selectedValues.reduce((sum, val) => sum + val, 0)

  // Invariant verification: no duplicates, within capacity, value matches
  const uniqueIndices = new Set(selectedIndices)
  if (uniqueIndices.size !== selectedIndices.length) {
    throw new Error('0/1 Knapsack invariant violated: duplicate item selection (item reused)')
  }
  if (totalWeight > W) {
    throw new Error(`0/1 Knapsack invariant violated: total weight ${totalWeight} exceeds capacity ${W}`)
  }
  if (totalValue !== dp[n][W]) {
    throw new Error(`0/1 Knapsack invariant violated: total value ${totalValue} does not match dp ${dp[n][W]}`)
  }

  return {
    maxValue: dp[n][W],
    selectedIndices,
    selectedWeights,
    selectedValues,
    totalWeight,
    totalValue,
    dpTable: dp,
    capacity: W,
    itemsCount: n,
  }
}

// ─── 3. REPLAY STEPS (ANIMATION & VISUALIZATION FRAMES) ──────────────────────

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32).
 * Ensures reproducible pseudo-random sequences given the same seed.
 *
 * @param {number} [seed=42]
 * @returns {() => number} Returns float in [0, 1)
 */
export function createKnapsackPrng(seed = 42) {
  let s = (Math.abs(Math.floor(Number(seed) || 42)) || 42) >>> 0
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generates deterministic random Knapsack inputs using the specified seed.
 * Useful for automated property testing and visual randomizations.
 *
 * @param {number} [itemCount=3]
 * @param {number} [maxWeight=10]
 * @param {number} [maxValue=20]
 * @param {number} [seed=42]
 * @returns {{ weights: number[], values: number[], capacity: number, seed: number }}
 */
export function generateRandomKnapsackInput(
  itemCount = 3,
  maxWeight = 10,
  maxValue = 20,
  seed = 42
) {
  const prng = createKnapsackPrng(seed)
  const count = Math.max(1, Math.floor(Number(itemCount) || 3))
  const maxW = Math.max(1, Math.floor(Number(maxWeight) || 10))
  const maxV = Math.max(1, Math.floor(Number(maxValue) || 20))

  const weights = []
  const values = []
  for (let i = 0; i < count; i++) {
    weights.push(Math.floor(prng() * maxW) + 1)
    values.push(Math.floor(prng() * maxV) + 1)
  }

  const totalW = weights.reduce((sum, w) => sum + w, 0)
  const capacity = Math.max(1, Math.floor(totalW * 0.6))

  return { weights, values, capacity, seed }
}

/**
 * Generates replay steps for 0/1 Knapsack dynamic programming visualization.
 * Produces deterministic steps for the same input and seed, and respects
 * animation timing controls (baseDuration, speed, minDelay, duration).
 * Fully backward-compatible with `DPVisualizer.jsx`.
 *
 * @param {Array<number>} weights
 * @param {Array<number>} values
 * @param {number} capacity
 * @param {Object} [options={}]
 * @param {number} [options.seed=42] - Seed for deterministic tie-breaking / PRNG
 * @param {number} [options.baseDuration=700] - Base pause duration in ms
 * @param {number} [options.speed=1] - Speed multiplier
 * @param {number} [options.minDelay=120] - Minimum delay in ms
 * @param {number} [options.duration] - Explicit step duration override
 * @param {boolean} [options.includeInit=false] - Whether to prepend the zeroed-table init step
 * @param {boolean} [options.includeTraceback=true] - Whether to append traceback steps
 * @param {boolean} [options.includeComplete=true] - Whether to append the completion step
 * @returns {{ steps: Array<Object>, dp: Array<Array<number>>, weights: number[], values: number[], capacity: number, maxValue: number, selectedIndices: number[] }}
 */
export function generateKnapsackSteps(weights = [], values = [], capacity = 0, options = {}) {
  const {
    baseDuration = 700,
    speed = 1,
    minDelay = 120,
    duration: explicitDuration,
    includeInit = false,
    includeTraceback = true,
    includeComplete = true,
  } = options

  const stepDelay =
    explicitDuration !== undefined
      ? Math.max(0, Number(explicitDuration) || 0)
      : calculateStepDelay(baseDuration, speed, minDelay)

  const n = Array.isArray(weights) ? weights.length : 0
  const rawCap = Number(capacity)
  const cap = !isNaN(rawCap) && rawCap >= 0 ? Math.floor(rawCap) : 0

  const dp = Array.from({ length: n + 1 }, () => new Array(cap + 1).fill(0))
  const steps = []

  // Optional Step 0: Initialization frame
  if (includeInit) {
    steps.push(
      createStep({
        lineKey: 'init',
        type: 'init',
        array: weights,
        indices: [],
        table: dp.map((r) => [...r]),
        activeCell: null,
        decision: 'init',
        itemIndex: -1,
        phase: 'init',
        message: `Initialize DP table of size (${n + 1} × ${cap + 1}) with zeros.`,
        variables: { n, capacity: cap, itemsCount: n },
        duration: stepDelay,
      })
    )
  }

  // DP Fill Steps (matching DPVisualizer.jsx contract)
  for (let i = 1; i <= n; i++) {
    const itemWt = weights[i - 1]
    const itemVal = values[i - 1]

    for (let w = 0; w <= cap; w++) {
      const canInclude = itemWt <= w
      const includeVal = canInclude
        ? itemVal + dp[i - 1][w - itemWt]
        : -Infinity
      const excludeVal = dp[i - 1][w]
      const isIncludeOptimal = canInclude && includeVal > excludeVal

      dp[i][w] = Math.max(includeVal, excludeVal)

      const decision = isIncludeOptimal ? 'include' : 'exclude'
      const lineKey = isIncludeOptimal ? 'include' : 'exclude'

      let explanation = ''
      if (!canInclude) {
        explanation = `Item ${i} (w=${itemWt}, v=${itemVal}) exceeds capacity ${w}. Exclude: dp[${i}][${w}] = ${excludeVal}.`
      } else if (isIncludeOptimal) {
        explanation = `Include item ${i} (w=${itemWt}, v=${itemVal}): ${itemVal} + dp[${i - 1}][${w - itemWt}] (${includeVal}) > exclude (${excludeVal}). dp[${i}][${w}] = ${includeVal}.`
      } else {
        explanation = `Exclude item ${i} (w=${itemWt}, v=${itemVal}): exclude (${excludeVal}) >= include (${includeVal}). dp[${i}][${w}] = ${excludeVal}.`
      }

      steps.push(
        createStep({
          lineKey,
          type: decision,
          array: weights,
          indices: [i - 1],
          table: dp.map((r) => [...r]),
          activeCell: [i, w],
          decision,
          itemIndex: i - 1,
          phase: 'fill',
          message: explanation,
          variables: {
            i,
            w,
            itemWeight: itemWt,
            itemValue: itemVal,
            canInclude,
            includeVal: canInclude ? includeVal : null,
            excludeVal,
            currentMax: dp[i][w],
          },
          duration: stepDelay,
        })
      )
    }
  }

  // Backtracking Traceback Steps
  let currW = cap
  const selectedIndices = []
  for (let i = n; i > 0; i--) {
    const itemIdx = i - 1
    const wt = weights[itemIdx]
    const val = values[itemIdx]
    const wasIncluded = wt <= currW && dp[i][currW] !== dp[i - 1][currW]

    if (wasIncluded) {
      selectedIndices.unshift(itemIdx)
      if (includeTraceback) {
        steps.push(
          createStep({
            lineKey: 'traceback',
            type: 'traceback',
            array: weights,
            indices: [itemIdx],
            table: dp.map((r) => [...r]),
            activeCell: [i, currW],
            decision: 'include',
            itemIndex: itemIdx,
            phase: 'traceback',
            message: `Traceback: Item ${itemIdx + 1} (w=${wt}, v=${val}) was selected. Remaining capacity: ${currW - wt}.`,
            variables: {
              i,
              w: currW,
              itemIndex: itemIdx,
              weight: wt,
              value: val,
              included: true,
              selectedIndices: [...selectedIndices],
            },
            duration: stepDelay,
          })
        )
      }
      currW -= wt
    } else if (includeTraceback) {
      steps.push(
        createStep({
          lineKey: 'traceback',
          type: 'traceback',
          array: weights,
          indices: [itemIdx],
          table: dp.map((r) => [...r]),
          activeCell: [i, currW],
          decision: 'exclude',
          itemIndex: itemIdx,
          phase: 'traceback',
          message: `Traceback: Item ${itemIdx + 1} (w=${wt}, v=${val}) was not selected.`,
          variables: {
            i,
            w: currW,
            itemIndex: itemIdx,
            weight: wt,
            value: val,
            included: false,
            selectedIndices: [...selectedIndices],
          },
          duration: stepDelay,
        })
      )
    }
  }

  // Final Step: Completion
  if (includeComplete && steps.length > 0) {
    const maxValue = n > 0 && cap >= 0 ? dp[n][cap] : 0
    steps.push(
      createStep({
        lineKey: 'complete',
        type: 'complete',
        array: weights,
        indices: selectedIndices,
        sortedIndices: selectedIndices,
        table: dp.map((r) => [...r]),
        activeCell: [n, cap],
        decision: 'include',
        itemIndex: -1,
        phase: 'complete',
        message: `0/1 Knapsack complete! Optimum value: ${maxValue}. Selected items: [${selectedIndices.map((idx) => idx + 1).join(', ')}].`,
        variables: {
          maxValue,
          selectedIndices: [...selectedIndices],
          totalWeight: selectedIndices.reduce((sum, idx) => sum + weights[idx], 0),
          totalValue: maxValue,
          capacity: cap,
        },
        duration: stepDelay,
      })
    )
  }

  return {
    steps,
    dp,
    weights,
    values,
    capacity: cap,
    maxValue: n > 0 && cap >= 0 ? dp[n][cap] : 0,
    selectedIndices,
  }
}

export const generateKnapsackReplaySteps = generateKnapsackSteps

