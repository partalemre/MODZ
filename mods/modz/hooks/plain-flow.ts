// The order of a run's work as one small picture: an icon and a word per kind of step, joined by a hairline, with
// a count where neighbours were of one kind ("inceleme ×3 — kontrol — sürüm kaydı"). Colour is state only
// (DESIGN.md §0): the live stop in the accent, a failed one in Flare, the rest in quiet ink.
import { lang } from './kit/lang'
import { KIND_ICON, kindWord } from './kit/plain'
import type { Kind } from './kit/plain'
import { pixelGlyph } from './kit/pixels'
import { baseline, rectEl, sans, textEl, toPic } from './kit/svg-core'
import type { SvgPic } from './kit/svg-core'
import type { StepState, Trail } from './plain-trail'

export const ICON = 16
const HEIGHT = 20
const JOIN = 10
const GAP = 6
const LABEL = { size: 11.5, weight: 500 }
const COUNT = { size: 11, weight: 600 }
const LABEL_GAP = 4
const STOPS_SHOWN = 6

const PAINT: Record<StepState, string> = { done: 'mid', live: 'edit', failed: 'danger', stopped: 'lo' }
// The hub's own pixel cells (kit/pixels.ts), sized so a 7-cell glyph fills the 16 px box.
const CELLS = { cell: 1.8, pitch: 2.2 }

const glyphAt = (kind: Kind, state: StepState, x: number, y: number): string =>
  pixelGlyph(KIND_ICON[kind], { x, y, box: ICON, ...CELLS, className: `f-${PAINT[state]}` })

/** One kind's icon alone, for the head of a step's line. */
export function kindPic(kind: Kind, state: StepState): SvgPic {
  const body = glyphAt(kind, state, 0, 0)

  return toPic({ body, width: ICON, height: ICON, alt: kindWord(kind, lang()) })
}

type Drawn = { body: string; x: number }

function stopAt(stop: Trail['flow'][number], x: number): Drawn {
  const icon = glyphAt(stop.kind, stop.state, x, (HEIGHT - ICON) / 2)
  const word = kindWord(stop.kind, lang())
  const wordX = x + ICON + LABEL_GAP
  const label = textEl({ x: wordX, y: baseline(0, HEIGHT, LABEL.size), text: word, paint: 'mid', ...LABEL })
  const end = wordX + sans(LABEL.size, LABEL.weight)(word)
  if (stop.count < 2) return { body: icon + label, x: end }
  const times = `×${stop.count}`
  const count = textEl({ x: end + LABEL_GAP, y: baseline(0, HEIGHT, COUNT.size), text: times, paint: 'lo', ...COUNT })

  return { body: icon + label + count, x: end + LABEL_GAP + sans(COUNT.size, COUNT.weight)(times) }
}

const joinAt = (x: number): Drawn => ({
  body: rectEl({ x: x + GAP, y: HEIGHT / 2 - 0.5, width: JOIN, height: 1, paint: 'line-strong' }),
  x: x + GAP + JOIN + GAP,
})

const altOf = (flow: Trail['flow']): string =>
  flow.map(stop => (stop.count > 1 ? `${kindWord(stop.kind, lang())} ×${stop.count}` : kindWord(stop.kind, lang()))).join(' → ')

/** The picture of the work's order; null when the run was one stop, which its line already says. */
export function flowPic(flow: Trail['flow']): SvgPic | null {
  if (flow.length < 2) return null
  const shown = flow.slice(0, STOPS_SHOWN)
  const drawn = shown.reduce<Drawn>((sofar, stop, i) => {
    const from = i === 0 ? sofar : joinAt(sofar.x)
    const at = stopAt(stop, from.x)

    return { body: sofar.body + (i === 0 ? '' : from.body) + at.body, x: at.x }
  }, { body: '', x: 0 })
  const rest = flow.length - shown.length
  const more = rest > 0 ? textEl({ x: drawn.x + GAP * 2, y: baseline(0, HEIGHT, COUNT.size), text: `+${rest}`, paint: 'lo', ...COUNT }) : ''
  const width = Math.ceil(drawn.x + (rest > 0 ? GAP * 2 + sans(COUNT.size, COUNT.weight)(`+${rest}`) : 0))

  return toPic({ body: drawn.body + more, width, height: HEIGHT, alt: altOf(flow) })
}
