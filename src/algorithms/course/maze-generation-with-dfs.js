const DIRECTIONS = [
  { name: 'N', row: -1, col: 0, opposite: 'S' },
  { name: 'E', row: 0, col: 1, opposite: 'W' },
  { name: 'S', row: 1, col: 0, opposite: 'N' },
  { name: 'W', row: 0, col: -1, opposite: 'E' },
]

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a perfect maze with iterative depth-first search.
 * Concrete fixture: 3 rows × 3 columns with seed 42 visits all 9 cells and
 * opens exactly 8 passages, yielding a connected, acyclic passage graph.
 */
export function generateDfsMaze(rows, columns, seed = 0) {
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
    throw new RangeError('rows and columns must be positive integers')
  }
  if (!Number.isInteger(seed)) {
    throw new TypeError('seed must be an integer')
  }

  const cells = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, col) => ({
      row,
      col,
      passages: { N: false, E: false, S: false, W: false },
    }))
  )
  const visited = new Set(['0,0'])
  const stack = [cells[0][0]]
  const random = seededRandom(seed)
  let passageCount = 0

  while (stack.length) {
    const current = stack.at(-1)
    const unvisited = DIRECTIONS.map((direction) => ({
      direction,
      row: current.row + direction.row,
      col: current.col + direction.col,
    })).filter(
      ({ row, col }) =>
        row >= 0 && row < rows && col >= 0 && col < columns && !visited.has(`${row},${col}`)
    )

    if (unvisited.length === 0) {
      stack.pop()
      continue
    }

    const { direction, row, col } = unvisited[Math.floor(random() * unvisited.length)]
    const next = cells[row][col]
    current.passages[direction.name] = true
    next.passages[direction.opposite] = true
    visited.add(`${row},${col}`)
    passageCount += 1
    stack.push(next)
  }

  return { cells, visitedCount: visited.size, passageCount, seed }
}
