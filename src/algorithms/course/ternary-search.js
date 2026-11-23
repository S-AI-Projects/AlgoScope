/**
 * Searches a sorted array using ternary search.
 * Returns the matching index, or -1 when the target is absent.
 */
export function ternarySearch(sortedArray, target) {
  let left = 0
  let right = sortedArray.length - 1

  while (left <= right) {
    const third = Math.floor((right - left) / 3)
    const firstMiddle = left + third
    const secondMiddle = right - third

    if (sortedArray[firstMiddle] === target) return firstMiddle
    if (sortedArray[secondMiddle] === target) return secondMiddle

    if (target < sortedArray[firstMiddle]) {
      right = firstMiddle - 1
    } else if (target > sortedArray[secondMiddle]) {
      left = secondMiddle + 1
    } else {
      left = firstMiddle + 1
      right = secondMiddle - 1
    }
  }

  return -1
}
