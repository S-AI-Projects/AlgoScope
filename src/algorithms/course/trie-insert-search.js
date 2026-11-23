class TrieNode {
  constructor() {
    this.children = {}
    this.isEnd = false
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode()
  }

  insert(word) {
    let node = this.root
    const path = ['']
    for (const char of word) {
      if (!node.children[char]) node.children[char] = new TrieNode()
      node = node.children[char]
      path.push(char)
    }
    node.isEnd = true
    return path
  }

  search(word) {
    let node = this.root
    const path = ['']
    for (const char of word) {
      if (!node.children[char]) return { found: false, path }
      node = node.children[char]
      path.push(char)
    }
    return { found: node.isEnd, path }
  }

  startsWith(prefix) {
    let node = this.root
    const path = ['']
    for (const char of prefix) {
      if (!node.children[char]) return { found: false, path }
      node = node.children[char]
      path.push(char)
    }
    return { found: true, path }
  }

  toJSON(node = this.root, prefix = '') {
    return {
      label: prefix === '' ? 'root' : prefix[prefix.length - 1],
      fullPrefix: prefix,
      isEnd: node.isEnd,
      children: Object.entries(node.children).map(([char, child]) =>
        this.toJSON(child, prefix + char)
      ),
    }
  }
}
