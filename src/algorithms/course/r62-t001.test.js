import { describe, expect, it } from 'vitest'
import { ternarySearch } from './ternary-search'

describe('ternarySearch contract', () => {
  it('finds target 7 in the sorted fixture [1, 3, 5, 7, 9]', () => {
    const sortedArray = [1, 3, 5, 7, 9]

    expect(ternarySearch(sortedArray, 7)).toBe(3)
    expect(sortedArray).toEqual([1, 3, 5, 7, 9])
  })

  it('returns -1 when target 4 is missing from the fixture', () => {
    expect(ternarySearch([1, 3, 5, 7, 9], 4)).toBe(-1)
  })

  it('returns -1 for empty input', () => {
    expect(ternarySearch([], 7)).toBe(-1)
  })
})
