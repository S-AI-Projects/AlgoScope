/** Return the unit-cost Levenshtein distance between two strings. */
export function editDistance(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    throw new TypeError('editDistance expects two strings')
  }

  const first = Array.from(left)
  const second = Array.from(right)
  const distance = Array.from({ length: first.length + 1 }, (_, row) =>
    Array.from({ length: second.length + 1 }, (_, col) =>
      row === 0 ? col : col === 0 ? row : 0
    )
  )

  for (let row = 1; row <= first.length; row++) {
    for (let col = 1; col <= second.length; col++) {
      const substitutionCost = first[row - 1] === second[col - 1] ? 0 : 1
      distance[row][col] = Math.min(
        distance[row - 1][col] + 1,
        distance[row][col - 1] + 1,
        distance[row - 1][col - 1] + substitutionCost
      )
    }
  }

  return distance[first.length][second.length]
}
