import { upper } from './lang'
import { svgStyle } from './theme'

// Svg building blocks of the Tidemark kit: a document shell
// and the eyebrow. Pure strings; colors come from classes.

export type SvgDoc = { source: string; alt: string; width: number; height: number }

const EYEBROW_SIZE = 10.5
const EYEBROW_TRACKING = 1.05

export const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NARROW = 'iljtf.,:;|!\'` ·'
const WIDE = 'mwMW@%'

// Width of a text in px, close enough to lay out a line without a renderer.
export function measure(text: string, size: number, isMono = false): number {
  if (isMono) return [...text].length * size * 0.6

  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char)) return sum + size * 0.3
    if (WIDE.includes(char)) return sum + size * 0.82

    return sum + (char >= 'A' && char <= 'Z' ? size * 0.66 : size * 0.55)
  }, 0)
}

export function svgDoc(spec: { width: number; height: number; body: string; alt: string; css?: string }): SvgDoc {
  const width = Math.ceil(spec.width)
  const height = Math.ceil(spec.height)
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`

  return { source: `${open}${svgStyle(spec.css)}${spec.body}</svg>`, alt: spec.alt, width, height }
}

// The upper-case label each card and tile opens with.
export function eyebrow(text: string, at: { x: number; y: number; cls: string }): string {
  const { x, y, cls } = at
  const label = escape(upper(text))

  return `<text class="${cls}" x="${x}" y="${y}" font-size="${EYEBROW_SIZE}" font-weight="700" letter-spacing="${EYEBROW_TRACKING}">${label}</text>`
}

export const eyebrowWidth = (text: string): number =>
  measure(upper(text), EYEBROW_SIZE) + [...text].length * EYEBROW_TRACKING
