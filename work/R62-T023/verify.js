import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  gcd,
  euclidGCD,
  generateEuclidGCDSteps,
  replayTrace,
  independentReferenceGCD,
  naiveSubtractionGCD,
  ZERO_INPUT_POLICY,
  euclidGCDSources,
  euclidGCDMetadata,
} from '../../src/algorithms/course/euclid-gcd-steps.js'

console.log('=== R62-T023 Euclid GCD Verification ===')

// 1. Primary Fixture: (54, 24) produces remainders [6, 0] and GCD 6
console.log('1. Verifying Primary Fixture (54, 24)...')
const res54_24 = euclidGCD(54, 24)
assert.strictEqual(res54_24.gcd, 6, 'GCD of (54, 24) must be 6')
assert.deepStrictEqual(res54_24.remainders, [6, 0], 'Remainders for (54, 24) must be [6, 0]')
assert.deepStrictEqual(res54_24.quotients, [2, 4], 'Quotients for (54, 24) must be [2, 4]')
assert.strictEqual(gcd(54, 24), 6, 'Pure gcd(54, 24) must be 6')

// Reverse argument order check
const res24_54 = euclidGCD(24, 54)
assert.strictEqual(res24_54.gcd, 6)
assert.deepStrictEqual(res24_54.remainders, [24, 6, 0])
console.log('  PASS: Primary fixture verified successfully.')

// 2. Hand-Calculated Step Trace Verification
console.log('2. Verifying Hand-Calculated Step Trace...')
const trace = replayTrace(54, 24)
assert.strictEqual(trace.length, 2, 'Trace must contain exactly 2 division steps')
assert.deepStrictEqual(trace[0], { x: 54, y: 24, remainder: 6 }, 'Round 1: 54 = 2*24 + 6')
assert.deepStrictEqual(trace[1], { x: 24, y: 6, remainder: 0 }, 'Round 2: 24 = 4*6 + 0')
console.log('  PASS: Hand-calculated trace verified.')

// 3. Zero-Input Policy Verification
console.log('3. Verifying Zero-Input Policy...')
assert.strictEqual(gcd(54, 0), 54, 'gcd(a, 0) must equal |a|')
assert.strictEqual(gcd(0, 24), 24, 'gcd(0, b) must equal |b|')
assert.strictEqual(gcd(0, 0), 0, 'gcd(0, 0) must equal 0 by convention')
assert.strictEqual(gcd(-54, 0), 54, 'gcd(-a, 0) must equal |a|')
assert.strictEqual(gcd(0, -24), 24, 'gcd(0, -b) must equal |b|')
assert.strictEqual(gcd(-54, 24), 6, 'gcd(-54, 24) must equal 6')
assert.strictEqual(gcd(54, -24), 6, 'gcd(54, -24) must equal 6')
assert.strictEqual(gcd(-54, -24), 6, 'gcd(-54, -24) must equal 6')
console.log('  PASS: Zero-Input policy verified.')

// 4. Independent Reference Comparison
console.log('4. Comparing Against Independent Reference (Brute-Force & Naive Subtraction)...')
const testPairs = [
  [54, 24],
  [48, 18],
  [100, 25],
  [35, 64],
  [17, 19],
  [1, 1],
  [270, 192],
  [1071, 462],
  [123456, 7890],
  [0, 15],
  [15, 0],
  [0, 0],
]

for (const [a, b] of testPairs) {
  const eGcd = gcd(a, b)
  const refGcd = independentReferenceGCD(a, b)
  assert.strictEqual(eGcd, refGcd, `Euclid GCD must match independent reference for (${a}, ${b})`)

  if (a !== 0 && b !== 0) {
    const subGcd = naiveSubtractionGCD(a, b)
    assert.strictEqual(eGcd, subGcd, `Euclid GCD must match naive subtraction for (${a}, ${b})`)
  }
}
console.log('  PASS: Independent reference comparison verified across all pairs.')

// 5. Trace and Step Player Contract
console.log('5. Verifying Step Player Steps...')
const steps = generateEuclidGCDSteps(54, 24)
assert.strictEqual(steps[0].type, 'start')
assert.strictEqual(steps[1].type, 'compare')
assert.strictEqual(steps[1].variables.remainder, 6)
assert.strictEqual(steps[2].type, 'swap')
assert.strictEqual(steps[steps.length - 1].type, 'complete')
assert.strictEqual(steps[steps.length - 1].variables.result, 6)
console.log('  PASS: Step player contract verified.')

// 6. Source String Isolated Node VM Sandbox Execution
console.log('6. Executing Displayed JS Source String in Isolated Node VM...')
const jsCode = euclidGCDSources.javascript.code
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

assert.strictEqual(logs.length, 1, 'VM script must produce exactly 1 console log')
assert.strictEqual(logs[0], 6, 'Logged result must be 6')
assert.strictEqual(typeof context.gcd, 'function')
assert.strictEqual(context.gcd(54, 24), 6)
assert.strictEqual(context.gcd(48, 18), 6)
console.log('  PASS: Isolated VM execution verified.')

// 7. Multi-Language Definitions and Metadata
console.log('7. Verifying Multi-Language Sources and Metadata...')
const languages = ['python', 'cpp', 'java', 'c', 'rust', 'go']
for (const lang of languages) {
  const entry = euclidGCDSources[lang]
  assert.ok(entry && typeof entry.code === 'string' && entry.code.length > 0)
}
assert.strictEqual(euclidGCDMetadata.name, 'Euclidean GCD Algorithm')
assert.strictEqual(euclidGCDMetadata.zeroInputPolicy.rule3, 'gcd(0, 0) = 0')
console.log('  PASS: Multi-language definitions and metadata verified.')

// 8. Contract Validation and Error Handling
console.log('8. Verifying Contract Validation and Errors...')
assert.throws(() => gcd('54', 24), TypeError)
assert.throws(() => gcd(54, null), TypeError)
assert.throws(() => gcd(54.5, 24), TypeError)
assert.throws(() => euclidGCD(NaN, 24), TypeError)
console.log('  PASS: Contract validation errors verified.')

// 9. Sensitivity Checks
console.log('9. Verifying Defect Sensitivity...')
assert.notStrictEqual(res54_24.gcd, 12)
assert.notDeepStrictEqual(res54_24.remainders, [24, 6])
console.log('  PASS: Sensitivity verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
