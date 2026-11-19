/**
 * LRU Cache: Pure algorithm, deterministic replay, and invariant verification module.
 *
 * Coursework module for R62-T025.
 * Preserves the distinction between pure algorithm results, replay steps,
 * source strings, and UI timing controllers.
 */

export const LRU_MISS_SENTINEL = -1

/**
 * Creates a deterministic pseudo-random number generator (Mulberry32).
 * @param {number} seed
 * @returns {() => number} Returns pseudo-random float in [0, 1).
 */
export function createDeterministicRandom(seed = 12345) {
  let s = Math.floor(seed) >>> 0
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pure LRU Cache implementation using internal Map ordering.
 */
export class LRUCache {
  /**
   * @param {number} capacity Maximum number of entries.
   */
  constructor(capacity = 2) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError(`Capacity must be a positive integer, got ${capacity}`)
    }
    this.capacity = capacity
    this.map = new Map()
  }

  get size() {
    return this.map.size
  }

  /**
   * Retrieves value for key, refreshing its recency.
   * Returns LRU_MISS_SENTINEL (-1) on miss.
   * @param {*} key
   * @returns {*}
   */
  get(key) {
    if (!this.map.has(key)) {
      return LRU_MISS_SENTINEL
    }
    const value = this.map.get(key)
    // Refresh recency: delete and re-insert at end (most recently used)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  /**
   * Inspects value without refreshing recency.
   * @param {*} key
   * @returns {*}
   */
  peek(key) {
    if (!this.map.has(key)) {
      return LRU_MISS_SENTINEL
    }
    return this.map.get(key)
  }

  /**
   * Inserts or updates key/value pair.
   * If key exists, updates value and recency without evicting.
   * If key is new and size reaches capacity, evicts least recently used item.
   * @param {*} key
   * @param {*} value
   * @returns {{ evictedKey: * | null, isUpdate: boolean }}
   */
  put(key, value) {
    let evictedKey = null
    const isUpdate = this.map.has(key)

    if (isUpdate) {
      this.map.delete(key)
    } else if (this.map.size >= this.capacity) {
      // Evict least recently used (first inserted entry)
      const lruKey = this.map.keys().next().value
      this.map.delete(lruKey)
      evictedKey = lruKey
    }

    this.map.set(key, value)
    return { evictedKey, isUpdate }
  }

  /**
   * Explicitly evicts the least recently used entry.
   * @returns {* | null} Evicted key or null if empty.
   */
  evict() {
    if (this.map.size === 0) return null
    const lruKey = this.map.keys().next().value
    this.map.delete(lruKey)
    return lruKey
  }

  has(key) {
    return this.map.has(key)
  }

  clear() {
    this.map.clear()
  }

  /**
   * Returns array of keys ordered from least recently used (index 0)
   * to most recently used (last index).
   * @returns {Array<*>}
   */
  getRecencyOrder() {
    return Array.from(this.map.keys())
  }

  /**
   * Creates an immutable snapshot of current state.
   */
  snapshot() {
    return {
      size: this.map.size,
      capacity: this.capacity,
      recencyOrder: Array.from(this.map.keys()),
      entries: Array.from(this.map.entries()).map(([k, v]) => ({ key: k, value: v })),
    }
  }
}

/**
 * Generates deterministic sequence of operations from a seed.
 * @param {object} options
 * @param {number} [options.seed] Seed for PRNG.
 * @param {number} [options.count] Number of operations.
 * @param {Array<*>} [options.keySpace] Possible keys.
 * @param {number} [options.getRatio] Fraction of operations that are get.
 * @returns {Array<{ op: 'get' | 'put', key: *, value?: * }>}
 */
export function generateDeterministicOperations({
  seed = 42,
  count = 10,
  keySpace = ['A', 'B', 'C', 'D'],
  getRatio = 0.4,
} = {}) {
  const rng = createDeterministicRandom(seed)
  const ops = []
  let valCounter = 1

  for (let i = 0; i < count; i++) {
    const keyIdx = Math.floor(rng() * keySpace.length)
    const key = keySpace[keyIdx]
    const isGet = rng() < getRatio && i > 0 // Ensure initial op is put

    if (isGet) {
      ops.push({ op: 'get', key })
    } else {
      ops.push({ op: 'put', key, value: valCounter++ })
    }
  }
  return ops
}

/**
 * Generates an immutable, deterministic step trace of LRU replay.
 * Allows virtual timing control through stepDurationMs or custom clock.
 *
 * @param {Array<{ op: 'get' | 'put' | 'evict', key?: *, value?: * }>} operations
 * @param {number} capacity
 * @param {object} [options]
 * @param {number} [options.stepDurationMs] Milliseconds per step.
 * @param {(stepIndex: number) => number} [options.clock] Custom timestamp function.
 * @returns {Array<object>} Array of step snapshots.
 */
export function generateLRUReplaySteps(operations, capacity = 2, options = {}) {
  if (!Array.isArray(operations)) {
    throw new TypeError('operations must be an array')
  }

  const stepDurationMs = typeof options.stepDurationMs === 'number' ? options.stepDurationMs : 100
  const clock = typeof options.clock === 'function' ? options.clock : (idx) => idx * stepDurationMs

  const cache = new LRUCache(capacity)
  const steps = []

  // Step 0: Initial state
  steps.push({
    stepIndex: 0,
    type: 'init',
    op: { op: 'init' },
    description: `Initialized LRU cache with capacity ${capacity}`,
    cacheState: cache.snapshot(),
    timestamp: clock(0),
    result: null,
  })

  operations.forEach((opObj, idx) => {
    const stepIdx = idx + 1
    const { op, key, value } = opObj

    if (op === 'put') {
      const { evictedKey, isUpdate } = cache.put(key, value)
      let desc = isUpdate
        ? `Updated key "${key}" to value ${value} (refreshed recency)`
        : `Inserted key "${key}" with value ${value}`

      if (evictedKey !== null) {
        desc += ` (evicted least recently used key "${evictedKey}")`
      }

      steps.push({
        stepIndex: stepIdx,
        type: evictedKey !== null ? 'put-evict' : isUpdate ? 'put-update' : 'put',
        op: { ...opObj },
        key,
        value,
        evictedKey,
        isUpdate,
        result: { evictedKey, isUpdate },
        description: desc,
        cacheState: cache.snapshot(),
        timestamp: clock(stepIdx),
      })
    } else if (op === 'get') {
      const retrieved = cache.get(key)
      const isHit = retrieved !== LRU_MISS_SENTINEL
      const desc = isHit
        ? `Cache HIT on key "${key}": value = ${retrieved} (refreshed recency)`
        : `Cache MISS on key "${key}"`

      steps.push({
        stepIndex: stepIdx,
        type: isHit ? 'get-hit' : 'get-miss',
        op: { ...opObj },
        key,
        value: retrieved,
        isHit,
        result: retrieved,
        description: desc,
        cacheState: cache.snapshot(),
        timestamp: clock(stepIdx),
      })
    } else if (op === 'evict') {
      const evictedKey = cache.evict()
      steps.push({
        stepIndex: stepIdx,
        type: 'evict',
        op: { ...opObj },
        evictedKey,
        result: evictedKey,
        description: evictedKey ? `Explicitly evicted LRU key "${evictedKey}"` : 'Cache is empty, nothing to evict',
        cacheState: cache.snapshot(),
        timestamp: clock(stepIdx),
      })
    } else {
      throw new Error(`Unsupported operation: ${op}`)
    }
  })

  return steps
}

/**
 * Validates the LRU cache invariant for a given step.
 * Checks capacity bounds, recency ordering consistency, and non-corruption.
 *
 * @param {object} step
 * @param {number} capacity
 * @returns {boolean} True if invariant holds, throws Error on violation.
 */
export function validateLRUInvariant(step, capacity) {
  if (!step || typeof step !== 'object') {
    throw new Error('Step must be a valid object')
  }

  const { cacheState, type, key, isHit } = step
  if (!cacheState) {
    throw new Error('Step missing cacheState')
  }

  // 1. Capacity invariant: size <= capacity
  if (cacheState.size > capacity) {
    throw new Error(`Capacity invariant violated: size ${cacheState.size} exceeds capacity ${capacity}`)
  }

  // 2. State coherence: recencyOrder length === entries length === size
  if (cacheState.recencyOrder.length !== cacheState.size) {
    throw new Error('Recency order length does not match cache size')
  }
  if (cacheState.entries.length !== cacheState.size) {
    throw new Error('Entries length does not match cache size')
  }

  // 3. Uniqueness: all keys in recencyOrder must be distinct
  const uniqueKeys = new Set(cacheState.recencyOrder)
  if (uniqueKeys.size !== cacheState.size) {
    throw new Error('Duplicate keys found in recency order')
  }

  // 4. Recency refresh invariant: on get-hit or put, operated key MUST be at the end (MRU)
  if (type === 'get-hit' && isHit) {
    const lastKey = cacheState.recencyOrder[cacheState.recencyOrder.length - 1]
    if (lastKey !== key) {
      throw new Error(`Get-hit invariant violated: key "${key}" was not refreshed to MRU`)
    }
  }

  if (type === 'put' || type === 'put-update' || type === 'put-evict') {
    const lastKey = cacheState.recencyOrder[cacheState.recencyOrder.length - 1]
    if (lastKey !== key) {
      throw new Error(`Put invariant violated: key "${key}" was not placed at MRU`)
    }
  }

  return true
}

/**
 * Animation timing controller for deterministic replay testing and UI control.
 */
export class AnimationPlaybackController {
  constructor({ stepDurationMs = 100, onStep = null } = {}) {
    this.stepDurationMs = stepDurationMs
    this.onStep = onStep
    this.currentStep = 0
    this.virtualTime = 0
    this.isPlaying = false
  }

  setDuration(ms) {
    this.stepDurationMs = Math.max(0, ms)
  }

  advanceToStep(targetIndex, totalSteps) {
    const bounded = Math.max(0, Math.min(targetIndex, totalSteps - 1))
    this.currentStep = bounded
    this.virtualTime = bounded * this.stepDurationMs
    if (this.onStep) {
      this.onStep(this.currentStep, this.virtualTime)
    }
    return { currentStep: this.currentStep, virtualTime: this.virtualTime }
  }

  next(totalSteps) {
    return this.advanceToStep(this.currentStep + 1, totalSteps)
  }

  prev(totalSteps) {
    return this.advanceToStep(this.currentStep - 1, totalSteps)
  }

  reset() {
    return this.advanceToStep(0, 1)
  }
}

/**
 * Source code implementations in multiple languages for display.
 */
export const lruCacheSources = {
  javascript: {
    code: `class LRUCache {
  constructor(capacity = 2) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const lruKey = this.map.keys().next().value;
      this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }
}`,
    lineMap: {
      constructor: 2,
      get: 6,
      getMiss: 7,
      getHit: 8,
      put: 14,
      putUpdate: 15,
      putEvict: 18,
      putInsert: 21,
    },
  },
  python: {
    code: `class LRUCache:
    def __init__(self, capacity: int = 2):
        self.capacity = capacity
        self.cache = {}

    def get(self, key):
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key, value):
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value`,
    lineMap: {
      constructor: 2,
      get: 6,
      getMiss: 7,
      getHit: 9,
      put: 13,
      putUpdate: 14,
      putEvict: 17,
      putInsert: 19,
    },
  },
}

export function getLRUCacheSource(language = 'javascript') {
  return lruCacheSources[language] || lruCacheSources.javascript
}
