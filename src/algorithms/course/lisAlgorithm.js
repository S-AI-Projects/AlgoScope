/**
 * Longest Increasing Subsequence (LIS) — Pure Algorithm & Replay Module
 *
 * This module separates:
 *  - Pure computation  : `computeLIS(arr)` returns the LIS length and the
 *                        reconstructed subsequence without any side-effects.
 *  - Replay / steps    : `generateLISSteps(arr)` re-exports the step generator
 *                        from the shared DP module so visualizers can consume it.
 *
 * The visualizer UI state (currentStep, playing, speed, etc.) lives exclusively
 * in the consuming React component and is never stored here.
 *
 * NOTE: An identical step generator (`generateLISSteps`) already exists in
 * `src/algorithms/dp/dpStepGenerators.js`. We re-export it here to give this
 * course module a stable, self-contained public interface without duplicating
 * the implementation.
 */

// ─── Re-export shared replay module (no duplication) ─────────────────────────
export { generateLISSteps } from '../dp/dpStepGenerators'

// ─── Pure computation ─────────────────────────────────────────────────────────

/**
 * Computes the Longest Increasing Subsequence (LIS) using the classic O(n²) DP
 * approach with strict-increasing semantics (arr[j] < arr[i]).
 *
 * @param {number[]} arr - Input array of numbers.
 * @returns {{ length: number, subsequence: number[], dp: number[] }}
 *   - `length`      : Length of the LIS (0 for empty input).
 *   - `subsequence` : One valid LIS (lexicographically first by index).
 *   - `dp`          : Raw dp table where dp[i] is the LIS length ending at i.
 */
export function computeLIS(arr) {
  const n = arr.length

  if (n === 0) {
    return { length: 0, subsequence: [], dp: [] }
  }

  // dp[i] = length of LIS ending at index i (every element is a subsequence of
  // length 1 by itself).
  const dp = Array(n).fill(1)

  // parent[i] = index of the previous element in the optimal LIS ending at i,
  // or -1 if i is the starting element of its LIS.
  const parent = Array(n).fill(-1)

  let maxLen = 1
  let maxIdx = 0

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1
        parent[i] = j
      }
    }
    if (dp[i] > maxLen) {
      maxLen = dp[i]
      maxIdx = i
    }
  }

  // Reconstruct the subsequence by walking the parent chain.
  const subsequence = []
  let cur = maxIdx
  while (cur !== -1) {
    subsequence.unshift(arr[cur])
    cur = parent[cur]
  }

  return { length: maxLen, subsequence, dp }
}

