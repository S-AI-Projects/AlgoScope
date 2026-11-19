export const binarySearchSources = {
  javascript: {
    code: `function binarySearch(arr, target) {
  let low = 0
  let high = arr.length - 1
  while (low <= high) {
    let mid = Math.floor((low + high) / 2)
    if (arr[mid] === target) {
      return mid
    } else if (arr[mid] < target) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return -1
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 9,
      high: 11,
      notFound: 14,
    },
  },
  python: {
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 8,
      high: 10,
      notFound: 11,
    },
  },
  java: {
    code: `public int binarySearch(int[] arr, int target) {
    int low = 0;
    int high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 8,
      high: 10,
      notFound: 13,
    },
  },
  cpp: {
    code: `int binarySearch(vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 8,
      high: 10,
      notFound: 13,
    },
  },
  c: {
    code: `int binarySearch(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 8,
      high: 10,
      notFound: 13,
    },
  },
  rust: {
    code: `fn binary_search(arr: &[i32], target: i32) -> i32 {
    let mut low = 0;
    let mut high = (arr.len() as i32) - 1;
    while low <= high {
        let mid = low + (high - low) / 2;
        if arr[mid as usize] == target {
            return mid;
        } else if arr[mid as usize] < target {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    -1
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 9,
      high: 11,
      notFound: 14,
    },
  },
  go: {
    code: `func binarySearch(arr []int, target int) int {
    low := 0
    high := len(arr) - 1
    for low <= high {
        mid := low + (high-low)/2
        if arr[mid] == target {
            return mid
        } else if arr[mid] < target {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return -1
}`,
    lineMap: {
      function: 1,
      setup: 2,
      loop: 4,
      mid: 5,
      compare: 6,
      found: 7,
      low: 9,
      high: 11,
      notFound: 14,
    },
  },
}

export const BINARY_SEARCH_MISS_SENTINEL = -1

const createStep = ({
  lineKey,
  type,
  array = [],
  indices = [], // [mid, low, high]
  foundIndex = null,
  message = '',
  variables = {},
  duration,
}) => ({
  lineKey,
  type,
  array: [...array],
  indices: [...indices],
  foundIndex,
  message,
  variables: { ...variables },
  duration,
})

export function getBinarySearchSource(language = 'javascript') {
  return binarySearchSources[language] ?? binarySearchSources.javascript
}

export function resolveBinarySearchSortLine(language, lineKey) {
  if (!lineKey) return undefined

  const source = getBinarySearchSource(language)
  return (
    source.lineMap[lineKey] ?? binarySearchSources.javascript.lineMap[lineKey]
  )
}

export function generateBinarySearchSteps(inputArray, target) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }
  const arr = [...inputArray]
  const steps = []
  const n = arr.length

  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: arr,
      message: `Binary Search starts. Searching for target value: ${target}.`,
      variables: { target, n },
      duration: 700,
    })
  )

  let low = 0
  let high = n - 1

  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      array: arr,
      indices: [-1, low, high],
      message: `Initialize low = ${low} and high = ${high}.`,
      variables: { low, high, target },
      duration: 650,
    })
  )

  while (low <= high) {
    steps.push(
      createStep({
        lineKey: 'loop',
        type: 'loop',
        array: arr,
        indices: [-1, low, high],
        message: `Condition low <= high (${low} <= ${high}) is true.`,
        variables: { low, high, target },
        duration: 500,
      })
    )

    const mid = Math.floor((low + high) / 2)
    steps.push(
      createStep({
        lineKey: 'mid',
        type: 'mid',
        array: arr,
        indices: [mid, low, high],
        message: `Calculate mid = floor((${low} + ${high}) / 2) = ${mid}.`,
        variables: { low, high, mid, target },
        duration: 700,
      })
    )

    steps.push(
      createStep({
        lineKey: 'compare',
        type: 'compare',
        array: arr,
        indices: [mid, low, high],
        message: `Compare arr[mid] (${arr[mid]}) with target (${target}).`,
        variables: { low, high, mid, target, midValue: arr[mid] },
        duration: 800,
      })
    )

    if (arr[mid] === target) {
      steps.push(
        createStep({
          lineKey: 'found',
          type: 'found',
          array: arr,
          indices: [mid, low, high],
          foundIndex: mid,
          message: `Target found at index ${mid}!`,
          variables: { low, high, mid, target },
          duration: 1000,
        })
      )
      return steps
    } else if (arr[mid] < target) {
      const oldLow = low
      low = mid + 1
      steps.push(
        createStep({
          lineKey: 'low',
          type: 'bounds-update',
          array: arr,
          indices: [mid, low, high],
          message: `${arr[mid]} < ${target}. Update low: low = mid + 1 = ${low}.`,
          variables: { low, high, mid, target, oldLow },
          duration: 750,
        })
      )
    } else {
      const oldHigh = high
      high = mid - 1
      steps.push(
        createStep({
          lineKey: 'high',
          type: 'bounds-update',
          array: arr,
          indices: [mid, low, high],
          message: `${arr[mid]} > ${target}. Update high: high = mid - 1 = ${high}.`,
          variables: { low, high, mid, target, oldHigh },
          duration: 750,
        })
      )
    }
  }

  steps.push(
    createStep({
      lineKey: 'notFound',
      type: 'not-found',
      array: arr,
      message: `low (${low}) > high (${high}). Target ${target} not found.`,
      variables: { target, low, high },
      duration: 900,
    })
  )

  return steps
}

/**
 * Pure Binary Search implementation.
 * Returns the index of target if found in the sorted array, or -1 (source miss sentinel).
 *
 * Duplicate-index contract:
 * When target appears multiple times, returns an index k such that arr[k] === target.
 *
 * @param {Array<number>} inputArray - Sorted array of numbers.
 * @param {number} target - Value to search for.
 * @returns {number} The found index, or -1 (BINARY_SEARCH_MISS_SENTINEL).
 */
export function binarySearch(inputArray, target) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }
  if (typeof target !== 'number' || !Number.isFinite(target)) {
    throw new TypeError('target must be a finite number')
  }

  let low = 0
  let high = inputArray.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (inputArray[mid] === target) {
      return mid
    } else if (inputArray[mid] < target) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return BINARY_SEARCH_MISS_SENTINEL
}

/**
 * Validates the core Binary Search invariant after each recorded animation step.
 *
 * Invariant properties checked:
 * 1. Target absence outside search window:
 *    - All elements arr[0...low-1] < target (or <= target in duplicates).
 *    - All elements arr[high+1...n-1] > target (or >= target in duplicates).
 * 2. Bounds validity:
 *    - In active loop: 0 <= low <= high < n, or low > high upon termination.
 * 3. Mid calculation:
 *    - When mid is defined: mid === Math.floor((low + high) / 2).
 *    - low <= mid <= high.
 * 4. Step snapshot state:
 *    - If type === 'found', arr[foundIndex] === target.
 *    - If type === 'not-found', low > high and target is absent from arr.
 *
 * @param {Object} step - Recorded step snapshot.
 * @param {Array<number>} originalArray - The input sorted array.
 * @param {number} target - The search target.
 * @returns {boolean} True if invariant holds.
 */
export function validateBinarySearchInvariant(step, originalArray, target) {
  if (!step || typeof step !== 'object') return false
  const { low, high, mid } = step.variables || {}
  const n = originalArray.length

  if (step.type === 'start') {
    return Array.isArray(step.array) && step.array.length === n
  }

  if (low !== undefined && high !== undefined) {
    // Left boundary invariant: elements before low cannot be greater than target
    for (let i = 0; i < low && i < n; i++) {
      if (originalArray[i] > target) {
        return false
      }
    }
    // Right boundary invariant: elements after high cannot be smaller than target
    for (let i = Math.max(0, high + 1); i < n; i++) {
      if (originalArray[i] < target) {
        return false
      }
    }
  }

  if (step.type === 'mid' || step.type === 'compare' || step.type === 'found') {
    if (mid !== undefined && low !== undefined && high !== undefined && low <= high) {
      const expectedMid = Math.floor((low + high) / 2)
      if (mid !== expectedMid) return false
      if (mid < low || mid > high) return false
    }
  } else if (step.type === 'bounds-update') {
    const { oldLow, oldHigh } = step.variables || {}
    if (step.lineKey === 'low') {
      if (low !== mid + 1) return false
      if (oldLow !== undefined && Math.floor((oldLow + high) / 2) !== mid) return false
    } else if (step.lineKey === 'high') {
      if (high !== mid - 1) return false
      if (oldHigh !== undefined && Math.floor((low + oldHigh) / 2) !== mid) return false
    }
  }

  if (step.type === 'found') {
    if (step.foundIndex === null || step.foundIndex === undefined) return false
    if (originalArray[step.foundIndex] !== target) return false
  }

  if (step.type === 'not-found') {
    if (low !== undefined && high !== undefined && low <= high) return false
    if (originalArray.includes(target)) return false
  }

  return true
}
