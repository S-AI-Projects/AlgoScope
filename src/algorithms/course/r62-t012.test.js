import { describe, it, expect } from 'vitest'
import {
  manacher,
  longestPalindrome,
  manacherDetailed,
  transformString,
  generateManacherSteps,
  manacherSources,
  getManacherSource,
  resolveManacherLine,
} from '../stringAlgo/manacherSteps.js'
import * as manacherModule from '../stringAlgo/manacher.js'

/**
 * ============================================================================
 * R62-T012: MANACHER'S LONGEST PALINDROMIC SUBSTRING REGRESSION TESTS
 * ============================================================================
 * Specification requirements:
 * 1. Verifies "abba" has longest palindrome "abba" (even-length center).
 * 2. Verifies "babad" permits "bab" or "aba" under a declared tie-breaking rule
 *    (document the tie rule clearly).
 * 3. Explicitly handles and tests empty input ("") as well as single-character input.
 * 4. Contains explicit result/state assertions so the test fails on an incorrect implementation.
 * ============================================================================
 */

describe('R62-T012: Manacher Algorithm - Longest Palindromic Substring', () => {
  describe('Even-length palindrome: input "abba"', () => {
    const input = 'abba'

    it('verifies "abba" has longest palindrome "abba"', () => {
      const result = manacher(input)
      expect(result).toBe('abba')

      // Canonical alias longestPalindrome produces identical result
      expect(longestPalindrome(input)).toBe('abba')

      // Re-export from manacher.js entrypoint behaves identically
      expect(manacherModule.manacher(input)).toBe('abba')
      expect(manacherModule.longestPalindrome(input)).toBe('abba')
    })

    it('verifies exact algorithmic state and metadata for "abba"', () => {
      const details = manacherDetailed(input)

      expect(details.longestPalindrome).toBe('abba')
      expect(details.length).toBe(4)
      expect(details.start).toBe(0)
      expect(details.end).toBe(4)

      // Transformed string verification: ^#a#b#b#a#$
      expect(details.transformed).toBe('^#a#b#b#a#$')
      expect(details.transformed).toHaveLength(11)

      // Center of "abba" is the delimiter '#' between the two 'b's at index 5 in T
      expect(details.center).toBe(5)
      expect(details.radius).toBe(4)

      // Explicit radius array P assertions to catch broken expansion or missing delimiters:
      // Indices in T:  0   1   2   3   4   5   6   7   8   9  10
      // Chars in T:    ^   #   a   #   b   #   b   #   a   #   $
      // Expected P:   [0,  0,  1,  0,  1,  4,  1,  0,  1,  0,  0]
      expect(details.p).toEqual([0, 0, 1, 0, 1, 4, 1, 0, 1, 0, 0])
      expect(details.p[5]).toBe(4)

      // Verify the substring slice in original string matches
      expect(input.slice(details.start, details.end)).toBe('abba')
    })

    it('generates replay steps that faithfully track setup, symmetry, expansion, and completion for "abba"', () => {
      const steps = generateManacherSteps(input)

      expect(steps.length).toBeGreaterThan(0)

      // Verify presence of all key step types
      const stepTypes = new Set(steps.map((s) => s.type))
      expect(stepTypes.has('setup')).toBe(true)
      expect(stepTypes.has('mirror')).toBe(true)
      expect(stepTypes.has('expand')).toBe(true)
      expect(stepTypes.has('mismatch')).toBe(true)
      expect(stepTypes.has('boundary')).toBe(true)
      expect(stepTypes.has('record-max')).toBe(true)
      expect(stepTypes.has('complete')).toBe(true)

      // Initial setup step
      const setupStep = steps[0]
      expect(setupStep.type).toBe('setup')
      expect(setupStep.variables.transformed).toBe('^#a#b#b#a#$')
      expect(setupStep.variables.source).toBe('abba')

      // Final complete step
      const completeStep = steps[steps.length - 1]
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.longestPalindrome).toBe('abba')
      expect(completeStep.variables.length).toBe(4)
      expect(completeStep.variables.start).toBe(0)
      expect(completeStep.variables.end).toBe(4)
    })
  })

  describe('Multiple maximal palindromes: input "babad" with declared tie-breaking rule', () => {
    /**
     * ============================================================================
     * DECLARED TIE-BREAKING RULE DOCUMENTATION:
     * ============================================================================
     * In the input string "babad", there exist two distinct longest palindromic
     * substrings of length 3:
     *   1. "bab" located at starting index 0 (indices 0..2)
     *   2. "aba" located at starting index 1 (indices 1..3)
     *
     * In AlgoScope's Manacher module:
     * - Default Rule ('first'):
     *   The algorithm records the FIRST-encountered longest palindrome (earliest
     *   start index in text). It updates the maximum record only when the current
     *   palindrome radius strictly exceeds the existing maximum (`p[i] > maxLen`).
     *   Under 'first', "babad" deterministically produces "bab".
     *
     * - Alternative Declared Rule ('last'):
     *   The algorithm records the LAST-encountered longest palindrome (latest
     *   start index in text). It updates the maximum record when the current
     *   palindrome radius is greater than or equal to the existing maximum (`p[i] >= maxLen`).
     *   Under 'last', "babad" deterministically produces "aba".
     *
     * Specification compliance:
     * - The implementation permits BOTH "bab" and "aba" as valid maximal palindromes.
     * - The tie-breaking rule is explicitly declared, documented, and configurable.
     * ============================================================================
     */
    const input = 'babad'

    it('permits either "bab" or "aba" as valid longest palindromes of length 3', () => {
      const result = manacher(input)
      const validTies = ['bab', 'aba']

      expect(validTies).toContain(result)
      expect(result).toHaveLength(3)
    })

    it('selects "bab" under default first-seen tie-breaking rule', () => {
      // Default invocation
      const defaultResult = manacher(input)
      expect(defaultResult).toBe('bab')

      // Explicit tieBreak: 'first'
      const explicitFirst = manacher(input, { tieBreak: 'first' })
      expect(explicitFirst).toBe('bab')

      const detailsFirst = manacherDetailed(input, { tieBreak: 'first' })
      expect(detailsFirst.longestPalindrome).toBe('bab')
      expect(detailsFirst.start).toBe(0)
      expect(detailsFirst.end).toBe(3)
      expect(detailsFirst.length).toBe(3)
      expect(detailsFirst.tieBreak).toBe('first')
    })

    it('selects "aba" under declared last-seen tie-breaking rule', () => {
      const lastResult = manacher(input, { tieBreak: 'last' })
      expect(lastResult).toBe('aba')

      const detailsLast = manacherDetailed(input, { tieBreak: 'last' })
      expect(detailsLast.longestPalindrome).toBe('aba')
      expect(detailsLast.start).toBe(1)
      expect(detailsLast.end).toBe(4)
      expect(detailsLast.length).toBe(3)
      expect(detailsLast.tieBreak).toBe('last')
    })

    it('records both "bab" and "aba" in allPalindromes collection', () => {
      const details = manacherDetailed(input)
      const foundPalindromes = details.allPalindromes.map((p) => p.palindrome)

      expect(foundPalindromes).toContain('bab')
      expect(foundPalindromes).toContain('aba')

      const babEntry = details.allPalindromes.find((p) => p.palindrome === 'bab')
      expect(babEntry).toBeDefined()
      expect(babEntry.start).toBe(0)
      expect(babEntry.length).toBe(3)

      const abaEntry = details.allPalindromes.find((p) => p.palindrome === 'aba')
      expect(abaEntry).toBeDefined()
      expect(abaEntry.start).toBe(1)
      expect(abaEntry.length).toBe(3)
    })

    it('generates replay steps correctly respecting the declared tie-breaking rule', () => {
      const stepsFirst = generateManacherSteps(input, { tieBreak: 'first' })
      const completeFirst = stepsFirst[stepsFirst.length - 1]
      expect(completeFirst.variables.longestPalindrome).toBe('bab')

      const stepsLast = generateManacherSteps(input, { tieBreak: 'last' })
      const completeLast = stepsLast[stepsLast.length - 1]
      expect(completeLast.variables.longestPalindrome).toBe('aba')
    })
  })

  describe('Empty input ("") policy and handling', () => {
    it('returns empty string "" when input is empty string ""', () => {
      expect(manacher('')).toBe('')
      expect(longestPalindrome('')).toBe('')
    })

    it('returns empty details metadata structure for empty string ""', () => {
      const details = manacherDetailed('')

      expect(details.longestPalindrome).toBe('')
      expect(details.start).toBe(0)
      expect(details.end).toBe(0)
      expect(details.length).toBe(0)
      expect(details.transformed).toBe('^$')
      expect(details.p).toEqual([0, 0])
      expect(details.allPalindromes).toEqual([])
      expect(details.source).toBe('')
    })

    it('returns empty replay steps array [] for empty string ""', () => {
      const steps = generateManacherSteps('')
      expect(steps).toEqual([])
      expect(steps).toHaveLength(0)
    })

    it('safely handles null, undefined, and non-string inputs without throwing', () => {
      expect(manacher(null)).toBe('')
      expect(manacher(undefined)).toBe('')
      expect(manacher(12345)).toBe('')
      expect(manacher({})).toBe('')

      expect(manacherDetailed(null).longestPalindrome).toBe('')
      expect(manacherDetailed(undefined).longestPalindrome).toBe('')

      expect(generateManacherSteps(null)).toEqual([])
      expect(generateManacherSteps(undefined)).toEqual([])
      expect(generateManacherSteps(999)).toEqual([])
    })
  })

  describe('Single-character input policy and handling', () => {
    it('returns the single character itself for any 1-character input', () => {
      expect(manacher('a')).toBe('a')
      expect(manacher('z')).toBe('z')
      expect(manacher('!')).toBe('!')
      expect(longestPalindrome('x')).toBe('x')
    })

    it('returns accurate single-character metadata from manacherDetailed', () => {
      const details = manacherDetailed('a')

      expect(details.longestPalindrome).toBe('a')
      expect(details.length).toBe(1)
      expect(details.start).toBe(0)
      expect(details.end).toBe(1)
      expect(details.transformed).toBe('^#a#$')
      expect(details.transformed).toHaveLength(5)
      expect(details.center).toBe(2)
      expect(details.radius).toBe(1)
      expect(details.p).toEqual([0, 0, 1, 0, 0])
    })

    it('generates valid replay steps for single-character input', () => {
      const steps = generateManacherSteps('a')

      expect(steps.length).toBeGreaterThan(0)
      const completeStep = steps[steps.length - 1]
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.longestPalindrome).toBe('a')
      expect(completeStep.variables.length).toBe(1)
      expect(completeStep.variables.start).toBe(0)
      expect(completeStep.variables.end).toBe(1)
    })
  })

  describe('Explicit result/state assertions to fail on incorrect implementations', () => {
    it('verifies exact transformed string and delimiter placement', () => {
      expect(transformString('')).toBe('^$')
      expect(transformString('a')).toBe('^#a#$')
      expect(transformString('ab')).toBe('^#a#b#$')
      expect(transformString('abba')).toBe('^#a#b#b#a#$')
      expect(transformString('racecar')).toBe('^#r#a#c#e#c#a#r#$')
    })

    it('verifies exact radius array P for odd-length palindrome "aba"', () => {
      const details = manacherDetailed('aba')

      // Indices in T:  0   1   2   3   4   5   6   7   8
      // Chars in T:    ^   #   a   #   b   #   a   #   $
      // Expected P:   [0,  0,  1,  0,  3,  0,  1,  0,  0]
      expect(details.transformed).toBe('^#a#b#a#$')
      expect(details.p).toEqual([0, 0, 1, 0, 3, 0, 1, 0, 0])
      expect(details.longestPalindrome).toBe('aba')
      expect(details.length).toBe(3)
      expect(details.center).toBe(4)
      expect(details.radius).toBe(3)
    })

    it('detects failure on even-length palindromes if delimiter logic is skipped', () => {
      // If an algorithm fails to insert delimiters, it fails even palindromes:
      expect(manacher('cbbd')).toBe('bb')
      const cbbdDetails = manacherDetailed('cbbd')
      expect(cbbdDetails.start).toBe(1)
      expect(cbbdDetails.end).toBe(3)
      expect(cbbdDetails.length).toBe(2)

      expect(manacher('noon')).toBe('noon')
      expect(manacher('aa')).toBe('aa')
    })

    it('correctly handles classic long and nested palindromes', () => {
      expect(manacher('forgeeksskeegfor')).toBe('geeksskeeg')
      expect(manacher('racecar')).toBe('racecar')
      expect(manacher('bananas')).toBe('anana')
      expect(manacher('abacdfgdcaba')).toBe('aba')
      expect(manacher('aaaaa')).toBe('aaaaa')
    })

    it('verifies mirror symmetry reuse (centers to the right reuse radii from the left)', () => {
      // In "abacaba", center 'c' is at index 8 in T.
      // Symmetrical radii around center 8 must match:
      const details = manacherDetailed('abacaba')
      expect(details.longestPalindrome).toBe('abacaba')
      expect(details.length).toBe(7)

      // In T: ^ # a # b # a # c # a # b # a # $
      // Center 'c' is at index 8 with radius 7
      // Mirror check: index 6 (between 'b' and 'a') mirror is 2*8 - 10 = 6, etc.
      expect(details.p[4]).toBe(details.p[12]) // left 'b' vs right 'b'
      expect(details.p[2]).toBe(details.p[14]) // left 'a' vs right 'a'
    })
  })

  describe('Source code strings, line maps, and helpers', () => {
    it('provides multi-language source implementations with valid line maps', () => {
      expect(manacherSources.javascript.code).toContain('function manacher')
      expect(manacherSources.python.code).toContain('def manacher')
      expect(manacherSources.cpp.code).toContain('string manacher')
      expect(manacherSources.java.code).toContain('public class Manacher')

      const jsSource = getManacherSource('javascript')
      expect(jsSource.code).toBeDefined()
      expect(jsSource.lineMap).toBeDefined()
      expect(typeof jsSource.lineMap.setup).toBe('number')
      expect(typeof jsSource.lineMap.mirror).toBe('number')
      expect(typeof jsSource.lineMap.expand).toBe('number')
      expect(typeof jsSource.lineMap.complete).toBe('number')

      const expandLine = resolveManacherLine('javascript', 'expand')
      expect(typeof expandLine).toBe('number')
      expect(expandLine).toBeGreaterThan(0)

      expect(resolveManacherLine('javascript', null)).toBeUndefined()
      expect(resolveManacherLine('javascript', 'nonExistentKey')).toBeUndefined()
    })
  })
})

