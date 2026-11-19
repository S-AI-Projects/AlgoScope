/**
 * Sieve of Eratosthenes: Pure algorithm, complexity experiment, and replay module.
 *
 * Coursework module for R62-T029.
 * Preserves the distinction between pure algorithm results, complexity counters,
 * replay steps, source strings, and UI components.
 */

/**
 * Pure Sieve of Eratosthenes algorithm.
 * Returns an array of prime numbers up to n.
 * Contract: 0 and 1 are not prime. Primes up to 12 are [2, 3, 5, 7, 11].
 *
 * @param {number} n Upper bound integer.
 * @returns {number[]} Array of prime numbers up to n.
 */
export function sieveOfEratosthenes(n) {
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new TypeError(`Expected integer, received ${typeof n}`)
  }
  if (n < 0) {
    throw new RangeError(`Upper bound must be non-negative, received ${n}`)
  }
  if (n < 2) {
    return []
  }

  const isPrime = new Array(n + 1).fill(true)
  isPrime[0] = false
  isPrime[1] = false

  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false
      }
    }
  }

  const primes = []
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) {
      primes.push(i)
    }
  }
  return primes
}

/**
 * Checks whether a single non-negative integer is prime.
 * @param {number} num
 * @returns {boolean}
 */
export function isPrime(num) {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 2) {
    return false
  }
  if (num === 2 || num === 3) return true
  if (num % 2 === 0 || num % 3 === 0) return false
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false
  }
  return true
}

/**
 * Records algorithmic operation and step counts for complexity analysis.
 * Avoids any hardware-dependent speed thresholds (wall-clock timing)
 * in favor of deterministic, machine-independent operation metrics.
 *
 * @param {number} n
 * @returns {{
 *   n: number,
 *   primes: number[],
 *   primesCount: number,
 *   outerChecks: number,
 *   primeHits: number,
 *   compositeStrikes: number,
 *   totalOperations: number,
 *   theoreticalRatio: number
 * }}
 */
export function recordSieveComplexity(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new TypeError('Expected non-negative integer')
  }

  let outerChecks = 0
  let primeHits = 0
  let compositeStrikes = 0

  if (n < 2) {
    return {
      n,
      primes: [],
      primesCount: 0,
      outerChecks: 0,
      primeHits: 0,
      compositeStrikes: 0,
      totalOperations: 0,
      theoreticalRatio: 0,
    }
  }

  const isPrimeArr = new Array(n + 1).fill(true)
  isPrimeArr[0] = false
  isPrimeArr[1] = false

  for (let i = 2; i * i <= n; i++) {
    outerChecks++
    if (isPrimeArr[i]) {
      primeHits++
      for (let j = i * i; j <= n; j += i) {
        compositeStrikes++
        isPrimeArr[j] = false
      }
    }
  }

  const primes = []
  for (let i = 2; i <= n; i++) {
    if (isPrimeArr[i]) {
      primes.push(i)
    }
  }

  const totalOperations = outerChecks + compositeStrikes
  // n * log(log(n)) asymptotic reference
  const logLogN = Math.log(Math.max(1.001, Math.log(Math.max(2, n))))
  const theoreticalEstimate = n * logLogN
  const theoreticalRatio = theoreticalEstimate > 0 ? totalOperations / theoreticalEstimate : 0

  return {
    n,
    primes,
    primesCount: primes.length,
    outerChecks,
    primeHits,
    compositeStrikes,
    totalOperations,
    theoreticalRatio,
  }
}

/**
 * Runs a comparative complexity experiment across multiple bounded valid sizes.
 * @param {number[]} sizes
 * @returns {Array<object>}
 */
export function runSieveComplexityExperiment(sizes = [12, 30, 100]) {
  return sizes.map((size) => recordSieveComplexity(size))
}

/**
 * Generates immutable step-by-step replay trace for Sieve of Eratosthenes.
 *
 * @param {number} n
 * @returns {Array<object>}
 */
export function generateSieveReplaySteps(n) {
  const steps = []
  if (typeof n !== 'number' || n < 0) return steps

  const isPrimeArr = new Array(n + 1).fill(true)
  if (n >= 0) isPrimeArr[0] = false
  if (n >= 1) isPrimeArr[1] = false

  steps.push({
    stepIndex: 0,
    type: 'init',
    lineKey: 'init',
    n,
    array: [...isPrimeArr],
    indices: n >= 1 ? [0, 1] : n === 0 ? [0] : [],
    message: `Initialized isPrime boolean array for [0..${n}]. Marked 0 and 1 as not prime.`,
    variables: { n, currentPrime: null, compositeStrike: null },
  })

  let stepCounter = 1
  for (let i = 2; i * i <= n; i++) {
    steps.push({
      stepIndex: stepCounter++,
      type: 'outer-check',
      lineKey: 'checkPrime',
      n,
      array: [...isPrimeArr],
      indices: [i],
      message: `Checking candidate i = ${i} (i^2 = ${i * i} <= ${n}). isPrime[${i}] = ${isPrimeArr[i]}.`,
      variables: { n, i, isPrime: isPrimeArr[i] },
    })

    if (isPrimeArr[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrimeArr[j] = false
        steps.push({
          stepIndex: stepCounter++,
          type: 'strike-composite',
          lineKey: 'markFalse',
          n,
          array: [...isPrimeArr],
          indices: [j],
          message: `Striking composite multiple j = ${j} of prime ${i}.`,
          variables: { n, prime: i, composite: j },
        })
      }
    }
  }

  const finalPrimes = []
  for (let i = 2; i <= n; i++) {
    if (isPrimeArr[i]) finalPrimes.push(i)
  }

  steps.push({
    stepIndex: stepCounter,
    type: 'complete',
    lineKey: 'complete',
    n,
    array: [...isPrimeArr],
    primes: [...finalPrimes],
    indices: [...finalPrimes],
    message: `Sieve completed. Primes up to ${n}: [${finalPrimes.join(', ')}].`,
    variables: { n, primesCount: finalPrimes.length },
  })

  return steps
}

/**
 * Validates step invariants for Sieve of Eratosthenes replay.
 * Checks that 0 and 1 are never prime, and that composites are marked accurately.
 *
 * @param {object} step
 * @param {number} n
 * @returns {boolean}
 */
export function validateSieveStep(step, n) {
  if (!step || typeof step !== 'object') {
    throw new Error('Step must be a valid object')
  }

  const { array } = step
  if (!Array.isArray(array)) {
    throw new Error('Step missing isPrime array')
  }

  if (array.length !== n + 1) {
    throw new Error(`Array length ${array.length} does not match expected n+1 = ${n + 1}`)
  }

  // Invariant 1: 0 and 1 are never prime
  if (n >= 0 && array[0] !== false) {
    throw new Error('Invariant violated: 0 must not be prime')
  }
  if (n >= 1 && array[1] !== false) {
    throw new Error('Invariant violated: 1 must not be prime')
  }

  // Invariant 2: On completion step, primes list matches pure sieveOfEratosthenes
  if (step.type === 'complete') {
    const expectedPrimes = sieveOfEratosthenes(n)
    if (JSON.stringify(step.primes) !== JSON.stringify(expectedPrimes)) {
      throw new Error('Terminal step primes do not match expected primes')
    }
  }

  return true
}

export const sieveSources = {
  javascript: {
    code: `function sieve(n) {
  if (n < 2) return [];
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = false;
  isPrime[1] = false;

  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) primes.push(i);
  }
  return primes;
}`,
    lineMap: {
      function: 1,
      baseCase: 2,
      initArray: 3,
      markZeroOne: 4,
      outerLoop: 7,
      primeCheck: 8,
      innerLoop: 9,
      strikeComposite: 10,
      collectPrimes: 16,
      returnPrimes: 19,
    },
  },
  python: {
    code: `def sieve_of_eratosthenes(n):
    if n < 2:
        return []
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False

    return [i for i in range(2, n + 1) if is_prime[i]]`,
    lineMap: {
      function: 1,
      baseCase: 2,
      initArray: 4,
      markZeroOne: 5,
      outerLoop: 7,
      primeCheck: 8,
      innerLoop: 9,
      strikeComposite: 10,
      returnPrimes: 12,
    },
  },
}

export function getSieveSource(language = 'javascript') {
  return sieveSources[language] ?? sieveSources.javascript
}

export function resolveSieveLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getSieveSource(language)
  return source.lineMap?.[lineKey] ?? sieveSources.javascript.lineMap?.[lineKey]
}
