export function generateZSteps(text, pattern) {
  if (typeof text !== 'string' || typeof pattern !== 'string') {
    throw new TypeError('Text and pattern must be strings.')
  }

  if (!text || !pattern) return { steps: [], matches: [] }

  // A Symbol separator cannot collide with any character in either input.
  const separator = Symbol('z-algorithm-separator')
  const combined = [...pattern.split(''), separator, ...text.split('')]
  const n = combined.length
  const z = new Array(n).fill(0)
  z[0] = n
  let l = 0,
    r = 0

  const steps = [{ i: 0, z: [...z], l, r }]
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l])
    while (i + z[i] < n && combined[z[i]] === combined[i + z[i]]) z[i]++
    if (i + z[i] > r) {
      l = i
      r = i + z[i]
    }
    steps.push({ i, z: [...z], l, r })
  }

  const patternLength = pattern.length
  const matches = steps[steps.length - 1].z
    .slice(patternLength + 1)
    .map((value, index) => (value === patternLength ? index : -1))
    .filter((index) => index !== -1)

  return { steps, matches }
}
