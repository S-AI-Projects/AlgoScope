// R62-T017 — Pascal's Triangle  Vitest regression suite
// ─────────────────────────────────────────────────────────────────────────────
//
// What is tested:
//   1. Pure algorithm  – pascalsTriangle()
//      a. First four rows equal [, [1,1], [1,2,1], [1,3,3,1]]
//         (index-1 through index-3 of a 4-row call)
//      b. Row sums match 2^0, 2^1, 2^2, 2^3  for a 4-row call
//      c. Edge cases: 0 rows → [], 1 row → [[1]], negative → []
//
//   2. Source strings  – getPascalsTriangleSource()
//      a. Every language's code string is a non-empty string
//      b. Unknown language falls back to JavaScript source
//
//   3. Line maps  – resolvePascalsTriangleLine()
//      a. All five lineKey names resolve to positive integers for JS
//      b. Line numbers sit inside the bounds of the code string
//      c. Unknown language falls back to JavaScript lineMap
//      d. Unknown lineKey returns undefined (not a stale number)
//
//   4. Replay steps  – generatePascalsTriangleSteps()
//      a. First step always has lineKey "start"
//      b. Last step always has lineKey "result"
//      c. For numRows=4 the "innerCell" steps carry correct cell values
//      d. The triangle snapshot embedded in each step is consistent
//      e. Edge case: numRows=0 → single "complete" step with empty array
//      f. numRows=1 → exactly two steps (start + result), no outerLoop steps
//
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  pascalsTriangle,
  generatePascalsTriangleSteps,
  getPascalsTriangleSource,
  resolvePascalsTriangleLine,
  pascalsTriangleSources,
} from './pascalsTriangle'

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Pure algorithm
// ─────────────────────────────────────────────────────────────────────────────

describe('pascalsTriangle() – pure algorithm', () => {
  // ── 1a.  First four rows ──────────────────────────────────────────────────
  it('produces the correct first four rows for numRows=4', () => {
    const result = pascalsTriangle(4)

    // row 0
    expect(result[0]).toEqual([1])
    // row 1  — the requirement fixture uses index-1 → [1, 1]
    expect(result[1]).toEqual([1, 1])
    // row 2  → [1, 2, 1]
    expect(result[2]).toEqual([1, 2, 1])
    // row 3  → [1, 3, 3, 1]
    expect(result[3]).toEqual([1, 3, 3, 1])
  })

  it('returns exactly numRows rows', () => {
    expect(pascalsTriangle(1)).toHaveLength(1)
    expect(pascalsTriangle(5)).toHaveLength(5)
    expect(pascalsTriangle(7)).toHaveLength(7)
  })

  // ── 1b.  Row sums are powers of two ──────────────────────────────────────
  it('row sums equal 2^0, 2^1, 2^2, 2^3 for numRows=4', () => {
    const result = pascalsTriangle(4)
    const rowSum = (row) => row.reduce((acc, v) => acc + v, 0)

    expect(rowSum(result[0])).toBe(1)   // 2^0 = 1
    expect(rowSum(result[1])).toBe(2)   // 2^1 = 2
    expect(rowSum(result[2])).toBe(4)   // 2^2 = 4
    expect(rowSum(result[3])).toBe(8)   // 2^3 = 8
  })

  it('row sums are powers of two for numRows=6', () => {
    const result = pascalsTriangle(6)
    result.forEach((row, i) => {
      const sum = row.reduce((acc, v) => acc + v, 0)
      expect(sum).toBe(Math.pow(2, i))
    })
  })

  // ── 1c.  Edge cases ───────────────────────────────────────────────────────
  it('returns [] for numRows=0', () => {
    expect(pascalsTriangle(0)).toEqual([])
  })

  it('returns [] for negative numRows', () => {
    expect(pascalsTriangle(-1)).toEqual([])
    expect(pascalsTriangle(-100)).toEqual([])
  })

  it('returns [[1]] for numRows=1', () => {
    expect(pascalsTriangle(1)).toEqual([[1]])
  })

  it('truncates fractional numRows via Math.floor', () => {
    // 4.9 should behave like 4
    expect(pascalsTriangle(4.9)).toEqual(pascalsTriangle(4))
  })

  it('row lengths grow by one at each row', () => {
    const result = pascalsTriangle(6)
    result.forEach((row, i) => {
      expect(row).toHaveLength(i + 1)
    })
  })

  it('interior cells satisfy the Pascal recurrence', () => {
    const result = pascalsTriangle(6)
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]
      const row = result[i]
      for (let j = 1; j < row.length - 1; j++) {
        expect(row[j]).toBe(prev[j - 1] + prev[j])
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Source strings
// ─────────────────────────────────────────────────────────────────────────────

describe('getPascalsTriangleSource() – source strings', () => {
  const languages = Object.keys(pascalsTriangleSources)

  it('every registered language has a non-empty code string', () => {
    languages.forEach((lang) => {
      const code = getPascalsTriangleSource(lang)
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
    })
  })

  it('falls back to JavaScript source for an unknown language', () => {
    const fallback = getPascalsTriangleSource('brainfuck')
    expect(fallback).toBe(getPascalsTriangleSource('javascript'))
  })

  it('JavaScript source contains the outer-loop signature', () => {
    const src = getPascalsTriangleSource('javascript')
    expect(src).toContain('for')
    expect(src).toContain('prev[j - 1] + prev[j]')
  })

  it('Python source uses list-append idiom', () => {
    const src = getPascalsTriangleSource('python')
    expect(src).toContain('row.append')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Line maps
// ─────────────────────────────────────────────────────────────────────────────

describe('resolvePascalsTriangleLine() – line maps', () => {
  const LINE_KEYS = ['start', 'outerLoop', 'innerCell', 'rowDone', 'result']

  // ── 3a.  All lineKey names resolve for JavaScript ─────────────────────────
  it('resolves all five lineKeys to positive integers for javascript', () => {
    LINE_KEYS.forEach((key) => {
      const line = resolvePascalsTriangleLine('javascript', key)
      expect(typeof line).toBe('number')
      expect(line).toBeGreaterThan(0)
    })
  })

  // ── 3b.  Line numbers are within the code bounds ──────────────────────────
  it('resolved line numbers lie within the actual code string', () => {
    const languages = Object.keys(pascalsTriangleSources)
    languages.forEach((lang) => {
      const { code, lineMap } = pascalsTriangleSources[lang]
      const totalLines = code.split('\n').length
      Object.values(lineMap).forEach((lineNo) => {
        expect(lineNo).toBeGreaterThan(0)
        expect(lineNo).toBeLessThanOrEqual(totalLines)
      })
    })
  })

  // ── 3c.  Unknown language falls back to JavaScript lineMap ────────────────
  it('falls back to javascript lineMap for an unknown language', () => {
    LINE_KEYS.forEach((key) => {
      expect(resolvePascalsTriangleLine('cobol', key)).toBe(
        resolvePascalsTriangleLine('javascript', key)
      )
    })
  })

  // ── 3d.  Unknown lineKey returns undefined ────────────────────────────────
  it('returns undefined for an unknown lineKey', () => {
    expect(
      resolvePascalsTriangleLine('javascript', 'nonExistentKey')
    ).toBeUndefined()
  })

  // Spot-check: innerCell for JS must equal line 9
  it('javascript innerCell maps to line 9', () => {
    expect(resolvePascalsTriangleLine('javascript', 'innerCell')).toBe(9)
  })

  // Spot-check: start for JS must equal line 2
  it('javascript start maps to line 2', () => {
    expect(resolvePascalsTriangleLine('javascript', 'start')).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Replay steps
// ─────────────────────────────────────────────────────────────────────────────

describe('generatePascalsTriangleSteps() – replay module', () => {
  // ── 4a / 4b.  First/last step lineKeys ───────────────────────────────────
  it('first step has lineKey "start"', () => {
    const steps = generatePascalsTriangleSteps(4)
    expect(steps[0].lineKey).toBe('start')
  })

  it('last step has lineKey "result"', () => {
    const steps = generatePascalsTriangleSteps(4)
    expect(steps[steps.length - 1].lineKey).toBe('result')
  })

  // ── 4c.  innerCell steps carry correct computed values ────────────────────
  it('innerCell steps carry the correct cell value in variables', () => {
    const steps = generatePascalsTriangleSteps(4)
    const innerCells = steps.filter((s) => s.lineKey === 'innerCell')

    // Row 2 has one interior cell: 1+1 = 2
    const row2Cell = innerCells.find(
      (s) => s.variables.rowIndex === 2 && s.variables.colIndex === 1
    )
    expect(row2Cell).toBeDefined()
    expect(row2Cell.variables.cell).toBe(2)
    expect(row2Cell.variables.left).toBe(1)
    expect(row2Cell.variables.right).toBe(1)

    // Row 3 has two interior cells: 1+2=3 and 2+1=3
    const row3Cells = innerCells.filter((s) => s.variables.rowIndex === 3)
    expect(row3Cells).toHaveLength(2)
    expect(row3Cells[0].variables.cell).toBe(3)
    expect(row3Cells[1].variables.cell).toBe(3)
  })

  // ── 4d.  Triangle snapshot grows correctly ────────────────────────────────
  it('the triangle snapshot embedded in rowDone steps is consistent', () => {
    const steps = generatePascalsTriangleSteps(4)
    const rowDones = steps.filter((s) => s.lineKey === 'rowDone')

    expect(rowDones).toHaveLength(3) // rows 1, 2, 3  (row 0 is the seed)

    // After rowDone for row 1 the snapshot should contain 2 rows
    expect(rowDones[0].triangle).toHaveLength(2)
    expect(rowDones[0].triangle[1]).toEqual([1, 1])

    // After rowDone for row 2 the snapshot should contain 3 rows
    expect(rowDones[1].triangle).toHaveLength(3)
    expect(rowDones[1].triangle[2]).toEqual([1, 2, 1])

    // After rowDone for row 3 the snapshot should contain 4 rows
    expect(rowDones[2].triangle).toHaveLength(4)
    expect(rowDones[2].triangle[3]).toEqual([1, 3, 3, 1])
  })

  // ── 4e.  Edge case: numRows=0 ─────────────────────────────────────────────
  it('numRows=0 produces a single step with type "complete" and empty array', () => {
    const steps = generatePascalsTriangleSteps(0)
    expect(steps).toHaveLength(1)
    expect(steps[0].type).toBe('complete')
    expect(steps[0].array).toEqual([])
  })

  // ── 4f.  numRows=1 → exactly two steps (start + result) ──────────────────
  it('numRows=1 produces exactly two steps: start then result', () => {
    const steps = generatePascalsTriangleSteps(1)
    expect(steps).toHaveLength(2)
    expect(steps[0].lineKey).toBe('start')
    expect(steps[1].lineKey).toBe('result')
    // No outerLoop or innerCell steps
    const hasLoop = steps.some(
      (s) => s.lineKey === 'outerLoop' || s.lineKey === 'innerCell'
    )
    expect(hasLoop).toBe(false)
  })

  // ── All step objects satisfy the createStep contract ──────────────────────
  it('every step has lineKey, type, array, indices, sortedIndices, message, variables', () => {
    const steps = generatePascalsTriangleSteps(4)
    steps.forEach((step) => {
      expect(typeof step.lineKey).toBe('string')
      expect(typeof step.type).toBe('string')
      expect(Array.isArray(step.array)).toBe(true)
      expect(Array.isArray(step.indices)).toBe(true)
      expect(Array.isArray(step.sortedIndices)).toBe(true)
      expect(typeof step.message).toBe('string')
      expect(typeof step.variables).toBe('object')
    })
  })

  it('the array field in the result step equals the last row of the triangle', () => {
    const steps = generatePascalsTriangleSteps(5)
    const resultStep = steps[steps.length - 1]
    expect(resultStep.array).toEqual([1, 4, 6, 4, 1])
  })
})
