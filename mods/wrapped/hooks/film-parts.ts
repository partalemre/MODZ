import { costumeFor, crab, lookAt } from './crabs'
import { rectEl, textEl } from './kit/svg-core'
import type { Wrapped } from '../types'

// What every scene of the film draws with: the stage's size, timing helpers, the Agents pane's card and crab, and
// the MODZ pixel letters for big figures. A frame is one still picture, so everything takes the time it is drawn at.

export const W = 540
export const H = 960
export const PAD = 36
export const INNER = W - 2 * PAD

export type SceneCtx = { w: Wrapped; isNamed: boolean; t: number; dur: number; step: number }

// The MODZ wordmark's 5×7 cells, with what big figures and "MODZ × CLAUDE" need.
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['.XXX.', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', '.XXX.'],
  '1': ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
  '2': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'],
  '3': ['XXXX.', '....X', '....X', '.XXX.', '....X', '....X', 'XXXX.'],
  '4': ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'],
  '5': ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
  '6': ['.XXX.', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'],
  '7': ['XXXXX', '....X', '...X.', '..X..', '..X..', '..X..', '..X..'],
  '8': ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'],
  '9': ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '....X', '.XXX.'],
  '.': ['.', '.', '.', '.', '.', '.', 'X'],
  k: ['X....', 'X....', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.'],
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
  C: ['.XXXX', 'X....', 'X....', 'X....', 'X....', 'X....', '.XXXX'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
  x: ['.....', '.....', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
}

const GLYPH_GAP = 1

export const clamp = (value: number, low = 0, high = 1): number => Math.min(high, Math.max(low, value))

// 0 until `start`, 1 after `start + span`, eased out between.
export function ease(t: number, start: number, span = 0.45): number {
  const raw = clamp((t - start) / span)

  return 1 - (1 - raw) ** 3
}

const glyphOf = (char: string): readonly string[] => GLYPHS[char] ?? GLYPHS[' '] ?? []

export function pixelWidth(text: string, cell: number): number {
  const columns = [...text].reduce((sum, char) => sum + (glyphOf(char)[0]?.length ?? 0) + GLYPH_GAP, -GLYPH_GAP)

  return Math.max(0, columns) * cell
}

export type PixelOpts = { x: number; y: number; cell: number; paint: string; isCentered?: boolean }

// Big figures in the wordmark's own cells; the cell stays square and soft, as in `kit/pixels.ts`.
export function pixelText(text: string, o: PixelOpts): string {
  const size = o.cell * 0.88
  let x = o.isCentered ? o.x - pixelWidth(text, o.cell) / 2 : o.x
  let body = ''
  for (const char of text) {
    const glyph = glyphOf(char)
    glyph.forEach((row, rowAt) => {
      ;[...row].forEach((mark, columnAt) => {
        if (mark === 'X') body += rectEl({ x: x + columnAt * o.cell, y: o.y + rowAt * o.cell, width: size, height: size, radius: o.cell * 0.18, paint: o.paint })
      })
    })
    x += ((glyph[0]?.length ?? 0) + GLYPH_GAP) * o.cell
  }

  return body
}

export type LabelOpts = { x: number; y: number; size: number; paint?: string; weight?: number; anchor?: 'start' | 'middle' | 'end' }

export const label = (text: string, o: LabelOpts): string => textEl({ text, paint: 'mid', ...o })

// A scene's part slides up a little and comes in.
export function enter(body: string, amount: number): string {
  const rise = (1 - amount) * 18

  return `<g opacity="${amount.toFixed(3)}" transform="translate(0 ${rise.toFixed(2)})">${body}</g>`
}

// The Agents pane's look: the card, the crab's dark tile.
export function card(o: { x: number; y: number; width: number; height: number }): string {
  return rectEl({ ...o, radius: 12, paint: 'card' }) + `<rect x="${o.x + 0.5}" y="${o.y + 0.5}" width="${o.width - 1}" height="${o.height - 1}" rx="11.5" fill="none" stroke="#2E2E2A"/>`
}

export function agentCrab(type: string, rank: number, o: { x: number; y: number; scale: number; step: number }): string {
  return crab(o.x, o.y, { costume: costumeFor(type, rank), look: lookAt(rank), scale: o.scale, step: o.step })
}

export function bar(o: { x: number; y: number; width: number; share: number; paint: string; height?: number }): string {
  const height = o.height ?? 6
  const track = rectEl({ x: o.x, y: o.y, width: o.width, height, radius: height / 2, paint: 'track' })

  return track + rectEl({ x: o.x, y: o.y, width: o.width * clamp(o.share), height, radius: height / 2, paint: o.paint })
}
