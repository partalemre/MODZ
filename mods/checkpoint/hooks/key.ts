// A folder's key in a ref or a file name: readable from its slug, and unique even where two slugs meet
// (`/a/b-c` and `/a/b/c` both slug to `a-b-c`), from a 53-bit hash of the whole path (cyrb53).

const SLUG_MAX = 120
const SLUG_TAIL = 60
const SEED_A = 0xdeadbeef
const SEED_B = 0x41c6ce57
const MIX_A = 2654435761
const MIX_B = 1597334677
const FOLD_A = 2246822507
const FOLD_B = 3266489909
const HIGH_BITS = 0x1fffff
const TWO_32 = 4294967296
const RADIX = 36

export function slug(text: string): string {
  return text.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, SLUG_MAX) || 'root'
}

function hash53(text: string): number {
  let a = SEED_A
  let b = SEED_B
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    a = Math.imul(a ^ code, MIX_A)
    b = Math.imul(b ^ code, MIX_B)
  }
  a = Math.imul(a ^ (a >>> 16), FOLD_A) ^ Math.imul(b ^ (b >>> 13), FOLD_B)
  b = Math.imul(b ^ (b >>> 16), FOLD_A) ^ Math.imul(a ^ (a >>> 13), FOLD_B)

  return TWO_32 * (HIGH_BITS & b) + (a >>> 0)
}

export const keyOf = (path: string): string => `${slug(path).slice(-SLUG_TAIL).replace(/^[-.]+/, '')}-${hash53(path).toString(RADIX)}`

// Where one session's checkpoints in one work tree live: a worktree's pane never lists another's.
export const scopeOf = (root: string, session: string): string => `refs/checkpoints/${keyOf(root)}/${slug(session)}/`
