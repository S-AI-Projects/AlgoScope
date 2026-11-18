const createStep = ({
  lineKey,
  type,
  array,
  indices = [],
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

/**
 * Computes an interpolation search and its replay trace for a sorted numeric array.
 * Returns the matching index, or -1 when the target is absent.
 */
export function runInterpolationSearch(inputArray, target) {
  const array = [...inputArray]
  const steps = []
  const size = array.length
  let low = 0
  let high = size - 1
  let index = -1

  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array,
      message: `Interpolation Search starts. Searching for target value: ${target}.`,
      variables: { target, size },
      duration: 700,
    })
  )

  steps.push(
    createStep({
      lineKey: 'setup',
      type: 'setup',
      array,
      indices: [-1, low, high],
      message: `Initialize low = ${low} and high = ${high}.`,
      variables: { low, high, target },
      duration: 650,
    })
  )

  while (
    low <= high &&
    target >= array[low] &&
    target <= array[high]
  ) {
    // Equal endpoints have no interpolation range, so handle them before division.
    if (array[low] === array[high]) {
      if (array[low] === target) index = low
      break
    }

    const probe =
      low +
      Math.floor(
        ((target - array[low]) * (high - low)) /
          (array[high] - array[low])
      )

    steps.push(
      createStep({
        lineKey: 'probe',
        type: 'probe',
        array,
        indices: [probe, low, high],
        message: `Estimate position ${probe} from the target's value range.`,
        variables: { low, high, probe, target },
        duration: 650,
      })
    )

    const value = array[probe]
    steps.push(
      createStep({
        lineKey: 'compare',
        type: 'compare',
        array,
        indices: [probe, low, high],
        message: `Compare arr[${probe}] (${value}) with ${target}.`,
        variables: { low, high, probe, target, currentValue: value },
        duration: 650,
      })
    )

    if (value === target) {
      index = probe
      break
    }

    if (value < target) {
      low = probe + 1
    } else {
      high = probe - 1
    }

    steps.push(
      createStep({
        lineKey: 'update',
        type: 'update',
        array,
        indices: [-1, low, high],
        message: `Narrow the search range to low = ${low} and high = ${high}.`,
        variables: { low, high, target },
        duration: 600,
      })
    )
  }

  if (index !== -1) {
    steps.push(
      createStep({
        lineKey: 'found',
        type: 'found',
        array,
        indices: [index, low, high],
        foundIndex: index,
        message: `Target found at index ${index}!`,
        variables: { index, target },
        duration: 1000,
      })
    )
  } else {
    steps.push(
      createStep({
        lineKey: 'notFound',
        type: 'not-found',
        array,
        indices: [-1, low, high],
        message: `Target ${target} not found in the array. Returning -1.`,
        variables: { low, high, target },
        duration: 900,
      })
    )
  }

  return { index, steps }
}

export function interpolationSearch(inputArray, target) {
  return runInterpolationSearch(inputArray, target).index
}

export function generateInterpolationSearchSteps(inputArray, target) {
  return runInterpolationSearch(inputArray, target).steps
}
