import { createStep } from '../../lib/utils'

/**
 * ============================================================================
 * MANACHER'S LONGEST PALINDROMIC SUBSTRING MODULE
 * ============================================================================
 * Architectural separation:
 * 1. Source Strings: Multi-language reference implementations and line maps.
 * 2. Pure Algorithm Results: Deterministic O(n) Manacher computation returning
 *    longest palindrome substrings, radii array P, indices, and metadata,
 *    independent of any rendering context.
 * 3. Replay Steps: Standardized visualizer step snapshots for stepping forward,
 *    backward, and tracking center, mirror, right-boundary, and radii changes.
 * 4. UI Components: Pure algorithmic module with zero React UI / DOM dependencies.
 *
 * ----------------------------------------------------------------------------
 * TIE-BREAKING POLICY:
 * ----------------------------------------------------------------------------
 * When multiple palindromic substrings achieve the maximum length (e.g. "babad"
 * which contains both "bab" at start 0 and "aba" at start 1):
 * - Default: 'first' (first-encountered / earliest start index in text).
 *   Updates the best record only when p[i] > maxLen (strictly greater).
 * - Declared option: 'last' (last-encountered / latest start index in text).
 *   Updates the best record when p[i] >= maxLen (greater than or equal).
 *
 * ----------------------------------------------------------------------------
 * EMPTY & SINGLE-CHARACTER INPUT POLICY:
 * ----------------------------------------------------------------------------
 * - Empty string ("") returns an empty string "" and empty replay steps [].
 * - Non-string / null / undefined inputs return "" and empty replay steps [].
 * - Single-character strings ("a") return that single character "a" with length 1.
 * ============================================================================
 */

// ─── 1. SOURCE STRINGS & LINE MAPS ──────────────────────────────────────────

export const manacherSources = {
  javascript: {
    code: `function manacher(s) {
  if (!s || s.length === 0) return ''
  const t = '^#' + s.split('').join('#') + '#$'
  const n = t.length
  const p = new Array(n).fill(0)
  let c = 0, r = 0
  let maxLen = 0, centerIndex = 0

  for (let i = 1; i < n - 1; i++) {
    const iMirror = 2 * c - i
    if (i < r) {
      p[i] = Math.min(r - i, p[iMirror])
    }
    while (t[i + 1 + p[i]] === t[i - 1 - p[i]]) {
      p[i]++
    }
    if (i + p[i] > r) {
      c = i
      r = i + p[i]
    }
    if (p[i] > maxLen) {
      maxLen = p[i]
      centerIndex = i
    }
  }

  const start = Math.floor((centerIndex - maxLen - 1) / 2)
  return s.slice(start, start + maxLen)
}`,
    lineMap: {
      function: 1,
      edgeCase: 2,
      transform: 3,
      setup: 5,
      loop: 9,
      mirror: 12,
      expand: 14,
      boundary: 18,
      recordMax: 22,
      extract: 27,
      complete: 28,
    },
  },

  python: {
    code: `def manacher(s: str) -> str:
    if not s:
        return ""
    t = "^#" + "#".join(s) + "#$"
    n = len(t)
    p = [0] * n
    c, r = 0, 0
    max_len, center_idx = 0, 0

    for i in range(1, n - 1):
        i_mirror = 2 * c - i
        if i < r:
            p[i] = min(r - i, p[i_mirror])
        while t[i + 1 + p[i]] == t[i - 1 - p[i]]:
            p[i] += 1
        if i + p[i] > r:
            c = i
            r = i + p[i]
        if p[i] > max_len:
            max_len = p[i]
            center_idx = i

    start = (center_idx - max_len - 1) // 2
    return s[start:start + max_len]`,
    lineMap: {
      function: 1,
      edgeCase: 2,
      transform: 4,
      setup: 6,
      loop: 10,
      mirror: 13,
      expand: 14,
      boundary: 17,
      recordMax: 20,
      extract: 23,
      complete: 24,
    },
  },

  cpp: {
    code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

string manacher(const string& s) {
    if (s.empty()) return "";
    string t = "^#";
    for (char ch : s) {
        t += ch;
        t += '#';
    }
    t += '$';

    int n = t.size();
    vector<int> p(n, 0);
    int c = 0, r = 0;
    int maxLen = 0, centerIdx = 0;

    for (int i = 1; i < n - 1; i++) {
        int iMirror = 2 * c - i;
        if (i < r) p[i] = min(r - i, p[iMirror]);
        while (t[i + 1 + p[i]] == t[i - 1 - p[i]]) p[i]++;
        if (i + p[i] > r) {
            c = i;
            r = i + p[i];
        }
        if (p[i] > maxLen) {
            maxLen = p[i];
            centerIdx = i;
        }
    }

    int start = (centerIdx - maxLen - 1) / 2;
    return s.substr(start, maxLen);
}`,
    lineMap: {
      function: 7,
      edgeCase: 8,
      transform: 9,
      setup: 17,
      loop: 21,
      mirror: 23,
      expand: 24,
      boundary: 26,
      recordMax: 30,
      extract: 35,
      complete: 36,
    },
  },

  java: {
    code: `public class Manacher {
    public static String longestPalindrome(String s) {
        if (s == null || s.length() == 0) return "";
        StringBuilder sb = new StringBuilder("^#");
        for (int i = 0; i < s.length(); i++) {
            sb.append(s.charAt(i)).append('#');
        }
        sb.append('$');
        String t = sb.toString();

        int n = t.length();
        int[] p = new int[n];
        int c = 0, r = 0;
        int maxLen = 0, centerIdx = 0;

        for (int i = 1; i < n - 1; i++) {
            int iMirror = 2 * c - i;
            if (i < r) p[i] = Math.min(r - i, p[iMirror]);
            while (t.charAt(i + 1 + p[i]) == t.charAt(i - 1 - p[i])) p[i]++;
            if (i + p[i] > r) {
                c = i;
                r = i + p[i];
            }
            if (p[i] > maxLen) {
                maxLen = p[i];
                centerIdx = i;
            }
        }

        int start = (centerIdx - maxLen - 1) / 2;
        return s.substring(start, start + maxLen);
    }
}`,
    lineMap: {
      class: 1,
      function: 2,
      edgeCase: 3,
      transform: 4,
      setup: 12,
      loop: 16,
      mirror: 18,
      expand: 19,
      boundary: 21,
      recordMax: 25,
      extract: 30,
      complete: 31,
    },
  },
}

/**
 * Returns the source code definition and line map for a specified language.
 *
 * @param {'javascript'|'python'|'cpp'|'java'} [language='javascript']
 * @returns {{ code: string, lineMap: Record<string, number> }}
 */
export function getManacherSource(language = 'javascript') {
  return manacherSources[language] || manacherSources.javascript
}

/**
 * Resolves the 1-based line number for a logical step key in the specified language.
 *
 * @param {'javascript'|'python'|'cpp'|'java'} language
 * @param {string} lineKey
 * @returns {number|undefined}
 */
export function resolveManacherLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getManacherSource(language)
  return source?.lineMap?.[lineKey]
}

// ─── 2. PURE ALGORITHM FUNCTIONS ────────────────────────────────────────────

/**
 * Transforms an input string by inserting boundary sentinels ('^' and '$')
 * and delimiter symbols ('#') between all adjacent characters.
 *
 * Example: "abba" -> "^#a#b#b#a#$"
 *
 * @param {string} s - Original input string
 * @returns {string} Transformed string
 */
export function transformString(s) {
  if (typeof s !== 'string' || s.length === 0) return '^$'
  return '^#' + s.split('').join('#') + '#$'
}

/**
 * Executes Manacher's algorithm and returns full algorithmic metadata
 * without generating replay steps.
 *
 * @param {string} s - Input string
 * @param {Object} [options] - Optional settings
 * @param {'first'|'last'} [options.tieBreak='first'] - Tie-breaking rule for multiple longest palindromes
 * @returns {{
 *   longestPalindrome: string,
 *   start: number,
 *   end: number,
 *   length: number,
 *   center: number,
 *   radius: number,
 *   transformed: string,
 *   p: number[],
 *   allPalindromes: Array<{ palindrome: string, start: number, end: number, length: number, center: number, radius: number }>,
 *   source: string,
 *   tieBreak: 'first'|'last'
 * }}
 */
export function manacherDetailed(s, options = {}) {
  const tieBreak = options?.tieBreak === 'last' ? 'last' : 'first'

  if (typeof s !== 'string' || s.length === 0) {
    return {
      longestPalindrome: '',
      start: 0,
      end: 0,
      length: 0,
      center: -1,
      radius: 0,
      transformed: '^$',
      p: [0, 0],
      allPalindromes: [],
      source: typeof s === 'string' ? s : '',
      tieBreak,
    }
  }

  const t = transformString(s)
  const n = t.length
  const p = new Array(n).fill(0)
  let c = 0
  let r = 0

  let maxLen = 0
  let maxCenter = -1
  const allPalindromes = []

  for (let i = 1; i < n - 1; i++) {
    const iMirror = 2 * c - i

    if (i < r) {
      p[i] = Math.min(r - i, p[iMirror])
    } else {
      p[i] = 0
    }

    while (t[i + 1 + p[i]] === t[i - 1 - p[i]]) {
      p[i]++
    }

    if (i + p[i] > r) {
      c = i
      r = i + p[i]
    }

    if (p[i] > 0) {
      const palStart = Math.floor((i - p[i] - 1) / 2)
      const palLen = p[i]
      const palindrome = s.slice(palStart, palStart + palLen)
      allPalindromes.push({
        palindrome,
        start: palStart,
        end: palStart + palLen,
        length: palLen,
        center: i,
        radius: p[i],
      })
    }

    const shouldUpdate =
      tieBreak === 'last' ? p[i] >= maxLen : p[i] > maxLen

    if (shouldUpdate) {
      maxLen = p[i]
      maxCenter = i
    }
  }

  const start = maxCenter >= 0 ? Math.floor((maxCenter - maxLen - 1) / 2) : 0
  const longestPalindromeStr = s.slice(start, start + maxLen)

  return {
    longestPalindrome: longestPalindromeStr,
    start,
    end: start + maxLen,
    length: maxLen,
    center: maxCenter,
    radius: maxLen,
    transformed: t,
    p,
    allPalindromes,
    source: s,
    tieBreak,
  }
}

/**
 * Pure Manacher's algorithm for longest palindromic substring.
 *
 * @param {string} s - Input string
 * @param {Object} [options] - Configuration options
 * @param {'first'|'last'} [options.tieBreak='first'] - Tie-breaking rule ('first' or 'last')
 * @returns {string} The longest palindromic substring
 */
export function manacher(s, options = {}) {
  return manacherDetailed(s, options).longestPalindrome
}

/**
 * Canonical alias for manacher.
 */
export const longestPalindrome = manacher

// ─── 3. REPLAY STEPS (VISUALIZATION FRAMES) ──────────────────────────────────

/**
 * Generates standardized replay steps for visualizer replay.
 *
 * @param {string} s - Input string
 * @param {Object} [options] - Options (tieBreak: 'first' | 'last')
 * @returns {Array<Object>} Array of replay steps
 */
export function generateManacherSteps(s, options = {}) {
  const tieBreak = options?.tieBreak === 'last' ? 'last' : 'first'

  if (typeof s !== 'string' || s.length === 0) {
    return []
  }

  const steps = []
  const t = transformString(s)
  const n = t.length
  const p = new Array(n).fill(0)
  let c = 0
  let r = 0

  let maxLen = 0
  let maxCenter = -1
  const tChars = t.split('')

  // Step: Setup
  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      array: tChars,
      indices: [0],
      message: `Preprocessed string into "${t}". Sentinels '^' and '$' bound the search; '#' enables uniform treatment of odd and even palindromes.`,
      variables: {
        i: 0,
        c: 0,
        r: 0,
        p: [...p],
        source: s,
        transformed: t,
        maxLen: 0,
        longestPalindrome: '',
      },
      duration: 800,
    })
  )

  for (let i = 1; i < n - 1; i++) {
    const iMirror = 2 * c - i

    // Step: Mirror symmetry lookup
    if (i < r) {
      p[i] = Math.min(r - i, p[iMirror])
      steps.push(
        createStep({
          lineKey: 'mirror',
          type: 'mirror',
          array: tChars,
          indices: [i, iMirror, c, r],
          message: `Index ${i} < boundary R=${r}. Mirror index is 2*${c} - ${i} = ${iMirror}. Initialized radius p[${i}] = min(R - i, p[${iMirror}]) = ${p[i]}.`,
          variables: {
            i,
            iMirror,
            c,
            r,
            radius: p[i],
            p: [...p],
            maxLen,
          },
          duration: 700,
        })
      )
    } else {
      p[i] = 0
      steps.push(
        createStep({
          lineKey: 'mirror',
          type: 'mirror',
          array: tChars,
          indices: [i, c, r],
          message: `Index ${i} >= boundary R=${r}. Initialized radius p[${i}] = 0.`,
          variables: {
            i,
            iMirror: iMirror >= 0 ? iMirror : null,
            c,
            r,
            radius: 0,
            p: [...p],
            maxLen,
          },
          duration: 700,
        })
      )
    }

    // Step: Expansion loop
    while (t[i + 1 + p[i]] === t[i - 1 - p[i]]) {
      const left = i - 1 - p[i]
      const right = i + 1 + p[i]
      p[i]++

      steps.push(
        createStep({
          lineKey: 'expand',
          type: 'expand',
          array: tChars,
          indices: [left, right, i],
          message: `Characters '${t[left]}' at index ${left} and '${t[right]}' at index ${right} match! Expanded radius at center ${i} to ${p[i]}.`,
          variables: {
            i,
            left,
            right,
            radius: p[i],
            p: [...p],
            c,
            r,
            maxLen,
          },
          duration: 600,
        })
      )
    }

    // Step: Expansion mismatch boundary reached
    const mismatchLeft = i - 1 - p[i]
    const mismatchRight = i + 1 + p[i]
    steps.push(
      createStep({
        lineKey: 'expand',
        type: 'mismatch',
        array: tChars,
        indices: [mismatchLeft, mismatchRight, i],
        message: `Characters '${t[mismatchLeft]}' at index ${mismatchLeft} and '${t[mismatchRight]}' at index ${mismatchRight} differ. Expansion at center ${i} stopped with radius ${p[i]}.`,
        variables: {
          i,
          left: mismatchLeft,
          right: mismatchRight,
          radius: p[i],
          p: [...p],
          c,
          r,
          maxLen,
        },
        duration: 600,
      })
    )

    // Step: Update center C and boundary R if expanded beyond R
    if (i + p[i] > r) {
      const oldR = r
      c = i
      r = i + p[i]

      steps.push(
        createStep({
          lineKey: 'boundary',
          type: 'boundary',
          array: tChars,
          indices: [c, r],
          message: `Palindrome at center ${i} extends past R=${oldR}. Updated center C=${c} and right boundary R=${r}.`,
          variables: {
            i,
            c,
            r,
            oldR,
            radius: p[i],
            p: [...p],
            maxLen,
          },
          duration: 700,
        })
      )
    }

    // Step: Record new maximum palindrome
    const shouldUpdate =
      tieBreak === 'last' ? p[i] >= maxLen : p[i] > maxLen

    if (shouldUpdate) {
      maxLen = p[i]
      maxCenter = i
      const curStart = Math.floor((maxCenter - maxLen - 1) / 2)
      const currentPal = s.slice(curStart, curStart + maxLen)

      steps.push(
        createStep({
          lineKey: 'recordMax',
          type: 'record-max',
          array: tChars,
          indices: [maxCenter],
          message: `New maximum palindrome recorded: "${currentPal}" (length ${maxLen}) centered at ${maxCenter}.`,
          variables: {
            i,
            maxCenter,
            maxLen,
            longestPalindrome: currentPal,
            start: curStart,
            end: curStart + maxLen,
            p: [...p],
          },
          duration: 700,
        })
      )
    }
  }

  // Step: Complete
  const finalStart = maxCenter >= 0 ? Math.floor((maxCenter - maxLen - 1) / 2) : 0
  const finalPalindrome = s.slice(finalStart, finalStart + maxLen)

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: tChars,
      indices: maxCenter >= 0 ? [maxCenter] : [],
      message: `Manacher's algorithm complete. Longest palindromic substring is "${finalPalindrome}" of length ${maxLen}.`,
      variables: {
        source: s,
        transformed: t,
        longestPalindrome: finalPalindrome,
        start: finalStart,
        end: finalStart + maxLen,
        length: maxLen,
        center: maxCenter,
        radius: maxLen,
        p: [...p],
        tieBreak,
      },
      duration: 1000,
    })
  )

  return steps
}

