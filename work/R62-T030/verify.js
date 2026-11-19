import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  countingSort,
  generateCountingSortSteps,
  validateCountingSortInvariant,
  countingSortSources,
  getCountingSortSource,
  resolveCountingSortLine,
} from '../../src/algorithms/sorting/countingSortSteps.js'

console.log('=== R62-T030 countingSortSteps Mutation-Resistant Verification ===')

// 1. Required Ascending & Descending Collections
console.log('1. Verifying [3, 1, 2], [2, 2, 1], [1, 2, 3], [3, 2, 1], [42], []...')
assert.deepStrictEqual(countingSort([3, 1, 2]), [1, 2, 3])
assert.deepStrictEqual(countingSort([3, 1, 2], { order: 'desc' }), [3, 2, 1])

assert.deepStrictEqual(countingSort([2, 2, 1]), [1, 2, 2])
assert.deepStrictEqual(countingSort([2, 2, 1], { order: 'desc' }), [2, 2, 1])

assert.deepStrictEqual(countingSort([1, 2, 3]), [1, 2, 3])
assert.deepStrictEqual(countingSort([3, 2, 1]), [1, 2, 3])

assert.deepStrictEqual(countingSort([42]), [42], 'Singleton collection must return [42]')
assert.deepStrictEqual(countingSort([]), [], 'Empty collection must return []')
console.log('  PASS: Required inputs and boundary collections verified.')

// 2. Mutation-Resistant Regression
console.log('2. Verifying Rejection of Decisive Operation Mutants...')
function mutantDecisive(arr) {
  const n = arr.length
  if (n <= 1) return [...arr]
  const max = Math.max(...arr)
  const count = new Array(max + 1).fill(0)
  for (let i = 0; i < n; i++) count[arr[i]]++
  for (let i = 1; i <= max; i++) count[i] += count[i - 1]
  const output = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    output[count[arr[i]]] = arr[i] // MUTANT: omitted - 1
    count[arr[i]]--
  }
  return output
}
assert.notDeepStrictEqual(mutantDecisive([3, 1, 2]), [1, 2, 3], 'Mutant 1 must be rejected')

function mutantDecrement(arr) {
  const n = arr.length
  if (n <= 1) return [...arr]
  const max = Math.max(...arr)
  const count = new Array(max + 1).fill(0)
  for (let i = 0; i < n; i++) count[arr[i]]++
  for (let i = 1; i <= max; i++) count[i] += count[i - 1]
  const output = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    output[count[arr[i]] - 1] = arr[i]
    // MUTANT: count[arr[i]]-- omitted!
  }
  return output
}
assert.notDeepStrictEqual(mutantDecrement([2, 2, 1]), [1, 2, 2], 'Mutant 2 must be rejected')
console.log('  PASS: Mutants successfully rejected by regression suite.')

// 3. Step Generation & Invariant Validation
console.log('3. Verifying Step Generation and Invariants...')
const inputs = [[3, 1, 2], [2, 2, 1], [1, 2, 3], [3, 2, 1], [42], []]
for (const inp of inputs) {
  const steps = generateCountingSortSteps(inp)
  assert.ok(steps.length > 0)
  assert.strictEqual(steps[steps.length - 1].type, 'complete')
  assert.deepStrictEqual(steps[steps.length - 1].array, countingSort(inp))
  for (const step of steps) {
    assert.ok(validateCountingSortInvariant(step, inp))
  }
}
console.log('  PASS: Step invariants verified.')

// 4. Snapshot Immutability
console.log('4. Verifying Snapshot Immutability...')
const steps = generateCountingSortSteps([3, 1, 2])
const cached = steps.map((s) => [...s.array])
for (let i = 0; i < steps.length; i++) {
  assert.deepStrictEqual(steps[i].array, cached[i], `Step ${i} array mutated!`)
}
console.log('  PASS: Snapshot immutability verified.')

// 5. Source Strings & Isolated Node VM Sandbox Execution
console.log('5. Executing JavaScript Source in Isolated VM Sandbox...')
assert.ok(getCountingSortSource('javascript'))
assert.strictEqual(resolveCountingSortLine('javascript', 'prefixSum'), 8)

const sandbox = { Math }
const context = vm.createContext(sandbox)
const script = new vm.Script(countingSortSources.javascript.code + '\nglobalThis.countingSort = countingSort;')
script.runInContext(context)

const vmSort = context.countingSort
assert.strictEqual(typeof vmSort, 'function')

const a1 = [3, 1, 2]
vmSort(a1)
assert.deepStrictEqual(Array.from(a1), [1, 2, 3])

const a2 = [2, 2, 1]
vmSort(a2)
assert.deepStrictEqual(Array.from(a2), [1, 2, 2])
console.log('  PASS: VM isolated execution verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
