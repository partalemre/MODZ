// The guard's setting: warn, or hold once, optionally only when the cold write is priced at a dollar floor or more.

import type { GuardMode, State } from './core'

export type GuardSetting = { guard: GuardMode; guardFloor: number }

const isFloor = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** The setting as stored: 'warn', 'refuse', or the floor in its place. Nothing stored, or anything else, reads as warn. */
export function guardFromStore(value: unknown): GuardSetting {
  if (value === 'refuse') return { guard: 'refuse', guardFloor: 0 }
  return isFloor(value) ? { guard: 'refuse', guardFloor: value } : { guard: 'warn', guardFloor: 0 }
}

export const storedGuard = (s: State): string | number => (s.guard === 'warn' ? 'warn' : s.guardFloor || 'refuse')

/** The words after `/cache-tax guard`: warn, refuse, or refuse with a dollar floor such as 5 or $5; null for anything else. */
export function parseGuard(rest: string[]): GuardSetting | null {
  if (rest[0] === 'warn' && rest.length === 1) return { guard: 'warn', guardFloor: 0 }
  if (rest[0] !== 'refuse' || rest.length > 2) return null
  if (rest.length === 1) return { guard: 'refuse', guardFloor: 0 }
  const floor = Number((rest[1] ?? '').replace(/^\$/, ''))
  return isFloor(floor) ? { guard: 'refuse', guardFloor: floor } : null
}
