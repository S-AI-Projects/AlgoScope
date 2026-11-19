import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  MonotonicStack,
  maximalRectangle,
  largestRectangleInHistogram,
  EMPTY_STATE_AREA,
  generateMaximalRectangleSteps,
  validateMaximalRectangleStep,
  maximalRectangleSources,
  getMaximalRectangleSource,
  resolveMaximalRectangleLine,
} from '../../src/algorithms/monotonicStack/maximalRectangleSteps.js'

console.log('=== R62-T026 maximalRectangleSteps Focused Refactoring Verification ===')

// 1. Required Sequence: Push A, B, C; pop twice; push D; drain -> Pop order C, B, D, A
console.log('1. Verifying Stack Sequence: Push A, B, C; pop twice; push D; drain...')
const stack = new MonotonicStack()
assert.strictEqual(stack.isEmpty(), true)
assert.strictEqual(stack.size, 0)

stack.push('A')
stack.push('B')
stack.push('C')
assert.strictEqual(stack.size, 3)

const p1 = stack.pop() // 'C'
const p2 = stack.pop() // 'B'
assert.strictEqual(p1, 'C', 'First pop must be C')
assert.strictEqual(p2, 'B', 'Second pop must be B')
assert.strictEqual(stack.size, 1)

stack.push('D')
assert.strictEqual(stack.size, 2)

const drained = stack.drain()
assert.deepStrictEqual(drained, ['D', 'A'], 'Drain must pop D then A')
assert.strictEqual(stack.isEmpty(), true)

const fullPopOrder = [p1, p2, ...drained]
assert.deepStrictEqual(fullPopOrder, ['C', 'B', 'D', 'A'], 'Total pop order must be C, B, D, A')
console.log('  PASS: Pop order C, B, D, A verified.')

// 2. Monotonic Histogram Pop Order with Heights [2, 4, 6, 3]
console.log('2. Verifying Histogram Pop Order with heights [2, 4, 6, 3]...')
const heights = [2, 4, 6, 3]
const labels = ['A', 'B', 'C', 'D']
const monoStack = new MonotonicStack()
const histPops = []
for (let i = 0; i <= heights.length; i++) {
  const cur = i === heights.length ? 0 : heights[i]
  while (!monoStack.isEmpty() && (i === heights.length || cur < heights[monoStack.peek()])) {
    histPops.push(labels[monoStack.pop()])
  }
  if (i < heights.length) monoStack.push(i)
}
assert.deepStrictEqual(histPops, ['C', 'B', 'D', 'A'], 'Histogram pop order must match C, B, D, A')
console.log('  PASS: Histogram monotonic stack pop order verified.')

// 3. Documented Empty-State Behavior
console.log('3. Verifying Documented Empty-State Behavior...')
const emptyStack = new MonotonicStack()
assert.strictEqual(emptyStack.isEmpty(), true)
assert.strictEqual(emptyStack.size, 0)
assert.strictEqual(emptyStack.peek(), undefined)
assert.strictEqual(emptyStack.pop(), undefined)
assert.deepStrictEqual(emptyStack.drain(), [])

assert.strictEqual(maximalRectangle([]), EMPTY_STATE_AREA)
assert.strictEqual(maximalRectangle([[]]), EMPTY_STATE_AREA)
assert.strictEqual(maximalRectangle(null), EMPTY_STATE_AREA)
assert.strictEqual(largestRectangleInHistogram([]), EMPTY_STATE_AREA)
assert.deepStrictEqual(generateMaximalRectangleSteps([]), [])
assert.deepStrictEqual(generateMaximalRectangleSteps([[]]), [])
console.log('  PASS: Documented empty-state behavior verified.')

// 4. Pure Maximal Rectangle Calculation and Invariants
console.log('4. Verifying Pure Algorithm & Step Invariants...')
const matrix = [
  ['1', '0', '1', '0', '0'],
  ['1', '0', '1', '1', '1'],
  ['1', '1', '1', '1', '1'],
  ['1', '0', '0', '1', '0'],
]
const pureResult = maximalRectangle(matrix)
assert.strictEqual(pureResult, 6, 'Maximal rectangle for standard matrix must be 6')

const steps = generateMaximalRectangleSteps(matrix)
assert.ok(steps.length > 0)
assert.strictEqual(steps[0].type, 'start')
assert.strictEqual(steps[steps.length - 1].type, 'complete')
assert.strictEqual(steps[steps.length - 1].variables.maxArea, 6)

for (const step of steps) {
  assert.ok(validateMaximalRectangleStep(step, matrix), 'Step invariant must hold')
}
console.log('  PASS: Pure computation and step invariants verified.')

// 5. Source Strings Isolated VM Execution
console.log('5. Verifying Source String Execution in VM...')
const jsCode = maximalRectangleSources.javascript.code
const sandbox = { Math }
const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode + '\nglobalThis.maximalRectangle = maximalRectangle;')
script.runInContext(context)
assert.strictEqual(typeof context.maximalRectangle, 'function')
assert.strictEqual(context.maximalRectangle([]), 0)
assert.strictEqual(context.maximalRectangle(matrix), 6)
console.log('  PASS: VM source string execution verified.')

// 6. Multi-language mappings
console.log('6. Verifying Multi-Language Sources...')
assert.ok(getMaximalRectangleSource('javascript'))
assert.strictEqual(resolveMaximalRectangleLine('javascript', 'setup'), 2)
assert.strictEqual(resolveMaximalRectangleLine('python', 'setup'), 2)
console.log('  PASS: Multi-language line mapping verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
