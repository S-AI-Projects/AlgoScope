export function generateFloydWarshallSteps(nodes, edges) {
  const size = nodes.length
  const nodeIndex = new Map(nodes.map((node, index) => [node, index]))
  const dist = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i === j ? 0 : Infinity))
  )

  for (const { from, to, weight } of edges) {
    const fromIndex = nodeIndex.get(from)
    const toIndex = nodeIndex.get(to)
    if (fromIndex === undefined || toIndex === undefined) continue
    dist[fromIndex][toIndex] = weight
  }

  const snapshot = () => dist.map((row) => [...row])
  const steps = [{
    dist: snapshot(),
    k: null,
    updated: [],
    phase: 'Initialize distance matrix',
  }]

  for (let k = 0; k < size; k++) {
    const updated = []
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (
          dist[i][k] !== Infinity &&
          dist[k][j] !== Infinity &&
          dist[i][k] + dist[k][j] < dist[i][j]
        ) {
          dist[i][j] = dist[i][k] + dist[k][j]
          updated.push([nodes[i], nodes[j]])
        }
      }
    }
    steps.push({
      dist: snapshot(),
      k: k + 1,
      updated,
      phase: `Intermediate node k=${k + 1}: ${updated.length} paths improved`,
    })
  }

  steps.push({
    dist: snapshot(),
    k: null,
    updated: [],
    phase: 'All-pairs shortest paths complete',
    done: true,
  })
  return steps
}
