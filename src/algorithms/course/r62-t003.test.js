import { describe, expect, it } from 'vitest'
import { generateZSteps } from '../stringAlgo/zAlgorithm'

function referenceMatches(text, pattern) {
  const matches = []
  for (let index = 0; index <= text.length - pattern.length; index++) {
    if (text.slice(index, index + pattern.length) === pattern) {
      matches.push(index)
    }
  }
  return matches
}

describe('Z algorithm visualization results', () => {
  it('matches the independent reference for overlapping repeated text', () => {
    const text = 'aaaa'
    const pattern = 'aa'
    const result = generateZSteps(text, pattern)
    const finalZArray = result.steps.at(-1).z.slice(pattern.length + 1)

    expect(result.matches).toEqual([0, 1, 2])
    expect(result.matches).toEqual(referenceMatches(text, pattern))
    expect(finalZArray).toEqual([2, 2, 2, 1])
  })

  it('treats dollar signs in text and pattern as ordinary characters', () => {
    const text = '$a$a$'
    const pattern = '$a'
    const result = generateZSteps(text, pattern)
    const finalZArray = result.steps.at(-1).z.slice(pattern.length + 1)

    expect(result.matches).toEqual([0, 2])
    expect(result.matches).toEqual(referenceMatches(text, pattern))
    expect(finalZArray).toEqual([2, 0, 2, 0, 1])
  })
})
