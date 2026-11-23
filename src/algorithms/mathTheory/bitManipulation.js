export const BIT_WIDTH = 8
export const BIT_MAX = 2 ** BIT_WIDTH - 1

export function toBits8(value) {
  assertUnsigned8(value)
  return Array.from(
    { length: BIT_WIDTH },
    (_, index) => (value >> (BIT_WIDTH - 1 - index)) & 1
  )
}

export function countSetBits(value) {
  assertUnsigned8(value)

  let remaining = value
  let count = 0
  while (remaining !== 0) {
    remaining &= remaining - 1
    count++
  }
  return count
}

function assertUnsigned8(value) {
  if (!Number.isInteger(value) || value < 0 || value > BIT_MAX) {
    throw new RangeError(`Value must be an unsigned ${BIT_WIDTH}-bit integer.`)
  }
}
