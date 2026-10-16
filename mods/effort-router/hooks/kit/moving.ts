// MODZ kit — a pane's drawings on the desktop, in motion (motion.ts). Any finished Svg source goes in under a key
// naming its place in the pane; out comes the props for an interactive Svg whose source stays byte-identical while
// what it shows does (stable.ts), so the desktop keeps its frame and its loops run on. The first draw of a key since
// the pane opened cascades in with the other new ones, a changed one sweeps once, a row's drawing answers hover, and
// every source says its colour scheme, else the frame is painted on an opaque white sheet.
import { entering, motionCss, SWEEP, WASH } from './motion'
import type { Cue } from './motion'
import { stableDrawings } from './stable'

export type Pic = { source: string; width?: number; height?: number; alt: string }

export type MovingPic<T extends Pic> = T & { isInteractive: true }

// `isRow`: the drawing is one row of a list, so hover washes it.
export type MoveOpts = { isRow?: boolean }

export type PaneMotion = {
  // The pane opened again: each drawing enters anew.
  reset: () => void
  // `pic` as an interactive Svg's props, its source moving per the drawing's life under `key`, which names one
  // place in the pane (two drawings under one key would flip between their sources on every draw).
  pic: <T extends Pic>(key: string, pic: T, opts?: MoveOpts) => MovingPic<T>
}

const SVG = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/
const SCHEME = '<style>:root{color-scheme:light dark}</style>'
// A scheme the drawing already says (not the `prefers-color-scheme` media query).
const SAYS_SCHEME = /(^|[^-\w])color-scheme\s*:/
// Draws within this long of each other are one pass of the pane; a new pass starts its cascade over.
const PASS_MS = 120
// The cascade stops lengthening here, so a long list is in place soon.
const MAX_ORDER = 12

// `source` with its scheme said and, per its cue, its entrance or its sweep; the hover wash for a row.
export function animate(source: string, spec: { cue: Cue } & MoveOpts): string {
  const parts = SVG.exec(source)
  if (parts === null) return source
  const [, open, inner, close] = parts
  const scheme = SAYS_SCHEME.test(inner) ? '' : SCHEME
  const lit = `${spec.isRow === true ? WASH : ''}${inner}${spec.cue.phase === 'change' ? SWEEP : ''}`
  const body = entering(lit, spec.cue)
  const css = motionCss(body)

  return `${open}${scheme}${css === '' ? '' : `<style>${css}</style>`}${body}${close}`
}

export function paneMotion(): PaneMotion {
  const drawings = stableDrawings<string>()
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 }
  const begin = () => {
    const now = Date.now()
    if (now - pass.at > PASS_MS) pass.entered = 0
    pass.at = now
  }

  return {
    reset: () => drawings.reset(),
    pic: (key, pic, opts = {}) => {
      begin()
      const what = `${opts.isRow === true ? 'row:' : ''}${pic.source}`
      const source = drawings.draw(key, what, phase => {
        const order = phase === 'enter' ? Math.min(MAX_ORDER, pass.entered++) : 0

        return animate(pic.source, { cue: { phase, order }, ...opts })
      })

      return { ...pic, source, isInteractive: true }
    },
  }
}
