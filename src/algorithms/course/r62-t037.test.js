import { describe, expect, it } from 'vitest'
import { generateDfsMaze } from './maze-generation-with-dfs.js'

describe('seeded depth-first maze generation', () => {
  it('generates a reachable 3×3 perfect maze reproducibly for seed 42', () => {
    const maze = generateDfsMaze(3, 3, 42)
    expect(generateDfsMaze(3, 3, 42)).toEqual(maze)
    expect(maze.visitedCount).toBe(9)
    expect(maze.passageCount).toBe(8)

    const reachable = new Set(['0,0'])
    const pending = [[0, 0]]
    const directions = [
      ['N', -1, 0],
      ['E', 0, 1],
      ['S', 1, 0],
      ['W', 0, -1],
    ]

    while (pending.length) {
      const [row, col] = pending.pop()
      for (const [name, deltaRow, deltaCol] of directions) {
        const nextRow = row + deltaRow
        const nextCol = col + deltaCol
        const key = `${nextRow},${nextCol}`
        if (
          maze.cells[row][col].passages[name] &&
          nextRow >= 0 && nextRow < 3 && nextCol >= 0 && nextCol < 3 &&
          !reachable.has(key)
        ) {
          reachable.add(key)
          pending.push([nextRow, nextCol])
        }
      }
    }
    expect(reachable.size).toBe(9)
  })

  it('rejects invalid dimensions and noninteger seeds', () => {
    expect(() => generateDfsMaze(0, 3, 42)).toThrow(RangeError)
    expect(() => generateDfsMaze(3, 3, 1.5)).toThrow(TypeError)
  })
})
