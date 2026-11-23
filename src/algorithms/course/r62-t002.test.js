import { describe, expect, it } from 'vitest'
import { kruskalMinimumSpanningForest } from './kruskal-s-mst-with-union-find'

describe('Kruskal minimum spanning forest contract', () => {
  it('handles one isolated vertex as the smallest valid graph', () => {
    const result = kruskalMinimumSpanningForest(['A'], [])

    expect(result).toMatchObject({
      edges: [],
      cost: 0,
      components: 1,
      connected: true,
      steps: [],
    })
  })

  it('finds the expected MST for the specified weighted triangle', () => {
    const edges = [
      { id: 'AB', from: 'A', to: 'B', weight: 1 },
      { id: 'BC', from: 'B', to: 'C', weight: 2 },
      { id: 'AC', from: 'A', to: 'C', weight: 4 },
    ]
    const result = kruskalMinimumSpanningForest(['A', 'B', 'C'], edges)

    expect(result.edges.map(({ id }) => id)).toEqual(['AB', 'BC'])
    expect(result.cost).toBe(3)
    expect(result.components).toBe(1)
    expect(result.connected).toBe(true)
    expect(result.steps.map(({ accepted }) => accepted)).toEqual([
      true,
      true,
      false,
    ])
    expect(result.steps.map(({ components, cost }) => [components, cost])).toEqual([
      [2, 1],
      [1, 3],
      [1, 3],
    ])
    expect(edges).toEqual([
      { id: 'AB', from: 'A', to: 'B', weight: 1 },
      { id: 'BC', from: 'B', to: 'C', weight: 2 },
      { id: 'AC', from: 'A', to: 'C', weight: 4 },
    ])
  })

  it('returns a minimum spanning forest and reports disconnected components', () => {
    // Contract: disconnected input returns its minimum spanning forest and component count.
    const result = kruskalMinimumSpanningForest(['A', 'B', 'C', 'D', 'E'], [
      { id: 'AB', from: 'A', to: 'B', weight: 1 },
      { id: 'CD', from: 'C', to: 'D', weight: 2 },
    ])

    expect(result.edges.map(({ id }) => id)).toEqual(['AB', 'CD'])
    expect(result.cost).toBe(3)
    expect(result.components).toBe(3)
    expect(result.connected).toBe(false)
    expect(result.edges).toHaveLength(5 - result.components)
  })

  it('breaks equal-weight ties by original edge order and ignores self-loops', () => {
    const result = kruskalMinimumSpanningForest(['A', 'B', 'C'], [
      { id: 'AC-first', from: 'A', to: 'C', weight: 1 },
      { id: 'AA-loop', from: 'A', to: 'A', weight: 1 },
      { id: 'AB-second', from: 'A', to: 'B', weight: 1 },
      { id: 'BC-cycle', from: 'B', to: 'C', weight: 1 },
    ])

    expect(result.edges.map(({ id }) => id)).toEqual(['AC-first', 'AB-second'])
    expect(result.cost).toBe(2)
    expect(result.steps.map(({ edge, accepted }) => [edge.id, accepted])).toEqual([
      ['AC-first', true],
      ['AA-loop', false],
      ['AB-second', true],
      ['BC-cycle', false],
    ])
  })

  it('rejects edges whose endpoints are absent from the vertex list', () => {
    expect(() =>
      kruskalMinimumSpanningForest(['A'], [
        { id: 'AB', from: 'A', to: 'B', weight: 1 },
      ])
    ).toThrow(RangeError)
  })

  it('rejects an empty vertex list as outside the graph contract', () => {
    expect(() => kruskalMinimumSpanningForest([], [])).toThrow(RangeError)
  })
})
