// The MODZ mark that heads the hub: a Kiln tile holding the film's pixel "M" (tools/site/hero.ts), then the name
// set in type. Entering, the pixels drop in row by row, as the film's title does, and the name fades up after
// them; settled, it is a still mark.
import { delayOf, entering, isEntering } from './kit/motion'
import type { Cue } from './kit/motion'

const M = ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X']
const NAME = 'MODZ'
const TILE = 30
const TILE_RADIUS = 9
const PITCH = 3.6
const CELL = 3
const NAME_GAP = 10
const NAME_SIZE = 15
const NAME_TRACKING = 1.8
// Each pixel's own wait inside the cascade: a row after the row above, a column after the one before it.
const ROW_MS = 40
const COLUMN_MS = 12

export type WordmarkSpec = { x: number; y: number; cue: Cue }

export const wordmarkHeight = (): number => TILE

function pixels(spec: WordmarkSpec, isMoving: boolean): string {
  const side = M[0].length * PITCH - (PITCH - CELL)
  const left = spec.x + (TILE - side) / 2
  const top = spec.y + (TILE - side) / 2

  return M.flatMap((row, r) =>
    [...row].map((c, col) => {
      if (c !== 'X') return ''
      const motion = isMoving ? ` class="m-px" style="${delayOf(spec.cue, r * ROW_MS + col * COLUMN_MS)}"` : ''

      return `<rect x="${(left + col * PITCH).toFixed(2)}" y="${(top + r * PITCH).toFixed(2)}" width="${CELL}" height="${CELL}" rx=".6"${motion}/>`
    }),
  ).join('')
}

export function wordmark(spec: WordmarkSpec): string {
  const isMoving = isEntering(spec.cue)
  const tile = `<rect x="${spec.x + 0.5}" y="${spec.y + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="${TILE_RADIUS}" class="bg-edit ln-edit"/>`
  const name = `<text x="${spec.x + TILE + NAME_GAP}" y="${spec.y + TILE / 2 + NAME_SIZE * 0.36}" class="hi" ` +
    `style="font-size:${NAME_SIZE}px;font-weight:700;letter-spacing:${NAME_TRACKING}px">${NAME}</text>`

  return [
    entering(`${tile}<g class="fg-edit">${pixels(spec, isMoving)}</g>`, { ...spec.cue, order: 0 }, 'fade'),
    entering(name, { ...spec.cue, order: 1 }),
  ].join('')
}
