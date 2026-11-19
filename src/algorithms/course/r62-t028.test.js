import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  graphSearchSources,
  getSource,
  GRAPH_SEARCH_METADATA,
} from '../searching/graphSearchSources.js'

describe('R62-T028: graphSearchSources Failure-Path Coverage', () => {
  const selectedEntry = 'bfs'
  const selectedLanguage = 'javascript'

  describe('1. Selection of First Exported Entry and Language', () => {
    it('selects the first exported algorithm entry "bfs" and language "javascript"', () => {
      // Named explicitly in the test as required
      expect(GRAPH_SEARCH_METADATA.entry).toBe(selectedEntry)
      expect(GRAPH_SEARCH_METADATA.language).toBe(selectedLanguage)

      const firstExportedKey = Object.keys(graphSearchSources)[0]
      expect(firstExportedKey).toBe(selectedEntry)

      const snippet = getSource(selectedEntry, selectedLanguage)
      expect(typeof snippet).toBe('string')
      expect(snippet.length).toBeGreaterThan(0)
      expect(snippet).toContain('function bfs(startNode)')
    })

    it('preserves the distinction: source strings collection is not an executable step generator', () => {
      expect(typeof graphSearchSources).toBe('object')
      expect(typeof graphSearchSources.bfs).toBe('object')
      // Must NOT be a step-generator function or array of steps
      expect(typeof graphSearchSources.bfs.javascript.code).toBe('string')
      expect(Array.isArray(graphSearchSources.bfs)).toBe(false)
    })
  })

  describe('2. Isolated VM Execution: Displayed Example and Independent Input', () => {
    function runBFSInVM(startNode) {
      const logs = []
      const sandbox = {
        console: {
          log: (val) => logs.push(val),
        },
        Set,
      }
      const context = vm.createContext(sandbox)
      const code = graphSearchSources.bfs.javascript.code
      const script = new vm.Script(code + `\nbfs(${JSON.stringify(startNode)});`)
      script.runInContext(context)
      return logs
    }

    it('executes displayed example (startNode = 1) producing expected traversal [1, 2, 5, 6, 3, 7, 4, 9, 8]', () => {
      const logs = runBFSInVM(1)
      expect(logs).toEqual([1, 2, 5, 6, 3, 7, 4, 9, 8])
      expect(logs).toEqual(GRAPH_SEARCH_METADATA.displayedExample.expectedOutput)
    })

    it('executes small independently computed input (startNode = 8) producing [8, 7, 9, 2, 5, 1, 3, 4, 6]', () => {
      const logs = runBFSInVM(8)
      expect(logs).toEqual([8, 7, 9, 2, 5, 1, 3, 4, 6])
      expect(logs).toEqual(GRAPH_SEARCH_METADATA.independentlyComputedExample.expectedOutput)
    })
  })

  describe('3. Unsupported Input and Failure-Path Documentation', () => {
    function runBFSInVM(startNode) {
      const logs = []
      const sandbox = {
        console: {
          log: (val) => logs.push(val),
        },
        Set,
      }
      const context = vm.createContext(sandbox)
      const code = graphSearchSources.bfs.javascript.code
      const script = new vm.Script(code + `\nbfs(${JSON.stringify(startNode)});`)
      script.runInContext(context)
      return logs
    }

    it('documents and tests unsupported non-existent node 999: isolated halt without graph traversal', () => {
      // Node 999 is not in the embedded graph adjacency table
      const logs = runBFSInVM(999)

      // The snippet lacks input validation for non-existent graph nodes.
      // It visits and logs [999], then graph[999] is undefined, terminating prematurely
      // without exploring any legitimate graph vertices.
      expect(logs).toEqual([999])
      expect(logs).not.toContain(1)
      expect(logs).toHaveLength(1)

      const doc = GRAPH_SEARCH_METADATA.unsupportedInputs.find((u) => u.input === 999)
      expect(doc).toBeDefined()
      expect(doc.behavior).toBe('isolated-halt')
    })

    it('documents and tests unsupported null input: spurious visit of null value', () => {
      const logs = runBFSInVM(null)
      expect(logs).toEqual([null])

      const doc = GRAPH_SEARCH_METADATA.unsupportedInputs.find((u) => u.input === null)
      expect(doc).toBeDefined()
      expect(doc.behavior).toBe('spurious-visit')
    })
  })

  describe('4. Multi-language and DFS Coverage', () => {
    it('verifies all languages are populated for BFS and DFS', () => {
      const langs = ['javascript', 'python', 'cpp', 'java', 'c', 'rust', 'go']
      for (const lang of langs) {
        expect(getSource('bfs', lang)).not.toBe('')
        expect(getSource('dfs', lang)).not.toBe('')
      }
    })
  })
})
