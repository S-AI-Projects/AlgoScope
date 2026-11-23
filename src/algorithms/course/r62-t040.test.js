import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { editDistance } from './edit-distance.js'

describe('unit-cost edit distance', () => {
  it('returns the expected standard, identity, and empty-string distances', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('same', 'same')).toBe(0)
    expect(editDistance('', 'abc')).toBe(3)
  })

  it('kills a temporary mutant that reverses the substitution equality condition', () => {
    const source = readFileSync(new URL('./edit-distance.js', import.meta.url), 'utf8')
    const mutant = source.replace(
      'first[row - 1] === second[col - 1] ? 0 : 1',
      'first[row - 1] !== second[col - 1] ? 0 : 1'
    )
    expect(mutant).not.toBe(source)

    const encoded = Buffer.from(mutant).toString('base64')
    const script = `const { editDistance } = await import('data:text/javascript;base64,${encoded}'); console.log(JSON.stringify([editDistance('kitten', 'sitting'), editDistance('same', 'same'), editDistance('', 'abc')]));`
    const mutantResults = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' }))

    expect(mutantResults).not.toEqual([3, 0, 3])
    expect(mutantResults[1]).not.toBe(0)
  })
})
