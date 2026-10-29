// The Cache Tax cube, taken from upstream's official asset (status-icons.ts): its lid carries the
// temperature, Amber when cold and Moss when warm, its outline the text colour.

import { statusIcons } from './status-icons'
import type { Square } from './svg'

const GRID = 64
const ASSET = statusIcons.dark.neutral.svg
const GROUP = /<g [\s\S]*?<\/g>/.exec(ASSET)?.[0] ?? ''
const OUTLINE = /stroke="([^"]+)"/.exec(GROUP)?.[1] ?? ''
const LID = /fill="([^"]+)"/.exec(GROUP)?.[1] ?? ''

/** The cube's group, `size` px square with its top-left at (x, y). */
export function cube({ x, y, size }: Square, ink: { lid: string; outline: string }): string {
  const { lid, outline } = ink
  const group = GROUP.replace(`stroke="${OUTLINE}"`, `stroke="${outline}"`).replace(`fill="${LID}"`, `fill="${lid}"`)
  return `<g transform="translate(${x} ${y}) scale(${size / GRID})" fill="none">${group}</g>`
}
