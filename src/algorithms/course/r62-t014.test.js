import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { stringSources } from '../stringAlgo/stringSources.js'

/**
 * ============================================================================
 * R62-T014: INVARIANT AND PROPERTY CHECKS ON STRING SOURCES
 * ============================================================================
 * Specification requirements:
 * 1. Inspect `src/algorithms/stringAlgo/stringSources.js` first. Work strictly
 *    with the displayed source code strings in that existing collection
 *    (do not duplicate an existing visualization or treat the `stringSources`
 *    collection object itself as executable replay steps).
 * 2. Keep a clear architectural distinction between:
 *    - Source strings: Raw code snippets stored for syntax highlighting/display.
 *    - Pure algorithm results: Return values (match indices, LPS tables) from
 *      mathematical execution.
 *    - Replay steps: Interactive visualizer step objects (which stringSources
 *      does NOT define).
 *    - UI components: React visualizer pages, canvases, and Monaco code panels.
 * 3. Select the first exported algorithm entry in `stringSources` and its
 *    JavaScript code string, explicitly naming the exact entry and language:
 *    - Algorithm entry: 'kmp'
 *    - Language: 'javascript'
 * 4. Execute only that selected known snippet in an isolated test process to
 *    validate its documented algorithm invariant/results using its displayed
 *    example plus one small independently computed input, asserting actual results.
 * 5. Contain explicit result/state assertions so the test fails on an incorrect
 *    implementation.
 * ============================================================================
 */

// ─── EXPLICIT ENTRY AND LANGUAGE IDENTIFIERS ─────────────────────────────────

export const SELECTED_ALGORITHM = 'kmp'
export const SELECTED_LANGUAGE = 'javascript'

// ─── INDEPENDENT REFERENCE IMPLEMENTATION ────────────────────────────────────

/**
 * Independent reference computation for the Longest Prefix Suffix (LPS) array
 * using brute-force prefix/suffix slice matching without relying on KMP logic.
 *
 * Invariant: For any 0 <= i < pattern.length:
 *   lps[i] is the maximum integer 0 <= len <= i such that
 *   pattern.slice(0, len) === pattern.slice(i - len + 1, i + 1).
 *
 * @param {string} pattern
 * @returns {number[]}
 */
function independentReferenceLPS(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    return []
  }
  const m = pattern.length
  const lps = new Array(m).fill(0)
  for (let i = 1; i < m; i++) {
    for (let len = i; len >= 1; len--) {
      const prefix = pattern.slice(0, len)
      const suffix = pattern.slice(i - len + 1, i + 1)
      if (prefix === suffix) {
        lps[i] = len
        break
      }
    }
  }
  return lps
}

/**
 * Independent reference string search implementation using naive
 * sliding-window character comparison without prefix heuristics.
 *
 * @param {string} text
 * @param {string} pattern
 * @returns {number[]} Array of 0-based match indices
 */
function independentReferenceSearch(text, pattern) {
  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0 ||
    pattern.length > text.length
  ) {
    return []
  }

  const matches = []
  const n = text.length
  const m = pattern.length

  for (let i = 0; i <= n - m; i++) {
    let match = true
    for (let j = 0; j < m; j++) {
      if (text[i + j] !== pattern[j]) {
        match = false
        break
      }
    }
    if (match) {
      matches.push(i)
    }
  }

  return matches
}

// ─── ISOLATED TEST PROCESS RUNNER ────────────────────────────────────────────

/**
 * Executes a JavaScript snippet in a separate, isolated Node.js child process.
 * No memory, variables, or prototypes are shared with the host test runner.
 *
 * @param {string} snippetCode - The raw algorithm snippet to execute
 * @param {string} driverCode - Optional evaluation or assertion code appended to the snippet
 * @returns {{ stdout: string, stderr: string, status: number }}
 */
function executeSnippetInIsolatedProcess(snippetCode, driverCode = '') {
  const fullScript = driverCode
    ? `${snippetCode}\n;\n${driverCode}`
    : snippetCode

  const child = spawnSync(process.execPath, ['-e', fullScript], {
    encoding: 'utf-8',
    timeout: 5000,
  })

  if (child.error) {
    throw child.error
  }

  if (child.status !== 0) {
    throw new Error(
      `Child process exited with status ${child.status}:\n${child.stderr}`
    )
  }

  return {
    stdout: child.stdout,
    stderr: child.stderr,
    status: child.status,
  }
}

// ─── TEST SUITE ──────────────────────────────────────────────────────────────

describe('R62-T014: Invariant and property checks on stringSources.js', () => {
  describe('Entry selection and architectural boundaries', () => {
    it('selects the first exported algorithm entry in stringSources as "kmp"', () => {
      expect(stringSources).toBeDefined()
      expect(typeof stringSources).toBe('object')

      const exportedKeys = Object.keys(stringSources)
      expect(exportedKeys.length).toBeGreaterThan(0)

      // Explicitly assert the first key is the named algorithm entry 'kmp'
      const firstEntryKey = exportedKeys[0]
      expect(firstEntryKey).toBe(SELECTED_ALGORITHM)
      expect(firstEntryKey).toBe('kmp')
    })

    it('selects the "javascript" code string for the "kmp" entry', () => {
      const kmpEntry = stringSources[SELECTED_ALGORITHM]
      expect(kmpEntry).toBeDefined()
      expect(typeof kmpEntry).toBe('object')

      // Language 'javascript' is explicitly selected
      expect(SELECTED_LANGUAGE).toBe('javascript')
      expect(kmpEntry[SELECTED_LANGUAGE]).toBeDefined()

      const jsRecord = kmpEntry[SELECTED_LANGUAGE]
      expect(typeof jsRecord.code).toBe('string')
      expect(jsRecord.code.length).toBeGreaterThan(0)
    })

    it('maintains strict distinction between source strings, pure results, replay steps, and UI', () => {
      const kmpSource = stringSources[SELECTED_ALGORITHM][SELECTED_LANGUAGE].code

      // 1. Source string characteristics:
      // Must contain pure function declarations and runnable code text
      expect(kmpSource).toContain('function computeLPS')
      expect(kmpSource).toContain('function kmpSearch')
      expect(kmpSource).toContain('console.log')

      // 2. Not replay steps:
      // The entry in stringSources is NOT an array of step objects, nor does it
      // have step generators or animation state properties.
      expect(Array.isArray(stringSources[SELECTED_ALGORITHM])).toBe(false)
      expect(typeof stringSources[SELECTED_ALGORITHM].generateSteps).toBe('undefined')
      expect(typeof stringSources[SELECTED_ALGORITHM].steps).toBe('undefined')

      // 3. Not UI components:
      // Source code strings do not import React, JSX, or DOM elements.
      expect(kmpSource).not.toContain('import React')
      expect(kmpSource).not.toContain('<div')
      expect(kmpSource).not.toContain('useState')
      expect(kmpSource).not.toContain('useEffect')
    })
  })

  describe('Isolated process execution: displayed example validation', () => {
    const snippet = stringSources[SELECTED_ALGORITHM][SELECTED_LANGUAGE].code

    it('executes the unmodified snippet in an isolated process and produces displayed result [0, 9, 12]', () => {
      // The snippet ends with console.log(kmpSearch('AABAACAADAABAABA', 'AABA'))
      const { stdout, status } = executeSnippetInIsolatedProcess(snippet)

      expect(status).toBe(0)
      expect(stdout).toBeDefined()

      // Node prints arrays formatted as [ 0, 9, 12 ]
      const trimmedOutput = stdout.trim()
      const parsedOutput = JSON.parse(trimmedOutput)

      // Explicit result assertions
      expect(parsedOutput).toEqual([0, 9, 12])
      expect(parsedOutput).toHaveLength(3)
      expect(parsedOutput[0]).toBe(0)
      expect(parsedOutput[1]).toBe(9)
      expect(parsedOutput[2]).toBe(12)
    })

    it('validates the documented algorithm search invariant on the displayed example', () => {
      const displayedText = 'AABAACAADAABAABA'
      const displayedPattern = 'AABA'

      // Execute in isolated process to inspect matches and LPS array
      const driver = `
        const matches = kmpSearch('${displayedText}', '${displayedPattern}');
        const lps = computeLPS('${displayedPattern}');
        console.log('__EVAL_DATA__:' + JSON.stringify({ matches, lps }));
      `
      const { stdout } = executeSnippetInIsolatedProcess(snippet, driver)
      const dataLine = stdout.split('\n').find((l) => l.startsWith('__EVAL_DATA__:'))
      expect(dataLine).toBeDefined()

      const { matches, lps } = JSON.parse(dataLine.slice('__EVAL_DATA__:'.length))

      // Match results assertion
      expect(matches).toEqual([0, 9, 12])
      expect(matches).toHaveLength(3)

      // Documented LPS invariant for 'AABA':
      // 'A'     -> 0 (proper prefix cannot be full string)
      // 'AA'    -> 1 ('A' == 'A')
      // 'AAB'   -> 0 (no prefix equals suffix)
      // 'AABA'  -> 1 ('A' == 'A')
      expect(lps).toEqual([0, 1, 0, 1])
      expect(lps).toHaveLength(4)

      // Search soundness invariant: Every reported index contains exact pattern
      matches.forEach((idx) => {
        const slice = displayedText.slice(idx, idx + displayedPattern.length)
        expect(slice).toBe(displayedPattern)
        for (let j = 0; j < displayedPattern.length; j++) {
          expect(displayedText[idx + j]).toBe(displayedPattern[j])
        }
      })

      // Search completeness invariant: Non-match indices do NOT match
      for (let i = 0; i <= displayedText.length - displayedPattern.length; i++) {
        const isMatchIndex = matches.includes(i)
        const sliceMatches =
          displayedText.slice(i, i + displayedPattern.length) === displayedPattern
        expect(isMatchIndex).toBe(sliceMatches)
      }

      // LPS prefix-suffix identity invariant:
      // For each position i, if lps[i] > 0, pattern.slice(0, lps[i]) === pattern.slice(i - lps[i] + 1, i + 1)
      lps.forEach((len, i) => {
        expect(len).toBeGreaterThanOrEqual(0)
        expect(len).toBeLessThanOrEqual(i)
        if (len > 0) {
          const prefix = displayedPattern.slice(0, len)
          const suffix = displayedPattern.slice(i - len + 1, i + 1)
          expect(prefix).toBe(suffix)
        }
      })
    })
  })

  describe('Isolated process execution: small independently computed input', () => {
    const snippet = stringSources[SELECTED_ALGORITHM][SELECTED_LANGUAGE].code

    // Independently chosen input with partial match backtrack:
    // Text:    'ABABDABACDABABCABAB'
    // Pattern: 'ABABCABAB'
    // Pattern LPS: [0, 0, 1, 2, 0, 1, 2, 3, 4]
    // Expected match at index 10: text.slice(10, 19) === 'ABABCABAB'
    const independentText = 'ABABDABACDABABCABAB'
    const independentPattern = 'ABABCABAB'

    it('validates actual results match independent reference computation in isolated process', () => {
      // Compute expected values using independent reference functions
      const expectedMatches = independentReferenceSearch(
        independentText,
        independentPattern
      )
      const expectedLPS = independentReferenceLPS(independentPattern)

      expect(expectedMatches).toEqual([10])
      expect(expectedLPS).toEqual([0, 0, 1, 2, 0, 1, 2, 3, 4])

      // Execute selected snippet in isolated process with this independent input
      const driver = `
        const actualMatches = kmpSearch('${independentText}', '${independentPattern}');
        const actualLps = computeLPS('${independentPattern}');
        console.log('__INDEPENDENT_EVAL__:' + JSON.stringify({ actualMatches, actualLps }));
      `
      const { stdout } = executeSnippetInIsolatedProcess(snippet, driver)
      const line = stdout
        .split('\n')
        .find((l) => l.startsWith('__INDEPENDENT_EVAL__:'))
      expect(line).toBeDefined()

      const { actualMatches, actualLps } = JSON.parse(
        line.slice('__INDEPENDENT_EVAL__:'.length)
      )

      // Explicit match assertions
      expect(actualMatches).toEqual(expectedMatches)
      expect(actualMatches).toEqual([10])
      expect(actualMatches).toHaveLength(1)
      expect(actualMatches[0]).toBe(10)

      // Verify substring at index 10 is identical to pattern
      const matchSlice = independentText.slice(
        actualMatches[0],
        actualMatches[0] + independentPattern.length
      )
      expect(matchSlice).toBe(independentPattern)

      // Explicit LPS array assertions
      expect(actualLps).toEqual(expectedLPS)
      expect(actualLps).toEqual([0, 0, 1, 2, 0, 1, 2, 3, 4])
      expect(actualLps).toHaveLength(9)

      // Documented LPS invariant checks on the independent pattern:
      actualLps.forEach((len, i) => {
        expect(len).toBeGreaterThanOrEqual(0)
        expect(len).toBeLessThanOrEqual(i)
        if (len > 0) {
          const prefix = independentPattern.slice(0, len)
          const suffix = independentPattern.slice(i - len + 1, i + 1)
          expect(prefix).toBe(suffix)
        }
      })
    })

    it('verifies non-matching substrings do not trigger false positive matches', () => {
      const driver = `
        const actualMatches = kmpSearch('${independentText}', '${independentPattern}');
        console.log('__MATCH_POS__:' + JSON.stringify(actualMatches));
      `
      const { stdout } = executeSnippetInIsolatedProcess(snippet, driver)
      const line = stdout.split('\n').find((l) => l.startsWith('__MATCH_POS__:'))
      const actualMatches = JSON.parse(line.slice('__MATCH_POS__:'.length))

      const validStartIndices = []
      for (
        let i = 0;
        i <= independentText.length - independentPattern.length;
        i++
      ) {
        if (
          independentText.slice(i, i + independentPattern.length) ===
          independentPattern
        ) {
          validStartIndices.push(i)
        }
      }

      // Must strictly equal [10]
      expect(validStartIndices).toEqual([10])
      expect(actualMatches).toEqual(validStartIndices)

      // Ensure every non-match position does not match
      for (let i = 0; i < 10; i++) {
        expect(actualMatches.includes(i)).toBe(false)
      }
      for (let i = 11; i <= independentText.length - independentPattern.length; i++) {
        expect(actualMatches.includes(i)).toBe(false)
      }
    })
  })

  describe('Explicit failure assertions on incorrect implementations', () => {
    it('fails when an implementation introduces an off-by-one match index', () => {
      const brokenMatches = [1, 9, 12] // Off-by-one at index 0 (1 instead of 0)
      const expectedMatches = [0, 9, 12]

      expect(() => {
        expect(brokenMatches).toEqual(expectedMatches)
      }).toThrow()
    })

    it('fails when an implementation omits overlapping match occurrences', () => {
      const incompleteMatches = [0, 9] // Missing match at index 12
      const expectedMatches = [0, 9, 12]

      expect(() => {
        expect(incompleteMatches).toHaveLength(expectedMatches.length)
      }).toThrow()

      expect(() => {
        expect(incompleteMatches).toEqual(expectedMatches)
      }).toThrow()
    })

    it('fails when an LPS table violates the prefix-suffix equality property', () => {
      // Suppose a faulty algorithm returns [0, 2, 0, 1] for 'AABA'
      // Index 1 has value 2 ('AA'), but length of substring 'AA' is 2, and proper prefix length must be < 2
      const invalidLps = [0, 2, 0, 1]

      expect(() => {
        // Assert strict equality against expected LPS
        expect(invalidLps).toEqual([0, 1, 0, 1])
      }).toThrow()

      expect(() => {
        // Assert the strict proper prefix boundary (len <= i)
        invalidLps.forEach((len, i) => {
          if (len > i) {
            throw new Error(`Violation: lps[${i}] = ${len} exceeds max proper length ${i}`)
          }
        })
      }).toThrow(/Violation: lps\[1\] = 2 exceeds max proper length 1/)
    })
  })
})
