import { biggestFirst, factsOf, noteOf, shortName, stateOf } from './card-facts'
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
const TITLE_H = 22
const FACT_H = 34
const FILE_H = 20
const GAP = 10
const DOT = 7
const BADGE_W = 26
const CHIP_GAP = 14
const COUNT_SIZE = 11.5

type Row = { height: number; draw: (y: number) => string }

const fit = (text: string, max: number, size: number, weight?: number): string => fitText(text, max, sans(size, weight))

function headRow(entry: PrEntry, width: number): Row {
  const state = stateOf(entry.view)
  const view = entry.view
  const tail = view === null ? '' : `${words().files(view.changedFiles)}`
  const plus = view === null ? '' : `+${view.additions}`
  const minus = view === null ? '' : `−${view.deletions}`
  const stats = mono(COUNT_SIZE)
  const minusW = stats(minus)
  const plusW = stats(plus)
  const tailW = sans(META)(tail)
  const stateW = sans(META, TYPE.eyebrow.weight)(state.text)
  const right = width - PAD
  const repoX = PAD + DOT + 6 + stateW + 10
  const repoMax = right - tailW - plusW - minusW - 24 - repoX

  return {
    height: HEAD_H,
    draw: y => {
      const line = baseline(y, HEAD_H, META)

      return [
        `<circle cx="${PAD + DOT / 2}" cy="${y + HEAD_H / 2}" r="${DOT / 2}" class="f-${state.tone}"/>`,
        textEl({ x: PAD + DOT + 6, y: line, text: state.text, size: META, weight: TYPE.eyebrow.weight, paint: state.tone === 'lo' ? 'mid' : state.tone }),
        textEl({ x: repoX, y: line, text: fit(`${entry.repo} #${entry.number}`, repoMax, META), size: META, paint: 'lo' }),
        view === null ? '' : textEl({ x: right, y: line, text: minus, size: COUNT_SIZE, paint: 'mid', anchor: 'end', isMono: true }),
        view === null ? '' : textEl({ x: right - minusW - 6, y: line, text: plus, size: COUNT_SIZE, paint: 'mid', anchor: 'end', isMono: true }),
        view === null ? '' : textEl({ x: right - minusW - plusW - 18, y: line, text: tail, size: META, paint: 'lo', anchor: 'end' }),
      ].join('')
    },
  }
}

function titleRow(text: string, width: number): Row {
  return {
    height: TITLE_H,
    draw: y => textEl({ x: PAD, y: baseline(y, TITLE_H, TYPE.title.size), text: fit(text, width - PAD * 2, TYPE.title.size, TYPE.title.weight), size: TYPE.title.size, weight: TYPE.title.weight, paint: 'hi' }),
  }
}

function factsRow(view: PrView, width: number): Row {
  const facts = factsOf(view)
  const cell = (width - PAD * 2) / facts.length

  return {
    height: FACT_H,
    draw: y => facts.map((fact, i) => {
      const x = PAD + i * cell

      return [
        textEl({ x, y: y + META, text: fact.label, size: META, paint: 'lo' }),
        textEl({ x, y: y + META + LINE_H, text: fit(fact.value, cell - 8, META, TYPE.label.weight), size: META, weight: TYPE.label.weight, paint: fact.tone }),
      ].join('')
    }).join(''),
  }
}

function failingRow(names: readonly string[], width: number): Row {
  const label = words().failingLabel
  const labelW = sans(META)(label) + 8

  return {
    height: LINE_H,
    draw: y => {
      const line = baseline(y, LINE_H, META)

      return [
        textEl({ x: PAD, y: line, text: label, size: META, paint: 'lo' }),
        textEl({ x: PAD + labelW, y: line, text: fit(names.join(' · '), width - PAD * 2 - labelW, META), size: META, paint: 'danger' }),
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

function rowsOf(entry: PrEntry, now: number, width: number): Row[] {
  const view = entry.view
  const note = noteOf(entry, now)
  const rows = [headRow(entry, width)]
  if (view !== null) {
    rows.push(titleRow(view.title, width), factsRow(view, width))
    if (view.checks.failing.length > 0) rows.push(failingRow(view.checks.failing, width))
    if (view.files.length > 0) rows.push(filesRow(view, width))
  }
  if (note !== null) rows.push(noteRow(note, width))

  return rows
}

function altOf(entry: PrEntry, now: number): string {
  const view = entry.view
  const state = stateOf(view).text
  const head = `${state} ${entry.repo} #${entry.number}`
  const facts = view === null ? [] : [view.title, ...factsOf(view).map(fact => `${fact.label}: ${fact.value}`)]

  return [head, ...facts, noteOf(entry, now)].filter(Boolean).join(' · ')
}

export function cardSvg(entry: PrEntry, opts: { now: number; width: number }): SvgPic {
  const { width, now } = opts
  const rows = rowsOf(entry, now, width)
  const height = rows.reduce((sum, row) => sum + row.height + GAP, PAD * 2 - GAP)
  const box = { x: 0, y: 0, width, height, radius: RADIUS, paint: 'card' }
  let y = PAD
  const body = rows.map(row => {
    const drawn = row.draw(y)
    y += row.height + GAP

    return drawn
  })

  return toPic({ body: [rectEl(box), outlineEl({ ...box, paint: 'line' }), ...body].join(''), width, height, alt: altOf(entry, now) })
}
