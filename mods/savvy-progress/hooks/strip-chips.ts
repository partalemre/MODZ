import { textWidth, xml } from './format'
import { FONT, paneSvg } from './theme'

// The strip's chips: one fact each (cost, tokens, the week's allowance, the plan's step), a quiet label and its
// value in one line, with no frame of its own. The only surface a chip ever shows is the app's own button hover
// (strip.tsx lays a native button over it), so there are never two shapes to line up: at rest the row reads as
// a status line, under the pointer each fact lights as the app's buttons do.

export const CHIP_H = 28
// Chips touch: each one's own padding is the space between two facts.
export const CHIP_GAP = 0
// A native button's own measures (kit/press.tsx): its padding, and the advance of one blank cell of its label.
export const BUTTON_PAD = 28
export const CELL_PX = 11.9
const PAD = 12
const GAP = 6
const BASELINE = 18.5
const LABEL_SIZE = 11.5
const VALUE_SIZE = 13
// Semibold runs a little wider than the body text the widths are measured for.
const BOLD = 1.14
// Digits and capitals run wider than the measure assumes; a little room keeps a note off the value.
const VALUE_SLACK = 3
const METER = { w: 34, h: 4 }
const WARN_AT = 70
const DANGER_AT = 90
const FULL = 100
// The measure runs a little short of what the app draws; a note sized by it bare could lose its last letter.
const LABEL_SLACK = 1.08
// The modz wordmark, in the hub's own pixel letters (kit/pixels.ts): 5 cells wide, 7 tall.
const LETTERS: Readonly<Record<string, readonly string[]>> = {
  m: ['.....', '.....', 'XX.X.', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X'],
  o: ['.....', '.....', '.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  d: ['....X', '....X', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX'],
  z: ['.....', '.....', 'XXXXX', '...X.', '..X..', '.X...', 'XXXXX'],
}
const PIXEL = { pitch: 2.3, cell: 1.9, cols: 5, rows: 7, gap: 1 }

export type Tone = 'ok' | 'warn' | 'danger'

/** `meter` is a percent, drawn as a small bar; `note` is the part that gives way when the row is tight. */
/** `widest` is the longest reading the value can show: its slot is sized for that, so live numbers never move the row. */
export type Chip = { id: string; label: string; value: string; widest?: string; note?: string; tone?: Tone; meter?: number; isWordmark?: boolean }

type Part = { w: number; draw: (x: number) => string }

const label = (cls: string, s: string): Part => ({
  w: Math.ceil(textWidth(s, LABEL_SIZE) * LABEL_SLACK),
  draw: x => `<text class="${cls}" x="${x}" y="${BASELINE}" font-family="${FONT}" font-size="${LABEL_SIZE}">${xml(s)}</text>`,
})

const value = (cls: string, s: string, widest = s): Part => ({
  w: Math.ceil(Math.max(textWidth(s, VALUE_SIZE), textWidth(widest, VALUE_SIZE)) * BOLD) + VALUE_SLACK,
  draw: x => `<text class="${cls}" x="${x}" y="${BASELINE}" font-family="${FONT}" font-size="${VALUE_SIZE}" font-weight="600" style="font-variant-numeric:tabular-nums">${xml(s)}</text>`,
})

// A word in pixel letters, in the hub's clay; the tall `d` is centred, so the x-height sits a little low.
const wordmark = (word: string): Part => {
  const advance = (PIXEL.cols + PIXEL.gap) * PIXEL.pitch
  const top = (CHIP_H - PIXEL.rows * PIXEL.pitch) / 2 - 1

  return {
    w: Math.ceil([...word].length * advance - PIXEL.gap * PIXEL.pitch),
    draw: x =>
      [...word]
        .flatMap((ch, i) =>
          (LETTERS[ch] ?? []).flatMap((row, r) =>
            [...row].flatMap((cell, c) =>
              cell === 'X' ? [`<rect class="f-edit" x="${(x + i * advance + c * PIXEL.pitch).toFixed(1)}" y="${(top + r * PIXEL.pitch).toFixed(1)}" width="${PIXEL.cell}" height="${PIXEL.cell}" rx=".4"/>`] : [],
            ),
          ),
        )
        .join(''),
  }
}

const meterTone = (percent: number): string => {
  if (percent >= DANGER_AT) return 'f-danger'
  return percent >= WARN_AT ? 'f-warn' : 's'
}

const meter = (percent: number): Part => ({
  w: METER.w,
  draw: x => {
    const y = (CHIP_H - METER.h) / 2
    const filled = Math.max(METER.h, (METER.w * Math.min(FULL, percent)) / FULL)
    const r = METER.h / 2

    return `<rect class="m" x="${x}" y="${y}" width="${METER.w}" height="${METER.h}" rx="${r}" opacity=".3"/><rect class="${meterTone(percent)}" x="${x}" y="${y}" width="${filled.toFixed(1)}" height="${METER.h}" rx="${r}"/>`
  },
})

const partsOf = (chip: Chip, note: string): Part[] => {
  if (chip.isWordmark === true) return [wordmark(chip.value)]
  const ink = chip.tone === undefined ? 't' : `f-${chip.tone}`

  return [
    ...(chip.label === '' ? [] : [label('m', chip.label)]),
    value(ink, chip.value, chip.widest),
    ...(chip.meter === undefined ? [] : [meter(chip.meter)]),
    ...(note === '' ? [] : [label(chip.tone === undefined ? 's' : ink, note)]),
  ]
}

const widthOf = (parts: readonly Part[]): number => Math.ceil(PAD * 2 + parts.reduce((sum, part) => sum + part.w, 0) + GAP * (parts.length - 1))

/** How many blank cells the button over a chip `width` wide carries: the widest button that stays inside it. */
export const chipCells = (width: number): number => Math.max(1, Math.floor((width - BUTTON_PAD) / CELL_PX))

/** The chip's width with its whole note. */
export const chipWidth = (chip: Chip): number => widthOf(partsOf(chip, chip.note ?? ''))

// The longest run of whole words of `note` that fits `maxW`, with "…" when words were left out; '' when none fit.
function wordsThatFit(chip: Chip, maxW: number): string {
  const words = (chip.note ?? '').split(' ')
  for (let n = words.length; n > 0; n--) {
    const note = n === words.length ? words.join(' ') : `${words.slice(0, n).join(' ')}…`
    if (widthOf(partsOf(chip, note)) <= maxW) return note
  }

  return ''
}

/** The chip drawn at most `maxW` wide: a note is never cut mid-word; only the plan's step gives up its last words. */
export function chipSvg(chip: Chip, maxW = Number.POSITIVE_INFINITY): { source: string; width: number; alt: string } {
  const whole = chip.note ?? ''
  const fitted = widthOf(partsOf(chip, whole)) <= maxW ? whole : chip.id === 'plan' ? wordsThatFit(chip, maxW) : ''
  const parts = partsOf(chip, fitted)
  const width = widthOf(parts)
  let x = PAD
  const drawn = parts.map(part => {
    const at = x
    x += part.w + GAP

    return part.draw(at)
  })
  const alt = [chip.label, chip.value, chip.note ?? ''].filter(Boolean).join(' ')

  return { source: paneSvg(width, CHIP_H, drawn.join('')), width, alt }
}
