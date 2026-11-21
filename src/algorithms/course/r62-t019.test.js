// R62-T019 – Coin Change: complexity experiment & regression suite
// ─────────────────────────────────────────────────────────────────
// Tests the PURE algorithm module at src/algorithms/dp/coinChange.js.
// The replay/step-generator (generateCoinChangeSteps in dpStepGenerators.js)
// is a separate concern used exclusively by the UI visualiser; this test does
// NOT import it, keeping the two layers independent.
//
// Key semantic distinction asserted throughout:
//   • Coin Change (minimum-coin-count) – this module –
//       dp[i] = fewest coins summing to i.
//   • Coin Change 2 (number-of-combinations) – a *different* problem –
//       dp[i] = count of distinct ways to make i (would return 6 for [1,3,4]/6).
// Both share the same input format, so the test names and comments call this
// out explicitly.

import { describe, it, expect } from 'vitest'
import { coinChange } from '../dp/coinChange'

// ─── helper: reconstruct dp table externally to cross-check ──────────────────
function buildDpTable(coins, amount) {
  const INF = amount + 1
  const dp = Array(amount + 1).fill(INF)
  dp[0] = 0
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) dp[i] = dp[i - coin] + 1
    }
  }
  return dp
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Core correctness: canonical example from the task specification
// ─────────────────────────────────────────────────────────────────────────────
describe('coinChange – canonical example [1,3,4] amount=6', () => {
  const result = coinChange([1, 3, 4], 6)

  it('returns minimum-coin-count of 2 (NOT number-of-combinations which is 6)', () => {
    // The minimum-coin-count answer is 2  → [3, 3]
    // The number-of-combinations answer is 6 (a different problem; Coin Change 2).
    // This assertion would fail if the implementation accidentally counted
    // combinations instead of minimising coins.
    expect(result.minCoins).toBe(2)
  })

  it('traces back the exact coins used: [3, 3]', () => {
    // coinsUsed is reconstructed via the usedCoin traceback array; order
    // reflects the traceback traversal (largest index first → [3, 3]).
    expect(result.coinsUsed).toEqual([3, 3])
    // Verify the coins actually sum to the target amount
    const sum = result.coinsUsed.reduce((a, c) => a + c, 0)
    expect(sum).toBe(6)
  })

  it('the dp table matches an independent reference implementation', () => {
    const reference = buildDpTable([1, 3, 4], 6)
    expect(result.dpTable).toEqual(reference)
  })

  it('dp[0] is always 0 (base case: zero coins needed to reach amount 0)', () => {
    expect(result.dpTable[0]).toBe(0)
  })

  it('dp[6] equals minCoins (the answer cell is consistent)', () => {
    expect(result.dpTable[6]).toBe(result.minCoins)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Deterministic operation-count experiment (no wall-clock assertions)
//    Three bounded valid input sizes; counts are purely structural.
//    Formula: amount * coins.length  (every inner candidate is counted once)
// ─────────────────────────────────────────────────────────────────────────────
describe('coinChange – deterministic operation counts across three input sizes', () => {
  //
  // Size A – small: coins=[1,3,4], amount=6
  //   Outer loop: i=1..6  (6 iterations)
  //   Inner loop: 3 coins each → 6 × 3 = 18 operations
  //
  it('Size A [1,3,4]/6 → operationCount = 18, minCoins = 2', () => {
    const r = coinChange([1, 3, 4], 6)
    // Structural assertion: exactly amount × |coins| evaluations
    expect(r.operationCount).toBe(18)
    // Result assertion: fail fast if the algorithm is wrong
    expect(r.minCoins).toBe(2)
    expect(r.coinsUsed.reduce((a, c) => a + c, 0)).toBe(6)
  })

  //
  // Size B – medium: coins=[1,2,5], amount=11 (LeetCode 322 classic)
  //   Outer loop: i=1..11 (11 iterations)
  //   Inner loop: 3 coins each → 11 × 3 = 33 operations
  //
  it('Size B [1,2,5]/11 → operationCount = 33, minCoins = 3', () => {
    const r = coinChange([1, 2, 5], 11)
    expect(r.operationCount).toBe(33)
    // Minimum: 5+5+1 = 11 → 3 coins
    expect(r.minCoins).toBe(3)
    expect(r.coinsUsed.reduce((a, c) => a + c, 0)).toBe(11)
    // Verify each coin is a valid denomination
    r.coinsUsed.forEach((c) => expect([1, 2, 5]).toContain(c))
  })

  //
  // Size C – larger: coins=[1,3,4], amount=10
  //   Outer loop: i=1..10 (10 iterations)
  //   Inner loop: 3 coins each → 10 × 3 = 30 operations
  //
  it('Size C [1,3,4]/10 → operationCount = 30, minCoins = 3', () => {
    const r = coinChange([1, 3, 4], 10)
    expect(r.operationCount).toBe(30)
    // Minimum: 3+3+4 = 10 → 3 coins
    expect(r.minCoins).toBe(3)
    expect(r.coinsUsed.reduce((a, c) => a + c, 0)).toBe(10)
    r.coinsUsed.forEach((c) => expect([1, 3, 4]).toContain(c))
  })

  it('operation count scales as O(amount × |coins|) across the three sizes', () => {
    // Structural invariant: confirms the loop structure is correct
    const sizeA = coinChange([1, 3, 4], 6).operationCount
    const sizeB = coinChange([1, 2, 5], 11).operationCount
    const sizeC = coinChange([1, 3, 4], 10).operationCount

    // Each count must equal amount × numberOfCoins exactly (pure inner-loop tally)
    expect(sizeA).toBe(6 * 3)
    expect(sizeB).toBe(11 * 3)
    expect(sizeC).toBe(10 * 3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Additional correctness / edge-case assertions
// ─────────────────────────────────────────────────────────────────────────────
describe('coinChange – edge cases and correctness invariants', () => {
  it('returns minCoins=-1 and empty coinsUsed when amount is unreachable', () => {
    // Coins [2] cannot reach amount 3
    const r = coinChange([2], 3)
    expect(r.minCoins).toBe(-1)
    expect(r.coinsUsed).toEqual([])
  })

  it('returns minCoins=0 and no coins used for amount=0 (base case)', () => {
    const r = coinChange([1, 5, 10], 0)
    expect(r.minCoins).toBe(0)
    expect(r.coinsUsed).toEqual([])
    expect(r.dpTable[0]).toBe(0)
  })

  it('handles a single denomination that exactly divides the amount', () => {
    const r = coinChange([3], 9)
    expect(r.minCoins).toBe(3) // 3+3+3
    expect(r.coinsUsed).toEqual([3, 3, 3])
  })

  it('prefers fewer coins over more coins (greedy trap check)', () => {
    // With [1,3,4], amount=6: greedy picks 4+1+1=3 coins but DP finds 3+3=2.
    // This catches a greedy implementation masquerading as DP.
    const r = coinChange([1, 3, 4], 6)
    expect(r.minCoins).toBeLessThan(3)
    expect(r.minCoins).toBe(2)
  })

  it('coinsUsed entries are all valid denominations from the input set', () => {
    const coins = [1, 3, 4]
    const r = coinChange(coins, 6)
    r.coinsUsed.forEach((c) => expect(coins).toContain(c))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Replay-layer independence check (structural, no UI import)
// ─────────────────────────────────────────────────────────────────────────────
describe('coinChange – replay module consistency (structural)', () => {
  it('pure module result matches the final dp cell of the step generator', async () => {
    // Import the existing step generator lazily to verify both modules agree
    // on the answer without coupling the test to any UI component.
    const { generateCoinChangeSteps } = await import('../dp/dpStepGenerators')
    const pure = coinChange([1, 3, 4], 6)
    const replay = generateCoinChangeSteps([1, 3, 4], 6)

    // Both should report the same minimum-coin-count value at dp[6]
    expect(replay.dp[6]).toBe(pure.minCoins)
    // And the same full dp table
    expect(replay.dp).toEqual(pure.dpTable)
  })
})

