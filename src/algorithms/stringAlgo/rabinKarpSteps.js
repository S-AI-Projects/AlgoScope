import { createStep } from '../../lib/utils'

/**
 * ============================================================================
 * RABIN-KARP STRING SEARCH MODULE
 * ============================================================================
 * Architectural separation:
 * 1. Source Strings & Line Maps: Multi-language reference implementations and
 *    line maps for visual code tracing and educational reference.
 * 2. Pure Algorithm Results: Deterministic polynomial rolling hash string matching
 *    with explicit character-by-character candidate verification to guarantee
 *    hash collisions cannot produce false matches (spurious hits rejected).
 * 3. Replay Steps: Normalized step-by-step execution frames compatible with
 *    `createStep` for visualizer animation, timeline replay, and comparison mode.
 * 4. UI Components: Pure algorithmic module with zero React UI / DOM dependencies.
 *
 * ----------------------------------------------------------------------------
 * EMPTY-PATTERN & DEGENERATE INPUT POLICY:
 * ----------------------------------------------------------------------------
 * - An empty pattern ("") contains no characters to form a hash window.
 * - Under this specification:
 *   1. Pure search `rabinKarpSearch(text, "")` returns an empty array: []
 *   2. Step replay `generateRabinKarpSteps(text, "")` returns an empty array: []
 *   3. Empty text `""` returns: []
 *   4. Null, undefined, or non-string inputs safely return: []
 *   5. When pattern length m > text length n, returns: []
 * ============================================================================
 */

export const DEFAULT_BASE = 256
export const DEFAULT_PRIME = 101

// ─── 1. SOURCE STRINGS & LINE MAPS ──────────────────────────────────────────

export const rabinKarpSources = {
  javascript: {
    code: `function rabinKarp(text, pattern, prime = 101) {
  const n = text.length, m = pattern.length
  const BASE = 256
  let patHash = 0, winHash = 0, h = 1
  const matches = []

  for (let i = 0; i < m - 1; i++) h = (h * BASE) % prime
  for (let i = 0; i < m; i++) {
    patHash = (BASE * patHash + pattern.charCodeAt(i)) % prime
    winHash = (BASE * winHash + text.charCodeAt(i)) % prime
  }
  for (let i = 0; i <= n - m; i++) {
    if (patHash === winHash) {
      if (text.slice(i, i + m) === pattern) matches.push(i)
    }
    if (i < n - m) {
      winHash = (BASE * (winHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime
      if (winHash < 0) winHash += prime
    }
  }
  return matches
}

console.log(rabinKarp('ABCCDABCDABDC', 'ABCD'))`,
    lineMap: {
      function: 1,
      setup: 2,
      hLoop: 7,
      hashLoop: 8,
      windowLoop: 12,
      hashMatch: 13,
      verifyMatch: 14,
      found: 14,
      rollingHash: 17,
      complete: 21,
    },
  },
  python: {
    code: `def rabin_karp(text, pattern, prime=101):
    n, m, BASE = len(text), len(pattern), 256
    pat_hash = win_hash = 0
    h = pow(BASE, m - 1, prime)
    matches = []

    for i in range(m):
        pat_hash = (BASE * pat_hash + ord(pattern[i])) % prime
        win_hash = (BASE * win_hash + ord(text[i])) % prime

    for i in range(n - m + 1):
        if pat_hash == win_hash and text[i:i+m] == pattern:
            matches.append(i)
        if i < n - m:
            win_hash = (BASE * (win_hash - ord(text[i]) * h) + ord(text[i + m])) % prime
            if win_hash < 0:
                win_hash += prime
    return matches

print(rabin_karp('ABCCDABCDABDC', 'ABCD'))`,
    lineMap: {
      function: 1,
      setup: 2,
      hashLoop: 7,
      windowLoop: 11,
      hashMatch: 12,
      verifyMatch: 12,
      found: 13,
      rollingHash: 15,
      complete: 18,
    },
  },
  cpp: {
    code: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

vector<int> rabinKarp(const string& text, const string& pattern, int prime = 101) {
    int n = text.size(), m = pattern.size(), BASE = 256;
    long long patHash = 0, winHash = 0, h = 1;
    vector<int> matches;
    for (int i = 0; i < m - 1; i++) h = (h * BASE) % prime;
    for (int i = 0; i < m; i++) {
        patHash = (BASE * patHash + pattern[i]) % prime;
        winHash = (BASE * winHash + text[i]) % prime;
    }
    for (int i = 0; i <= n - m; i++) {
        if (patHash == winHash && text.substr(i, m) == pattern)
            matches.push_back(i);
        if (i < n - m) {
            winHash = (BASE * (winHash - text[i] * h) + text[i + m]) % prime;
            if (winHash < 0) winHash += prime;
        }
    }
    return matches;
}

int main() {
    for (int i : rabinKarp("ABCCDABCDABDC", "ABCD")) cout << i << " ";
}`,
    lineMap: {
      function: 6,
      setup: 7,
      hashLoop: 11,
      windowLoop: 15,
      hashMatch: 16,
      verifyMatch: 16,
      found: 17,
      rollingHash: 19,
      complete: 23,
    },
  },
  java: {
    code: `import java.util.*;

public class RabinKarp {
    static List<Integer> rabinKarp(String text, String pattern, int prime) {
        int n = text.length(), m = pattern.length(), BASE = 256;
        long patHash = 0, winHash = 0, h = 1;
        List<Integer> matches = new ArrayList<>();
        for (int i = 0; i < m - 1; i++) h = (h * BASE) % prime;
        for (int i = 0; i < m; i++) {
            patHash = (BASE * patHash + pattern.charAt(i)) % prime;
            winHash = (BASE * winHash + text.charAt(i)) % prime;
        }
        for (int i = 0; i <= n - m; i++) {
            if (patHash == winHash && text.substring(i, i + m).equals(pattern))
                matches.add(i);
            if (i < n - m) {
                winHash = (BASE * (winHash - text.charAt(i) * h) + text.charAt(i + m)) % prime;
                if (winHash < 0) winHash += prime;
            }
        }
        return matches;
    }

    public static void main(String[] args) {
        System.out.println(rabinKarp("ABCCDABCDABDC", "ABCD", 101));
    }
}`,
    lineMap: {
      function: 4,
      setup: 5,
      hashLoop: 9,
      windowLoop: 13,
      hashMatch: 14,
      verifyMatch: 14,
      found: 15,
      rollingHash: 17,
      complete: 21,
    },
  },
}

export function getRabinKarpSource(language = 'javascript') {
  const lang = language.toLowerCase()
  return rabinKarpSources[lang] ?? rabinKarpSources.javascript
}

export function resolveRabinKarpLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getRabinKarpSource(language)
  return (
    source.lineMap?.[lineKey] ??
    rabinKarpSources.javascript.lineMap?.[lineKey]
  )
}

// ─── 2. PURE ALGORITHM (HASHING & RESULTS) ──────────────────────────────────

/**
 * Computes polynomial rolling hash for a string.
 * Hash(s) = sum_{k=0}^{m-1} (s[k] * base^(m-1-k)) mod prime.
 *
 * @param {string} str - Target string
 * @param {number} [prime=101] - Modulo prime
 * @param {number} [base=256] - Base radix
 * @returns {number} Non-negative computed hash in [0, prime - 1]
 */
export function computeHash(
  str,
  prime = DEFAULT_PRIME,
  base = DEFAULT_BASE
) {
  if (typeof str !== 'string' || str.length === 0) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (base * hash + str.charCodeAt(i)) % prime
  }
  return (hash + prime) % prime
}

/**
 * Pure Rabin-Karp string search.
 * Searches for all occurrences of pattern in text using rolling hash and
 * explicit character-by-character verification on hash matches to prevent
 * spurious false positives from collisions.
 *
 * @param {string} text - Search haystack
 * @param {string} pattern - Search needle
 * @param {number|{prime?: number, base?: number}} [options={}] - Custom prime and base
 * @returns {number[]} Array of 0-based match start indices
 */
export function rabinKarpSearch(text, pattern, options = {}) {
  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0
  ) {
    return []
  }

  const prime =
    typeof options === 'number'
      ? options
      : (options?.prime ?? DEFAULT_PRIME)
  const base =
    typeof options === 'object' && options?.base !== undefined
      ? options.base
      : DEFAULT_BASE

  const n = text.length
  const m = pattern.length
  if (m > n) return []

  let h = 1
  for (let i = 0; i < m - 1; i++) {
    h = (h * base) % prime
  }

  let patHash = 0
  let winHash = 0
  for (let i = 0; i < m; i++) {
    patHash = (base * patHash + pattern.charCodeAt(i)) % prime
    winHash = (base * winHash + text.charCodeAt(i)) % prime
  }

  const matches = []

  for (let i = 0; i <= n - m; i++) {
    if (patHash === winHash) {
      // Explicit character-by-character candidate verification to eliminate spurious hits
      let isRealMatch = true
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          isRealMatch = false
          break
        }
      }
      if (isRealMatch) {
        matches.push(i)
      }
    }

    if (i < n - m) {
      winHash =
        (base * (winHash - ((text.charCodeAt(i) * h) % prime) + prime) +
          text.charCodeAt(i + m)) %
        prime
      if (winHash < 0) winHash = (winHash + prime) % prime
    }
  }

  return matches
}

/**
 * Alias for rabinKarpSearch for concise usage.
 */
export const rabinKarp = rabinKarpSearch

/**
 * Executes Rabin-Karp and returns full pure algorithmic metadata:
 * - matches: verified match start indices
 * - patternHash: computed pattern hash
 * - windows: detailed metadata for every evaluated text window
 * - spuriousHits: indices where window hash matched pattern hash but characters differed
 * - prime, base, text, pattern
 *
 * @param {string} text
 * @param {string} pattern
 * @param {number|{prime?: number, base?: number}} [options={}]
 */
export function rabinKarpDetailed(text, pattern, options = {}) {
  const prime =
    typeof options === 'number'
      ? options
      : (options?.prime ?? DEFAULT_PRIME)
  const base =
    typeof options === 'object' && options?.base !== undefined
      ? options.base
      : DEFAULT_BASE

  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0
  ) {
    return {
      matches: [],
      patternHash: 0,
      windows: [],
      spuriousHits: [],
      prime,
      base,
      text: typeof text === 'string' ? text : '',
      pattern: typeof pattern === 'string' ? pattern : '',
    }
  }

  const n = text.length
  const m = pattern.length
  const patHash = computeHash(pattern, prime, base)

  if (m > n) {
    return {
      matches: [],
      patternHash: patHash,
      windows: [],
      spuriousHits: [],
      prime,
      base,
      text,
      pattern,
    }
  }

  let h = 1
  for (let i = 0; i < m - 1; i++) {
    h = (h * base) % prime
  }

  let winHash = computeHash(text.slice(0, m), prime, base)

  const matches = []
  const spuriousHits = []
  const windows = []

  for (let i = 0; i <= n - m; i++) {
    const windowStr = text.slice(i, i + m)
    const isHashMatch = winHash === patHash
    let isRealMatch = false

    if (isHashMatch) {
      let charMatch = true
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          charMatch = false
          break
        }
      }
      isRealMatch = charMatch
    }

    const isSpurious = isHashMatch && !isRealMatch

    if (isRealMatch) {
      matches.push(i)
    }
    if (isSpurious) {
      spuriousHits.push(i)
    }

    windows.push({
      index: i,
      windowStr,
      hash: winHash,
      isHashMatch,
      isRealMatch,
      isSpurious,
    })

    if (i < n - m) {
      winHash =
        (base * (winHash - ((text.charCodeAt(i) * h) % prime) + prime) +
          text.charCodeAt(i + m)) %
        prime
      if (winHash < 0) winHash = (winHash + prime) % prime
    }
  }

  return {
    matches,
    patternHash: patHash,
    windows,
    spuriousHits,
    prime,
    base,
    text,
    pattern,
  }
}

// ─── 3. REPLAY STEP GENERATOR ───────────────────────────────────────────────

/**
 * Generates standardized replay steps for Rabin-Karp animation and visualization.
 *
 * @param {string} text - Target text
 * @param {string} pattern - Search pattern
 * @param {number|{prime?: number, base?: number}} [options={}]
 * @returns {Array<Object>} Normalized visualizer animation steps
 */
export function generateRabinKarpSteps(text, pattern, options = {}) {
  if (
    typeof text !== 'string' ||
    typeof pattern !== 'string' ||
    text.length === 0 ||
    pattern.length === 0
  ) {
    return []
  }

  const prime =
    typeof options === 'number'
      ? options
      : (options?.prime ?? DEFAULT_PRIME)
  const base =
    typeof options === 'object' && options?.base !== undefined
      ? options.base
      : DEFAULT_BASE

  const n = text.length
  const m = pattern.length

  if (m > n) {
    return [
      createStep({
        lineKey: 'setup',
        type: 'complete',
        message: `Pattern length (${m}) is greater than text length (${n}); no match possible.`,
        variables: { text, pattern, prime, base, matches: [] },
        indices: [],
        matches: [],
        foundMatches: [],
        duration: 800,
      }),
    ]
  }

  const steps = []
  const matches = []

  let h = 1
  for (let i = 0; i < m - 1; i++) {
    h = (h * base) % prime
  }

  let patHash = 0
  let winHash = 0
  for (let i = 0; i < m; i++) {
    patHash = (base * patHash + pattern.charCodeAt(i)) % prime
    winHash = (base * winHash + text.charCodeAt(i)) % prime
  }

  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      message: `Initialized Rabin-Karp search (Base: ${base}, Prime: ${prime}). Pattern "${pattern}" hash: ${patHash}, initial window text[0..${m - 1}] hash: ${winHash}.`,
      variables: {
        text,
        pattern,
        prime,
        base,
        h,
        patternHash: patHash,
        windowHash: winHash,
        matches: [],
      },
      indices: [0, m - 1],
      i: 0,
      window: 0,
      windowIndex: 0,
      patternHash: patHash,
      winHash,
      windowHash: winHash,
      matches: [],
      foundMatches: [],
      duration: 650,
    })
  )

  for (let i = 0; i <= n - m; i++) {
    const windowStr = text.slice(i, i + m)
    const isHashMatch = winHash === patHash

    let isRealMatch = false
    if (isHashMatch) {
      let charMatch = true
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          charMatch = false
          break
        }
      }
      isRealMatch = charMatch
    }

    const isSpurious = isHashMatch && !isRealMatch

    steps.push(
      createStep({
        lineKey: isHashMatch ? 'hashMatch' : 'windowLoop',
        type: 'compare',
        message: `Window at [${i}..${i + m - 1}] ("${windowStr}"): window hash = ${winHash}, pattern hash = ${patHash}.${isHashMatch ? ' Hashes match! Verifying characters...' : ' Hashes differ.'}`,
        variables: {
          windowIndex: i,
          windowStr,
          patternHash: patHash,
          windowHash: winHash,
          isHashMatch,
          isRealMatch,
          isSpurious,
          matches: [...matches],
        },
        indices: [i, i + m - 1],
        i,
        window: i,
        windowIndex: i,
        windowStr,
        patternHash: patHash,
        winHash,
        windowHash: winHash,
        isHashMatch,
        isRealMatch,
        isSpurious,
        matches: [...matches],
        foundMatches: [...matches],
        duration: 600,
      })
    )

    if (isRealMatch) {
      matches.push(i)
      steps.push(
        createStep({
          lineKey: 'found',
          type: 'found',
          foundAt: i,
          at: i,
          message: `Match confirmed at index ${i}! Window "${windowStr}" equals pattern "${pattern}".`,
          variables: {
            foundAt: i,
            windowIndex: i,
            patternHash: patHash,
            windowHash: winHash,
            matches: [...matches],
          },
          indices: [i, i + m - 1],
          i,
          window: i,
          windowIndex: i,
          winHash,
          windowHash: winHash,
          isHashMatch: true,
          isRealMatch: true,
          isSpurious: false,
          matches: [...matches],
          foundMatches: [...matches],
          duration: 900,
        })
      )
    } else if (isSpurious) {
      steps.push(
        createStep({
          lineKey: 'verifyMatch',
          type: 'spurious',
          message: `Hash collision at index ${i}! Window "${windowStr}" has hash ${winHash} matching pattern hash, but character-by-character check failed. Spurious hit rejected.`,
          variables: {
            windowIndex: i,
            windowStr,
            patternHash: patHash,
            windowHash: winHash,
            isHashMatch: true,
            isRealMatch: false,
            isSpurious: true,
            matches: [...matches],
          },
          indices: [i, i + m - 1],
          i,
          window: i,
          windowIndex: i,
          winHash,
          windowHash: winHash,
          isHashMatch: true,
          isRealMatch: false,
          isSpurious: true,
          matches: [...matches],
          foundMatches: [...matches],
          duration: 850,
        })
      )
    }

    if (i < n - m) {
      winHash =
        (base * (winHash - ((text.charCodeAt(i) * h) % prime) + prime) +
          text.charCodeAt(i + m)) %
        prime
      if (winHash < 0) winHash = (winHash + prime) % prime

      steps.push(
        createStep({
          lineKey: 'rollingHash',
          type: 'shift',
          message: `Rolling hash updated for next window: removed text[${i}] ('${text[i]}'), added text[${i + m}] ('${text[i + m]}'). Next window hash: ${winHash}.`,
          variables: {
            previousIndex: i,
            nextIndex: i + 1,
            removedChar: text[i],
            addedChar: text[i + m],
            nextWindowHash: winHash,
            matches: [...matches],
          },
          indices: [i + 1, i + m],
          i: i + 1,
          window: i + 1,
          windowIndex: i + 1,
          winHash,
          windowHash: winHash,
          matches: [...matches],
          foundMatches: [...matches],
          duration: 500,
        })
      )
    }
  }

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      message:
        matches.length > 0
          ? `Rabin-Karp search complete. Found ${matches.length} match(es) at index(es): [${matches.join(', ')}].`
          : 'Rabin-Karp search complete. No matches found in text.',
      variables: {
        matches: [...matches],
        totalMatches: matches.length,
      },
      indices: [],
      matches: [...matches],
      foundMatches: [...matches],
      duration: 800,
    })
  )

  return steps
}
