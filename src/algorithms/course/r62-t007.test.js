import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { backtrackingSources, getBacktrackingSource } from '../backtracking/backtrackingSources'

// First exported algorithm entry and the exact displayed language under test.
const displayedNQueensJavaScript = backtrackingSources.nqueens.javascript.code

function executeDisplayedNQueensSource(size) {
  const isolatedProgram = `${displayedNQueensJavaScript}\nprocess.stdout.write(JSON.stringify(solveNQueens(${size})))`
  const output = execFileSync(process.execPath, ['-e', isolatedProgram], {
    encoding: 'utf8',
    timeout: 5000,
  })

  return JSON.parse(output)
}

describe('backtrackingSources.nqueens.javascript displayed source', () => {
  it('returns the displayed 4-Queens example solutions', () => {
    expect(getBacktrackingSource('nqueens', 'javascript')).toBe(
      displayedNQueensJavaScript
    )
    expect(displayedNQueensJavaScript).toContain(
      'Displayed example: solveNQueens(4)'
    )
    expect(executeDisplayedNQueensSource(4)).toEqual([
      ['.Q..', '...Q', 'Q...', '..Q.'],
      ['..Q.', 'Q...', '...Q', '.Q..'],
    ])
  })

  it('returns the independently computed one-queen solution for n = 1', () => {
    expect(executeDisplayedNQueensSource(1)).toEqual([['Q']])
  })

  it('keeps displayed line numbers attached to their actual operations', () => {
    const displayedLines = displayedNQueensJavaScript.split('\n')
    const lineAt = (displayedNumber) => displayedLines[displayedNumber - 1]

    expect(lineAt(1)).toContain('function solveNQueens(n)')
    expect(lineAt(5)).toContain('function isSafe(row, col)')
    expect(lineAt(17)).toContain('results.push(board.map')
    expect(lineAt(22)).toContain("board[row][col] = 'Q'")
    expect(lineAt(23).trim()).toBe('solve(row + 1)')
    expect(lineAt(24)).toContain("board[row][col] = '.'")
  })
})
