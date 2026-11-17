/**
 * Euclid GCD Steps & Independent Reference Module
 * Task: R62-T023
 *
 * Implements:
 * - Euclidean Algorithm with modulo reduction
 * - Formal Zero-Input Policy:
 *     gcd(a, 0) = |a| (for a !== 0)
 *     gcd(0, b) = |b| (for b !== 0)
 *     gcd(0, 0) = 0
 * - Explicit fixture (54, 24) producing remainders [6, 0] and GCD 6
 * - Independent reference implementation (brute-force divisor search & naive subtraction)
 * - Replayable step trace generation
 * - Multi-language source representations and metadata
 */

/**
 * Zero-Input Policy Specification:
 * - gcd(a, 0) = |a| for any non-zero integer a.
 * - gcd(0, b) = |b| for any non-zero integer b.
 * - gcd(0, 0) = 0 by standard convention (following Python math.gcd, C++ std::gcd, and computer algebra systems).
 * - For negative inputs, gcd(a, b) = gcd(|a|, |b|).
 */
export const ZERO_INPUT_POLICY = Object.freeze({
  description:
    'gcd(a, 0) = |a|, gcd(0, b) = |b|, gcd(0, 0) = 0; negative inputs are evaluated on absolute values.',
  evaluateZero: (a, b) => {
    const absA = Math.abs(a)
    const absB = Math.abs(b)
    if (absA === 0 && absB === 0) return 0
    if (absB === 0) return absA
    if (absA === 0) return absB
    return null
  },
})

/**
 * Validates that an input is an integer.
 *
 * @param {any} val - Value to validate.
 * @param {string} paramName - Parameter name for error message.
 */
function validateInteger(val, paramName) {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new TypeError(`${paramName} must be a finite number, received: ${val}`)
  }
  if (!Number.isInteger(val)) {
    throw new TypeError(`${paramName} must be an integer, received: ${val}`)
  }
}

/**
 * Computes the Greatest Common Divisor (GCD) using the Euclidean algorithm (modulo method).
 * Pure function: does not mutate inputs.
 *
 * Primary Fixture:
 * gcd(54, 24) produces remainders [6, 0] and returns GCD = 6.
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {number} The greatest common divisor.
 */
export function gcd(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  let x = Math.abs(a)
  let y = Math.abs(b)

  while (y !== 0) {
    const remainder = x % y
    x = y
    y = remainder
  }

  return x
}

/**
 * Computes GCD and records the complete sequence of intermediate division remainders,
 * quotients, and state transitions.
 *
 * For (54, 24):
 * - Round 1: 54 = 2 * 24 + 6 -> remainder = 6, quotient = 2
 * - Round 2: 24 = 4 * 6 + 0  -> remainder = 0, quotient = 4
 * -> remainders: [6, 0], gcd: 6
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {{
 *   a: number,
 *   b: number,
 *   gcd: number,
 *   remainders: Array<number>,
 *   quotients: Array<number>,
 *   steps: Array<Object>
 * }}
 */
export function euclidGCD(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  let x = Math.abs(a)
  let y = Math.abs(b)
  const remainders = []
  const quotients = []
  const transitions = []

  // Check Zero-Input Policy
  const zeroCheck = ZERO_INPUT_POLICY.evaluateZero(x, y)
  if (zeroCheck !== null && (x === 0 || y === 0)) {
    return {
      a,
      b,
      gcd: zeroCheck,
      remainders: [],
      quotients: [],
      steps: generateEuclidGCDSteps(a, b),
    }
  }

  while (y !== 0) {
    const remainder = x % y
    const quotient = Math.floor(x / y)
    remainders.push(remainder)
    quotients.push(quotient)
    transitions.push({
      dividend: x,
      divisor: y,
      quotient,
      remainder,
    })
    x = y
    y = remainder
  }

  return {
    a,
    b,
    gcd: x,
    remainders,
    quotients,
    transitions,
    steps: generateEuclidGCDSteps(a, b),
  }
}

/**
 * Independent Reference GCD Implementation:
 * Uses brute-force common divisor search to provide an independent,
 * non-Euclidean mathematical baseline.
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {number} The greatest common divisor.
 */
export function independentReferenceGCD(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  const x = Math.abs(a)
  const y = Math.abs(b)

  // Zero-Input Policy alignment
  if (x === 0 && y === 0) return 0
  if (x === 0) return y
  if (y === 0) return x

  // Find greatest integer dividing both x and y
  const limit = Math.min(x, y)
  for (let d = limit; d >= 1; d--) {
    if (x % d === 0 && y % d === 0) {
      return d
    }
  }

  return 1
}

/**
 * Naive Subtraction-based GCD (Euclid's original geometric subtraction method).
 * Provides a second independent algorithmic reference.
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {number} The greatest common divisor.
 */
export function naiveSubtractionGCD(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  let x = Math.abs(a)
  let y = Math.abs(b)

  if (x === 0 && y === 0) return 0
  if (x === 0) return y
  if (y === 0) return x

  while (x !== y) {
    if (x > y) {
      x -= y
    } else {
      y -= x
    }
  }

  return x
}

/**
 * Generates sequential visualization / replay animation steps for Euclidean GCD.
 * Compatible with AlgoScope's step player contract.
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {Array<Object>} List of step objects.
 */
export function generateEuclidGCDSteps(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  const steps = []
  let x = Math.abs(a)
  let y = Math.abs(b)

  steps.push({
    lineKey: 'start',
    type: 'start',
    array: [x, y],
    message: `Start: gcd(${x}, ${y})`,
    variables: { a: x, b: y },
    duration: 700,
  })

  // Zero-Input Policy immediate termination
  if (y === 0) {
    steps.push({
      lineKey: 'result',
      type: 'complete',
      array: [x, 0],
      message: `GCD = ${x} (Zero-Input Policy: gcd(${x}, 0) = ${x})`,
      variables: { result: x },
      duration: 900,
    })
    return steps
  }

  while (y !== 0) {
    const remainder = x % y
    const quotient = Math.floor(x / y)
    steps.push({
      lineKey: 'modulo',
      type: 'compare',
      array: [x, y],
      indices: [0, 1],
      message: `gcd(${x}, ${y}) → ${x} = ${quotient} × ${y} + ${remainder} (remainder = ${remainder})`,
      variables: { a: x, b: y, quotient, remainder },
      duration: 900,
    })

    x = y
    y = remainder

    steps.push({
      lineKey: 'assign',
      type: 'swap',
      array: [x, y],
      indices: [0, 1],
      message: `→ next pair: gcd(${x}, ${y})`,
      variables: { a: x, b: y },
      duration: 700,
    })
  }

  steps.push({
    lineKey: 'result',
    type: 'complete',
    array: [x, 0],
    message: `GCD = ${x}`,
    variables: { result: x },
    duration: 900,
  })

  return steps
}

/**
 * Replays step-by-step intermediate remainder snapshots.
 *
 * @param {number} a - First integer.
 * @param {number} b - Second integer.
 * @returns {Array<{ x: number, y: number, remainder: number }>}
 */
export function replayTrace(a, b) {
  validateInteger(a, 'a')
  validateInteger(b, 'b')

  let x = Math.abs(a)
  let y = Math.abs(b)
  const trace = []

  while (y !== 0) {
    const remainder = x % y
    trace.push({ x, y, remainder })
    x = y
    y = remainder
  }

  return trace
}

/**
 * Multi-language source code string representations for Euclidean GCD.
 * Demonstrates the explicit fixture gcd(54, 24) yielding 6.
 */
export const euclidGCDSources = {
  javascript: {
    code: `function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    let remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

const a = 54;
const b = 24;
const result = gcd(a, b);
console.log(result);`,
  },

  python: {
    code: `def gcd(a, b):
    a, b = abs(a), abs(b)
    while b != 0:
        a, b = b, a % b
    return a

a = 54
b = 24
print(gcd(a, b))`,
  },

  cpp: {
    code: `#include <iostream>
#include <cmath>

int gcd(int a, int b) {
    a = std::abs(a);
    b = std::abs(b);
    while (b != 0) {
        int r = a % b;
        a = b;
        b = r;
    }
    return a;
}

int main() {
    std::cout << gcd(54, 24) << std::endl;
    return 0;
}`,
  },

  java: {
    code: `public class EuclidGCD {
    public static int gcd(int a, int b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b != 0) {
            int r = a % b;
            a = b;
            b = r;
        }
        return a;
    }

    public static void main(String[] args) {
        System.out.println(gcd(54, 24));
    }
}`,
  },

  c: {
    code: `#include <stdio.h>
#include <stdlib.h>

int gcd(int a, int b) {
    a = abs(a);
    b = abs(b);
    while (b != 0) {
        int r = a % b;
        a = b;
        b = r;
    }
    return a;
}

int main() {
    printf("%d\\n", gcd(54, 24));
    return 0;
}`,
  },

  rust: {
    code: `fn gcd(mut a: i64, mut b: i64) -> i64 {
    a = a.abs();
    b = b.abs();
    while b != 0 {
        let r = a % b;
        a = b;
        b = r;
    }
    a
}

fn main() {
    println!("{}", gcd(54, 24));
}`,
  },

  go: {
    code: `package main

import "fmt"

func gcd(a, b int) int {
    if a < 0 { a = -a }
    if b < 0 { b = -b }
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

func main() {
    fmt.Println(gcd(54, 24))
}`,
  },
}

/**
 * Metadata documenting Euclid GCD properties, complexities, and policies.
 */
export const euclidGCDMetadata = {
  id: 'euclid-gcd',
  name: 'Euclidean GCD Algorithm',
  category: 'Number Theory / Math',
  timeComplexity: 'O(log(min(a, b)))',
  spaceComplexity: 'O(1)',
  zeroInputPolicy: {
    rule1: 'gcd(a, 0) = |a|',
    rule2: 'gcd(0, b) = |b|',
    rule3: 'gcd(0, 0) = 0',
  },
  invariants: [
    'gcd(a, b) === gcd(b, a % b)',
    'gcd(a, b) === gcd(-a, b) === gcd(a, -b)',
    'Every common divisor of a and b also divides a % b',
  ],
}
