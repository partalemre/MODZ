import { shine } from './kit/motion'
import { durationText, eyebrowRole, headlineOf, runMeta, spanOf, suiteTag } from './summary'
import { bar, esc, eyebrow, fileBadge, fit, fitStart, highlight, icon, measure, rect, runs, svgDoc, text, wrapText } from './svg'
import type { Ink } from './svg'
import type { Mode } from './tidemark'
import { words } from './words'
import type { Failure, TestBadge } from '../types'

// The details pane's vector parts: the header (eyebrow, headline, result bar), a file's heading,
// a failure row, the heading of output no parser could place, and the loading skeleton.

export type Drawing = { source: string; width: number; height: number; alt: string }
type Frame = { width: number; mode: Mode }

const HEADLINE = { size: 17, weight: 620 }
const TITLE = { size: 13, weight: 600 }
const SPAN = { size: 11.5, weight: 500, isMono: true }
const MESSAGE = { size: 11.5, isMono: true }
const META = { size: 11 }
const PATH = { size: 12.5, weight: 600 }
const HEADER_H = 66
const HEADER_BARLESS_H = 52
const FILE_H = 26
const ROW_BASE = 17
const NAME_LINE = 18
const MESSAGE_GAP = 19
const MESSAGE_LINE = 16
const ROW_PAD = 9
const TEXT_INDENT = 4
const NAME_LINES = 4
const MESSAGE_LINES = 8
const SKELETON_H = 64
const EMPTY_FONT = { size: 13 }
const EMPTY_LINE = 18
const EMPTY_TOP = 40
// Semibold runs wider than the regular advance `measure` assumes.
const BOLD_WIDEN = 1.06

const inkOf = (tone: string): Ink => (tone === 'neutral' ? 'hi' : (tone as Ink))

export function headerSvg(frame: Frame, spec: { badge: TestBadge; now: number }): Drawing {
  const { badge } = spec
  const head = headlineOf(badge)
  const tests = badge.tests
  const hasBar = badge.isRunning || (tests !== null && tests.total !== null && tests.passed !== null)
  const height = hasBar ? HEADER_H : HEADER_BARLESS_H
  const top = eyebrow({ x: 0, y: 13, width: frame.width, label: words().eyebrowResults, role: eyebrowRole(badge), meta: runMeta(badge, spec.now), isLive: badge.isRunning })
  const title = runs({ x: 0, y: 42, size: HEADLINE.size, parts: [{ text: head.lead, ink: inkOf(head.tone), weight: 650 }, { text: head.rest, ink: 'hi', weight: HEADLINE.weight }] })
  let meter = ''
  // A run still going: its track breathes and a light runs along it until it ends.
  if (badge.isRunning) meter = rect({ x: 0, y: 55, w: frame.width, h: 6, rx: 3, fill: 'iris-l', className: 'shimmer' }) + shine({ id: 'tb-run', x: 0, y: 55, width: frame.width, height: 6 })
  else if (hasBar && tests !== null) {
    const passed = tests.passed ?? 0
    const total = tests.total ?? 0
    meter = bar({ x: 0, y: 55, width: frame.width, height: 6, total, parts: [{ value: passed, ink: 'moss' }, { value: total - passed, ink: 'flare' }] })
  }
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: top + title + meter })

  return { source, width: frame.width, height, alt: `${words().eyebrowResults}: ${head.lead}${head.rest}` }
}

export function fileHeadSvg(frame: Frame, spec: { file: string | null; count: number }): Drawing {
  const count = words().errorCount(spec.count)
  const room = frame.width - 34 - measure(count, META) - 12
  const path = spec.file ?? words().noFile
  const cut = path.lastIndexOf('/')
  const name = fit(path.slice(cut + 1), room, PATH)
  const dir = fitStart(path.slice(0, cut + 1), Math.max(0, room - measure(name, PATH)), { size: PATH.size })
  const body = fileBadge({ x: 0, y: 5, path })
    + runs({ x: 34, y: 17.5, size: PATH.size, parts: [{ text: dir === '…' ? '' : dir, ink: 'lo', weight: 500 }, { text: name, ink: 'hi', weight: PATH.weight }] })
    + text({ ...META, x: frame.width, y: 17.5, text: count, ink: 'lo', anchor: 'end' })

  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: `${path}: ${count}` }
}

// One failure: `file:line` span, suite and time on the right, the test's name beside the span when it fits
// and on lines of its own when not, then the error, wrapped rather than cut.
export function rowSvg(frame: Frame, failure: Failure): Drawing {
  const isCheck = failure.suite === 'lint' || failure.suite === 'typecheck'
  const span = highlight({ x: 0, y: ROW_BASE, text: spanOf(failure), role: isCheck ? 'amber' : 'flare', font: SPAN })
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter(part => part !== '').join(' · ')
  const titleX = span.width + 10
  const isInline = measure(failure.name, TITLE) <= frame.width - titleX - measure(meta, META) - 14
  const names = isInline ? [failure.name] : wrapText(failure.name, { width: frame.width - TEXT_INDENT, font: TITLE, maxLines: NAME_LINES })
  const title = names.map((line, n) => text({ ...TITLE, x: isInline ? titleX : TEXT_INDENT, y: ROW_BASE + (isInline ? 0 : (n + 1) * NAME_LINE), text: line, ink: 'hi' }))
  const right = text({ ...META, x: frame.width, y: ROW_BASE, text: meta, ink: 'lo', anchor: 'end' })
  const nameBottom = ROW_BASE + (isInline ? 0 : names.length * NAME_LINE)
  const messages = failure.message === '' ? [] : wrapText(failure.message, { width: frame.width - TEXT_INDENT, font: MESSAGE, maxLines: MESSAGE_LINES })
  const message = messages.map((line, n) => text({ ...MESSAGE, x: TEXT_INDENT, y: nameBottom + MESSAGE_GAP + n * MESSAGE_LINE, text: line, ink: 'mid' }))
  const height = (messages.length === 0 ? nameBottom : nameBottom + MESSAGE_GAP + (messages.length - 1) * MESSAGE_LINE) + ROW_PAD
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: span.svg + title.join('') + right + message.join('') })

  return { source, width: frame.width, height, alt: `${spanOf(failure)} ${failure.name}${failure.message === '' ? '' : `: ${failure.message}`}` }
}

// No run yet: the eyebrow and one sentence, its lead in text.hi, laid into lines that keep each word's ink.
export function emptySvg(frame: Frame): Drawing {
  const says = words()
  const items = [...`${says.emptyLead} ·`.split(' ').map(word => ({ word, isLead: word !== '·' })), ...says.emptyHow.split(' ').map(word => ({ word, isLead: false }))]
  const lines: (typeof items)[] = [[]]
  let used = 0
  for (const item of items) {
    const line = lines[lines.length - 1] as typeof items
    const wide = measure(item.word, EMPTY_FONT) * (item.isLead ? BOLD_WIDEN : 1)
    const next = used + (line.length === 0 ? 0 : measure(' ', EMPTY_FONT)) + wide
    const isBreak = line.length > 0 && next > frame.width
    if (isBreak) lines.push([item])
    else line.push(item)
    used = isBreak ? wide : next
  }
  const body = lines.map((line, n) => {
    const spans = line.map((item, k) => `<tspan${item.isLead ? ' font-weight="600"' : ''} style="fill:var(--${item.isLead ? 'hi' : 'mid'})">${k === 0 ? '' : ' '}${esc(item.word)}</tspan>`)

    return `<text x="0" y="${EMPTY_TOP + n * EMPTY_LINE}" font-size="${EMPTY_FONT.size}" xml:space="preserve">${spans.join('')}</text>`
  })
  const height = EMPTY_TOP + (lines.length - 1) * EMPTY_LINE + ROW_PAD
  const head = eyebrow({ x: 0, y: 13, width: frame.width, label: says.eyebrowTests, role: 'tide' })
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: head + body.join('') })

  return { source, width: frame.width, height, alt: `${says.eyebrowTests}: ${says.emptyLead} · ${says.emptyHow}` }
}

export function tailHeadSvg(frame: Frame, title: string): Drawing {
  const body = icon('x', { x: 0, y: 4, size: 16, ink: 'flare', stroke: 2 }) + text({ ...TITLE, x: 24, y: 16.5, text: fit(title, frame.width - 24, TITLE), ink: 'hi' })

  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: title }
}

export function skeletonSvg(frame: Frame): Drawing {
  const rows = [0, 1, 2].map(index => {
    const y = 6 + index * 20
    const width = frame.width * (index === 1 ? 0.55 : 0.8)

    return rect({ x: 0, y, w: 52, h: 10, rx: 3, fill: 'track', className: 'shimmer' }) + rect({ x: 62, y, w: width - 62, h: 10, rx: 3, fill: 'track', className: 'shimmer' })
  })

  return { source: svgDoc({ width: frame.width, height: SKELETON_H, mode: frame.mode, body: rows.join('') }), width: frame.width, height: SKELETON_H, alt: words().loading }
}
