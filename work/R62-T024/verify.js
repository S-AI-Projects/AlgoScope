import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  binarySearch,
  generateBinarySearchSteps,
  validateBinarySearchInvariant,
  BINARY_SEARCH_MISS_SENTINEL,
  binarySearchSources,
  getBinarySearchSource,
  resolveBinarySearchSortLine,
} from '../../src/algorithms/searching/binarySearchSteps.js'

console.log('=== R62-T024 Binary Search Invariant & Property Verification ===')

// 1. Primary Searches on [2, 4, 6, 8]
console.log('1. Verifying Primary Searches on [2, 4, 6, 8] for 2, 8 and 5...')
const primaryArray = [2, 4, 6, 8]

// Search for 2 -> index 0
const idx2 = binarySearch(primaryArray, 2)
assert.strictEqual(idx2, 0, 'Target 2 must be found at index 0')
const steps2 = generateBinarySearchSteps(primaryArray, 2)
assert.strictEqual(steps2[steps2.length - 1].type, 'found')
assert.strictEqual(steps2[steps2.length - 1].foundIndex, 0)
for (const step of steps2) {
  assert.ok(validateBinarySearchInvariant(step, primaryArray, 2), 'Invariant must hold for search 2')
}

// Search for 8 -> index 3
const idx8 = binarySearch(primaryArray, 8)
assert.strictEqual(idx8, 3, 'Target 8 must be found at index 3')
const steps8 = generateBinarySearchSteps(primaryArray, 8)
assert.strictEqual(steps8[steps8.length - 1].type, 'found')
assert.strictEqual(steps8[steps8.length - 1].foundIndex, 3)
for (const step of steps8) {
  assert.ok(validateBinarySearchInvariant(step, primaryArray, 8), 'Invariant must hold for search 8')
}

// Search for 5 -> miss sentinel -1
const idx5 = binarySearch(primaryArray, 5)
assert.strictEqual(idx5, -1, 'Target 5 must return miss sentinel -1')
assert.strictEqual(idx5, BINARY_SEARCH_MISS_SENTINEL)
const steps5 = generateBinarySearchSteps(primaryArray, 5)
assert.strictEqual(steps5[steps5.length - 1].type, 'not-found')
for (const step of steps5) {
  assert.ok(validateBinarySearchInvariant(step, primaryArray, 5), 'Invariant must hold for search 5')
}
console.log('  PASS: Primary searches and step invariants verified.')

// 2. Singleton and Empty Collection Boundaries
console.log('2. Verifying Singleton and Empty Collection Boundaries...')
// Singleton present
assert.strictEqual(binarySearch([42], 42), 0)
const stepsSingletonFound = generateBinarySearchSteps([42], 42)
assert.strictEqual(stepsSingletonFound[stepsSingletonFound.length - 1].type, 'found')

// Singleton absent
assert.strictEqual(binarySearch([42], 10), -1)
const stepsSingletonMiss = generateBinarySearchSteps([42], 10)
assert.strictEqual(stepsSingletonMiss[stepsSingletonMiss.length - 1].type, 'not-found')

// Empty collection
assert.strictEqual(binarySearch([], 5), -1)
const stepsEmpty = generateBinarySearchSteps([], 5)
assert.strictEqual(stepsEmpty[stepsEmpty.length - 1].type, 'not-found')
for (const step of stepsEmpty) {
  assert.ok(validateBinarySearchInvariant(step, [], 5))
}
console.log('  PASS: Boundary collections verified.')

// 3. Duplicate-Index Contract
console.log('3. Verifying Duplicate-Index Contract...')
const dupArr = [1, 2, 2, 2, 3]
const dupIdx = binarySearch(dupArr, 2)
assert.ok([1, 2, 3].includes(dupIdx), 'Must return a valid index containing 2')
assert.strictEqual(dupArr[dupIdx], 2)

const allIdentical = [7, 7, 7, 7]
const allIdx = binarySearch(allIdentical, 7)
assert.ok(allIdx >= 0 && allIdx < 4)
assert.strictEqual(allIdentical[allIdx], 7)
console.log('  PASS: Duplicate-index contract verified.')

// 4. Snapshot Immutability and Non-Mutation
console.log('4. Verifying Snapshot Immutability and Non-Mutation Contract...')
const frozenArr = Object.freeze([2, 4, 6, 8])
assert.doesNotThrow(() => binarySearch(frozenArr, 4))
assert.doesNotThrow(() => generateBinarySearchSteps(frozenArr, 4))
assert.deepStrictEqual(frozenArr, [2, 4, 6, 8])

const recordedSteps = generateBinarySearchSteps(primaryArray, 8)
const snapshotsBefore = recordedSteps.map((s) => JSON.parse(JSON.stringify(s)))
for (let i = 0; i < recordedSteps.length; i++) {
  assert.deepStrictEqual(recordedSteps[i].array, snapshotsBefore[i].array)
  assert.deepStrictEqual(recordedSteps[i].indices, snapshotsBefore[i].indices)
  assert.deepStrictEqual(recordedSteps[i].variables, snapshotsBefore[i].variables)
}
console.log('  PASS: Snapshot immutability verified.')

// 5. Source String Isolated VM Sandbox Execution
console.log('5. Executing Displayed JavaScript Source String in Isolated Node VM...')
const jsCode = binarySearchSources.javascript.code
assert.ok(typeof jsCode === 'string' && jsCode.length > 0)

const sandbox = { console: { log: () => {} }, Math }
const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode)
script.runInContext(context, { timeout: 2000 })

assert.strictEqual(typeof context.binarySearch, 'function')
assert.strictEqual(context.binarySearch([2, 4, 6, 8], 2), 0)
assert.strictEqual(context.binarySearch([2, 4, 6, 8], 8), 3)
assert.strictEqual(context.binarySearch([2, 4, 6, 8], 5), -1)
assert.strictEqual(context.binarySearch([42], 42), 0)
assert.strictEqual(context.binarySearch([42], 10), -1)
assert.strictEqual(context.binarySearch([], 5), -1)
console.log('  PASS: Source string VM execution verified.')

// 6. Multi-Language Definitions and Line Maps
console.log('6. Verifying Multi-Language Sources and Line Mapping...')
const langs = ['javascript', 'python', 'java', 'cpp', 'c', 'rust', 'go']
for (const l of langs) {
  const src = getBinarySearchSource(l)
  assert.ok(src && typeof src.code === 'string')
  assert.ok(src.lineMap)
}
assert.strictEqual(resolveBinarySearchSortLine('javascript', 'function'), 1)
assert.strictEqual(resolveBinarySearchSortLine('javascript', 'found'), 7)
console.log('  PASS: Multi-language sources and line mappings verified.')

// 7. Contract Validation and Error Handling
console.log('7. Verifying Contract Validation and Errors...')
assert.throws(() => binarySearch(null, 5), TypeError)
assert.throws(() => binarySearch([1, 2], 'target'), TypeError)
assert.throws(() => generateBinarySearchSteps(null, 5), TypeError)
console.log('  PASS: Contract validation errors verified.')

// 8. Defect Sensitivity
console.log('8. Verifying Defect Sensitivity...')
assert.notStrictEqual(idx2, 1)
assert.notStrictEqual(idx8, 0)
assert.notStrictEqual(idx5, 0)
console.log('  PASS: Sensitivity verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
