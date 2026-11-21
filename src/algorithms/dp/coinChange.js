// ─── Coin Change – pure algorithm module ─────────────────────────────────────
// Distinct from dpStepGenerators.js (replay/visualisation steps).
// This module exposes the pure DP result plus traceback and an operation
// counter so tests can assert deterministic step counts without relying on
// wall-clock timing.

/**
 * Solve the Coin Change problem (minimum-coin-count variant).
 *
 * This is *not* the number-of-combinations (Coin Change 2) variant:
 *   - Coin Change (this function): fewest coins that sum to `amount`.
 *     dp[i] = min number of coins to make exactly i.
 *   - Coin Change 2 (combinations): count of distinct ways to reach `amount`.
 *     dp[i] counts combinations, not min coins.
 *
 * @param {number[]} coins   – available coin denominations (positive integers)
 * @param {number}   amount  – target amount (non-negative integer)
 * @returns {{
 *   minCoins:       number,   // minimum coins needed (-1 if impossible)
 *   coinsUsed:      number[], // the actual coins chosen (traceback)
 *   dpTable:        number[], // full dp array for inspection
 *   operationCount: number,   // deterministic inner-loop iteration count
 * }}
 */
export function coinChange(coins, amount) {
  const INF = amount + 1
  const dp = Array(amount + 1).fill(INF)
  dp[0] = 0

  // usedCoin[i] records which coin denomination was last used to reach amount i
  const usedCoin = Array(amount + 1).fill(-1)

  let operationCount = 0

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      operationCount++ // count every candidate evaluation
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1
        usedCoin[i] = coin
      }
    }
  }

  // Result
  const minCoins = dp[amount] >= INF ? -1 : dp[amount]

  // Traceback: reconstruct the coins actually chosen
  const coinsUsed = []
  if (minCoins !== -1) {
    let rem = amount
    while (rem > 0) {
      coinsUsed.push(usedCoin[rem])
      rem -= usedCoin[rem]
    }
  }

  return { minCoins, coinsUsed, dpTable: dp, operationCount }
}

