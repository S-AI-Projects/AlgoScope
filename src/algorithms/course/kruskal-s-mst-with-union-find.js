/**
 * Build a minimum spanning forest with Kruskal's algorithm.
 * Equal-weight edges keep their original input order. A disconnected graph
 * returns a forest and its remaining component count instead of throwing.
 */
export function kruskalMinimumSpanningForest(vertices, edges) {
  if (!Array.isArray(vertices) || !Array.isArray(edges)) {
    throw new TypeError('Vertices and edges must be arrays.')
  }
  if (vertices.length === 0) {
    throw new RangeError('Graph must contain at least one vertex.')
  }
  if (new Set(vertices).size !== vertices.length) {
    throw new RangeError('Vertex identifiers must be unique.')
  }

  const vertexSet = new Set(vertices)
  const orderedEdges = edges.map((edge, inputOrder) => {
    if (
      !edge ||
      !vertexSet.has(edge.from) ||
      !vertexSet.has(edge.to) ||
      typeof edge.weight !== 'number' ||
      !Number.isFinite(edge.weight)
    ) {
      throw new RangeError('Each edge needs known endpoints and a finite weight.')
    }
    return { edge: { ...edge }, inputOrder }
  })

  orderedEdges.sort(
    (left, right) =>
      left.edge.weight - right.edge.weight || left.inputOrder - right.inputOrder
  )

  const parent = new Map(vertices.map((vertex) => [vertex, vertex]))
  const rank = new Map(vertices.map((vertex) => [vertex, 0]))
  const find = (vertex) => {
    let root = vertex
    while (parent.get(root) !== root) root = parent.get(root)
    while (parent.get(vertex) !== vertex) {
      const next = parent.get(vertex)
      parent.set(vertex, root)
      vertex = next
    }
    return root
  }

  let components = vertices.length
  let cost = 0
  const selectedEdges = []
  const steps = []

  for (const { edge } of orderedEdges) {
    const rootFrom = find(edge.from)
    const rootTo = find(edge.to)
    const accepted = rootFrom !== rootTo

    if (accepted) {
      const rankFrom = rank.get(rootFrom)
      const rankTo = rank.get(rootTo)
      if (rankFrom < rankTo) parent.set(rootFrom, rootTo)
      else if (rankFrom > rankTo) parent.set(rootTo, rootFrom)
      else {
        parent.set(rootTo, rootFrom)
        rank.set(rootFrom, rankFrom + 1)
      }
      selectedEdges.push({ ...edge })
      cost += edge.weight
      components--
    }

    steps.push({
      edge: { ...edge },
      accepted,
      components,
      cost,
    })
  }

  return {
    edges: selectedEdges,
    cost,
    components,
    connected: components <= 1,
    steps,
  }
}
