// Small builders for the film's surfaces. Markup follows DESIGN.md v3: bare icons, sentence-case labels, one primary.
import { CRABS, GLYPHS, ICONS, LETTERS } from './assets.gen.js'

export const world = () => document.getElementById('world')
export const overlay = () => document.getElementById('overlay')

// An element placed at world coordinates (x, y) with its own box.
export function place(html, { x, y, w, h, cls = 'obj', parent = world() }) {
  const el = document.createElement('div')
  el.className = cls
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, ...(w && { width: `${w}px` }), ...(h && { height: `${h}px` }) })
  el.innerHTML = html
  parent.appendChild(el)
  return el
}

export const $ = (root, sel) => root.querySelector(sel)
export const $$ = (root, sel) => [...root.querySelectorAll(sel)]

export const icon = (name, size = 16, cls = 'ic') =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24">${ICONS[name] ?? ''}</svg>`

// A kit pixel glyph (hub icons) or a letter of the wordmark, cells as soft rounded squares.
export function pixels(grid, cell = 2.4, pitch = 3, attrs = '') {
  const w = Math.max(...grid.map(r => r.length)) * pitch, h = grid.length * pitch
  const rects = grid.flatMap((row, r) => [...row].map((c, k) => (c === 'X'
    ? `<rect x="${k * pitch}" y="${r * pitch}" width="${cell}" height="${cell}" rx="${cell * 0.22}"/>` : ''))).join('')
  return `<svg class="px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${attrs}>${rects}</svg>`
}
export const glyph = (name, cell, pitch) => pixels(GLYPHS[name] ?? GLYPHS.cube, cell, pitch)
export const word = (text, cell = 2.4, pitch = 3, gap = 6) =>
  `<span style="display:inline-flex;gap:${gap}px">${[...text].map(ch => pixels(LETTERS[ch], cell, pitch)).join('')}</span>`
export { LETTERS }

// A crab sprite at `scale` px per sprite pixel (30×28 grid).
export const crabSvg = (key, scale = 3) =>
  `<svg width="${30 * scale}" height="${28 * scale}" viewBox="0 0 30 28" shape-rendering="crispEdges">${CRABS[key]}</svg>`

export const windowFrame = (title, body, { w, h }) =>
  `<div class="win" style="width:${w}px;height:${h}px"><div class="bar"><i></i><i></i><i></i><span class="t">${title}</span></div>${body}</div>`

export const meter = (cls = '', color = 'var(--mid)', h = 4) =>
  `<div class="meter ${cls}" style="height:${h}px"><b style="background:${color};width:100%;transform:scaleX(0)"></b></div>`

export const setMeter = (el, p) => { el.querySelector('b').style.transform = `scaleX(${Math.max(0, Math.min(1, p)).toFixed(4)})` }

export const btn = (label, kind = '', key = '') => `<span class="btn ${kind}">${label}${key ? ` <kbd>${key}</kbd>` : ''}</span>`

// A text value that only touches the DOM when it changes.
export function setText(el, text) { if (el.textContent !== text) el.textContent = text }

export const money = v => `$${v.toFixed(2)}`
export const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
export const kTokens = v => (v >= 1000 ? `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : `${Math.round(v)}`)
