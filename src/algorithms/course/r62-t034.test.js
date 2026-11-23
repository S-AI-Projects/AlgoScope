import { describe, expect, it } from 'vitest'
import { generateFloydWarshallSteps } from './floyd-warshall.js'

const nodes = ['A', 'B', 'C', 'D']
const edges = [
  { from: 'A', to: 'B', weight: 2 },
  { from: 'B', to: 'C', weight: 3 },
  { from: 'A', to: 'C', weight: 9 },
]

describe('Floyd-Warshall step invariants', () => {
  it('applies the intermediate-node recurrence and preserves independent snapshots', () => {
    const steps = generateFloydWarshallSteps(nodes, edges)
    const initialSnapshot = structuredClone(steps[0].dist)

    expect(steps).toHaveLength(nodes.length + 2)
    expect(steps.at(-1).dist[0][2]).toBe(5)
    expect(steps.at(-1).dist[0][3]).toBe(Infinity)

    for (let k = 1; k <= nodes.length; k++) {
      const previous = steps[k - 1].dist
      const current = steps[k].dist
      const via = k - 1
      const expected = previous.map((row) => [...row])

      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          if (previous[i][via] !== Infinity && previous[via][j] !== Infinity) {
            expected[i][j] = Math.min(previous[i][j], previous[i][via] + previous[via][j])
          }
        }
      }

      expect(current, `distance recurrence after k=${k}`).toEqual(expected)
      expect(current[0][3], `unreachable A→D remains Infinity after k=${k}`).toBe(Infinity)
    }

    expect(steps[0].dist).toEqual(initialSnapshot)
    expect(steps[0].dist).toEqual([
      [0, 2, 9, Infinity],
      [Infinity, 0, 3, Infinity],
      [Infinity, Infinity, 0, Infinity],
      [Infinity, Infinity, Infinity, 0],
    ])
  })
})
