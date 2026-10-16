// The film's pixel "MODZ" (tools/site/hero.ts), small enough to head the hub. Entering, its squares drop in
// letter by letter, row by row, as the film's title does; settled, it is a still mark.
import { delayOf, entering, isEntering } from './kit/motion'
import type { Cue } from './kit/motion'

const LETTERS: Record<string, string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
}
const WORD = 'MODZ'
const COLUMNS = 5
const ROWS = 7
// Each square's own wait inside the cascade: a letter after the one before it, a row after the row above.
const LETTER_MS = 90
const ROW_MS = 22
const COLUMN_MS = 8

export type WordmarkSpec = { x: number; y: number; pitch: number; cue: Cue }

const letterWidth = (pitch: number) => COLUMNS * pitch - pitch * 0.15

export const wordmarkWidth = (pitch: number): number => WORD.length * letterWidth(pitch) + (WORD.length - 1) * pitch * 1.6

export const wordmarkHeight = (pitch: number): number => ROWS * pitch

export function wordmark(spec: WordmarkSpec): string {
  const { pitch, cue } = spec
  const cell = pitch * 0.85
  const isMoving = isEntering(cue)
  const squares = [...WORD].flatMap((ch, i) =>
    (LETTERS[ch] ?? []).flatMap((row, r) =>
      [...row].map((c, col) => {
        if (c !== 'X') return ''
        const x = spec.x + i * (letterWidth(pitch) + pitch * 1.6) + col * pitch
        const motion = isMoving ? ` class="m-px" style="${delayOf(cue, i * LETTER_MS + r * ROW_MS + col * COLUMN_MS)}"` : ''

        return `<rect x="${x.toFixed(2)}" y="${(spec.y + r * pitch).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${(cell * 0.18).toFixed(2)}"${motion}/>`
      }),
    ),
  )

  return entering(`<g class="mark">${squares.join('')}</g>`, { ...cue, order: 0 }, 'fade')
}
