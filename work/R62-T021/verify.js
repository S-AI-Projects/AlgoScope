import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  computePrefixSums,
  queryRange,
  rangeSum,
  prefixSums,
  generatePrefixSumSteps,
  replayTrace,
  replayOperations,
  prefixSumSources,
  prefixSumMetadata,
} from '../../src/algorithms/course/prefix-sums.js'

console.log('=== R62-T021 Prefix Sums Contract Verification ===')

// 1. Primary Fixture Verification
console.log('1. Verifying Primary Fixture: [2, -1, 3]...')
const fixtureInput = [2, -1, 3]
const prefix = computePrefixSums(fixtureInput)
assert.deepStrictEqual(prefix, [0, 2, 1, 4], 'Prefix array for [2, -1, 3] must be [0, 2, 1, 4]')

const range1to3 = queryRange(prefix, 1, 3)
assert.strictEqual(range1to3, 2, 'Range [1, 3) must sum to 2')

const directRange1to3 = rangeSum(fixtureInput, 1, 3)
assert.strictEqual(directRange1to3, 2, 'Direct rangeSum(arr, 1, 3) must equal 2')
console.log('  PASS: Primary fixture verified successfully ([2, -1, 3] -> [0, 2, 1, 4], range [1, 3) = 2).')

// 2. Comprehensive Subrange Invariants
console.log('2. Verifying Subrange Invariants on [2, -1, 3]...')
assert.strictEqual(queryRange(prefix, 0, 0), 0, 'range [0, 0) must sum to 0')
assert.strictEqual(queryRange(prefix, 0, 1), 2, 'range [0, 1) must sum to 2')
assert.strictEqual(queryRange(prefix, 0, 2), 1, 'range [0, 2) must sum to 1')
assert.strictEqual(queryRange(prefix, 0, 3), 4, 'range [0, 3) must sum to 4')
assert.strictEqual(queryRange(prefix, 1, 2), -1, 'range [1, 2) must sum to -1')
assert.strictEqual(queryRange(prefix, 2, 3), 3, 'range [2, 3) must sum to 3')
assert.strictEqual(queryRange(prefix, 3, 3), 0, 'range [3, 3) must sum to 0')
console.log('  PASS: All subranges verified.')

// 3. Immutability & Non-mutation contract
console.log('3. Verifying Non-Mutation Contract...')
const frozenArr = Object.freeze([2, -1, 3])
assert.doesNotThrow(() => computePrefixSums(frozenArr), 'Must not mutate frozen array')
assert.deepStrictEqual(fixtureInput, [2, -1, 3], 'Original fixture must not be modified')
console.log('  PASS: Non-mutation contract verified.')

// 4. Algorithm Runner Wrapper
console.log('4. Verifying Algorithm Runner Wrapper...')
const wrapper = prefixSums(fixtureInput)
assert.deepStrictEqual(wrapper.original, [2, -1, 3])
assert.deepStrictEqual(wrapper.prefix, [0, 2, 1, 4])
assert.strictEqual(wrapper.query(1, 3), 2)
assert.ok(Array.isArray(wrapper.steps) && wrapper.steps.length > 0)
console.log('  PASS: Algorithm runner wrapper verified.')

// 5. Replay Trace and Intermediate Snapshots
console.log('5. Verifying Replay Trace and Step Generation...')
const trace = replayTrace(fixtureInput)
assert.deepStrictEqual(
  trace,
  [
    [0],
    [0, 2],
    [0, 2, 1],
    [0, 2, 1, 4],
  ],
  'Intermediate prefix array snapshots must match expected cumulative steps'
)

const steps = generatePrefixSumSteps(fixtureInput, [[1, 3]])
assert.strictEqual(steps[0].type, 'init')
assert.strictEqual(steps[1].type, 'accumulate')
assert.strictEqual(steps[2].type, 'accumulate')
assert.strictEqual(steps[3].type, 'accumulate')
assert.strictEqual(steps[4].type, 'complete')
assert.strictEqual(steps[5].type, 'query')
assert.strictEqual(steps[5].query.sum, 2)

const replayBatch = replayOperations(fixtureInput, [
  [1, 3],
  [0, 2],
  [0, 3],
])
assert.deepStrictEqual(replayBatch, [2, 1, 4])
console.log('  PASS: Replay trace and step generator verified.')

// 6. Isolated Node VM Execution of Displayed JS Source String
console.log('6. Executing Displayed JS Source Code in Isolated Node VM...')
const jsCode = prefixSumSources.prefixSums.javascript.code
assert.ok(typeof jsCode === 'string' && jsCode.length > 0)

const logs = []
const sandbox = {
  console: {
    log: (...args) => logs.push(args.length === 1 ? args[0] : args),
    error: () => {},
    warn: () => {},
  },
  Math,
}
const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode)
script.runInContext(context, { timeout: 2000 })

assert.strictEqual(logs.length, 2, 'VM script must produce exactly 2 console logs')
assert.deepStrictEqual(Array.from(logs[0]), [0, 2, 1, 4], 'First console log must be [0, 2, 1, 4]')
assert.strictEqual(logs[1], 2, 'Second console log must be 2')
assert.strictEqual(typeof context.computePrefixSums, 'function')
assert.strictEqual(typeof context.queryRange, 'function')
console.log('  PASS: Isolated VM executed source string successfully.')

// 7. Multi-language Source Snippets and Metadata
console.log('7. Verifying Multi-Language Sources and Metadata...')
const languages = ['python', 'cpp', 'java', 'c', 'rust', 'go']
for (const l of languages) {
  const src = prefixSumSources.prefixSums[l]?.code
  assert.ok(typeof src === 'string' && src.length > 0, `Language ${l} source code must exist`)
}
assert.strictEqual(prefixSumMetadata.name, 'Prefix Sums')
assert.strictEqual(prefixSumMetadata.timeComplexity.query, 'O(1)')
console.log('  PASS: Multi-language sources and metadata verified.')

// 8. Edge Cases
console.log('8. Verifying Edge Cases...')
// Empty array
const emptyPrefix = computePrefixSums([])
assert.deepStrictEqual(emptyPrefix, [0])
assert.strictEqual(queryRange(emptyPrefix, 0, 0), 0)

// Single element
const singlePrefix = computePrefixSums([10])
assert.deepStrictEqual(singlePrefix, [0, 10])
assert.strictEqual(queryRange(singlePrefix, 0, 1), 10)

// Negative numbers
const negPrefix = computePrefixSums([-3, -7, -2])
assert.deepStrictEqual(negPrefix, [0, -3, -10, -12])
assert.strictEqual(queryRange(negPrefix, 0, 3), -12)
assert.strictEqual(queryRange(negPrefix, 1, 3), -9)
console.log('  PASS: Edge cases verified.')

// 9. Contract Error Handling
console.log('9. Verifying Contract Validation and Error Handling...')
assert.throws(() => computePrefixSums(null), TypeError)
assert.throws(() => computePrefixSums(['invalid']), TypeError)
assert.throws(() => queryRange([], 0, 0), RangeError)
assert.throws(() => queryRange([0, 2, 1, 4], -1, 2), RangeError)
assert.throws(() => queryRange([0, 2, 1, 4], 2, 1), RangeError)
assert.throws(() => queryRange([0, 2, 1, 4], 0, 5), RangeError)
console.log('  PASS: Contract validation errors verified.')

// 10. Sensitivity / Defect Detection
console.log('10. Verifying Test Sensitivity against Bugs...')
assert.notDeepStrictEqual(prefix, [2, -1, 3])
assert.notDeepStrictEqual(prefix, [0, 2, 1])
assert.notStrictEqual(range1to3, 4)
assert.notStrictEqual(range1to3, -1)
console.log('  PASS: Test sensitivity verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
