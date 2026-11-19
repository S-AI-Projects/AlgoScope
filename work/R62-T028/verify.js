import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  graphSearchSources,
  getSource,
  GRAPH_SEARCH_METADATA,
} from '../../src/algorithms/searching/graphSearchSources.js'

console.log('=== R62-T028 graphSearchSources Failure-Path Coverage Verification ===')

// 1. First Exported Algorithm and Language Selection
console.log('1. Verifying First Exported Algorithm Entry and Language Selection...')
const firstKey = Object.keys(graphSearchSources)[0]
assert.strictEqual(firstKey, 'bfs', 'First exported algorithm entry must be bfs')
assert.strictEqual(GRAPH_SEARCH_METADATA.entry, 'bfs')
assert.strictEqual(GRAPH_SEARCH_METADATA.language, 'javascript')

const jsCode = getSource('bfs', 'javascript')
assert.ok(typeof jsCode === 'string' && jsCode.length > 0)
assert.ok(jsCode.includes('function bfs(startNode)'))
console.log('  PASS: Selected entry "bfs" and language "javascript" verified.')

// 2. VM Execution Helper
function runBFSInVM(startNode) {
  const logs = []
  const sandbox = {
    console: {
      log: (val) => logs.push(val),
    },
    Set,
  }
  const context = vm.createContext(sandbox)
  const script = new vm.Script(jsCode + `\nbfs(${JSON.stringify(startNode)});`)
  script.runInContext(context)
  return logs
}

// 3. Displayed Example: startNode = 1
console.log('2. Executing Displayed Example (startNode = 1)...')
const logs1 = runBFSInVM(1)
const expected1 = [1, 2, 5, 6, 3, 7, 4, 9, 8]
assert.deepStrictEqual(logs1, expected1, 'startNode 1 must traverse [1, 2, 5, 6, 3, 7, 4, 9, 8]')
console.log('  PASS: Displayed example traversal verified.')

// 4. Independently Computed Example: startNode = 8
console.log('3. Executing Small Independently Computed Input (startNode = 8)...')
const logs8 = runBFSInVM(8)
const expected8 = [8, 7, 9, 2, 5, 1, 3, 4, 6]
assert.deepStrictEqual(logs8, expected8, 'startNode 8 must traverse [8, 7, 9, 2, 5, 1, 3, 4, 6]')
console.log('  PASS: Independently computed input verified.')

// 5. Unsupported Input: node 999 (non-existent node)
console.log('4. Testing Unsupported Input: node 999 (non-existent node)...')
const logs999 = runBFSInVM(999)
assert.deepStrictEqual(logs999, [999], 'Unsupported node 999 must produce isolated halt [999]')
assert.ok(!logs999.includes(1), 'Must not explore valid graph nodes')

const doc999 = GRAPH_SEARCH_METADATA.unsupportedInputs.find((u) => u.input === 999)
assert.ok(doc999, 'Unsupported input 999 must be documented in GRAPH_SEARCH_METADATA')
assert.strictEqual(doc999.behavior, 'isolated-halt')
console.log('  PASS: Unsupported input failure path verified.')

// 6. Distinction: Collection Object is not Executable Steps
console.log('5. Verifying Collection Object Structure...')
assert.strictEqual(typeof graphSearchSources, 'object')
assert.strictEqual(Array.isArray(graphSearchSources.bfs), false, 'Collection object must not be steps')
assert.strictEqual(typeof graphSearchSources.bfs.javascript.code, 'string')
console.log('  PASS: Separation of source string collection from step generator verified.')

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY.')
