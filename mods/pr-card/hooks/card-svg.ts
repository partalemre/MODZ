import { biggestFirst, noteOf, shortName } from './card-facts'
import { fileBadgePart } from './kit/svg-shapes'
import { baseline, mono, outlineEl, place, rectEl, sans, textEl, toPic, TYPE } from './kit/svg-core'
import type { SvgPic } from './kit/svg-core'
import { fitText } from './kit/svg-metrics'
import { words } from './words'
import type { PrEntry, PrView } from '../types'

const PAD = 14
const RADIUS = 10
const META = 12
const LINE_H = 18
const HEAD_H = 20
const FILE_H = 20
const GAP = 10
const BADGE_W = 26
const CHIP_GAP = 14
const COUNT_SIZE = 11.5

type Row = { height: number; draw: (y: number) => string }

// The desktop app's own PR pane shows state, checks, review and merge; this card adds only the largest changes.
const ALT_FILES = 5

const fit = (text: string, max: number, size: number, weight?: number): string => fitText(text, max, sans(size, weight))

function headRow(entry: PrEntry, view: PrView, width: number): Row {
  const tail = words().files(view.changedFiles)
  const plus = `+${view.additions}`
  const minus = `−${view.deletions}`
  const stats = mono(COUNT_SIZE)
  const minusW = stats(minus)
  const plusW = stats(plus)
  const tailW = sans(META)(tail)
  const right = width - PAD
  const repoMax = right - tailW - plusW - minusW - 24 - PAD

  return {
    height: HEAD_H,
    draw: y => {
      const line = baseline(y, HEAD_H, META)

      return [
        textEl({ x: PAD, y: line, text: fit(`${entry.repo} #${entry.number}`, repoMax, META, TYPE.eyebrow.weight), size: META, weight: TYPE.eyebrow.weight, paint: 'mid' }),
        textEl({ x: right, y: line, text: minus, size: COUNT_SIZE, paint: 'mid', anchor: 'end', isMono: true }),
        textEl({ x: right - minusW - 6, y: line, text: plus, size: COUNT_SIZE, paint: 'mid', anchor: 'end', isMono: true }),
        textEl({ x: right - minusW - plusW - 18, y: line, text: tail, size: META, paint: 'lo', anchor: 'end' }),
      ].join('')
    },
  }
}

// As many chips as the row holds, largest change first, then how many more.
function filesRow(view: PrView, width: number): Row {
  const measure = sans(META)
  const more = words().moreFiles
  const end = width - PAD

  return {
    height: FILE_H,
    draw: y => {
      const parts: string[] = []
      let x = PAD
      const files = biggestFirst(view)
      for (const [i, file] of files.entries()) {
        const name = shortName(file.path)
        const chip = BADGE_W + 6 + measure(name)
        const left = view.changedFiles - i - 1
        const reserve = left > 0 ? measure(more(left)) + CHIP_GAP : 0
        if (x + chip + reserve > end) {
          parts.push(textEl({ x, y: baseline(y, FILE_H, META), text: more(view.changedFiles - i), size: META, paint: 'lo' }))

          return parts.join('')
        }
        parts.push(place(fileBadgePart({ name: file.path }).body, x, y + 2))
        parts.push(textEl({ x: x + BADGE_W + 6, y: baseline(y, FILE_H, META), text: name, size: META, paint: 'mid' }))
        x += chip + CHIP_GAP
      }

      return parts.join('')
    },
  }
}

function noteRow(text: string, width: number): Row {
  return {
    height: LINE_H,
    draw: y => textEl({ x: PAD, y: baseline(y, LINE_H, META), text: fit(text, width - PAD * 2, META), size: META, paint: 'lo' }),
  }
}

function rowsOf(entry: PrEntry, view: PrView, opts: { now: number; width: number }): Row[] {
  const note = noteOf(entry, opts.now)
  const rows = [headRow(entry, view, opts.width)]
  if (view.files.length > 0) rows.push(filesRow(view, opts.width))
  if (note !== null) rows.push(noteRow(note, opts.width))

  return rows
}

function altOf(entry: PrEntry, view: PrView, now: number): string {
  const counts = `${words().files(view.changedFiles)} +${view.additions} −${view.deletions}`
  const names = biggestFirst(view).slice(0, ALT_FILES).map(file => shortName(file.path))

  return [`${entry.repo} #${entry.number}`, counts, ...names, noteOf(entry, now)].filter(Boolean).join(' · ')
}

// Drawn only once gh has answered: before that the card has nothing the app's pane lacks.
export function cardSvg(entry: PrEntry & { view: PrView }, opts: { now: number; width: number }): SvgPic {
  const { width, now } = opts
  const rows = rowsOf(entry, entry.view, opts)
  const height = rows.reduce((sum, row) => sum + row.height + GAP, PAD * 2 - GAP)
  const box = { x: 0, y: 0, width, height, radius: RADIUS, paint: 'card' }
  let y = PAD
  const body = rows.map(row => {
    const drawn = row.draw(y)
    y += row.height + GAP

    return drawn
  })

  return toPic({ body: [rectEl(box), outlineEl({ ...box, paint: 'line' }), ...body].join(''), width, height, alt: altOf(entry, entry.view, now) })
}
