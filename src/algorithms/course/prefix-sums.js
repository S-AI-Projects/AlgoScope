/**
 * Prefix Sums Pure Module & Replay Contract
 * Task: R62-T021
 *
 * Implements:
 * - Pure exclusive prefix sum array generation
 * - Constant-time O(1) range sum queries on half-open ranges [left, right)
 * - Replayable execution trace and step generators
 * - Multi-language source strings and explanation metadata
 */

/**
 * Computes the exclusive prefix sum array for a given numerical array.
 * Pure function: does not mutate the input array.
 *
 * For an array of length n, the exclusive prefix array has length n + 1:
 * prefix[0] = 0
 * prefix[i + 1] = prefix[i] + inputArray[i]
 *
 * Explicit Fixture:
 * [2, -1, 3] -> [0, 2, 1, 4]
 *
 * @param {Array<number>} inputArray - Array of finite numbers.
 * @returns {Array<number>} The exclusive prefix sum array.
 */
export function computePrefixSums(inputArray) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('Input must be an array')
  }

  for (let i = 0; i < inputArray.length; i++) {
    const val = inputArray[i]
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new TypeError(`Array element at index ${i} must be a finite number, received: ${val}`)
    }
  }

  const n = inputArray.length
  const prefix = new Array(n + 1)
  prefix[0] = 0

  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + inputArray[i]
  }

  return prefix
}

/**
 * Queries the sum of elements in the half-open range [left, right)
 * using a precomputed exclusive prefix sum array.
 *
 * Range sum formula: prefix[right] - prefix[left]
 *
 * For fixture [2, -1, 3] with prefix [0, 2, 1, 4]:
 * range [1, 3) sums to prefix[3] - prefix[1] = 4 - 2 = 2
 *
 * @param {Array<number>} prefixSums - Precomputed exclusive prefix sum array.
 * @param {number} left - Start index (inclusive), 0 <= left <= right.
 * @param {number} right - End index (exclusive), left <= right < prefixSums.length.
 * @returns {number} Sum of elements in [left, right).
 */
export function queryRange(prefixSums, left, right) {
  if (!Array.isArray(prefixSums)) {
    throw new TypeError('prefixSums must be an array')
  }
  if (prefixSums.length === 0) {
    throw new RangeError('prefixSums array cannot be empty')
  }
  if (!Number.isInteger(left)) {
    throw new TypeError(`left bound must be an integer, received: ${left}`)
  }
  if (!Number.isInteger(right)) {
    throw new TypeError(`right bound must be an integer, received: ${right}`)
  }
  if (left < 0) {
    throw new RangeError(`left index must be non-negative, received: ${left}`)
  }
  if (right < left) {
    throw new RangeError(`right index (${right}) cannot be less than left index (${left})`)
  }
  if (right >= prefixSums.length) {
    throw new RangeError(
      `right index (${right}) exceeds valid boundary (${prefixSums.length - 1})`
    )
  }

  return prefixSums[right] - prefixSums[left]
}

/**
 * Convenience helper to compute range sum directly from source array
 * without explicitly maintaining the prefix array reference.
 *
 * @param {Array<number>} inputArray - Source array of numbers.
 * @param {number} left - Start index (inclusive).
 * @param {number} right - End index (exclusive).
 * @returns {number} Range sum for [left, right).
 */
export function rangeSum(inputArray, left, right) {
  const prefix = computePrefixSums(inputArray)
  return queryRange(prefix, left, right)
}

/**
 * Pure algorithm wrapper returning original snapshot, prefix array,
 * query function, and replay trace.
 *
 * @param {Array<number>} inputArray - Input array.
 * @returns {{
 *   original: Array<number>,
 *   prefix: Array<number>,
 *   query: (left: number, right: number) => number,
 *   steps: Array<Object>
 * }}
 */
export function prefixSums(inputArray) {
  const original = Array.isArray(inputArray) ? [...inputArray] : inputArray
  const prefix = computePrefixSums(original)
  const steps = generatePrefixSumSteps(original)

  return {
    original,
    prefix,
    query: (left, right) => queryRange(prefix, left, right),
    steps,
  }
}

/**
 * Replays step-by-step intermediate states of exclusive prefix construction.
 *
 * @param {Array<number>} inputArray - Input array.
 * @returns {Array<Array<number>>} Intermediate prefix array states after each element addition.
 */
export function replayTrace(inputArray) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('Input must be an array')
  }

  const trace = [[0]]
  let currentSum = 0

  for (let i = 0; i < inputArray.length; i++) {
    const val = inputArray[i]
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new TypeError(`Array element at index ${i} must be a finite number`)
    }
    currentSum += val
    const prev = trace[trace.length - 1]
    trace.push([...prev, currentSum])
  }

  return trace
}

/**
 * Generates visualization / replay animation steps for prefix sum construction and queries.
 * Preserves separation between pure algorithm results and replayable step representations.
 *
 * @param {Array<number>} inputArray - Source array.
 * @param {Array<[number, number]>} [queries=[]] - Optional list of [left, right] range queries to visualize.
 * @returns {Array<Object>} List of sequential step objects.
 */
export function generatePrefixSumSteps(inputArray, queries = []) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }

  const steps = []
  const currentPrefix = [0]

  steps.push({
    type: 'init',
    array: [...inputArray],
    prefix: [0],
    currentIndex: -1,
    message: 'Initialize exclusive prefix array with prefix[0] = 0 (sum of first 0 elements).',
  })

  for (let i = 0; i < inputArray.length; i++) {
    const element = inputArray[i]
    const prevSum = currentPrefix[i]
    const nextSum = prevSum + element
    currentPrefix.push(nextSum)

    steps.push({
      type: 'accumulate',
      array: [...inputArray],
      prefix: [...currentPrefix],
      currentIndex: i,
      indices: [i],
      variables: {
        i,
        element,
        prevSum,
        nextSum,
      },
      message: `Compute prefix[${i + 1}] = prefix[${i}] (${prevSum}) + arr[${i}] (${element}) = ${nextSum}.`,
    })
  }

  steps.push({
    type: 'complete',
    array: [...inputArray],
    prefix: [...currentPrefix],
    currentIndex: -1,
    message: `Prefix sum array construction complete: [${currentPrefix.join(', ')}].`,
  })

  if (Array.isArray(queries) && queries.length > 0) {
    for (const [left, right] of queries) {
      const sum = queryRange(currentPrefix, left, right)
      steps.push({
        type: 'query',
        array: [...inputArray],
        prefix: [...currentPrefix],
        query: { left, right, sum },
        indices: [left, right],
        variables: {
          left,
          right,
          prefixRight: currentPrefix[right],
          prefixLeft: currentPrefix[left],
          sum,
        },
        message: `Query range [${left}, ${right}): prefix[${right}] (${currentPrefix[right]}) - prefix[${left}] (${currentPrefix[left]}) = ${sum}.`,
      })
    }
  }

  return steps
}

/**
 * Replays a list of range queries against an array, returning each range sum.
 *
 * @param {Array<number>} inputArray - Input array.
 * @param {Array<[number, number]>} queries - List of [left, right) pairs.
 * @returns {Array<number>} Array of range sums.
 */
export function replayOperations(inputArray, queries = []) {
  const prefix = computePrefixSums(inputArray)
  return queries.map(([left, right]) => queryRange(prefix, left, right))
}

/**
 * Multi-language source code string representations for Prefix Sums.
 * Preserves separation between source string representations, pure algorithm,
 * trace steps, and UI visualizers.
 */
export const prefixSumSources = {
  prefixSums: {
    javascript: {
      code: `function computePrefixSums(arr) {
  const n = arr.length;
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }
  return prefix;
}

function queryRange(prefix, left, right) {
  return prefix[right] - prefix[left];
}

const arr = [2, -1, 3];
const prefix = computePrefixSums(arr);
console.log(prefix);
console.log(queryRange(prefix, 1, 3));`,
    },

    python: {
      code: `def compute_prefix_sums(arr):
    n = len(arr)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + arr[i]
    return prefix

def query_range(prefix, left, right):
    return prefix[right] - prefix[left]

arr = [2, -1, 3]
prefix = compute_prefix_sums(arr)
print(prefix)
print(query_range(prefix, 1, 3))`,
    },

    cpp: {
      code: `#include <iostream>
#include <vector>

std::vector<int> computePrefixSums(const std::vector<int>& arr) {
    int n = arr.size();
    std::vector<int> prefix(n + 1, 0);
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

int queryRange(const std::vector<int>& prefix, int left, int right) {
    return prefix[right] - prefix[left];
}

int main() {
    std::vector<int> arr = {2, -1, 3};
    std::vector<int> prefix = computePrefixSums(arr);
    std::cout << queryRange(prefix, 1, 3) << std::endl;
    return 0;
}`,
    },

    java: {
      code: `public class PrefixSums {
    public static int[] computePrefixSums(int[] arr) {
        int[] prefix = new int[arr.length + 1];
        prefix[0] = 0;
        for (int i = 0; i < arr.length; i++) {
            prefix[i + 1] = prefix[i] + arr[i];
        }
        return prefix;
    }

    public static int queryRange(int[] prefix, int left, int right) {
        return prefix[right] - prefix[left];
    }

    public static void main(String[] args) {
        int[] arr = {2, -1, 3};
        int[] prefix = computePrefixSums(arr);
        System.out.println(queryRange(prefix, 1, 3));
    }
}`,
    },

    c: {
      code: `#include <stdio.h>
#include <stdlib.h>

int* computePrefixSums(const int* arr, int n) {
    int* prefix = (int*)malloc((n + 1) * sizeof(int));
    prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

int queryRange(const int* prefix, int left, int right) {
    return prefix[right] - prefix[left];
}

int main() {
    int arr[] = {2, -1, 3};
    int* prefix = computePrefixSums(arr, 3);
    printf("%d\\n", queryRange(prefix, 1, 3));
    free(prefix);
    return 0;
}`,
    },

    rust: {
      code: `fn compute_prefix_sums(arr: &[i32]) -> Vec<i32> {
    let mut prefix = vec![0; arr.len() + 1];
    for (i, &val) in arr.iter().enumerate() {
        prefix[i + 1] = prefix[i] + val;
    }
    prefix
}

fn query_range(prefix: &[i32], left: usize, right: usize) -> i32 {
    prefix[right] - prefix[left]
}

fn main() {
    let arr = [2, -1, 3];
    let prefix = compute_prefix_sums(&arr);
    println!("{}", query_range(&prefix, 1, 3));
}`,
    },

    go: {
      code: `package main

import "fmt"

func computePrefixSums(arr []int) []int {
    prefix := make([]int, len(arr)+1)
    for i, v := range arr {
        prefix[i+1] = prefix[i] + v
    }
    return prefix
}

func queryRange(prefix []int, left, right int) int {
    return prefix[right] - prefix[left]
}

func main() {
    arr := []int{2, -1, 3}
    prefix := computePrefixSums(arr)
    fmt.Println(queryRange(prefix, 1, 3))
}`,
    },
  },
}

/**
 * Metadata documenting Prefix Sums properties, complexity, and classification.
 */
export const prefixSumMetadata = {
  id: 'prefix-sums',
  name: 'Prefix Sums',
  category: 'Array / Range Queries',
  timeComplexity: {
    preprocessing: 'O(n)',
    query: 'O(1)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Precomputes cumulative prefix sums in O(n) time, enabling O(1) constant-time range sum queries on half-open ranges [left, right).',
  invariants: [
    'prefix[0] === 0 (exclusive zero-base)',
    'prefix.length === array.length + 1',
    'prefix[i + 1] === prefix[i] + array[i]',
    'queryRange(prefix, left, right) === prefix[right] - prefix[left]',
  ],
}
