import type { CrabMood } from '../types'
import { crab } from './crabs'
import { textWidth, xml } from './format'
import { lookAt } from './identity'
import { FONT } from './theme'

// The home crab's drawn parts: the crab in its mood (a nap's two z's over its shoulder) and its
// level as a quiet pill. The pill is neutral, so the pane keeps one accent: the job's own.

/** What the header and the empty pane draw of the home crab. `isMoving` only while no agent's crab walks. */
export type HomeMark = { mood: CrabMood; level: string; isMoving: boolean }

/** The home crab is the first look: clay, dot eyes, Pip. */
export const HOME_LOOK = lookAt(0)

// The z's sit past the crab's right claw, relative to its 30-cell grid; never smaller than legible.
const SNOOZE = { x1: 27, y1: 6, x2: 30, y2: 2.6, size1: 4.8, size2: 3.5, min1: 9, min2: 7 } as const

const snoozeSvg = (x: number, y: number, scale: number): string => {
  const big = Math.max(SNOOZE.min1, SNOOZE.size1 * scale)
  const small = Math.max(SNOOZE.min2, SNOOZE.size2 * scale)
  const z = (zx: number, zy: number, size: number) =>
    `<text class="m" x="${x + zx * scale}" y="${y + zy * scale}" font-family="${FONT}" font-size="${size}" font-weight="700">z</text>`
  return z(SNOOZE.x1, SNOOZE.y1, big) + z(SNOOZE.x2, SNOOZE.y2, small)
}

/** The home crab at (x, y) in its mood; it walks only when `isMoving`. */
export const homeCrab = (x: number, y: number, opts: { home: HomeMark; scale: number }): string => {
  const { mood, isMoving } = opts.home
  const body = crab(x, y, { costume: 'other', look: HOME_LOOK, mood, isWalking: isMoving && mood === 'working', scale: opts.scale })
  return mood === 'sleeping' ? body + snoozeSvg(x, y, opts.scale) : body
}

export const LEVEL_PILL = { h: 16, padX: 7, size: 10 } as const
const BOLD = 1.06

export const levelWidth = (text: string): number => Math.ceil(textWidth(text, LEVEL_PILL.size) * BOLD + LEVEL_PILL.padX * 2)

/** "Lv 3" in a small neutral pill: the inset fill, the hairline edge, the body text. */
export const levelPill = (text: string, x: number, y: number): string => {
  const w = levelWidth(text)
  const r = (LEVEL_PILL.h - 1) / 2
  return `<rect class="chip ln" x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${LEVEL_PILL.h - 1}" rx="${r}" stroke-width="1"/><text class="s" x="${x + w / 2}" y="${y + LEVEL_PILL.h / 2 + LEVEL_PILL.size * 0.35}" text-anchor="middle" font-family="${FONT}" font-size="${LEVEL_PILL.size}" font-weight="600" font-variant-numeric="tabular-nums">${xml(text)}</text>`
}

/** The terminal's crab: a face for each mood. */
export const FACES: Record<CrabMood, string> = { sleeping: '(-_-) zz', working: '(•_•)', happy: '(^_^)', worried: '(°_°;)' }
