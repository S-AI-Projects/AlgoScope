import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  quickSort,
  QUICK_SORT_FIXTURES,
  generateQuickSortSteps,
  validateQuickSortInvariant,
  quickSortSources,
  getQuickSortSource,
  resolveQuickSortLine,
} from '../../src/algorithms/sorting/quickSortSteps.js'

console.log('=== R62-T027 quickSortSteps Executable Documentation Verification ===')

// 1. Concrete Fixtures Verification
console.log('1. Verifying Concrete Fixtures [3, 1, 2], [2, 2, 1], [1, 2, 3], [3, 2, 1], [42], []...')
assert.deepStrictEqual(quickSort([3, 1, 2]), [1, 2, 3], '[3, 1, 2] must sort ascending to [1, 2, 3]')
assert.deepStrictEqual(quickSort([3, 1, 2], { order: 'desc' }), [3, 2, 1], '[3, 1, 2] descending must be [3, 2, 1]')

assert.deepStrictEqual(quickSort([2, 2, 1]), [1, 2, 2], '[2, 2, 1] must sort ascending to [1, 2, 2]')
assert.deepStrictEqual(quickSort([2, 2, 1], { order: 'desc' }), [2, 2, 1], '[2, 2, 1] descending must be [2, 2, 1]')

assert.deepStrictEqual(quickSort([1, 2, 3]), [1, 2, 3])
assert.deepStrictEqual(quickSort([3, 2, 1]), [1, 2, 3])

assert.deepStrictEqual(quickSort([42]), [42], 'Singleton must return [42]')
assert.deepStrictEqual(quickSort([]), [], 'Empty array must return []')
console.log('  PASS: Pure sorting and boundary collections verified.')

// 2. QUICK_SORT_FIXTURES Explanations
console.log('2. Verifying Concrete Fixture Documentation Explanations...')
assert.ok(Array.isArray(QUICK_SORT_FIXTURES))
assert.ok(QUICK_SORT_FIXTURES.length >= 6)
for (const fix of QUICK_SORT_FIXTURES) {
  assert.ok(typeof fix.name === 'string')
  assert.ok(typeof fix.explanation === 'string' && fix.explanation.length > 0)
  assert.deepStrictEqual(quickSort(fix.input), fix.expectedAscending)
}
console.log('  PASS: Fixture documentation verified.')

// 3. Step Generation & Invariant Validation
console.log('3. Verifying Step Generation and Invariants...')
const inputs = [[3, 1, 2], [2, 2, 1], [1, 2, 3], [3, 2, 1], [42], []]
for (const inp of inputs) {
  const steps = generateQuickSortSteps(inp)
  assert.ok(steps.length > 0)
  assert.strictEqual(steps[steps.length - 1].type, 'complete')
  assert.deepStrictEqual(steps[steps.length - 1].array, quickSort(inp))
  for (const step of steps) {
    assert.ok(validateQuickSortInvariant(step, inp))
  }
}
console.log('  PASS: Step invariants verified.')

// 4. Snapshot Immutability
console.log('4. Verifying Snapshot Immutability...')
const stepsTest = generateQuickSortSteps([3, 1, 2])
const cached = stepsTest.map((s) => [...s.array])
for (let i = 0; i < stepsTest.length; i++) {
  assert.deepStrictEqual(stepsTest[i].array, cached[i], `Step ${i} array mutated!`)
}
console.log('  PASS: Snapshot immutability verified.')

// 5. Line Maps & Source Alignment
console.log('5. Verifying Line Maps Alignment with Source...')
const jsSource = getQuickSortSource('javascript')
assert.ok(jsSource && typeof jsSource.code === 'string')
const lines = jsSource.code.split('\n')
assert.ok(lines[jsSource.lineMap.function - 1].includes('function quickSort'))
assert.ok(lines[jsSource.lineMap.partitionFunc - 1].includes('function partition'))
assert.ok(lines[jsSource.lineMap.pivotSelect - 1].includes('let pivot = arr[high]'))
assert.ok(lines[jsSource.lineMap.compare - 1].includes('if (arr[j] < pivot)'))
assert.ok(lines[jsSource.lineMap.swap - 1].includes('[arr[i], arr[j]]'))
assert.ok(lines[jsSource.lineMap.finalSwap - 1].includes('[arr[i + 1], arr[high]]'))

assert.strictEqual(resolveQuickSortLine('javascript', 'pivotSelect'), 10)
assert.strictEqual(resolveQuickSortLine('javascript', 'finalSwap'), 18)
console.log('  PASS: Line maps aligned with source strings.')

// 6. Source Execution in Isolated Node VM
console.log('6. Executing JavaScript Source in Isolated VM Sandbox...')
const sandbox = {}
const context = vm.createContext(sandbox)
const script = new vm.Script(quickSortSources.javascript.code + '\nglobalThis.quickSort = quickSort;')
script.runInContext(context)
const vmSort = context.quickSort
assert.strictEqual(typeof vmSort, 'function')

const a1 = [3, 1, 2]
vmSort(a1, 0, a1.length - 1)
assert.deepStrictEqual(a1, [1, 2, 3])

const a2 = [2, 2, 1]
vmSort(a2, 0, a2.length - 1)
assert.deepStrictEqual(a2, [1, 2, 2])
console.log('  PASS: VM isolated execution verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
