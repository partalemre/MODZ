import type { Field, Scene, Sprite } from './scenes'
import { escape, MONO } from './svg-kit'

// A living scene as one Svg: a glyph field in two layers drifting apart, and sprites crossing it, moved by CSS
// alone (the desktop's frame runs no script). The source depends on the scene only, so every redraw of the band
// hands the desktop the same frame and its loops run on. Reduced motion stills it where each sprite rests.

const COLS = 120
const ROWS = 9
const CELL = 8
const LINE = 13
const FONT_SIZE = 12
// Creatures stand out from the field: larger and heavier glyphs.
const SPRITE_SIZE = 15
const BASELINE = LINE - 3
const RADIUS = 12
// How far past the left edge a crossing sprite starts, and past the right edge it ends.
const EDGE = 200
const TAIL = 40
// How high a rising sprite goes before it starts again from below.
const TOP_OUT = 70
// Share of the cells a glint takes.
const GLINT_RATE = 0.035
const WAVE = 0.25
const GRAIN = 0.3

export const SCENE_WIDTH = COLS * CELL
export const SCENE_HEIGHT = ROWS * LINE + 3

export type ScenePic = { source: string; width: number; height: number }

const KEYFRAMES = [
  `@keyframes sr{from{transform:translateX(-${EDGE}px)}to{transform:translateX(${SCENE_WIDTH + TAIL}px)}}`,
  `@keyframes sl{from{transform:translateX(${SCENE_WIDTH + TAIL}px)}to{transform:translateX(-${EDGE}px)}}`,
  `@keyframes up{from{transform:translateY(${SCENE_HEIGHT + 10}px)}to{transform:translateY(-${TOP_OUT}px)}}`,
  '@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-4px)}}',
  '@keyframes sway{from{transform:translateX(-5px)}to{transform:translateX(5px)}}',
  '@keyframes tw{0%,100%{opacity:.1}50%{opacity:1}}',
  `@keyframes fl{from{transform:translateX(0)}to{transform:translateX(-${SCENE_WIDTH}px)}}`,
  `@keyframes fr{from{transform:translateX(-${SCENE_WIDTH}px)}to{transform:translateX(0)}}`,
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('')

const GLOW =
  '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/>' +
  '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'

// A cell's fixed grain in [0, 1): the same scene draws the same field every time.
function grain(x: number, y: number, seed: number): number {
  const h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed, 1274126177)

  return (Math.imul(h ^ (h >>> 13), 1103515245) >>> 0) / 2 ** 32
}

function mix(from: string, to: string, t: number): string {
  const channel = (hex: string, at: number) => parseInt(hex.slice(at, at + 2), 16)
  const parts = [1, 3, 5].map(at => Math.round(channel(from, at) * (1 - t) + channel(to, at) * t))

  return `#${parts.map(part => part.toString(16).padStart(2, '0')).join('')}`
}

// Row y twice across, so a layer drifts one whole width and starts over: the waves repeat every COLS cells.
function fieldRow(field: Field, y: number, seed: number): string {
  const ramp = Array.from(field.ramp)
  const depth = field.fill[0] + (field.fill[1] - field.fill[0]) * (y / (ROWS - 1))
  const cells = Array.from({ length: COLS * 2 }, (_, x) => {
    const c = x % COLS
    const wave = Math.sin((6 * Math.PI * c) / COLS + y * 0.9) * Math.sin((14 * Math.PI * c) / COLS - y * 0.5)
    const d = depth + WAVE * wave + GRAIN * (grain(c, y, seed) - 0.5)

    return ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(d * ramp.length)))]
  })

  return cells.join('')
}

function glintRow(field: Field, y: number, seed: number): string {
  const glints = Array.from(field.glint)
  const cells = Array.from({ length: COLS * 2 }, (_, x) => {
    const c = x % COLS

    return grain(c, y, seed + 1) < GLINT_RATE ? glints[c % glints.length] : ' '
  })

  return cells.join('')
}

const textRow = (text: string, y: number, fill?: string): string =>
  `<text y="${y * LINE + BASELINE}" textLength="${SCENE_WIDTH * 2}" lengthAdjust="spacing"${fill === undefined ? '' : ` fill="${fill}"`}>${escape(text)}</text>`

function fieldLayers(field: Field, seed: number): string {
  const rows = Array.from({ length: ROWS }, (_, y) => textRow(fieldRow(field, y, seed), y, mix(field.colors[0], field.colors[1], y / (ROWS - 1))))
  const drifting = `<g opacity=".85" style="animation:fl ${field.seconds}s linear infinite">${rows.join('')}</g>`
  if (field.glint === '') return drifting
  const glints = Array.from({ length: ROWS }, (_, y) => textRow(glintRow(field, y, seed), y))

  return `${drifting}<g fill="${field.glintColor}" style="animation:fr ${field.seconds * 1.5}s linear infinite">${glints.join('')}</g>`
}

const loop = (name: string, seconds: number, share: number, timing = 'linear', tail = ''): string =>
  `animation:${name} ${seconds.toFixed(2)}s ${timing} -${(share * seconds).toFixed(2)}s infinite${tail}`

// One copy of a sprite: the outer group places it, the next moves it from there, the inner one breathes.
function spriteAt(sprite: Sprite, [row, col]: readonly [number, number], i: number): string {
  const x = col * CELL
  const y = row * LINE
  const art = sprite.art.map((line, k) => `<text y="${BASELINE + k * SPRITE_SIZE}">${escape(line)}</text>`).join('')
  const breath = 3 + (i % 3)
  const bob = (inner: string) => `<g style="${loop('bob', breath, i / 3, 'ease-in-out', ' alternate')}">${inner}</g>`

  switch (sprite.motion) {
    case 'right':
    case 'left': {
      const span = SCENE_WIDTH + TAIL + EDGE
      const share = sprite.motion === 'right' ? (x + EDGE) / span : (SCENE_WIDTH + TAIL - x) / span

      return `<g transform="translate(0 ${y})"><g transform="translate(${x} 0)" style="${loop(sprite.motion === 'right' ? 'sr' : 'sl', sprite.seconds, share)}">${bob(art)}</g></g>`
    }
    case 'rise': {
      const share = (SCENE_HEIGHT + 10 - y) / (SCENE_HEIGHT + 10 + TOP_OUT)
      const sway = `<g style="${loop('sway', breath, i / 3, 'ease-in-out', ' alternate')}">${art}</g>`

      return `<g transform="translate(${x} 0)"><g transform="translate(0 ${y})" style="${loop('up', sprite.seconds, share)}">${sway}</g></g>`
    }
    case 'blink':
      return `<g transform="translate(${x} ${y})" style="${loop('tw', sprite.seconds, grain(col, row, i), 'ease-in-out')}">${bob(art)}</g>`
    case 'float':
      return `<g transform="translate(${x} ${y})">${bob(art)}</g>`
    case 'still':
      return `<g transform="translate(${x} ${y})">${art}</g>`
  }
}

const spriteLayer = (sprite: Sprite): string =>
  `<g fill="${sprite.color}"${sprite.glows === true ? ' filter="url(#glow)"' : ''}>${sprite.at.map((at, i) => spriteAt(sprite, at, i)).join('')}</g>`

function build(scene: Scene): ScenePic {
  const seed = Array.from(scene.name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const box = `width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}"`
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" ${box} viewBox="0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}">` +
    `<style>:root{color-scheme:light dark}${KEYFRAMES}</style>` +
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${scene.sky[0]}"/><stop offset="1" stop-color="${scene.sky[1]}"/></linearGradient>` +
    `<clipPath id="edge"><rect ${box} rx="${RADIUS}"/></clipPath>${GLOW}</defs>` +
    `<g clip-path="url(#edge)" font-family="${MONO}" font-size="${FONT_SIZE}">` +
    `<rect ${box} fill="url(#sky)"/>${fieldLayers(scene.field, seed)}` +
    `<g font-size="${SPRITE_SIZE}" font-weight="700">${scene.sprites.map(spriteLayer).join('')}</g></g></svg>`

  return { source, width: SCENE_WIDTH, height: SCENE_HEIGHT }
}

// The band redraws often; a scene's source never changes, so each is built once.
const built = new Map<string, ScenePic>()

export function sceneSvg(scene: Scene): ScenePic {
  const cached = built.get(scene.name) ?? build(scene)
  built.set(scene.name, cached)

  return cached
}
