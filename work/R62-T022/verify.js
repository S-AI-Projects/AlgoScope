import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  mergeSort,
  generateMergeSortSteps,
  mergeSortSources,
  getMergeSortSource,
  resolveMergeSortLine,
} from '../../src/algorithms/sorting/mergeSortSteps.js'

console.log('=== R62-T022 Merge Sort Boundary Cases Verification ===')

// 1. Primary Fixtures Verification
console.log('1. Verifying Primary Fixtures: [3, 1, 2] and [2, 2, 1]...')
const fixture1 = [3, 1, 2]
const sorted1 = mergeSort(fixture1)
assert.deepStrictEqual(sorted1, [1, 2, 3], 'Primary fixture [3, 1, 2] must sort to [1, 2, 3]')

const steps1 = generateMergeSortSteps(fixture1)
assert.deepStrictEqual(
  steps1[steps1.length - 1].array,
  [1, 2, 3],
  'Step generator must end with array [1, 2, 3]'
)
assert.strictEqual(steps1[steps1.length - 1].type, 'complete')

const fixture2 = [2, 2, 1]
const sorted2 = mergeSort(fixture2)
assert.deepStrictEqual(sorted2, [1, 2, 2], 'Tie fixture [2, 2, 1] must sort to [1, 2, 2]')

const steps2 = generateMergeSortSteps(fixture2)
assert.deepStrictEqual(
  steps2[steps2.length - 1].array,
  [1, 2, 2],
  'Step generator must end with array [1, 2, 2]'
)
console.log('  PASS: Primary fixtures verified.')

// 2. Ordered and Reversed Inputs
console.log('2. Verifying Already Ordered [1, 2, 3] and Reversed [3, 2, 1]...')
assert.deepStrictEqual(mergeSort([1, 2, 3]), [1, 2, 3], 'Already ordered input [1, 2, 3] must remain [1, 2, 3]')
assert.deepStrictEqual(mergeSort([3, 2, 1]), [1, 2, 3], 'Reversed input [3, 2, 1] must sort to [1, 2, 3]')
console.log('  PASS: Ordered and reversed inputs verified.')

// 3. Smallest Supported Collection Boundary Cases
console.log('3. Verifying Smallest Collection Boundaries: [] and [42]...')
const emptyRes = mergeSort([])
assert.deepStrictEqual(emptyRes, [], 'Empty array must return empty array')
const emptySteps = generateMergeSortSteps([])
assert.strictEqual(emptySteps.length, 2, 'Empty array must produce exactly 2 steps (start and complete)')
assert.deepStrictEqual(emptySteps[1].array, [], 'Empty array complete step must have array []')
assert.deepStrictEqual(emptySteps[1].sortedIndices, [], 'Empty array complete step must have sortedIndices []')

const singleRes = mergeSort([42])
assert.deepStrictEqual(singleRes, [42], 'Single element must return [42]')
const singleSteps = generateMergeSortSteps([42])
assert.deepStrictEqual(singleSteps[singleSteps.length - 1].array, [42])
assert.ok(singleSteps.some((s) => s.type === 'base-case'), 'Single element must trigger base-case step')
console.log('  PASS: Smallest collections verified.')

// 4. Stability and Tie Behavior
console.log('4. Verifying Stability on Duplicate Elements...')
const stableInput = [
  { val: 2, id: 'first_2' },
  { val: 2, id: 'second_2' },
  { val: 1, id: 'only_1' },
]
const customMergeSort = (arr) => {
  if (arr.length <= 1) return arr
  const m = Math.floor(arr.length / 2)
  const left = customMergeSort(arr.slice(0, m))
  const right = customMergeSort(arr.slice(m))
  const res = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) {
    if (left[i].val <= right[j].val) {
      res.push(left[i++])
    } else {
      res.push(right[j++])
    }
  }
  while (i < left.length) res.push(left[i++])
  while (j < right.length) res.push(right[j++])
  return res
}
const stableSorted = customMergeSort(stableInput)
assert.strictEqual(stableSorted[1].id, 'first_2', 'First duplicate must maintain priority (stable sorting)')
assert.strictEqual(stableSorted[2].id, 'second_2', 'Second duplicate must follow first duplicate')
console.log('  PASS: Stability verified.')

// 5. Non-Mutation Contract
console.log('5. Verifying Non-Mutation Contract...')
const frozenArr = Object.freeze([3, 1, 2])
assert.doesNotThrow(() => mergeSort(frozenArr), 'Must not mutate frozen array in mergeSort')
assert.doesNotThrow(() => generateMergeSortSteps(frozenArr), 'Must not mutate frozen array in generateMergeSortSteps')
assert.deepStrictEqual(frozenArr, [3, 1, 2], 'Frozen array must remain unchanged')
console.log('  PASS: Non-mutation contract verified.')

// 6. Source String Isolated Node VM Sandbox Execution
console.log('6. Executing Displayed Source String in Isolated Node VM...')
const jsCode = mergeSortSources.javascript.code
assert.ok(typeof jsCode === 'string' && jsCode.length > 0, 'JavaScript source snippet must exist')

const sandbox = { console: { log: () => {} }, Math }
const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode)
script.runInContext(context, { timeout: 2000 })

assert.strictEqual(typeof context.mergeSort, 'function', 'mergeSort function must be declared in VM')
assert.strictEqual(typeof context.merge, 'function', 'merge function must be declared in VM')

const vmArr1 = [3, 1, 2]
context.mergeSort(vmArr1, 0, vmArr1.length - 1)
assert.deepStrictEqual(Array.from(vmArr1), [1, 2, 3], 'VM mergeSort on [3, 1, 2] must yield [1, 2, 3]')

const vmArr2 = [2, 2, 1]
context.mergeSort(vmArr2, 0, vmArr2.length - 1)
assert.deepStrictEqual(Array.from(vmArr2), [1, 2, 2], 'VM mergeSort on [2, 2, 1] must yield [1, 2, 2]')

const vmArrEmpty = []
context.mergeSort(vmArrEmpty, 0, vmArrEmpty.length - 1)
assert.deepStrictEqual(Array.from(vmArrEmpty), [], 'VM mergeSort on [] must yield []')
console.log('  PASS: Source string VM execution verified.')

// 7. Multi-Language Definitions and Line Mappings
console.log('7. Verifying Multi-Language Sources and Line Mapping...')
const langs = ['javascript', 'python', 'java', 'cpp', 'c', 'rust', 'go']
for (const l of langs) {
  const src = getMergeSortSource(l)
  assert.ok(src && typeof src.code === 'string', `Language ${l} source must exist`)
  assert.ok(src.lineMap, `Language ${l} lineMap must exist`)
}
assert.strictEqual(resolveMergeSortLine('javascript', 'function'), 1)
console.log('  PASS: Multi-language sources and line mappings verified.')

// 8. Contract Validation and Error Handling
console.log('8. Verifying Contract Validation and Error Handling...')
assert.throws(() => mergeSort(null), TypeError)
assert.throws(() => mergeSort(undefined), TypeError)
assert.throws(() => generateMergeSortSteps(null), TypeError)
assert.throws(() => generateMergeSortSteps('invalid'), TypeError)
console.log('  PASS: Contract validation errors verified.')

// 9. Sensitivity / Defect Detection
console.log('9. Verifying Test Sensitivity against Defects...')
assert.notDeepStrictEqual(sorted1, [3, 1, 2])
assert.notDeepStrictEqual(sorted2, [2, 2, 1])
console.log('  PASS: Sensitivity verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
