import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  LRUCache,
  LRU_MISS_SENTINEL,
  createDeterministicRandom,
  generateDeterministicOperations,
  generateLRUReplaySteps,
  validateLRUInvariant,
  AnimationPlaybackController,
  lruCacheSources,
  getLRUCacheSource,
} from './lru-cache.js'

describe('R62-T025: LRU Cache Deterministic Execution & Replay', () => {
  describe('1. Core Algorithm & Required Trace', () => {
    it('Capacity 2: putA, putB, getA, putC evicts B; getting A refreshes recency without increasing size', () => {
      const cache = new LRUCache(2)
      expect(cache.capacity).toBe(2)
      expect(cache.size).toBe(0)

      // 1. put('A', 1)
      const putA = cache.put('A', 1)
      expect(putA.evictedKey).toBeNull()
      expect(putA.isUpdate).toBe(false)
      expect(cache.size).toBe(1)
      expect(cache.getRecencyOrder()).toEqual(['A'])

      // 2. put('B', 2)
      const putB = cache.put('B', 2)
      expect(putB.evictedKey).toBeNull()
      expect(putB.isUpdate).toBe(false)
      expect(cache.size).toBe(2)
      expect(cache.getRecencyOrder()).toEqual(['A', 'B']) // 'A' is LRU, 'B' is MRU

      // 3. get('A') -> refreshes recency without increasing size
      const valA = cache.get('A')
      expect(valA).toBe(1)
      expect(cache.size).toBe(2) // size did NOT increase!
      expect(cache.getRecencyOrder()).toEqual(['B', 'A']) // 'B' is now LRU, 'A' refreshed to MRU

      // 4. put('C', 3) -> capacity 2 reached, should evict LRU ('B')!
      const putC = cache.put('C', 3)
      expect(putC.evictedKey).toBe('B') // Evicts B!
      expect(putC.isUpdate).toBe(false)
      expect(cache.size).toBe(2)
      expect(cache.getRecencyOrder()).toEqual(['A', 'C'])

      // Verify B is gone and returns miss sentinel
      expect(cache.get('B')).toBe(LRU_MISS_SENTINEL)
      expect(cache.get('B')).toBe(-1)

      // Verify A and C are still present
      expect(cache.get('A')).toBe(1)
      expect(cache.get('C')).toBe(3)
    })

    it('updates existing key without evicting or increasing size', () => {
      const cache = new LRUCache(2)
      cache.put('K1', 10)
      cache.put('K2', 20)
      expect(cache.size).toBe(2)

      const updateRes = cache.put('K1', 99)
      expect(updateRes.isUpdate).toBe(true)
      expect(updateRes.evictedKey).toBeNull()
      expect(cache.size).toBe(2)
      expect(cache.get('K1')).toBe(99)
      expect(cache.getRecencyOrder()).toEqual(['K2', 'K1'])
    })

    it('handles explicit evict and peek without side effects', () => {
      const cache = new LRUCache(3)
      cache.put('X', 1)
      cache.put('Y', 2)

      // peek does not modify recency
      expect(cache.peek('X')).toBe(1)
      expect(cache.getRecencyOrder()).toEqual(['X', 'Y'])

      // evict removes LRU ('X')
      expect(cache.evict()).toBe('X')
      expect(cache.size).toBe(1)
      expect(cache.has('X')).toBe(false)
      expect(cache.has('Y')).toBe(true)
    })

    it('throws RangeError on invalid capacity', () => {
      expect(() => new LRUCache(0)).toThrow(RangeError)
      expect(() => new LRUCache(-1)).toThrow(RangeError)
      expect(() => new LRUCache(1.5)).toThrow(RangeError)
    })
  })

  describe('2. Deterministic Replay & Seed Repeatability', () => {
    it('produces identical pseudo-random floats from the same seed', () => {
      const rng1 = createDeterministicRandom(42)
      const rng2 = createDeterministicRandom(42)
      for (let i = 0; i < 10; i++) {
        expect(rng1()).toBe(rng2())
      }
    })

    it('produces identical operation sequences from the same seed', () => {
      const ops1 = generateDeterministicOperations({ seed: 98765, count: 20 })
      const ops2 = generateDeterministicOperations({ seed: 98765, count: 20 })
      const opsDiff = generateDeterministicOperations({ seed: 12345, count: 20 })

      expect(ops1).toEqual(ops2)
      expect(ops1).not.toEqual(opsDiff)
    })

    it('replays identical step traces given the same operation sequence', () => {
      const ops = [
        { op: 'put', key: 'A', value: 1 },
        { op: 'put', key: 'B', value: 2 },
        { op: 'get', key: 'A' },
        { op: 'put', key: 'C', value: 3 },
      ]

      const steps1 = generateLRUReplaySteps(ops, 2, { stepDurationMs: 50 })
      const steps2 = generateLRUReplaySteps(ops, 2, { stepDurationMs: 50 })

      expect(steps1).toEqual(steps2)
      expect(steps1).toHaveLength(5) // 1 init + 4 ops

      // Step 3 was get('A') -> hit
      expect(steps1[3].type).toBe('get-hit')
      expect(steps1[3].isHit).toBe(true)
      expect(steps1[3].cacheState.recencyOrder).toEqual(['B', 'A'])

      // Step 4 was put('C') -> evict 'B'
      expect(steps1[4].type).toBe('put-evict')
      expect(steps1[4].evictedKey).toBe('B')
      expect(steps1[4].cacheState.recencyOrder).toEqual(['A', 'C'])
    })

    it('guarantees snapshot immutability across replay steps', () => {
      const ops = [
        { op: 'put', key: 'A', value: 10 },
        { op: 'put', key: 'B', value: 20 },
        { op: 'put', key: 'C', value: 30 },
      ]
      const steps = generateLRUReplaySteps(ops, 2)
      const frozenSnapshots = steps.map((s) => JSON.parse(JSON.stringify(s.cacheState)))

      // Verify that after all steps executed, earlier snapshots remain unaltered
      steps.forEach((step, idx) => {
        expect(step.cacheState).toEqual(frozenSnapshots[idx])
      })
    })
  })

  describe('3. Animation Timing Control in Tests', () => {
    it('controls step timestamps deterministically without wall-clock sleep', () => {
      const ops = [
        { op: 'put', key: 'A', value: 1 },
        { op: 'get', key: 'A' },
      ]
      const stepDuration = 250
      const steps = generateLRUReplaySteps(ops, 2, { stepDurationMs: stepDuration })

      expect(steps[0].timestamp).toBe(0)
      expect(steps[1].timestamp).toBe(250)
      expect(steps[2].timestamp).toBe(500)
    })

    it('supports custom virtual clock function', () => {
      const ops = [{ op: 'put', key: 'M', value: 100 }]
      const virtualClock = (idx) => idx * 1000 + 50
      const steps = generateLRUReplaySteps(ops, 2, { clock: virtualClock })

      expect(steps[0].timestamp).toBe(50)
      expect(steps[1].timestamp).toBe(1050)
    })

    it('controls playback navigation through AnimationPlaybackController', () => {
      const controller = new AnimationPlaybackController({ stepDurationMs: 150 })
      const totalSteps = 6

      expect(controller.currentStep).toBe(0)
      expect(controller.virtualTime).toBe(0)

      const s1 = controller.next(totalSteps)
      expect(s1.currentStep).toBe(1)
      expect(s1.virtualTime).toBe(150)

      const sJump = controller.advanceToStep(4, totalSteps)
      expect(sJump.currentStep).toBe(4)
      expect(sJump.virtualTime).toBe(600)

      const sPrev = controller.prev(totalSteps)
      expect(sPrev.currentStep).toBe(3)
      expect(sPrev.virtualTime).toBe(450)

      // Clamp boundary
      const sOver = controller.advanceToStep(100, totalSteps)
      expect(sOver.currentStep).toBe(5)
      expect(sOver.virtualTime).toBe(750)
    })
  })

  describe('4. Invariant Verification', () => {
    it('validates invariants for all steps of required trace', () => {
      const ops = [
        { op: 'put', key: 'A', value: 1 },
        { op: 'put', key: 'B', value: 2 },
        { op: 'get', key: 'A' },
        { op: 'put', key: 'C', value: 3 },
      ]
      const steps = generateLRUReplaySteps(ops, 2)
      for (const step of steps) {
        expect(() => validateLRUInvariant(step, 2)).not.toThrow()
        expect(validateLRUInvariant(step, 2)).toBe(true)
      }
    })

    it('fails when capacity is violated', () => {
      const corruptStep = {
        type: 'put',
        key: 'Z',
        cacheState: {
          size: 3,
          capacity: 2,
          recencyOrder: ['A', 'B', 'Z'],
          entries: [{ key: 'A' }, { key: 'B' }, { key: 'Z' }],
        },
      }
      expect(() => validateLRUInvariant(corruptStep, 2)).toThrow(/Capacity invariant violated/)
    })

    it('fails when recency refresh invariant is violated', () => {
      const corruptStep = {
        type: 'get-hit',
        key: 'A',
        isHit: true,
        cacheState: {
          size: 2,
          capacity: 2,
          recencyOrder: ['A', 'B'], // 'A' should have been at the end!
          entries: [{ key: 'A' }, { key: 'B' }],
        },
      }
      expect(() => validateLRUInvariant(corruptStep, 2)).toThrow(/Get-hit invariant violated/)
    })
  })

  describe('5. Source Strings Isolated VM Execution', () => {
    it('executes displayed JavaScript source in an isolated VM sandbox', () => {
      expect(lruCacheSources.javascript).toBeDefined()
      expect(lruCacheSources.python).toBeDefined()
      const jsSource = getLRUCacheSource('javascript')
      expect(jsSource).toBeDefined()
      expect(typeof jsSource.code).toBe('string')
      expect(jsSource.lineMap).toBeDefined()

      const sandbox = { Map }
      const context = vm.createContext(sandbox)
      const script = new vm.Script(jsSource.code + '\nglobalThis.LRUCache = LRUCache;')
      script.runInContext(context)

      const VMLRUCache = context.LRUCache
      expect(typeof VMLRUCache).toBe('function')

      const vmCache = new VMLRUCache(2)
      vmCache.put('A', 1)
      vmCache.put('B', 2)
      expect(vmCache.get('A')).toBe(1)
      vmCache.put('C', 3) // Evicts B!
      expect(vmCache.get('B')).toBe(-1)
      expect(vmCache.get('A')).toBe(1)
      expect(vmCache.get('C')).toBe(3)
    })
  })
})
