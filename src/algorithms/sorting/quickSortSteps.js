import { createStep } from '../../lib/utils.js'

/**
 * Concrete reference fixtures for QuickSort verification.
 * Explains partitioning behavior, Lomuto partition with high element as pivot,
 * and expected output states for representative inputs.
 */
export const QUICK_SORT_FIXTURES = [
  {
    name: 'unsorted-distinct',
    input: [3, 1, 2],
    expectedAscending: [1, 2, 3],
    expectedDescending: [3, 2, 1],
    explanation:
      'Unsorted array with distinct elements. Pivot selects 2 (high index). 1 < 2 is swapped to front, 3 > 2 stays right, pivot placed at index 1.',
  },
  {
    name: 'duplicates',
    input: [2, 2, 1],
    expectedAscending: [1, 2, 2],
    expectedDescending: [2, 2, 1],
    explanation:
      'Array with duplicate values. Pivot selects 1. 1 is placed at index 0 after final swap, yielding correctly sorted [1, 2, 2].',
  },
  {
    name: 'already-ordered',
    input: [1, 2, 3],
    expectedAscending: [1, 2, 3],
    expectedDescending: [3, 2, 1],
    explanation:
      'Already sorted ascending array. Lomuto partition compares each element against pivot 3, placing pivot at end without swaps.',
  },
  {
    name: 'reversed',
    input: [3, 2, 1],
    expectedAscending: [1, 2, 3],
    expectedDescending: [3, 2, 1],
    explanation:
      'Reversed array. Worst-case partition for Lomuto high-pivot, partitioning elements one by one into [1, 2, 3].',
  },
  {
    name: 'singleton',
    input: [42],
    expectedAscending: [42],
    expectedDescending: [42],
    explanation:
      'Smallest non-trivial collection (single element). Base case low === high triggers immediately without partitioning.',
  },
  {
    name: 'empty',
    input: [],
    expectedAscending: [],
    expectedDescending: [],
    explanation:
      'Smallest supported collection (empty collection). Handles boundary gracefully without recursion or errors.',
  },
]

/**
 * Pure quick sort implementation separating pure computation from visualization steps.
 * Supports ascending ('asc', default) and descending ('desc') interfaces.
 *
 * @param {number[]} inputArray
 * @param {object} [options]
 * @param {'asc' | 'desc'} [options.order]
 * @returns {number[]} New sorted array.
 */
export function quickSort(inputArray, options = {}) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }

  const order = options.order === 'desc' ? 'desc' : 'asc'
  const arr = [...inputArray]
  if (arr.length <= 1) return arr

  const partition = (low, high) => {
    const pivot = arr[high]
    let i = low - 1
    for (let j = low; j < high; j++) {
      const condition = order === 'asc' ? arr[j] < pivot : arr[j] > pivot
      if (condition) {
        i++
        if (i !== j) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
      }
    }
    ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
    return i + 1
  }

  const sort = (low, high) => {
    if (low < high) {
      const pi = partition(low, high)
      sort(low, pi - 1)
      sort(pi + 1, high)
    }
  }

  sort(0, arr.length - 1)
  return arr
}

/**
 * Validates step invariants during QuickSort playback.
 * Verifies bounds coherence and final array sortedness.
 *
 * @param {object} step
 * @param {number[]} originalArray
 * @returns {boolean}
 */
export function validateQuickSortInvariant(step, originalArray) {
  if (!step || typeof step !== 'object') {
    throw new Error('Step must be an object')
  }
  if (!Array.isArray(step.array)) {
    throw new Error('Step must contain an array')
  }

  // Length must remain invariant throughout execution
  if (step.array.length !== originalArray.length) {
    throw new Error('Array length mutated during sort')
  }

  // Multiset conservation: same elements must exist
  const origCounts = {}
  for (const x of originalArray) origCounts[x] = (origCounts[x] || 0) + 1
  const stepCounts = {}
  for (const x of step.array) stepCounts[x] = (stepCounts[x] || 0) + 1
  for (const key of Object.keys(origCounts)) {
    if (origCounts[key] !== stepCounts[key]) {
      throw new Error(`Multiset conservation violated for element ${key}`)
    }
  }

  // On complete step, array must be in ascending order
  if (step.type === 'complete') {
    for (let i = 1; i < step.array.length; i++) {
      if (step.array[i - 1] > step.array[i]) {
        throw new Error('Terminal step array is not sorted')
      }
    }
  }

  return true
}

export const quickSortSources = {
  javascript: {
    code: `function quickSort(arr, low, high) {
  if (low < high) {
    let pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}

function partition(arr, low, high) {
  let pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 9,
      pivotSelect: 10,
      compare: 13,
      swap: 15,
      finalSwap: 18,
      complete: 20,
    },
  },
  python: {
    code: `def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 7,
      pivotSelect: 8,
      compare: 11,
      swap: 13,
      finalSwap: 14,
      complete: 15,
    },
  },
  java: {
    code: `public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 8,
      pivotSelect: 9,
      compare: 12,
      swap: 15,
      finalSwap: 20,
      complete: 22,
    },
  },
  cpp: {
    code: `void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 8,
      pivotSelect: 9,
      compare: 12,
      swap: 14,
      finalSwap: 17,
      complete: 19,
    },
  },
  c: {
    code: `void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 8,
      pivotSelect: 9,
      compare: 12,
      swap: 15,
      finalSwap: 20,
      complete: 22,
    },
  },
  go: {
    code: `func quickSort(arr []int, low, high int) {
    if low < high {
        pi := partition(arr, low, high)
        quickSort(arr, low, pi - 1)
        quickSort(arr, pi + 1, high)
    }
}

func partition(arr []int, low, high int) int {
    pivot := arr[high]
    i := low - 1
    for j := low; j < high; j++ {
        if arr[j] < pivot {
            i++
            arr[i], arr[j] = arr[j], arr[i]
        }
    }
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
}`,
    lineMap: {
      function: 1,
      recursion: 2,
      partitionCall: 3,
      partitionFunc: 8,
      pivotSelect: 9,
      compare: 12,
      swap: 14,
      finalSwap: 17,
      complete: 19,
    },
  },
  rust: {
    code: `pub fn quick_sort(arr: &mut [i32]) {
    let len = arr.len();
    if len <= 1 { return; }
    _quick_sort(arr, 0, (len - 1) as isize);
}

fn _quick_sort(arr: &mut [i32], low: isize, high: isize) {
    if low < high {
        let pi = partition(arr, low, high);
        _quick_sort(arr, low, pi - 1);
        _quick_sort(arr, pi + 1, high);
    }
}

fn partition(arr: &mut [i32], low: isize, high: isize) -> isize {
    let pivot = arr[high as usize];
    let mut i = low - 1;
    for j in low..high {
        if arr[j as usize] < pivot {
            i += 1;
            arr.swap(i as usize, j as usize);
        }
    }
    arr.swap((i + 1) as usize, high as usize);
    i + 1
}`,
    lineMap: {
      function: 1,
      recursion: 8,
      partitionCall: 9,
      partitionFunc: 15,
      pivotSelect: 16,
      compare: 19,
      swap: 21,
      finalSwap: 24,
      complete: 25,
    },
  },
}

export function getQuickSortSource(language = 'javascript') {
  return quickSortSources[language] ?? quickSortSources.javascript
}

export function resolveQuickSortLine(language, lineKey) {
  if (!lineKey) return undefined
  const source = getQuickSortSource(language)
  return source.lineMap[lineKey] ?? quickSortSources.javascript.lineMap[lineKey]
}

/**
 * Generates visualization steps for QuickSort.
 * Preserves the exact public interface and guarantees snapshot immutability.
 *
 * @param {number[]} inputArray
 * @returns {Array<object>}
 */
export function generateQuickSortSteps(inputArray) {
  if (!Array.isArray(inputArray)) return []

  const arr = [...inputArray]
  const steps = []
  const n = arr.length
  const sortedIndices = []

  // Boundary check: empty array
  if (n === 0) {
    steps.push(
      createStep({
        lineKey: 'complete',
        type: 'complete',
        array: [],
        indices: [],
        sortedIndices: [],
        message: 'Empty array is already sorted.',
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
        variables: { n: 1 },
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
        message: 'Quick Sort is complete.',
        variables: { n: 1 },
        duration: 500,
      })
    )
    return steps
  }

  const performQuickSort = (low, high) => {
    steps.push(
      createStep({
        lineKey: 'recursion',
        type: 'outer-loop',
        array: [...arr],
        indices: [low, high],
        sortedIndices: [...sortedIndices],
        message: `Quick Sort on range [${low}, ${high}].`,
        variables: { low, high },
        duration: 500,
      })
    )

    if (low < high) {
      const pi = performPartition(low, high)
      if (!sortedIndices.includes(pi)) sortedIndices.push(pi)
      performQuickSort(low, pi - 1)
      performQuickSort(pi + 1, high)
    } else if (low === high) {
      if (!sortedIndices.includes(low)) sortedIndices.push(low)
    }
  }

  const performPartition = (low, high) => {
    const pivot = arr[high]
    steps.push(
      createStep({
        lineKey: 'pivotSelect',
        type: 'pivot',
        array: [...arr],
        indices: [high],
        sortedIndices: [...sortedIndices],
        message: `Selected pivot ${pivot} at index ${high}.`,
        variables: { low, high, pivot },
        duration: 600,
      })
    )

    let i = low - 1
    for (let j = low; j < high; j++) {
      steps.push(
        createStep({
          lineKey: 'compare',
          type: 'compare',
          array: [...arr],
          indices: [j, high],
          sortedIndices: [...sortedIndices],
          message: `Compare ${arr[j]} with pivot ${pivot}.`,
          variables: { low, high, pivot, i, j },
          duration: 400,
        })
      )

      if (arr[j] < pivot) {
        i++
        if (i !== j) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          steps.push(
            createStep({
              lineKey: 'swap',
              type: 'swap',
              array: [...arr],
              indices: [i, j],
              sortedIndices: [...sortedIndices],
              message: `${arr[j]} is smaller than pivot, move it to index ${i}.`,
              variables: { low, high, pivot, i, j },
              duration: 600,
            })
          )
        }
      }
    }

    ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
    steps.push(
      createStep({
        lineKey: 'finalSwap',
        type: 'swap',
        array: [...arr],
        indices: [i + 1, high],
        sortedIndices: [...sortedIndices],
        message: `Place pivot ${pivot} in its correct position at index ${i + 1}.`,
        variables: { low, high, pivot, pi: i + 1 },
        duration: 700,
      })
    )

    return i + 1
  }

  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: [...arr],
      indices: [],
      sortedIndices: [],
      message: 'Quick Sort starts.',
      variables: { n },
      duration: 700,
    })
  )

  performQuickSort(0, n - 1)

  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: [...arr],
      indices: [],
      sortedIndices: Array.from({ length: n }, (_, index) => index),
      message: 'Quick Sort is complete.',
      variables: { n },
      duration: 900,
    })
  )

  return steps
}
