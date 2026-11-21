import { createStep } from '../../lib/utils'

/**
 * ============================================================================
 * BOYER-MOORE STRING SEARCH MODULE
 * ============================================================================
 * This module maintains a strict architectural separation between:
 * 1. Source Strings: Multi-language reference implementations and line maps.
 * 2. Pure Algorithm Results: Deterministic search and precomputation tables
 *    independent of any rendering context.
 * 3. Replay Steps: Normalized step-by-step execution frames for visual replay.
 * 4. UI Components: Pure algorithmic code; zero React UI / DOM dependencies.
 *
 * ----------------------------------------------------------------------------
 * EMPTY-PATTERN POLICY:
 * ----------------------------------------------------------------------------
 * An empty pattern ("") contains no characters to compare right-to-left.
 * Under this specification:
 * - Pure search `boyerMooreSearch(text, "")` returns an empty array: []
 * - Step generator `generateBoyerMooreSteps(text, "")` returns an empty array: []
 * - Degenerate/non-string inputs (null, undefined, non-strings) return: []
 * This prevents infinite 0-advance loops and preserves standard search semantics.
 * ============================================================================
 */

// ─── 1. SOURCE STRINGS & LINE MAPS ──────────────────────────────────────────

export const boyerMooreSources = {
  javascript: {
    code: `function buildBadCharTable(pattern) {
  const table = {}
  for (let i = 0; i < pattern.length; i++) {
    table[pattern[i]] = i
  }
  return table
}

function buildGoodSuffixTable(pattern) {
  const m = pattern.length
  const suff = new Array(m).fill(0)
  suff[m - 1] = m
  for (let i = m - 2; i >= 0; i--) {
    let len = 0
    while (len <= i && pattern[i - len] === pattern[m - 1 - len]) len++
    suff[i] = len
  }
  const goodSuffix = new Array(m).fill(m)
  let j = 0
  for (let i = m - 1; i >= 0; i--) {
    if (suff[i] === i + 1) {
      for (; j < m - 1 - i; j++) {
        if (goodSuffix[j] === m) goodSuffix[j] = m - 1 - i
      }
    }
  }
  for (let i = 0; i <= m - 2; i++) {
    goodSuffix[m - 1 - suff[i]] = m - 1 - i
  }
  return goodSuffix
}

function boyerMooreSearch(text, pattern) {
  if (!text || !pattern) return []
  const n = text.length, m = pattern.length
  if (m === 0 || n === 0 || m > n) return []
  const badChar = buildBadCharTable(pattern)
  const goodSuffix = buildGoodSuffixTable(pattern)
  const matches = []
  let s = 0
  while (s <= n - m) {
    let j = m - 1
    while (j >= 0 && pattern[j] === text[s + j]) j--
    if (j < 0) {
      matches.push(s)
      s += goodSuffix[0]
    } else {
      const bcShift = Math.max(1, j - (badChar[text[s + j]] ?? -1))
      const gsShift = goodSuffix[j]
      s += Math.max(bcShift, gsShift)
    }
  }
  return matches
}`,
    lineMap: {
      function: 31,
      setup: 35,
      loop: 38,
      compare: 40,
      found: 42,
      mismatch: 45,
      shift: 47,
      complete: 50,
    },
  },
  python: {
    code: `def build_bad_char(pattern):
    table = {}
    for i, ch in enumerate(pattern):
        table[ch] = i
    return table

def build_good_suffix(pattern):
    m = len(pattern)
    suff = [0] * m
    suff[m - 1] = m
    for i in range(m - 2, -1, -1):
        l = 0
        while l <= i and pattern[i - l] == pattern[m - 1 - l]:
            l += 1
        suff[i] = l
    gs = [m] * m
    j = 0
    for i in range(m - 1, -1, -1):
        if suff[i] == i + 1:
            while j < m - 1 - i:
                if gs[j] == m:
                    gs[j] = m - 1 - i
                j += 1
    for i in range(m - 1):
        gs[m - 1 - suff[i]] = m - 1 - i
    return gs

def boyer_moore_search(text, pattern):
    if not text or not pattern:
        return []
    n, m = len(text), len(pattern)
    if m == 0 or n == 0 or m > n:
        return []
    bad_char = build_bad_char(pattern)
    good_suffix = build_good_suffix(pattern)
    matches = []
    s = 0
    while s <= n - m:
        j = m - 1
        while j >= 0 and pattern[j] == text[s + j]:
            j -= 1
        if j < 0:
            matches.append(s)
            s += good_suffix[0]
        else:
            bc_shift = max(1, j - bad_char.get(text[s + j], -1))
            gs_shift = good_suffix[j]
            s += max(bc_shift, gs_shift)
    return matches`,
    lineMap: {
      function: 28,
      setup: 34,
      loop: 37,
      compare: 39,
      found: 42,
      mismatch: 45,
      shift: 47,
      complete: 48,
    },
  },
  cpp: {
    code: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

vector<int> boyerMooreSearch(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    if (m == 0 || n == 0 || m > n) return {};

    unordered_map<char, int> badChar;
    for (int i = 0; i < m; i++) badChar[pattern[i]] = i;

    vector<int> suff(m, 0);
    suff[m - 1] = m;
    for (int i = m - 2; i >= 0; i--) {
        int len = 0;
        while (len <= i && pattern[i - len] == pattern[m - 1 - len]) len++;
        suff[i] = len;
    }

    vector<int> goodSuffix(m, m);
    int j = 0;
    for (int i = m - 1; i >= 0; i--) {
        if (suff[i] == i + 1) {
            for (; j < m - 1 - i; j++) {
                if (goodSuffix[j] == m) goodSuffix[j] = m - 1 - i;
            }
        }
    }
    for (int i = 0; i <= m - 2; i++) {
        goodSuffix[m - 1 - suff[i]] = m - 1 - i;
    }

    vector<int> matches;
    int s = 0;
    while (s <= n - m) {
        int k = m - 1;
        while (k >= 0 && pattern[k] == text[s + k]) k--;
        if (k < 0) {
            matches.push_back(s);
            s += goodSuffix[0];
        } else {
            int bc = badChar.count(text[s + k]) ? badChar[text[s + k]] : -1;
            int bcShift = max(1, k - bc);
            int gsShift = goodSuffix[k];
            s += max(bcShift, gsShift);
        }
    }
    return matches;
}`,
    lineMap: {
      function: 8,
      setup: 12,
      loop: 37,
      compare: 39,
      found: 41,
      mismatch: 44,
      shift: 47,
      complete: 50,
    },
  },
  java: {
    code: `import java.util.*;

public class BoyerMoore {
    public static List<Integer> search(String text, String pattern) {
        List<Integer> matches = new ArrayList<>();
        if (text == null || pattern == null) return matches;
        int n = text.length(), m = pattern.length();
        if (m == 0 || n == 0 || m > n) return matches;

        Map<Character, Integer> badChar = new HashMap<>();
        for (int i = 0; i < m; i++) badChar.put(pattern.charAt(i), i);

        int[] suff = new int[m];
        suff[m - 1] = m;
        for (int i = m - 2; i >= 0; i--) {
            int len = 0;
            while (len <= i && pattern.charAt(i - len) == pattern.charAt(m - 1 - len)) len++;
            suff[i] = len;
        }

        int[] goodSuffix = new int[m];
        Arrays.fill(goodSuffix, m);
        int j = 0;
        for (int i = m - 1; i >= 0; i--) {
            if (suff[i] == i + 1) {
                for (; j < m - 1 - i; j++) {
                    if (goodSuffix[j] == m) goodSuffix[j] = m - 1 - i;
                }
            }
        }
        for (int i = 0; i <= m - 2; i++) {
            goodSuffix[m - 1 - suff[i]] = m - 1 - i;
        }

        int s = 0;
        while (s <= n - m) {
            int k = m - 1;
            while (k >= 0 && pattern.charAt(k) == text.charAt(s + k)) k--;
            if (k < 0) {
                matches.add(s);
                s += goodSuffix[0];
            } else {
                int bc = badChar.getOrDefault(text.charAt(s + k), -1);
                int bcShift = Math.max(1, k - bc);
                int gsShift = goodSuffix[k];
                s += Math.max(bcShift, gsShift);
            }
        }
        return matches;
    }
}`,
    lineMap: {
      function: 4,
      setup: 9,
      loop: 34,
      compare: 36,
      found: 38,
      mismatch: 41,
      shift: 44,
      complete: 47,
    },
  },
}

export function getBoyerMooreSource(language = 'javascript') {
  const lang = language.toLowerCase()
  return boyerMooreSources[lang] ?? boyerMooreSources.javascript
}

export function resolveBoyerMooreLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getBoyerMooreSource(language)
  return (
    source.lineMap[lineKey] ?? boyerMooreSources.javascript.lineMap[lineKey]
  )
}

// ─── 2. PURE ALGORITHM (TABLES & SEARCH RESULTS) ────────────────────────────

/**
 * Builds the Bad Character heuristic table for Boyer-Moore.
 * Maps each character present in the pattern to its rightmost index.
 *
 * @param {string} pattern - Search pattern
 * @returns {Record<string, number>} Bad character occurrence map
 */
export function buildBadCharTable(pattern) {
  if (typeof pattern !== 'string') return {}
  const table = {}
  for (let i = 0; i < pattern.length; i++) {
    table[pattern[i]] = i
  }
  return table
}

/**
 * Builds the Good Suffix heuristic table for Boyer-Moore.
 *
 * @param {string} pattern - Search pattern
 * @returns {number[]} Array of shift amounts indexed by pattern position
 */
export function buildGoodSuffixTable(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0) return []
  const m = pattern.length
  const suff = new Array(m).fill(0)
  suff[m - 1] = m

  for (let i = m - 2; i >= 0; i--) {
    let len = 0
    while (len <= i && pattern[i - len] === pattern[m - 1 - len]) {
      len++
    }
    suff[i] = len
  }

  const goodSuffix = new Array(m).fill(m)
  let j = 0
  for (let i = m - 1; i >= 0; i--) {
    if (suff[i] === i + 1) {
      for (; j < m - 1 - i; j++) {
        if (goodSuffix[j] === m) {
          goodSuffix[j] = m - 1 - i
        }
      }
    }
  }

  for (let i = 0; i <= m - 2; i++) {
    goodSuffix[m - 1 - suff[i]] = m - 1 - i
  }

  return goodSuffix
}

/**
 * Pure Boyer-Moore string search.
 * Returns an array of starting match indices in text.
 *
 * @param {string} text - The input text to search within
 * @param {string} pattern - The pattern to find
 * @returns {number[]} Array of zero-based start indices where pattern matches
 */
export function boyerMooreSearch(text, pattern) {
  // Empty-pattern & input validation policy
  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0
  ) {
    return []
  }

  const n = text.length
  const m = pattern.length
  if (m > n) return []

  const badChar = buildBadCharTable(pattern)
  const goodSuffix = buildGoodSuffixTable(pattern)
  const matches = []

  let s = 0
  while (s <= n - m) {
    let j = m - 1
    while (j >= 0 && pattern[j] === text[s + j]) {
      j--
    }

    if (j < 0) {
      matches.push(s)
      s += goodSuffix[0]
    } else {
      const bcLast = badChar[text[s + j]] ?? -1
      const bcShift = Math.max(1, j - bcLast)
      const gsShift = goodSuffix[j]
      s += Math.max(bcShift, gsShift)
    }
  }

  return matches
}

/**
 * Alias for boyerMooreSearch for backward/shorthand compatibility.
 */
export const boyerMoore = boyerMooreSearch

/**
 * Executes Boyer-Moore and returns full pure algorithmic metadata
 * without generating UI replay steps.
 *
 * @param {string} text
 * @param {string} pattern
 * @returns {{
 *   matches: number[],
 *   badCharTable: Record<string, number>,
 *   goodSuffixTable: number[],
 *   text: string,
 *   pattern: string
 * }}
 */
export function boyerMooreDetailed(text, pattern) {
  const matches = boyerMooreSearch(text, pattern)
  const badCharTable = buildBadCharTable(pattern)
  const goodSuffixTable = buildGoodSuffixTable(pattern)
  return {
    matches,
    badCharTable,
    goodSuffixTable,
    text: typeof text === 'string' ? text : '',
    pattern: typeof pattern === 'string' ? pattern : '',
  }
}

// ─── 3. REPLAY STEPS (ANIMATION & VISUALIZATION FRAMES) ──────────────────────

/**
 * Generates standardized replay steps for visualizing Boyer-Moore execution.
 *
 * @param {string} text - Search text
 * @param {string} pattern - Search pattern
 * @returns {Array<Object>} Array of standardized step objects
 */
export function generateBoyerMooreSteps(text, pattern) {
  // Empty-pattern policy:
  // If pattern or text is empty/invalid, return empty replay steps array
  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0
  ) {
    return []
  }

  const n = text.length
  const m = pattern.length
  if (m > n) {
    return [
      createStep({
        lineKey: 'complete',
        type: 'complete',
        message: `Pattern length (${m}) is greater than text length (${n}). No matches possible.`,
        variables: { text, pattern, shift: 0, matches: [] },
        indices: [],
        matches: [],
        foundMatches: [],
        duration: 800,
      }),
    ]
  }

  const badChar = buildBadCharTable(pattern)
  const goodSuffix = buildGoodSuffixTable(pattern)
  const steps = []
  const matches = []

  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      message: `Precomputed tables for pattern "${pattern}". Bad Character Table: ${JSON.stringify(badChar)}, Good Suffix Table: [${goodSuffix.join(', ')}].`,
      variables: {
        text,
        pattern,
        badChar,
        goodSuffix,
        matches: [],
      },
      indices: [],
      matches: [],
      foundMatches: [],
      duration: 650,
    })
  )

  let s = 0
  while (s <= n - m) {
    steps.push(
      createStep({
        lineKey: 'loop',
        type: 'loop',
        message: `Aligning pattern at text shift index ${s} (window: "${text.slice(s, s + m)}").`,
        variables: {
          shift: s,
          textIndex: s,
          patternIndex: m - 1,
          matches: [...matches],
        },
        indices: [s, s + m - 1],
        shift: s,
        matches: [...matches],
        foundMatches: [...matches],
        duration: 500,
      })
    )

    let j = m - 1
    let mismatchOccurred = false

    while (j >= 0) {
      const textIndex = s + j
      const patternChar = pattern[j]
      const textChar = text[textIndex]
      const isMatch = patternChar === textChar

      steps.push(
        createStep({
          lineKey: 'compare',
          type: 'compare',
          message: `Comparing text[${textIndex}] ('${textChar}') with pattern[${j}] ('${patternChar}') from right to left.`,
          variables: {
            shift: s,
            textIndex,
            patternIndex: j,
            textChar,
            patternChar,
            match: isMatch,
            matches: [...matches],
          },
          indices: [textIndex, j],
          shift: s,
          textIndex,
          patternIndex: j,
          match: isMatch,
          matches: [...matches],
          foundMatches: [...matches],
          duration: 700,
        })
      )

      if (!isMatch) {
        mismatchOccurred = true
        const bcLast = badChar[textChar] ?? -1
        const bcShift = Math.max(1, j - bcLast)
        const gsShift = goodSuffix[j]
        const actualShift = Math.max(bcShift, gsShift)

        steps.push(
          createStep({
            lineKey: 'mismatch',
            type: 'mismatch',
            message: `Mismatch: text[${textIndex}] ('${textChar}') != pattern[${j}] ('${patternChar}'). Bad-char shift = ${bcShift}, Good-suffix shift = ${gsShift}. Taking max shift: ${actualShift}.`,
            variables: {
              shift: s,
              textIndex,
              patternIndex: j,
              mismatchedChar: textChar,
              badCharLastOccurrence: bcLast,
              badCharShift: bcShift,
              goodSuffixShift: gsShift,
              actualShift,
              nextShift: s + actualShift,
              matches: [...matches],
            },
            indices: [textIndex, j],
            shift: s,
            textIndex,
            patternIndex: j,
            match: false,
            badCharShift: bcShift,
            goodSuffixShift: gsShift,
            actualShift,
            matches: [...matches],
            foundMatches: [...matches],
            duration: 800,
          })
        )

        s += actualShift
        break
      }

      j--
    }

    if (!mismatchOccurred) {
      matches.push(s)
      const nextShiftDelta = goodSuffix[0]

      steps.push(
        createStep({
          lineKey: 'found',
          type: 'found',
          foundAt: s,
          at: s,
          message: `Match found at text index ${s}! Advancing pattern by good-suffix shift: ${nextShiftDelta}.`,
          variables: {
            shift: s,
            foundAt: s,
            nextShift: s + nextShiftDelta,
            matches: [...matches],
          },
          indices: [s, s + m - 1],
          shift: s,
          matches: [...matches],
          foundMatches: [...matches],
          duration: 1000,
        })
      )

      s += nextShiftDelta
    }
  }

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      message:
        matches.length > 0
          ? `Search complete. Found ${matches.length} match(es) at index(es): [${matches.join(', ')}].`
          : 'Search complete. Pattern not found in text.',
      variables: {
        matches: [...matches],
        totalMatches: matches.length,
      },
      indices: [],
      matches: [...matches],
      foundMatches: [...matches],
      duration: 900,
    })
  )

  return steps
}
