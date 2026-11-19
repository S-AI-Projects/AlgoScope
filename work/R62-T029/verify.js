import assert from 'node:assert/strict'
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
} from '../../src/algorithms/course/sieve-of-eratosthenes.js'

console.log('=== R62-T029 Sieve of Eratosthenes Complexity Experiment Verification ===')

// 1. Primality Contract: Primes up to 12 are [2, 3, 5, 7, 11]; 0 and 1 are not prime
console.log('1. Verifying Primality Contract for primes up to 12...')
assert.strictEqual(isPrime(0), false, '0 must not be prime')
assert.strictEqual(isPrime(1), false, '1 must not be prime')
assert.deepStrictEqual(sieveOfEratosthenes(0), [], 'sieve(0) must be []')
assert.deepStrictEqual(sieveOfEratosthenes(1), [], 'sieve(1) must be []')

const primes12 = sieveOfEratosthenes(12)
assert.deepStrictEqual(primes12, [2, 3, 5, 7, 11], 'Primes up to 12 must be [2, 3, 5, 7, 11]')
console.log('  PASS: Primes up to 12 and non-prime status of 0, 1 verified.')

// 2. Complexity Experiment: Operation counts for three bounded valid sizes (12, 30, 100)
console.log('2. Recording Operation Counts for Three Bounded Sizes (12, 30, 100)...')
const exp12 = recordSieveComplexity(12)
assert.strictEqual(exp12.n, 12)
assert.deepStrictEqual(exp12.primes, [2, 3, 5, 7, 11])
assert.strictEqual(exp12.primesCount, 5)
assert.strictEqual(exp12.outerChecks, 2)
assert.strictEqual(exp12.compositeStrikes, 7)
assert.strictEqual(exp12.totalOperations, 9)

const exp30 = recordSieveComplexity(30)
assert.strictEqual(exp30.n, 30)
assert.strictEqual(exp30.primesCount, 10)
assert.ok(exp30.totalOperations > exp12.totalOperations)

const exp100 = recordSieveComplexity(100)
assert.strictEqual(exp100.n, 100)
assert.strictEqual(exp100.primesCount, 25)
assert.ok(exp100.totalOperations > exp30.totalOperations)

const experiment = runSieveComplexityExperiment([12, 30, 100])
assert.strictEqual(experiment.length, 3)
console.log('  PASS: Machine-independent operation counts verified across 3 bounded sizes.')

// 3. Replay Steps and Snapshot Immutability
console.log('3. Verifying Replay Steps and Snapshot Immutability...')
const steps12 = generateSieveReplaySteps(12)
assert.ok(steps12.length > 0)
assert.strictEqual(steps12[steps12.length - 1].type, 'complete')
assert.deepStrictEqual(steps12[steps12.length - 1].primes, [2, 3, 5, 7, 11])

const cachedArrays = steps12.map((s) => [...s.array])
for (let i = 0; i < steps12.length; i++) {
  assert.deepStrictEqual(steps12[i].array, cachedArrays[i], `Step ${i} array was mutated`)
  assert.ok(validateSieveStep(steps12[i], 12), `Step ${i} invariant failed`)
}
console.log('  PASS: Replay steps and snapshot immutability verified.')

// 4. Source Strings Line Maps and Isolated VM Execution
console.log('4. Verifying Source Strings and Isolated VM Execution...')
assert.ok(getSieveSource('javascript'))
assert.strictEqual(resolveSieveLine('javascript', 'outerLoop'), 7)

const sandbox = {}
const context = vm.createContext(sandbox)
const script = new vm.Script(sieveSources.javascript.code + '\nglobalThis.sieve = sieve;')
script.runInContext(context)

const vmSieve = context.sieve
assert.strictEqual(typeof vmSieve, 'function')
assert.deepStrictEqual(Array.from(vmSieve(12)), [2, 3, 5, 7, 11])
assert.deepStrictEqual(Array.from(vmSieve(0)), [])
assert.deepStrictEqual(Array.from(vmSieve(1)), [])
console.log('  PASS: VM isolated execution verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
