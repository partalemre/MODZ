import { CHECK_ROLE, cardHeadline } from './ci-text'
import { ago } from './parse'
import { PART_H, eyebrow, fit, icon, line, measure, partHead, rect, svgDoc, text, wrapText } from './svg'
import type { Mode, Role } from './tidemark'
import { githubSentence } from './verdict'
import { words } from './words'
import type { CiCard, CiCheck, CiWatch } from '../types'

// The "On GitHub" part's vector parts: its head (which pull request, its title, a plain sentence on its checks), one
// row per check on a rail of step dots (pass Moss ✓, fail Flare ✕, running a ring in the live accent with a
// breathing core, skipped a hollow dash), and the band card's head (a bare ✕, what failed, the PR's title).

export type Drawing = { source: string; width: number; height: number; alt: string }
type Frame = { width: number; mode: Mode }

const HEADLINE = { size: 16, weight: 600 }
const NAME = { size: 13, weight: 500 }
const STATE = { size: 12 }
const CARD_SUB = { size: 12 }
const PR = { size: 13, weight: 560 }
const BODY = { size: 12 }
const BODY_LINE = 17
const PR_BASE = 16
const BODY_GAP = 19
const TITLE_LINES = 2
const SENTENCE_LINES = 6
const BOTTOM = 6
// `measure` runs a little short on dotted names, and wrapped lines must not reach the drawing's edge.
const WRAP_SLACK = 12
const ROW_H = 24
const DOT_X = 5
const DOT_R = 4
const NAME_X = 20
const STATE_GAP = 12
const CARD_ICON = 16
const CARD_TEXT_X = 26
const CARD_H = 60

const prTag = (n: number): string => `${words().ci.eyebrow} · #${n}`

const wrapped = (lines: string[], spec: { y: number; ink: 'mid' | 'lo' }): string =>
  lines.map((one, n) => text({ ...BODY, x: 0, y: spec.y + n * BODY_LINE, text: one, ink: spec.ink })).join('')

export function ciHeadSvg(frame: Frame, spec: { watch: CiWatch; now: number }): Drawing {
  const { watch } = spec
  const says = words().github
  const meta = watch.checkedAt === null ? '' : says.checked(ago(spec.now - watch.checkedAt))
  const pr = says.pr(watch.number)
  const box = { width: frame.width - WRAP_SLACK, font: BODY }
  const titles = wrapText(watch.title, { ...box, maxLines: TITLE_LINES })
  const sentence = githubSentence(watch)
  const sentences = wrapText(sentence, { ...box, maxLines: SENTENCE_LINES })
  const titleY = PART_H + PR_BASE + BODY_GAP
  const sentenceY = titleY + titles.length * BODY_LINE + (BODY_GAP - BODY_LINE)
  const height = sentenceY + (sentences.length - 1) * BODY_LINE + BOTTOM
  const body = partHead({ width: frame.width, label: says.title, meta, isLive: watch.phase === 'watching' })
    + text({ ...PR, x: 0, y: PART_H + PR_BASE, text: pr, ink: 'hi' })
    + wrapped(titles, { y: titleY, ink: 'mid' })
    + wrapped(sentences, { y: sentenceY, ink: 'mid' })

  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${pr}: ${watch.title}. ${sentence}` }
}

// No pull request followed: the part still stands, so the person knows GitHub was not forgotten.
export function noPrSvg(frame: Frame): Drawing {
  const says = words().github
  const lines = wrapText(says.noPr, { width: frame.width - WRAP_SLACK, font: BODY, maxLines: SENTENCE_LINES })
  const height = PART_H + PR_BASE + (lines.length - 1) * BODY_LINE + BOTTOM
  const body = partHead({ width: frame.width, label: says.title }) + wrapped(lines, { y: PART_H + PR_BASE, ink: 'lo' })

  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: `${says.title}. ${says.noPr}` }
}

// A check's mark, at any height: the local rows take theirs in the role their result reads in.
export function dotOf(state: CiCheck['state'], at: { cy: number; role?: Role | 'lo' }): string {
  const mid = at.cy
  const role = at.role ?? CHECK_ROLE[state]
  if (state === 'pending') {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--${role})"/>`
      + `<circle class="breathe" cx="${DOT_X}" cy="${mid}" r="1.75" style="fill:var(--${role})"/>`
  }
  if (state === 'skipped') {
    return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R - 0.75}" fill="none" stroke-width="1.5" style="stroke:var(--strong)"/>`
      + line({ x1: DOT_X - 1.75, y1: mid, x2: DOT_X + 1.75, y2: mid, ink: 'lo' })
  }
  const glyph = icon(state === 'pass' ? 'check' : 'x', { x: DOT_X - 3, y: mid - 3, size: 6, ink: 'card', stroke: 1.5 })

  return `<circle cx="${DOT_X}" cy="${mid}" r="${DOT_R}" style="fill:var(--${role})"/>${glyph}`
}

// The rail runs through the dots, broken where a row starts or ends the list.
export function checkRowSvg(frame: Frame, spec: { check: CiCheck; isFirst: boolean; isLast: boolean }): Drawing {
  const { check } = spec
  const label = words().ci.states[check.state]
  const room = frame.width - NAME_X - measure(label, STATE) - STATE_GAP
  const rails = [
    spec.isFirst ? '' : rect({ x: DOT_X - 0.5, y: 0, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: 'strong' }),
    spec.isLast ? '' : rect({ x: DOT_X - 0.5, y: ROW_H / 2 + DOT_R + 1, w: 1, h: ROW_H / 2 - DOT_R - 1, fill: 'strong' }),
  ].join('')
  const body = rails + dotOf(check.state, { cy: ROW_H / 2 })
    + text({ ...NAME, x: NAME_X, y: 16.5, text: fit(check.name, room, NAME), ink: check.state === 'skipped' ? 'lo' : 'hi' })
    + text({ ...STATE, x: frame.width, y: 16.5, text: label, ink: check.state === 'pass' ? 'lo' : CHECK_ROLE[check.state], anchor: 'end' })
  const source = svgDoc({ width: frame.width, height: ROW_H, mode: frame.mode, body })

  return { source, width: frame.width, height: ROW_H, alt: `${check.name}: ${label}` }
}

export function cardHeadSvg(frame: Frame, spec: { card: CiCard; title: string }): Drawing {
  const headline = cardHeadline(spec.card)
  const room = frame.width - CARD_TEXT_X
  const body = icon('x', { x: 0, y: 13 - CARD_ICON + 3, size: CARD_ICON, ink: 'flare', stroke: 1.5 })
    + eyebrow({ x: CARD_TEXT_X, y: 13, width: room, label: prTag(spec.card.number) })
    + text({ ...HEADLINE, x: CARD_TEXT_X, y: 36, text: fit(headline, room, HEADLINE), ink: 'hi' })
    + text({ ...CARD_SUB, x: CARD_TEXT_X, y: 54, text: fit(spec.title, room, CARD_SUB), ink: 'lo' })
  const source = svgDoc({ width: frame.width, height: CARD_H, mode: frame.mode, body })

  return { source, width: frame.width, height: CARD_H, alt: `${prTag(spec.card.number)}: ${headline}` }
}
