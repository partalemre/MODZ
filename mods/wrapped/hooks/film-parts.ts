import { costumeFor, crab, lookAt } from './crabs'
import { escapeXml, rectEl } from './kit/svg-core'
import type { Wrapped } from '../types'

// What every story page draws with: the stage's size, its colours, timing helpers, the Agents pane's crab and the
// MODZ pixel letters. A page is one still picture of a moment, the same in the pane (its last moment) and the film.

export const W = 540
export const H = 960
export const PAD = 40
export const INNER = W - 2 * PAD

export type SlideCtx = { w: Wrapped; isNamed: boolean; t: number; step: number }

/** The moment a page holds in the pane and the saved image: every entrance is over. */
export const SETTLED = 100

// The one loud page in MODZ: a story takes colour blocks, not the panes' quiet ink (README).
export const C = { ink: '#16140F', clay: '#E2653A', violet: '#4B2FD6', moss: '#0E6B4A', sky: '#1677C9', amber: '#F5B81F', rose: '#E8467C', cream: '#F4EEDF', white: '#FFFFFF' } as const

// Only family names with one face reach the frame through macOS's `sips`, which ignores weights: Arial Black holds
// the figures, and body words thicken with a stroke of their own colour.
const DISPLAY = 'Arial Black,Arial,sans-serif'
const BODY = 'Helvetica Neue,Helvetica,Arial,sans-serif'
const DISPLAY_EM = 0.74
const BODY_EM = 0.54

export type TxtOpts = { x: number; y: number; size: number; fill: string; isDisplay?: boolean; isBold?: boolean; anchor?: 'start' | 'middle' | 'end'; opacity?: number }

export function txt(text: string, o: TxtOpts): string {
  const face = o.isDisplay === true ? DISPLAY : BODY
  const bold = o.isBold === true ? ` stroke="${o.fill}" stroke-width="${(o.size * 0.022).toFixed(2)}"` : ''
  const opacity = o.opacity === undefined ? '' : ` fill-opacity="${o.opacity}"`

  return `<text x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" font-family="${face}" font-size="${o.size.toFixed(1)}" fill="${o.fill}"${opacity}${bold} text-anchor="${o.anchor ?? 'start'}">${escapeXml(text)}</text>`
}

/** The largest display size up to `max` that keeps `text` inside `room`. */
export const fitSize = (text: string, max: number, room: number): number => Math.min(max, room / Math.max(1, [...text].length * DISPLAY_EM))

/** `text` cut with an ellipsis to what body type of `size` holds in `room`. */
export function fitBody(text: string, size: number, room: number): string {
  const most = Math.floor(room / (size * BODY_EM))

  return [...text].length <= most ? text : `${[...text].slice(0, Math.max(1, most - 1)).join('')}…`
}

/** Words broken into lines of body type, at most `lines`; the last one is cut if it must be. */
export function wrapBody(text: string, o: { size: number; room: number; lines: number }): string[] {
  const most = Math.floor(o.room / (o.size * BODY_EM))
  const out: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line !== '' && [...`${line} ${word}`].length > most) {
      out.push(line)
      line = word
    } else line = line === '' ? word : `${line} ${word}`
  }
  out.push(line)

  return [...out.slice(0, o.lines - 1), fitBody(out.slice(o.lines - 1).join(' '), o.size, o.room)].filter(part => part !== '')
}

export const sheet = (fill: string): string => `<rect width="${W}" height="${H}" fill="${fill}"/>`
export const circle = (x: number, y: number, r: number, fill: string, opacity = 1): string => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(0, r).toFixed(1)}" fill="${fill}" fill-opacity="${opacity}"/>`
export const box = (o: { x: number; y: number; w: number; h: number; fill: string; r?: number; opacity?: number }): string => `<rect x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" width="${Math.max(0, o.w).toFixed(1)}" height="${Math.max(0, o.h).toFixed(1)}" rx="${o.r ?? 0}" fill="${o.fill}" fill-opacity="${o.opacity ?? 1}"/>`

/** A part rises a little and comes in; `amount` is its `ease`. */
export function rise(body: string, amount: number): string {
  return `<g opacity="${amount.toFixed(3)}" transform="translate(0 ${((1 - amount) * 34).toFixed(2)})">${body}</g>`
}

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
  m: ['.....', '.....', 'XX.X.', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X'],
  o: ['.....', '.....', '.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  d: ['....X', '....X', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX'],
  z: ['.....', '.....', 'XXXXX', '...X.', '..X..', '.X...', 'XXXXX'],
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

export function agentCrab(type: string, rank: number, o: { x: number; y: number; scale: number; step: number }): string {
  return crab(o.x, o.y, { costume: costumeFor(type, rank), look: lookAt(rank), scale: o.scale, step: o.step })
}

