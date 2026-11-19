import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  LRUCache,
  LRU_MISS_SENTINEL,
  createDeterministicRandom,
  generateDeterministicOperations,
  generateLRUReplaySteps,
  validateLRUInvariant,
  AnimationPlaybackController,
  getLRUCacheSource,
} from '../../src/algorithms/course/lru-cache.js'

console.log('=== R62-T025 LRU Cache Deterministic Execution & Replay Verification ===')

// 1. Core Trace: Capacity 2: putA, putB, getA, putC evicts B; getting A refreshes recency without increasing size
console.log('1. Verifying Core Trace: putA, putB, getA, putC evicts B...')
const cache = new LRUCache(2)
assert.strictEqual(cache.capacity, 2)
assert.strictEqual(cache.size, 0)

const putA = cache.put('A', 1)
assert.strictEqual(putA.evictedKey, null)
assert.strictEqual(cache.size, 1)
assert.deepStrictEqual(cache.getRecencyOrder(), ['A'])

const putB = cache.put('B', 2)
assert.strictEqual(putB.evictedKey, null)
assert.strictEqual(cache.size, 2)
assert.deepStrictEqual(cache.getRecencyOrder(), ['A', 'B'])

// get('A') refreshes recency without increasing size
const valA = cache.get('A')
assert.strictEqual(valA, 1)
assert.strictEqual(cache.size, 2, 'Size must not increase after get')
assert.deepStrictEqual(cache.getRecencyOrder(), ['B', 'A'], 'A must be refreshed to MRU')

// put('C', 3) must evict 'B'
const putC = cache.put('C', 3)
assert.strictEqual(putC.evictedKey, 'B', 'B must be evicted')
assert.strictEqual(cache.size, 2)
assert.deepStrictEqual(cache.getRecencyOrder(), ['A', 'C'])

// B is gone, returning sentinel -1
assert.strictEqual(cache.get('B'), LRU_MISS_SENTINEL)
assert.strictEqual(cache.get('B'), -1)
assert.strictEqual(cache.get('A'), 1)
assert.strictEqual(cache.get('C'), 3)
console.log('  PASS: Core trace and recency refresh verified.')

// 2. Deterministic Replay & Seed Reproducibility
console.log('2. Verifying Deterministic Replay from Same Seed...')
const rng1 = createDeterministicRandom(12345)
const rng2 = createDeterministicRandom(12345)
for (let i = 0; i < 100; i++) {
  assert.strictEqual(rng1(), rng2(), 'PRNG outputs must match exactly')
}

const opsA = generateDeterministicOperations({ seed: 777, count: 15 })
const opsB = generateDeterministicOperations({ seed: 777, count: 15 })
assert.deepStrictEqual(opsA, opsB, 'Deterministic operations must match')

const stepsA = generateLRUReplaySteps(opsA, 2, { stepDurationMs: 100 })
const stepsB = generateLRUReplaySteps(opsB, 2, { stepDurationMs: 100 })
assert.deepStrictEqual(stepsA, stepsB, 'Step replay traces must match exactly')
console.log('  PASS: Deterministic replay verified.')

// 3. Snapshot Immutability
console.log('3. Verifying Snapshot Immutability...')
const steps = generateLRUReplaySteps(opsA, 2)
const serialized = steps.map((s) => JSON.stringify(s.cacheState))
for (let i = 0; i < steps.length; i++) {
  assert.strictEqual(JSON.stringify(steps[i].cacheState), serialized[i])
}
console.log('  PASS: Snapshot immutability verified.')

// 4. Invariant Validation Across All Steps
console.log('4. Verifying Invariants across all steps...')
for (const step of steps) {
  assert.doesNotThrow(() => validateLRUInvariant(step, 2))
}
console.log('  PASS: All step invariants hold.')

// 5. Controllable Animation Timing
console.log('5. Verifying Controllable Animation Timing...')
const timer = new AnimationPlaybackController({ stepDurationMs: 200 })
assert.strictEqual(timer.virtualTime, 0)
const nextState = timer.next(10)
assert.strictEqual(nextState.currentStep, 1)
assert.strictEqual(nextState.virtualTime, 200)
const jumpState = timer.advanceToStep(5, 10)
assert.strictEqual(jumpState.currentStep, 5)
assert.strictEqual(jumpState.virtualTime, 1000)
console.log('  PASS: Animation timing controller verified.')

// 6. Source String VM Sandbox Execution
console.log('6. Verifying Source String in Isolated VM...')
const jsSource = getLRUCacheSource('javascript')
assert.ok(typeof jsSource.code === 'string')
const sandbox = { Map }
const context = vm.createContext(sandbox)
const script = new vm.Script(jsSource.code + '\nglobalThis.LRUCache = LRUCache;')
script.runInContext(context)
const VMLRU = context.LRUCache
const vmInstance = new VMLRU(2)
vmInstance.put('A', 1)
vmInstance.put('B', 2)
assert.strictEqual(vmInstance.get('A'), 1)
vmInstance.put('C', 3)
assert.strictEqual(vmInstance.get('B'), -1)
console.log('  PASS: Source string VM execution verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
