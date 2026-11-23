const DEFAULT_RODS = ['A', 'B', 'C']

/** Build an immutable, deterministic replay trace for Tower of Hanoi. */
export function generateHanoiFrames(diskCount, rods = DEFAULT_RODS) {
  if (!Number.isInteger(diskCount) || diskCount < 1) {
    throw new RangeError('diskCount must be a positive integer')
  }
  if (!Array.isArray(rods) || rods.length !== 3 || new Set(rods).size !== 3) {
    throw new TypeError('rods must contain three distinct names')
  }

  const [source, auxiliary, destination] = rods
  const state = {
    [source]: Array.from({ length: diskCount }, (_, index) => diskCount - index),
    [auxiliary]: [],
    [destination]: [],
  }
  const frames = []
  let moveNumber = 0

  function snapshot(type, message, active = {}) {
    frames.push({
      rods: Object.fromEntries(Object.entries(state).map(([name, disks]) => [name, [...disks]])),
      type,
      message,
      moveNumber,
      ...active,
    })
  }

  function moveDisk(from, to) {
    const disk = state[from].pop()
    if (disk === undefined || (state[to].length && state[to].at(-1) < disk)) {
      throw new Error('Illegal Tower of Hanoi move')
    }
    state[to].push(disk)
    moveNumber += 1
    snapshot('move', `Move disk ${disk} from rod ${from} to rod ${to}.`, {
      from,
      to,
      disk,
    })
  }

  function solve(count, from, spare, to, depth = 1) {
    snapshot(
      'call',
      count === 1
        ? `Base case: move disk 1 from ${from} to ${to}.`
        : `Move ${count - 1} disk${count - 1 === 1 ? '' : 's'} from ${from} to ${spare} first.`,
      { source: from, auxiliary: spare, destination: to, depth, activeN: count }
    )
    if (count === 1) {
      moveDisk(from, to)
      return
    }
    solve(count - 1, from, to, spare, depth + 1)
    moveDisk(from, to)
    solve(count - 1, spare, from, to, depth + 1)
  }

  snapshot('start', `Starting Tower of Hanoi with ${diskCount} disks.`)
  solve(diskCount, source, auxiliary, destination)
  snapshot('complete', `Complete in ${moveNumber} moves.`)
  return frames
}
