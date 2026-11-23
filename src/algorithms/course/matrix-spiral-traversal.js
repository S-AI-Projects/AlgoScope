function createStep({ type, matrix, result, row, col, direction, value }) {
  return {
    type,
    matrix: matrix.map((matrixRow) => [...matrixRow]),
    result: [...result],
    row,
    col,
    direction,
    value,
  }
}

/**
 * Returns a clockwise spiral traversal and deterministic visit snapshots.
 * The input matrix is not mutated; playback timing is left to the UI layer.
 */
export function runMatrixSpiralTraversal(inputMatrix) {
  if (!Array.isArray(inputMatrix) || !inputMatrix.every(Array.isArray)) {
    throw new TypeError('Matrix spiral traversal expects an array of rows.')
  }

  const matrix = inputMatrix.map((row) => [...row])
  const rowCount = matrix.length
  const columnCount = matrix[0]?.length ?? 0

  if (!matrix.every((row) => row.length === columnCount)) {
    throw new RangeError('Matrix spiral traversal expects a rectangular matrix.')
  }

  const result = []
  const steps = [
    createStep({
      type: 'start',
      matrix,
      result,
      row: null,
      col: null,
      direction: 'right',
      value: null,
    }),
  ]

  let top = 0
  let bottom = rowCount - 1
  let left = 0
  let right = columnCount - 1

  const visit = (row, col, direction) => {
    const value = matrix[row][col]
    result.push(value)
    steps.push(
      createStep({
        type: 'visit',
        matrix,
        result,
        row,
        col,
        direction,
        value,
      })
    )
  }

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) visit(top, col, 'right')
    top++

    for (let row = top; row <= bottom; row++) visit(row, right, 'down')
    right--

    if (top <= bottom) {
      for (let col = right; col >= left; col--) visit(bottom, col, 'left')
      bottom--
    }

    if (left <= right) {
      for (let row = bottom; row >= top; row--) visit(row, left, 'up')
      left++
    }
  }

  steps.push(
    createStep({
      type: 'complete',
      matrix,
      result,
      row: null,
      col: null,
      direction: null,
      value: null,
    })
  )

  return { result, steps }
}
