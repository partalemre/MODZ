import { SUITE_TAG, durationText, eyebrowRole, headlineOf, runMeta, spanOf } from './summary'
import { bar, eyebrow, fileBadge, fit, highlight, icon, measure, rect, runs, svgDoc, text } from './svg'
import type { Ink } from './svg'
import type { Mode } from './tidemark'
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
const ROW_H = 44
const ROW_SHORT_H = 26
const SKELETON_H = 64

const inkOf = (tone: string): Ink => (tone === 'neutral' ? 'hi' : (tone as Ink))

export function headerSvg(frame: Frame, spec: { badge: TestBadge; now: number }): Drawing {
  const { badge } = spec
  const head = headlineOf(badge)
  const tests = badge.tests
  const hasBar = badge.isRunning || (tests !== null && tests.total !== null && tests.passed !== null)
  const height = hasBar ? HEADER_H : HEADER_BARLESS_H
  const top = eyebrow({ x: 0, y: 13, width: frame.width, label: 'Test sonuçları', role: eyebrowRole(badge), meta: runMeta(badge, spec.now), isLive: badge.isRunning })
  const title = runs({ x: 0, y: 42, size: HEADLINE.size, parts: [{ text: head.lead, ink: inkOf(head.tone), weight: 650 }, { text: head.rest, ink: 'hi', weight: HEADLINE.weight }] })
  let meter = ''
  if (badge.isRunning) meter = rect({ x: 0, y: 55, w: frame.width, h: 6, rx: 3, fill: 'iris-l', className: 'shimmer' })
  else if (hasBar && tests !== null) {
    const passed = tests.passed ?? 0
    const total = tests.total ?? 0
    meter = bar({ x: 0, y: 55, width: frame.width, height: 6, total, parts: [{ value: passed, ink: 'moss' }, { value: total - passed, ink: 'flare' }] })
  }
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: top + title + meter })

  return { source, width: frame.width, height, alt: `Test sonuçları: ${head.lead}${head.rest}` }
}

export function fileHeadSvg(frame: Frame, spec: { file: string | null; count: number }): Drawing {
  const count = `${spec.count} hata`
  const room = frame.width - 34 - measure(count, META) - 12
  const path = spec.file ?? 'dosya belirtilmemiş'
  const cut = path.lastIndexOf('/')
  const name = fit(path.slice(cut + 1), room, PATH)
  const dir = fit(path.slice(0, cut + 1), Math.max(0, room - measure(name, PATH)), { size: PATH.size }, true)
  const body = fileBadge({ x: 0, y: 5, path })
    + runs({ x: 34, y: 17.5, size: PATH.size, parts: [{ text: dir === '…' ? '' : dir, ink: 'lo', weight: 500 }, { text: name, ink: 'hi', weight: PATH.weight }] })
    + text({ ...META, x: frame.width, y: 17.5, text: count, ink: 'lo', anchor: 'end' })

  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: `${path}: ${count}` }
}

// One failure: `file:line` span, the test's name, suite and time on the right, the error below.
export function rowSvg(frame: Frame, failure: Failure): Drawing {
  const isCheck = failure.suite === 'lint' || failure.suite === 'typecheck'
  const span = highlight({ x: 0, y: 17, text: spanOf(failure), role: isCheck ? 'amber' : 'flare', font: SPAN })
  const meta = [SUITE_TAG[failure.suite], durationText(failure.durationMs)].filter(part => part !== '').join(' · ')
  const titleX = span.width + 10
  const room = frame.width - titleX - measure(meta, META) - 14
  const title = text({ ...TITLE, x: titleX, y: 17, text: fit(failure.name, room, TITLE), ink: 'hi' })
  const right = text({ ...META, x: frame.width, y: 17, text: meta, ink: 'lo', anchor: 'end' })
  const hasMessage = failure.message !== ''
  const height = hasMessage ? ROW_H : ROW_SHORT_H
  const message = hasMessage ? text({ ...MESSAGE, x: 4, y: 36, text: fit(failure.message, frame.width - 4, MESSAGE), ink: 'mid' }) : ''
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: span.svg + title + right + message })

  return { source, width: frame.width, height, alt: `${spanOf(failure)} ${failure.name}${hasMessage ? `: ${failure.message}` : ''}` }
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

  return { source: svgDoc({ width: frame.width, height: SKELETON_H, mode: frame.mode, body: rows.join('') }), width: frame.width, height: SKELETON_H, alt: 'Yükleniyor' }
}
