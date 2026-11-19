import { createStep } from '../../lib/utils.js'

/**
 * Pure counting sort implementation.
 * Supports ascending ('asc', default) and descending ('desc') sorting.
 * Handles duplicate elements, ordered, reversed, singleton, and empty collections.
 *
 * @param {number[]} inputArray
 * @param {object} [options]
 * @param {'asc' | 'desc'} [options.order]
 * @returns {number[]} New sorted array.
 */
export function countingSort(inputArray, options = {}) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }

  const order = options.order === 'desc' ? 'desc' : 'asc'
  const n = inputArray.length
  if (n <= 1) return [...inputArray]

  // Validate non-negative integers for counting sort
  for (const val of inputArray) {
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
      throw new TypeError(`Counting sort requires non-negative integers, received ${val}`)
    }
  }

  const max = Math.max(...inputArray)
  const count = new Array(max + 1).fill(0)

  // Step 1: Count frequencies
  for (let i = 0; i < n; i++) {
    count[inputArray[i]]++
  }

  // Step 2: Cumulative prefix sum
  for (let i = 1; i <= max; i++) {
    count[i] += count[i - 1]
  }

  // Step 3: Decisive stable placement into output array
  const output = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    const val = inputArray[i]
    const pos = count[val] - 1
    output[pos] = val
    count[val]--
  }

  if (order === 'desc') {
    output.reverse()
  }

  return output
}

/**
 * Validates step invariants during Counting Sort execution.
 * Verifies element conservation and terminal sortedness.
 *
 * @param {object} step
 * @param {number[]} originalArray
 * @returns {boolean}
 */
export function validateCountingSortInvariant(step, originalArray) {
  if (!step || typeof step !== 'object') {
    throw new Error('Step must be an object')
  }
  if (!Array.isArray(step.array)) {
    throw new Error('Step missing array')
  }

  // Multiset conservation: same element counts
  if (step.type === 'complete') {
    if (step.array.length !== originalArray.length) {
      throw new Error('Terminal array length differs from original')
    }
    const origCounts = {}
    for (const x of originalArray) origCounts[x] = (origCounts[x] || 0) + 1
    const stepCounts = {}
    for (const x of step.array) stepCounts[x] = (stepCounts[x] || 0) + 1
    for (const key of Object.keys(origCounts)) {
      if (origCounts[key] !== stepCounts[key]) {
        throw new Error(`Element conservation violated for value ${key}`)
      }
    }
    // Ascending check
    for (let i = 1; i < step.array.length; i++) {
      if (step.array[i - 1] > step.array[i]) {
        throw new Error('Terminal array is not sorted')
      }
    }
  }

  return true
}

export const countingSortSources = {
  javascript: {
    code: `function countingSort(arr) {
  let n = arr.length;
  let max = Math.max(...arr);
  let count = new Array(max + 1).fill(0);
  for (let i = 0; i < n; i++) {
    count[arr[i]]++;
  }
  for (let i = 1; i <= max; i++) {
    count[i] += count[i - 1];
  }
  let output = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    output[count[arr[i]] - 1] = arr[i];
    count[arr[i]]--;
  }
  for (let i = 0; i < n; i++) {
    arr[i] = output[i];
  }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      countOccurrences: 5,
      prefixSum: 8,
      placeElements: 12,
      copyBack: 16,
      complete: 19,
    },
  },
  python: {
    code: `def counting_sort(arr):
    n = len(arr)
    max_val = max(arr)
    count = [0] * (max_val + 1)
    for x in arr:
        count[x] += 1
    for i in range(1, max_val + 1):
        count[i] += count[i - 1]
    output = [0] * n
    for i in range(n - 1, -1, -1):
        output[count[arr[i]] - 1] = arr[i]
        count[arr[i]] -= 1
    for i in range(n):
        arr[i] = output[i]`,
    lineMap: {
      function: 1,
      setup: 2,
      countOccurrences: 5,
      prefixSum: 7,
      placeElements: 10,
      copyBack: 13,
      complete: 14,
    },
  },
  java: {
    code: `public void countingSort(int[] arr) {
    int n = arr.length;
    int max = Arrays.stream(arr).max().getAsInt();
    int[] count = new int[max + 1];
    for (int i = 0; i < n; i++) {
        count[arr[i]]++;
    }
    for (int i = 1; i <= max; i++) {
        count[i] += count[i - 1];
    }
    int[] output = new int[n];
    for (int i = n - 1; i >= 0; i--) {
        output[count[arr[i]] - 1] = arr[i];
        count[arr[i]]--;
    }
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      countOccurrences: 5,
      prefixSum: 8,
      placeElements: 12,
      copyBack: 16,
      complete: 19,
    },
  },
  cpp: {
    code: `void countingSort(vector<int>& arr) {
    int n = arr.size();
    int max = *max_element(arr.begin(), arr.end());
    vector<int> count(max + 1, 0);
    for (int i = 0; i < n; i++) {
        count[arr[i]]++;
    }
    for (int i = 1; i <= max; i++) {
        count[i] += count[i - 1];
    }
    vector<int> output(n);
    for (int i = n - 1; i >= 0; i--) {
        output[count[arr[i]] - 1] = arr[i];
        count[arr[i]]--;
    }
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}`,
    lineMap: {
      function: 1,
      setup: 2,
      countOccurrences: 5,
      prefixSum: 8,
      placeElements: 12,
      copyBack: 16,
      complete: 19,
    },
  },
  c: {
    code: `void countingSort(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++)
        if (arr[i] > max) max = arr[i];
    int count[max + 1];
    memset(count, 0, sizeof(count));
    for (int i = 0; i < n; i++)
        count[arr[i]]++;
    for (int i = 1; i <= max; i++)
        count[i] += count[i - 1];
    int output[n];
    for (int i = n - 1; i >= 0; i--) {
        output[count[arr[i]] - 1] = arr[i];
        count[arr[i]]--;
    }
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}`,
    lineMap: {
      function: 1,
      setup: 4,
      countOccurrences: 7,
      prefixSum: 9,
      placeElements: 12,
      copyBack: 16,
      complete: 18,
    },
  },
  rust: {
    code: `fn counting_sort(arr: &mut [i32]) {
    let n = arr.len();
    let max = *arr.iter().max().unwrap() as usize;
    let mut count = vec![0; max + 1];
    for &x in arr.iter() {
        count[x as usize] += 1;
    }
    for i in 1..=max {
        count[i] += count[i - 1];
    }
    let mut output = vec![0; n];
    for i in (0..n).rev() {
        output[count[arr[i] as usize] - 1] = arr[i];
        count[arr[i] as usize] -= 1;
    }
    for i in 0..n {
        arr[i] = output[i];
    }
}`,
    lineMap: {
      function: 1,
      setup: 3,
      countOccurrences: 5,
      prefixSum: 8,
      placeElements: 12,
      copyBack: 16,
      complete: 19,
    },
  },
  go: {
    code: `func countingSort(arr []int) {
    n := len(arr)
    max := arr[0]
    for _, v := range arr {
        if v > max { max = v }
    }
    count := make([]int, max+1)
    for _, v := range arr {
        count[v]++
    }
    for i := 1; i <= max; i++ {
        count[i] += count[i-1]
    }
    output := make([]int, n)
    for i := n - 1; i >= 0; i-- {
        output[count[arr[i]]-1] = arr[i]
        count[arr[i]]--
    }
    for i := 0; i < n; i++ {
        arr[i] = output[i]
    }
}`,
    lineMap: {
      function: 1,
      setup: 7,
      countOccurrences: 9,
      prefixSum: 12,
      placeElements: 16,
      copyBack: 20,
      complete: 23,
    },
  },
}

export function getCountingSortSource(language = 'javascript') {
  return countingSortSources[language] ?? countingSortSources.javascript
}

export function resolveCountingSortLine(language, lineKey) {
  if (!lineKey) {
    return undefined
  }
  const source = getCountingSortSource(language)
  return (
    source.lineMap[lineKey] ?? countingSortSources.javascript.lineMap[lineKey]
  )
}

/**
 * Step generator preserving public interface and enforcing snapshot immutability.
 * Handles boundary collections (empty and singleton).
 *
 * @param {number[]} inputArray
 * @returns {Array<object>}
 */
export function generateCountingSortSteps(inputArray) {
  if (!Array.isArray(inputArray)) return []

  const arr = [...inputArray]
  const steps = []
  const n = arr.length

  // Boundary check: empty array
  if (n === 0) {
    steps.push(
      createStep({
        lineKey: 'complete',
        type: 'complete',
        array: [],
        indices: [],
        sortedIndices: [],
        message: 'Empty collection is already sorted.',
        variables: { n: 0 },
        duration: 500,
      })
    )
    return steps
  }

  // Boundary check: singleton
  if (n === 1) {
    steps.push(
      createStep({
        lineKey: 'function',
        type: 'start',
        array: [...arr],
        indices: [0],
        sortedIndices: [0],
        message: 'Single-element collection is already sorted.',
        variables: { n: 1, max: arr[0] },
        duration: 500,
      })
    )
    steps.push(
      createStep({
        lineKey: 'complete',
        type: 'complete',
        array: [...arr],
        indices: [0],
        sortedIndices: [0],
        message: 'Counting Sort is complete.',
        variables: { n: 1 },
        duration: 500,
      })
    )
    return steps
  }

  const max = Math.max(...arr)
  const count = new Array(max + 1).fill(0)

  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: [...arr],
      indices: [],
      message: 'Counting Sort starts.',
      variables: { n, max },
      duration: 700,
    })
  )

  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      array: [...arr],
      indices: [],
      message: `Initialized count array of size ${max + 1}.`,
      variables: { n, max },
      duration: 500,
    })
  )

  for (let i = 0; i < n; i++) {
    count[arr[i]]++
    steps.push(
      createStep({
        lineKey: 'countOccurrences',
        type: 'active',
        array: [...arr],
        indices: [i],
        message: `Value ${arr[i]} found. Increment count[${arr[i]}].`,
        variables: { i, val: arr[i], countAtVal: count[arr[i]] },
        duration: 400,
      })
    )
  }

  for (let i = 1; i <= max; i++) {
    count[i] += count[i - 1]
    steps.push(
      createStep({
        lineKey: 'prefixSum',
        type: 'outer-loop',
        array: [...arr],
        indices: [],
        message: `Compute prefix sum: count[${i}] = ${count[i]}.`,
        variables: { i, prefixSum: count[i] },
        duration: 300,
      })
    )
  }

  const output = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    const val = arr[i]
    const pos = count[val] - 1
    output[pos] = val
    count[val]--

    steps.push(
      createStep({
        lineKey: 'placeElements',
        type: 'insert',
        array: [...arr],
        indices: [i],
        message: `Place ${val} at output index ${pos} (from count[${val}]).`,
        variables: { i, val, pos, newCount: count[val] },
        duration: 600,
      })
    )
  }

  for (let i = 0; i < n; i++) {
    arr[i] = output[i]
    steps.push(
      createStep({
        lineKey: 'copyBack',
        type: 'insert',
        array: [...arr],
        indices: [i],
        message: `Copy ${output[i]} back to original array at index ${i}.`,
        variables: { i, val: arr[i] },
        duration: 400,
      })
    )
  }

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: [...arr],
      indices: [],
      sortedIndices: Array.from({ length: n }, (_, index) => index),
      message: 'Counting Sort is complete.',
      variables: { n },
      duration: 900,
    })
  )

  return steps
}
