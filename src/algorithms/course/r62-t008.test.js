import { describe, expect, it } from 'vitest'
import { generateLCSSteps } from '../dp/dpStepGenerators'

describe('generateLCSSteps input and replay contract', () => {
  it('returns the zero-sized LCS table for the smallest valid string input', () => {
    // Preconditions: DPVisualizer.jsx:779 passes trimmed strings; dpStepGenerators.js:7-9 sizes the table from their lengths.
    const result = generateLCSSteps('', '')

    expect(result.strA).toBe('')
    expect(result.strB).toBe('')
    expect(result.dp).toEqual([[0]])
    expect(result.steps).toEqual([])
  })

  it('returns the expected LCS table and replay for the visualizer example', () => {
    // Precondition/source: DPVisualizer.jsx:16 supplies the example; one LCS is BDAB (length 4).
    const result = generateLCSSteps('ABCBDAB', 'BDCAB')

    expect(result.strA).toBe('ABCBDAB')
    expect(result.strB).toBe('BDCAB')
    expect(result.dp).toHaveLength(8)
    expect(result.dp.every((row) => row.length === 6)).toBe(true)
    expect(result.dp[7][5]).toBe(4)
    expect(result.steps.filter((step) => step.phase === 'fill')).toHaveLength(35)
    expect(result.steps.filter((step) => step.phase === 'traceback')).toHaveLength(4)
    expect(result.steps.at(-1)).toMatchObject({
      phase: 'traceback',
      activeCell: [4, 1],
      pathSoFar: [
        [7, 5],
        [6, 4],
        [5, 2],
        [4, 1],
      ],
    })
  })

  it('reports unsupported inputs and can run valid input immediately afterward', () => {
    // Preconditions: dpStepGenerators.js:3-4 rejects non-strings; DPVisualizer.jsx:779 supplies trimmed strings.
    expect(() => generateLCSSteps(null, 'A')).toThrowError(
      new TypeError('LCS inputs must be strings.'),
    )

    const result = generateLCSSteps('A', 'A')
    expect(result.dp).toEqual([[0, 0], [0, 1]])
    expect(result.steps).toHaveLength(2)
    expect(result.dp[1][1]).toBe(1)
  })
})
