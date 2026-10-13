// MODZ kit — structural equality for plain state values (JSON-like: objects, arrays, primitives).
// A `$.state` write redraws every reader, and every redraw hands out new press handles, so a
// value that did not change is not written again.
export function isSame(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const keys = Object.keys(left)
  if (keys.length !== Object.keys(right).length) return false

  return keys.every(key => Object.prototype.hasOwnProperty.call(right, key) && isSame(left[key], right[key]))
}
