import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { searchingSources } from '../searching/searchingSources.js'

describe('searchingSources.linearSearch.javascript displayed snippet', () => {
  function runDisplayedSnippet(arr, target) {
    const source = searchingSources.linearSearch.javascript.code
    const payload = JSON.stringify({ arr, target })
    const script = `${source}\nconst input = ${payload}; console.log(JSON.stringify(linearSearch(input.arr, input.target)));`
    return JSON.parse(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }))
  }

  it('matches the displayed example and a separately computed first-duplicate case', () => {
    // Displayed example fixture: find 6 in [2, 4, 6, 8].
    expect(runDisplayedSnippet([2, 4, 6, 8], 6)).toBe(2)
    // Independent input: first of two matching 9s is at index 0.
    expect(runDisplayedSnippet([9, 2, 9], 9)).toBe(0)
    expect(Object.keys(searchingSources.linearSearch)).toContain('javascript')
  })
})
