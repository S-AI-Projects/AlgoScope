import { describe, it, expect } from 'vitest'
import {
  boyerMooreSearch,
  boyerMoore,
  boyerMooreDetailed,
  buildBadCharTable,
  buildGoodSuffixTable,
  generateBoyerMooreSteps,
  boyerMooreSources,
  getBoyerMooreSource,
  resolveBoyerMooreLine,
} from '../stringAlgo/boyerMooreSteps.js'

/**
 * ============================================================================
 * R62-T011: BOYER-MOORE STRING SEARCH REGRESSION TESTS
 * ============================================================================
 * Specification requirements:
 * 1. Tests text "ABABABA" with pattern "ABA" and asserts matches.
 * 2. Includes a missing-match test case (pattern not found in text).
 * 3. Explicitly tests and documents the empty-pattern ("") policy.
 * 4. Contains explicit result/state assertions so the test fails on an
 *    incorrect implementation.
 * ============================================================================
 */

describe('R62-T011: Boyer-Moore String Search', () => {
  describe('Matching text "ABABABA" with pattern "ABA"', () => {
    const text = 'ABABABA'
    const pattern = 'ABA'

    it('finds all 3 overlapping occurrences at indices 0, 2, and 4', () => {
      const matches = boyerMooreSearch(text, pattern)

      // Explicit match result assertions
      expect(matches).toEqual([0, 2, 4])
      expect(matches).toHaveLength(3)
      expect(matches[0]).toBe(0)
      expect(matches[1]).toBe(2)
      expect(matches[2]).toBe(4)

      // Verify that every reported index strictly matches the pattern
      matches.forEach((idx) => {
        expect(text.slice(idx, idx + pattern.length)).toBe(pattern)
      })

      // Verify shorthand alias boyerMoore behaves identically
      expect(boyerMoore(text, pattern)).toEqual([0, 2, 4])
    })

    it('returns accurate precomputation tables and detailed pure results', () => {
      const details = boyerMooreDetailed(text, pattern)

      expect(details.matches).toEqual([0, 2, 4])
      expect(details.text).toBe(text)
      expect(details.pattern).toBe(pattern)

      // Bad character table: 'A' -> last index 2, 'B' -> last index 1
      expect(details.badCharTable).toEqual({ A: 2, B: 1 })

      // Good suffix shift table for "ABA":
      // Suffix of length 1 ("A") matched at pattern[2]: matches prefix "A", shift = 2
      // Suffix of length 2 ("BA") mismatch at pattern[0]: shift = 2
      // Full match (j < 0): border "A" allows next alignment shift of 2
      expect(details.goodSuffixTable).toEqual([2, 2, 1])
    })

    it('generates replay steps that faithfully track comparison, mismatch, and match states', () => {
      const steps = generateBoyerMooreSteps(text, pattern)

      expect(steps.length).toBeGreaterThan(0)

      // Step types present
      const stepTypes = new Set(steps.map((s) => s.type))
      expect(stepTypes.has('setup')).toBe(true)
      expect(stepTypes.has('loop')).toBe(true)
      expect(stepTypes.has('compare')).toBe(true)
      expect(stepTypes.has('found')).toBe(true)
      expect(stepTypes.has('complete')).toBe(true)

      // Found steps must reflect matches at indices 0, 2, and 4
      const foundSteps = steps.filter((s) => s.type === 'found')
      expect(foundSteps).toHaveLength(3)
      expect(foundSteps.map((s) => s.foundAt)).toEqual([0, 2, 4])
      expect(foundSteps.map((s) => s.at)).toEqual([0, 2, 4])

      // Verification of right-to-left comparison order in first window
      const firstCompares = steps
        .filter((s) => s.type === 'compare' && s.variables?.shift === 0)
        .map((s) => s.variables.patternIndex)
      expect(firstCompares).toEqual([2, 1, 0])

      // Completion step asserts total matches
      const completeStep = steps[steps.length - 1]
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.matches).toEqual([0, 2, 4])
      expect(completeStep.variables.totalMatches).toBe(3)
    })
  })

  describe('Missing-match test case (pattern not in text)', () => {
    it('returns an empty array when pattern is completely absent from text', () => {
      const text = 'ABABABA'
      const missingPattern = 'XYZ'

      const matches = boyerMooreSearch(text, missingPattern)
      expect(matches).toEqual([])
      expect(matches).toHaveLength(0)

      const details = boyerMooreDetailed(text, missingPattern)
      expect(details.matches).toEqual([])
    })

    it('returns an empty array when pattern characters exist but sequence does not match', () => {
      const text = 'ABABABA'
      const nonExistentSubstring = 'BBA'

      const matches = boyerMooreSearch(text, nonExistentSubstring)
      expect(matches).toEqual([])
    })

    it('generates replay steps for missing-match showing comparisons and zero found steps', () => {
      const text = 'ABABABA'
      const missingPattern = 'XYZ'

      const steps = generateBoyerMooreSteps(text, missingPattern)
      expect(steps.length).toBeGreaterThan(0)

      const foundSteps = steps.filter((s) => s.type === 'found')
      expect(foundSteps).toHaveLength(0)

      const completeStep = steps[steps.length - 1]
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.matches).toEqual([])
      expect(completeStep.variables.totalMatches).toBe(0)
      expect(completeStep.message).toContain('not found')
    })
  })

  describe('Empty-pattern ("") policy and edge-case inputs', () => {
    /**
     * EMPTY-PATTERN POLICY DOCUMENTATION:
     * ------------------------------------
     * In the Boyer-Moore string matching paradigm:
     * - Character matching scans right-to-left starting at `j = m - 1`.
     * - An empty pattern `""` has length `m = 0`, making right-to-left indices
     *   undefined (`j = -1`) and zero-width shifts prone to infinite loops.
     * - Therefore, in AlgoScope's Boyer-Moore implementation:
     *   1. Searching for an empty pattern `""` returns NO matches (`[]`).
     *   2. Step replay for an empty pattern returns NO steps (`[]`).
     *   3. Empty text `""` likewise returns NO matches (`[]`).
     *   4. Non-string inputs (null, undefined, non-strings) return `[]`.
     */

    it('returns empty matches [] and empty steps [] when pattern is empty ""', () => {
      expect(boyerMooreSearch('ABABABA', '')).toEqual([])
      expect(boyerMooreSearch('', '')).toEqual([])
      expect(generateBoyerMooreSteps('ABABABA', '')).toEqual([])
      expect(generateBoyerMooreSteps('', '')).toEqual([])
    })

    it('returns empty matches [] when text is empty but pattern is provided', () => {
      expect(boyerMooreSearch('', 'ABA')).toEqual([])
      expect(generateBoyerMooreSteps('', 'ABA')).toEqual([])
    })

    it('safely handles null, undefined, or non-string inputs without throwing', () => {
      expect(boyerMooreSearch(null, 'ABA')).toEqual([])
      expect(boyerMooreSearch('ABABABA', null)).toEqual([])
      expect(boyerMooreSearch(undefined, undefined)).toEqual([])
      expect(boyerMooreSearch(12345, '12')).toEqual([])
      expect(generateBoyerMooreSteps(null, 'ABA')).toEqual([])
      expect(generateBoyerMooreSteps('ABABABA', null)).toEqual([])
    })

    it('handles pattern longer than text cleanly', () => {
      const matches = boyerMooreSearch('ABA', 'ABABABA')
      expect(matches).toEqual([])

      const steps = generateBoyerMooreSteps('ABA', 'ABABABA')
      expect(steps).toHaveLength(1)
      expect(steps[0].type).toBe('complete')
      expect(steps[0].message).toContain('greater than text length')
    })
  })

  describe('Explicit result/state assertions to fail incorrect implementations', () => {
    it('verifies exact Bad Character and Good Suffix tables to detect naive shift regressions', () => {
      // Bad Character table for 'ABA'
      const badChar = buildBadCharTable('ABA')
      expect(badChar).toEqual({ A: 2, B: 1 })
      expect(badChar['A']).toBe(2)
      expect(badChar['B']).toBe(1)
      expect(badChar['C']).toBeUndefined()

      // Good Suffix table for 'ABA'
      const goodSuffix = buildGoodSuffixTable('ABA')
      expect(goodSuffix).toEqual([2, 2, 1])

      // If an implementation erroneously shifts by pattern length (m = 3)
      // after a match rather than goodSuffix[0] (2), it skips index 2.
      // This assertion ensures that incorrect shift logic immediately fails the test:
      const matches = boyerMooreSearch('ABABABA', 'ABA')
      expect(matches).toContain(2)
      expect(matches).not.toEqual([0, 4])
    })

    it('correctly matches classic textbook Boyer-Moore example', () => {
      const text = 'HERE IS A SIMPLE EXAMPLE'
      const pattern = 'EXAMPLE'
      const matches = boyerMooreSearch(text, pattern)

      expect(matches).toEqual([17])
      expect(text.substring(17, 17 + pattern.length)).toBe('EXAMPLE')
    })

    it('correctly handles all-identical character repetitions', () => {
      const text = 'AAAAA'
      const pattern = 'AAA'
      const matches = boyerMooreSearch(text, pattern)

      expect(matches).toEqual([0, 1, 2])
    })

    it('correctly handles single-character pattern search', () => {
      const text = 'BANANA'
      const pattern = 'A'
      const matches = boyerMooreSearch(text, pattern)

      expect(matches).toEqual([1, 3, 5])
    })
  })

  describe('Source code strings, line maps, and helpers', () => {
    it('provides multi-language source code implementations and valid line mappings', () => {
      expect(boyerMooreSources.javascript.code).toContain(
        'function boyerMooreSearch'
      )
      expect(boyerMooreSources.python.code).toContain('def boyer_moore_search')
      expect(boyerMooreSources.cpp.code).toContain(
        'vector<int> boyerMooreSearch'
      )
      expect(boyerMooreSources.java.code).toContain('public class BoyerMoore')

      const jsSource = getBoyerMooreSource('javascript')
      expect(jsSource.code).toBeDefined()
      expect(jsSource.lineMap).toBeDefined()
      expect(typeof jsSource.lineMap.compare).toBe('number')

      const compareLine = resolveBoyerMooreLine('javascript', 'compare')
      expect(typeof compareLine).toBe('number')
      expect(compareLine).toBeGreaterThan(0)

      expect(resolveBoyerMooreLine('javascript', null)).toBeUndefined()
    })
  })
})
