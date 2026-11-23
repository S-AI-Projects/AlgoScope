import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { shortestPathSources } from '../searching/shortestPathSources.js'

describe('shortestPathSources.dijkstra.network.javascript displayed snippet', () => {
  const queueImplementation = `class PriorityQueue {
  constructor(compare) { this.items = []; this.compare = compare; }
  push(item) { this.items.push(item); this.items.sort((a, b) => this.compare(a, b) ? -1 : this.compare(b, a) ? 1 : 0); }
  pop() { return this.items.shift(); }
  isEmpty() { return this.items.length === 0; }
}`

  function runSnippet(graph, start) {
    const source = shortestPathSources.dijkstra.network.javascript.code
    const payload = JSON.stringify({ graph, start })
    const script = `${queueImplementation}\n${source}\nconst input = ${payload}; try { console.log(JSON.stringify({ result: dijkstra(input.graph, input.start) })); } catch (error) { console.log(JSON.stringify({ error: error.name, message: error.message })); }`
    return JSON.parse(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }))
  }

  it('returns expected distances for an example and an independent graph', () => {
    // Example fixture: A→C→B→D is the shortest route to D.
    expect(runSnippet({ A: { B: 4, C: 1 }, B: { D: 1 }, C: { B: 2, D: 5 }, D: {} }, 'A'))
      .toEqual({ result: { A: 0, C: 1, B: 3, D: 4 } })
    // Independent fixture: A→B→C improves on the direct A→C edge.
    expect(runSnippet({ A: { B: 2, C: 9 }, B: { C: 3 }, C: {} }, 'A'))
      .toEqual({ result: { A: 0, B: 2, C: 5 } })
  })

  it('rejects a negative edge weight, which is unsupported by Dijkstra', () => {
    expect(runSnippet({ A: { B: -1 }, B: {} }, 'A')).toEqual({
      error: 'RangeError',
      message: 'Dijkstra requires non-negative edge weights',
    })
  })
})
