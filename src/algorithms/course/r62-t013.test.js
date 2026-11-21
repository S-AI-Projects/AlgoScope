import { describe, it, expect } from 'vitest'
import {
  rabinKarpSearch,
  rabinKarp,
  rabinKarpDetailed,
  computeHash,
  generateRabinKarpSteps,
  rabinKarpSources,
  getRabinKarpSource,
  resolveRabinKarpLine,
  DEFAULT_BASE,
  DEFAULT_PRIME,
} from '../stringAlgo/rabinKarpSteps.js'
import * as rabinKarpModule from '../stringAlgo/rabinKarp.js'

/**
 * ============================================================================
 * R62-T013: RABIN-KARP STRING SEARCH REGRESSION TESTS
 * ============================================================================
 * Specification requirements:
 * 1. Tests text "aaaa" with pattern "aa" and verifies matches [0, 1, 2].
 * 2. Explicitly verifies candidate matches character-by-character so hash
 *    collisions cannot produce false matches (includes collision test case
 *    and custom prime/modulus test confirming spurious hits are rejected).
 * 3. Compares results against a small independent reference implementation
 *    and contains explicit result/state assertions so the test fails on an
 *    incorrect implementation.
 * ============================================================================
 */

// ─── INDEPENDENT REFERENCE IMPLEMENTATION ────────────────────────────────────

/**
 * Independent reference string search implementation using naive
 * character-by-character comparison without hash heuristics.
 *
 * @param {string} text
 * @param {string} pattern
 * @returns {number[]} Array of 0-based match indices
 */
function referenceSearch(text, pattern) {
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

describe('R62-T013: Rabin-Karp String Search', () => {
  describe('Matching text "aaaa" with pattern "aa"', () => {
    const text = 'aaaa'
    const pattern = 'aa'

    it('finds all 3 overlapping matches at indices [0, 1, 2]', () => {
      const matches = rabinKarpSearch(text, pattern)

      // Explicit match assertions
      expect(matches).toEqual([0, 1, 2])
      expect(matches).toHaveLength(3)
      expect(matches[0]).toBe(0)
      expect(matches[1]).toBe(1)
      expect(matches[2]).toBe(2)

      // Character-by-character verification of each matched slice
      matches.forEach((idx) => {
        expect(text.slice(idx, idx + pattern.length)).toBe(pattern)
        for (let j = 0; j < pattern.length; j++) {
          expect(text[idx + j]).toBe(pattern[j])
        }
      })

      // Verify canonical alias rabinKarp produces identical result
      expect(rabinKarp(text, pattern)).toEqual([0, 1, 2])

      // Verify re-export from rabinKarp.js entrypoint behaves identically
      expect(rabinKarpModule.rabinKarpSearch(text, pattern)).toEqual([0, 1, 2])
      expect(rabinKarpModule.rabinKarp(text, pattern)).toEqual([0, 1, 2])
    })

    it('returns exact rolling hash states and metadata for "aaaa" with "aa"', () => {
      const details = rabinKarpDetailed(text, pattern)

      expect(details.matches).toEqual([0, 1, 2])
      expect(details.text).toBe(text)
      expect(details.pattern).toBe(pattern)
      expect(details.prime).toBe(DEFAULT_PRIME)
      expect(details.base).toBe(DEFAULT_BASE)

      // Hash computation verification:
      // Pattern "aa": ('a' * 256 + 'a') % 101 = (97 * 256 + 97) % 101 = 24929 % 101 = 83
      const expectedHash = computeHash('aa', DEFAULT_PRIME, DEFAULT_BASE)
      expect(details.patternHash).toBe(expectedHash)
      expect(details.patternHash).toBe(83)

      // All 3 evaluated windows must have hash equal to patternHash and zero spurious hits
      expect(details.windows).toHaveLength(3)
      details.windows.forEach((win, idx) => {
        expect(win.index).toBe(idx)
        expect(win.windowStr).toBe('aa')
        expect(win.hash).toBe(expectedHash)
        expect(win.isHashMatch).toBe(true)
        expect(win.isRealMatch).toBe(true)
        expect(win.isSpurious).toBe(false)
      })

      expect(details.spuriousHits).toEqual([])
    })

    it('generates replay steps that faithfully track setup, windows, matches, and completion', () => {
      const steps = generateRabinKarpSteps(text, pattern)

      expect(steps.length).toBeGreaterThan(0)

      const stepTypes = new Set(steps.map((s) => s.type))
      expect(stepTypes.has('setup')).toBe(true)
      expect(stepTypes.has('compare')).toBe(true)
      expect(stepTypes.has('found')).toBe(true)
      expect(stepTypes.has('shift')).toBe(true)
      expect(stepTypes.has('complete')).toBe(true)

      // Verify all 3 found steps
      const foundSteps = steps.filter((s) => s.type === 'found')
      expect(foundSteps).toHaveLength(3)
      expect(foundSteps.map((s) => s.foundAt)).toEqual([0, 1, 2])
      expect(foundSteps.map((s) => s.at)).toEqual([0, 1, 2])

      // Verification of completion step
      const completeStep = steps[steps.length - 1]
      expect(completeStep.type).toBe('complete')
      expect(completeStep.variables.matches).toEqual([0, 1, 2])
      expect(completeStep.variables.totalMatches).toBe(3)
    })
  })

  describe('Explicit character-by-character candidate verification and collision rejection', () => {
    /**
     * HASH COLLISION TEST CASE EXPLANATION:
     * -------------------------------------
     * With BASE = 256 and PRIME = 101:
     * - "BH": (66 * 256 + 72) % 101 = 16968 % 101 = 0
     * - "DA": (68 * 256 + 65) % 101 = 17473 % 101 = 0
     * - "MT": (77 * 256 + 84) % 101 = 19796 % 101 = 0
     *
     * In text "BHDAMTZ" searching for pattern "BH":
     * - Window [0..1] is "BH", hash is 0 (Hash Match + Exact String Match -> REAL MATCH)
     * - Window [2..3] is "DA", hash is 0 (Hash Match + String Mismatch -> SPURIOUS HIT)
     * - Window [4..5] is "MT", hash is 0 (Hash Match + String Mismatch -> SPURIOUS HIT)
     *
     * A broken implementation that only compares hashes would return [0, 2, 4].
     * The character-by-character verification MUST reject indices 2 and 4!
     */
    it('rejects spurious hits when hash collision occurs under default prime (BASE=256, PRIME=101)', () => {
      // Confirm that the test strings indeed have colliding hashes
      const hashBH = computeHash('BH', DEFAULT_PRIME, DEFAULT_BASE)
      const hashDA = computeHash('DA', DEFAULT_PRIME, DEFAULT_BASE)
      const hashMT = computeHash('MT', DEFAULT_PRIME, DEFAULT_BASE)

      expect(hashBH).toBe(0)
      expect(hashDA).toBe(0)
      expect(hashMT).toBe(0)
      expect(hashBH).toBe(hashDA)
      expect(hashBH).toBe(hashMT)

      const text = 'BHDAMTZ'
      const pattern = 'BH'

      const matches = rabinKarpSearch(text, pattern)

      // Must return strictly [0] and reject indices 2 and 4
      expect(matches).toEqual([0])
      expect(matches).toHaveLength(1)
      expect(matches).not.toContain(2)
      expect(matches).not.toContain(4)
      expect(matches).not.toEqual([0, 2, 4])
    })

    it('accurately categorizes spurious hits in rabinKarpDetailed metadata', () => {
      const text = 'BHDAMTZ'
      const pattern = 'BH'

      const details = rabinKarpDetailed(text, pattern)

      expect(details.matches).toEqual([0])
      expect(details.patternHash).toBe(0)
      expect(details.spuriousHits).toEqual([2, 4])

      // Check window at index 0: Real match
      const win0 = details.windows.find((w) => w.index === 0)
      expect(win0.windowStr).toBe('BH')
      expect(win0.hash).toBe(0)
      expect(win0.isHashMatch).toBe(true)
      expect(win0.isRealMatch).toBe(true)
      expect(win0.isSpurious).toBe(false)

      // Check window at index 2: Spurious hit (hash match, real mismatch)
      const win2 = details.windows.find((w) => w.index === 2)
      expect(win2.windowStr).toBe('DA')
      expect(win2.hash).toBe(0)
      expect(win2.isHashMatch).toBe(true)
      expect(win2.isRealMatch).toBe(false)
      expect(win2.isSpurious).toBe(true)

      // Check window at index 4: Spurious hit (hash match, real mismatch)
      const win4 = details.windows.find((w) => w.index === 4)
      expect(win4.windowStr).toBe('MT')
      expect(win4.hash).toBe(0)
      expect(win4.isHashMatch).toBe(true)
      expect(win4.isRealMatch).toBe(false)
      expect(win4.isSpurious).toBe(true)
    })

    it('emits spurious replay steps with descriptive collision messages during animation', () => {
      const text = 'BHDAMTZ'
      const pattern = 'BH'

      const steps = generateRabinKarpSteps(text, pattern)
      const spuriousSteps = steps.filter((s) => s.type === 'spurious')

      expect(spuriousSteps).toHaveLength(2)
      expect(spuriousSteps[0].windowIndex).toBe(2)
      expect(spuriousSteps[0].message).toContain('collision')
      expect(spuriousSteps[0].message).toContain('rejected')
      expect(spuriousSteps[1].windowIndex).toBe(4)
      expect(spuriousSteps[1].message).toContain('collision')
    })

    it('correctly rejects spurious hits under custom small prime/modulus (prime = 3)', () => {
      // With prime = 3, virtually all windows collide with the pattern modulo 3.
      // Candidate verification MUST reject all non-matching substrings.
      const text = 'ABCDEFGHIJKL'
      const pattern = 'DEF'

      const matches = rabinKarpSearch(text, pattern, { prime: 3 })
      expect(matches).toEqual([3])
      expect(matches).toHaveLength(1)
      expect(text.slice(3, 6)).toBe('DEF')

      const details = rabinKarpDetailed(text, pattern, { prime: 3 })
      expect(details.matches).toEqual([3])
      expect(details.spuriousHits.length).toBeGreaterThan(0)
      expect(details.spuriousHits).not.toContain(3)
    })

    it('detects character-by-character mismatch when candidate differs only at the final character', () => {
      // Text "ABCE", Pattern "ABCD" (same prefix, differing final character)
      const text = 'ABCE'
      const pattern = 'ABCD'

      const matches = rabinKarpSearch(text, pattern)
      expect(matches).toEqual([])
      expect(matches).toHaveLength(0)

      const details = rabinKarpDetailed(text, pattern)
      expect(details.matches).toEqual([])
    })

    it('detects character-by-character mismatch when candidate differs only at the first character', () => {
      // Text "EBCD", Pattern "ABCD" (differing first character)
      const text = 'EBCD'
      const pattern = 'ABCD'

      const matches = rabinKarpSearch(text, pattern)
      expect(matches).toEqual([])
    })
  })

  describe('Comparison against independent reference implementation', () => {
    const testCases = [
      { text: 'aaaa', pattern: 'aa' },
      { text: 'aaaaa', pattern: 'a' },
      { text: 'aaaaa', pattern: 'aaa' },
      { text: 'aaaaa', pattern: 'aaaaa' },
      { text: 'ABABABA', pattern: 'ABA' },
      { text: 'ABCCDABCDABDC', pattern: 'ABCD' },
      { text: 'BANANA', pattern: 'A' },
      { text: 'BANANA', pattern: 'AN' },
      { text: 'BANANA', pattern: 'NA' },
      { text: 'BANANA', pattern: 'BANANA' },
      { text: 'CATCATCAT', pattern: 'CAT' },
      { text: 'ABCDEF', pattern: 'XYZ' },
      { text: 'PREFIX_TEST', pattern: 'PREFIX' },
      { text: 'TEST_SUFFIX', pattern: 'SUFFIX' },
      { text: 'GCATCGATCGATCGATC', pattern: 'ATCG' },
      { text: '12345 67890 12345', pattern: '12345' },
      { text: 'Hello, World! Hello, Vitest!', pattern: 'Hello' },
    ]

    testCases.forEach(({ text, pattern }) => {
      it(`matches referenceSearch for text="${text}" and pattern="${pattern}"`, () => {
        const expected = referenceSearch(text, pattern)
        const actual = rabinKarpSearch(text, pattern)

        expect(actual).toEqual(expected)

        // Verify each returned index contains the exact pattern
        actual.forEach((idx) => {
          expect(text.slice(idx, idx + pattern.length)).toBe(pattern)
        })
      })
    })

    it('matches referenceSearch across various modulus primes (101, 10007, 31, 13)', () => {
      const text = 'AABAACAADAABAABA'
      const pattern = 'AABA'
      const expected = referenceSearch(text, pattern)

      const primes = [101, 10007, 31, 13]
      primes.forEach((prime) => {
        const actual = rabinKarpSearch(text, pattern, { prime })
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('Empty-pattern, degenerate, and edge-case policies', () => {
    /**
     * EMPTY-PATTERN POLICY:
     * - An empty pattern "" cannot form a comparison window.
     * - Searching for "" returns [] to avoid undefined bounds or infinite advance.
     * - generateRabinKarpSteps with "" returns [].
     */
    it('returns empty matches [] and empty steps [] when pattern is empty ""', () => {
      expect(rabinKarpSearch('aaaa', '')).toEqual([])
      expect(rabinKarpSearch('', '')).toEqual([])
      expect(generateRabinKarpSteps('aaaa', '')).toEqual([])
      expect(generateRabinKarpSteps('', '')).toEqual([])

      const details = rabinKarpDetailed('aaaa', '')
      expect(details.matches).toEqual([])
      expect(details.patternHash).toBe(0)
    })

    it('returns empty matches [] when text is empty but pattern is non-empty', () => {
      expect(rabinKarpSearch('', 'aa')).toEqual([])
      expect(generateRabinKarpSteps('', 'aa')).toEqual([])
    })

    it('safely handles null, undefined, and non-string inputs without throwing', () => {
      expect(rabinKarpSearch(null, 'aa')).toEqual([])
      expect(rabinKarpSearch('aaaa', null)).toEqual([])
      expect(rabinKarpSearch(undefined, undefined)).toEqual([])
      expect(rabinKarpSearch(12345, '12')).toEqual([])
      expect(rabinKarpSearch('aaaa', 12)).toEqual([])

      expect(generateRabinKarpSteps(null, 'aa')).toEqual([])
      expect(generateRabinKarpSteps('aaaa', null)).toEqual([])

      expect(computeHash(null)).toBe(0)
      expect(computeHash(undefined)).toBe(0)
      expect(computeHash(123)).toBe(0)
    })

    it('handles pattern longer than text cleanly', () => {
      const matches = rabinKarpSearch('aa', 'aaaa')
      expect(matches).toEqual([])

      const steps = generateRabinKarpSteps('aa', 'aaaa')
      expect(steps).toHaveLength(1)
      expect(steps[0].type).toBe('complete')
      expect(steps[0].message).toContain('greater than text length')
    })
  })

  describe('Source code strings, line maps, and helpers', () => {
    it('provides multi-language source implementations with valid line maps', () => {
      expect(rabinKarpSources.javascript.code).toContain('function rabinKarp')
      expect(rabinKarpSources.python.code).toContain('def rabin_karp')
      expect(rabinKarpSources.cpp.code).toContain('vector<int> rabinKarp')
      expect(rabinKarpSources.java.code).toContain('public class RabinKarp')

      const jsSource = getRabinKarpSource('javascript')
      expect(jsSource.code).toBeDefined()
      expect(jsSource.lineMap).toBeDefined()
      expect(typeof jsSource.lineMap.setup).toBe('number')
      expect(typeof jsSource.lineMap.windowLoop).toBe('number')
      expect(typeof jsSource.lineMap.hashMatch).toBe('number')
      expect(typeof jsSource.lineMap.verifyMatch).toBe('number')
      expect(typeof jsSource.lineMap.found).toBe('number')
      expect(typeof jsSource.lineMap.rollingHash).toBe('number')
      expect(typeof jsSource.lineMap.complete).toBe('number')

      const hashMatchLine = resolveRabinKarpLine('javascript', 'hashMatch')
      expect(typeof hashMatchLine).toBe('number')
      expect(hashMatchLine).toBeGreaterThan(0)

      expect(resolveRabinKarpLine('javascript', null)).toBeUndefined()
      expect(resolveRabinKarpLine('javascript', 'nonExistentKey')).toBeUndefined()
    })
  })
})
