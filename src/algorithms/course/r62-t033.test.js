import { describe, expect, it } from 'vitest'
import { Trie } from './trie-insert-search.js'

describe('Trie insert and search behavior', () => {
  it('distinguishes a complete word from a shared prefix and keeps reinsertion idempotent', () => {
    const trie = new Trie()
    const referenceWords = new Set()

    for (const word of ['car', 'cat']) {
      trie.insert(word)
      referenceWords.add(word)
    }
    trie.insert('car')
    referenceWords.add('car')

    const referenceSearch = (word) => referenceWords.has(word)
    const referencePrefix = (prefix) => [...referenceWords].some((word) => word.startsWith(prefix))

    expect(trie.search('ca')).toMatchObject({ found: referenceSearch('ca'), path: ['', 'c', 'a'] })
    expect(trie.startsWith('ca')).toMatchObject({ found: referencePrefix('ca'), path: ['', 'c', 'a'] })
    expect(trie.search('car').found).toBe(referenceSearch('car'))
    expect(trie.search('cat').found).toBe(referenceSearch('cat'))
    expect(trie.toJSON()).toEqual({
      label: 'root', fullPrefix: '', isEnd: false, children: [{
        label: 'c', fullPrefix: 'c', isEnd: false, children: [{
          label: 'a', fullPrefix: 'ca', isEnd: false, children: [
            { label: 'r', fullPrefix: 'car', isEnd: true, children: [] },
            { label: 't', fullPrefix: 'cat', isEnd: true, children: [] },
          ],
        }],
      }],
    })
  })
})
