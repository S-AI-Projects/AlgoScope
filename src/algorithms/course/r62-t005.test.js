import { describe, expect, it } from 'vitest'
import { runMatrixSpiralTraversal } from './matrix-spiral-traversal'

describe('matrix spiral traversal', () => {
  it('returns clockwise order and explicit replay state for a 2x3 matrix', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const { result, steps } = runMatrixSpiralTraversal(matrix)

    expect(result).toEqual([1, 2, 3, 6, 5, 4])
    expect(steps[0]).toMatchObject({ type: 'start', result: [], direction: 'right' })
    expect(steps.filter((step) => step.type === 'visit').map((step) => step.value)).toEqual(result)
    expect(
      steps
        .filter((step) => step.type === 'visit')
        .map(({ row, col, direction }) => [row, col, direction])
    ).toEqual([
      [0, 0, 'right'],
      [0, 1, 'right'],
      [0, 2, 'right'],
      [1, 2, 'down'],
      [1, 1, 'left'],
      [1, 0, 'left'],
    ])
    expect(steps.at(-1)).toMatchObject({ type: 'complete', result })
    expect(matrix).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ])
  })

  it('covers a single row', () => {
    const { result, steps } = runMatrixSpiralTraversal([[1, 2, 3, 4]])

    expect(result).toEqual([1, 2, 3, 4])
    expect(steps.filter((step) => step.type === 'visit').map((step) => [step.row, step.col])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ])
  })

  it('covers a single column', () => {
    const { result, steps } = runMatrixSpiralTraversal([[1], [2], [3], [4]])

    expect(result).toEqual([1, 2, 3, 4])
    expect(steps.filter((step) => step.type === 'visit').map((step) => [step.row, step.col])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
  })

  it('replays deterministically for the same input', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
    ]

    expect(runMatrixSpiralTraversal(matrix)).toEqual(
      runMatrixSpiralTraversal(matrix)
    )
  })
})
