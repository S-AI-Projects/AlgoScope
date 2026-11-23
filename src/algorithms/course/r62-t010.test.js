import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import {
  getKadaneSource,
  kadaneSources,
} from '../kadane/kadaneSources'

// First exported entry: kadane; exercise its displayed JavaScript source string.
const displayedKadaneJavaScript = kadaneSources.kadane.javascript.code

async function executeTemporarySnippet(
  source,
  tempDirectory,
  fileName,
  assertionCode
) {
  const filePath = join(tempDirectory, fileName)
  await writeFile(filePath, `${source}\n${assertionCode}\n`)
  return spawnSync(process.execPath, [filePath], {
    encoding: 'utf8',
    timeout: 5000,
  })
}

describe('kadaneSources.kadane.javascript displayed source', () => {
  it('matches its displayed example and an independently computed input', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'r62-t010-source-'))

    try {
      const execution = await executeTemporarySnippet(
        displayedKadaneJavaScript,
        tempDirectory,
        'kadane-example.cjs',
        `const assert = require('node:assert/strict')
assert.equal(kadane(arr), 6)
assert.equal(kadane([-2, 1, -3]), 1)
console.log(kadane([-2, 1, -3]))`
      )

      expect(execution.status).toBe(0)
      expect(getKadaneSource('javascript')).toBe(displayedKadaneJavaScript)
      expect(displayedKadaneJavaScript).toContain('// Example output: 6')
      expect(execution.stdout.trim().split(/\r?\n/)).toEqual(['6', '1'])
    } finally {
      await rm(tempDirectory, { recursive: true, force: true })
    }
  })

  it('fails when a temporary source copy produces a wrong example result', async () => {
    const incorrectSource = displayedKadaneJavaScript.replace(
      'maxSum = Math.max(maxSum, currentSum);',
      'maxSum = Math.min(maxSum, currentSum);'
    )
    const tempDirectory = await mkdtemp(join(tmpdir(), 'r62-t010-mutation-'))

    expect(incorrectSource).not.toBe(displayedKadaneJavaScript)

    try {
      const execution = await executeTemporarySnippet(
        incorrectSource,
        tempDirectory,
        'kadane-mutated.cjs',
        `const assert = require('node:assert/strict')
assert.equal(kadane(arr), 6)`
      )

      expect(execution.status).toBe(1)
      expect(execution.stderr).toContain('AssertionError')
    } finally {
      await rm(tempDirectory, { recursive: true, force: true })
    }
  })
})
