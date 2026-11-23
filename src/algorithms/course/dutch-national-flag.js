/** Sort 0/1/2 values with a single-pass three-way partition and count work. */
export function sortDutchNationalFlag(values) {
  if (!Array.isArray(values) || values.some((value) => ![0, 1, 2].includes(value))) {
    throw new RangeError('Dutch national flag input must contain only 0, 1, and 2')
  }

  const result = [...values]
  let low = 0
  let middle = 0
  let high = result.length - 1
  let steps = 0
  let comparisons = 0
  let swaps = 0

  function swap(left, right) {
    if (left === right) return
    ;[result[left], result[right]] = [result[right], result[left]]
    swaps += 1
  }

  while (middle <= high) {
    steps += 1
    comparisons += 1
    if (result[middle] === 0) {
      swap(low, middle)
      low += 1
      middle += 1
      continue
    }

    comparisons += 1
    if (result[middle] === 1) {
      middle += 1
    } else {
      swap(middle, high)
      high -= 1
    }
  }

  return { result, steps, comparisons, swaps }
}
