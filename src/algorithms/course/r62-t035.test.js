import { describe, expect, it } from 'vitest'
import { generateHanoiFrames } from './tower-of-hanoi.js'

describe('Tower of Hanoi deterministic replay', () => {
  it('replays three disks in seven legal moves onto the destination rod', () => {
    const first = generateHanoiFrames(3)
    const second = generateHanoiFrames(3)
    const moves = first.filter((frame) => frame.type === 'move')

    expect(first).toEqual(second)
    expect(moves).toHaveLength(7)
    expect(first.at(-1).rods).toEqual({ A: [], B: [], C: [3, 2, 1] })
    expect(first.at(-1).moveNumber).toBe(7)

    let state = { A: [3, 2, 1], B: [], C: [] }
    for (const move of moves) {
      const next = Object.fromEntries(Object.entries(state).map(([rod, disks]) => [rod, [...disks]]))
      expect(next[move.from].at(-1)).toBe(move.disk)
      next[move.from].pop()
      expect(next[move.to].length === 0 || next[move.to].at(-1) > move.disk).toBe(true)
      next[move.to].push(move.disk)
      expect(move.rods).toEqual(next)
      state = next
    }
  })

  it('rejects invalid disk counts and rod definitions', () => {
    expect(() => generateHanoiFrames(0)).toThrow(RangeError)
    expect(() => generateHanoiFrames(2.5)).toThrow(RangeError)
    expect(() => generateHanoiFrames(2, ['A', 'A', 'C'])).toThrow(TypeError)
  })
})
