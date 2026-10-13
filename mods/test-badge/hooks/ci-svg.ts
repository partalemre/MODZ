import { newTalkOf } from './ci-state'
import { CHECK_ROLE, cardHeadline, ciLine, ciRole } from './ci-text'
import { ago } from './parse'
import { eyebrow, fit, icon, line, measure, rect, svgDoc, text } from './svg'
import type { Mode } from './tidemark'
import { words } from './words'
import type { CiCard, CiCheck, CiWatch } from '../types'

// The CI section's vector parts: its header (eyebrow, the PR's title, the one-line summary), one row per check
// on a rail of step dots (pass Moss ✓, fail Flare ✕, running Iris ring with a breathing core, skipped a hollow
// dash), and the band card's head (a Flare ✕ tile, eyebrow, "CI failed: lint", the PR's title).

export type Drawing = { source: string; width: number; height: number; alt: string }
type Frame = { width: number; mode: Mode }

const HEADLINE = { size: 17, weight: 620 }
const SUB = { size: 13 }
const NAME = { size: 13, weight: 500 }
const STATE = { size: 11 }
const CARD_SUB = { size: 12 }
const HEAD_H = 68
const ROW_H = 24
const DOT_X = 5
const DOT_R = 4
const NAME_X = 20
const STATE_GAP = 12
const TILE = 36
const TILE_ICON = 18
const CARD_TEXT_X = 48
const CARD_H = 60

const prTag = (n: number): string => `${words().ci.eyebrow} · #${n}`

export function ciHeadSvg(frame: Frame, spec: { watch: CiWatch; now: number }): Drawing {
  const { watch } = spec
  const talk = newTalkOf(watch)
  const summary = [ciLine(watch) || words().ci.noChecks, talk > 0 ? words().ci.newTalk(talk) : ''].filter(part => part !== '').join(' · ')
  const meta = watch.checkedAt === null ? '' : ago(spec.now - watch.checkedAt)
  const body = eyebrow({ x: 0, y: 13, width: frame.width, label: prTag(watch.number), role: ciRole(watch), meta, isLive: watch.phase === 'watching' })
    + text({ ...HEADLINE, x: 0, y: 40, text: fit(watch.title, frame.width, HEADLINE), ink: 'hi' })
    + text({ ...SUB, x: 0, y: 60, text: fit(summary, frame.width, SUB), ink: 'mid' })
  const source = svgDoc({ width: frame.width, height: HEAD_H, mode: frame.mode, body })

  return { source, width: frame.width, height: HEAD_H, alt: `${prTag(watch.number)}: ${watch.title} · ${summary}` }
}

function dotOf(state: CiCheck['state']): string {
  const mid = ROW_H / 2
  const role = CHECK_ROLE[state]
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
  const body = rails + dotOf(check.state)
    + text({ ...NAME, x: NAME_X, y: 16.5, text: fit(check.name, room, NAME), ink: check.state === 'skipped' ? 'lo' : 'hi' })
    + text({ ...STATE, x: frame.width, y: 16.5, text: label, ink: CHECK_ROLE[check.state], anchor: 'end' })
  const source = svgDoc({ width: frame.width, height: ROW_H, mode: frame.mode, body })

  return { source, width: frame.width, height: ROW_H, alt: `${check.name}: ${label}` }
}

export function cardHeadSvg(frame: Frame, spec: { card: CiCard; title: string }): Drawing {
  const headline = cardHeadline(spec.card)
  const room = frame.width - CARD_TEXT_X
  const tile = rect({ x: 0.5, y: 2.5, w: TILE - 1, h: TILE - 1, rx: 9, fill: 'flare-t', stroke: 'flare-l' })
    + icon('x', { x: (TILE - TILE_ICON) / 2, y: 2 + (TILE - TILE_ICON) / 2, size: TILE_ICON, ink: 'flare' })
  const body = tile
    + eyebrow({ x: CARD_TEXT_X, y: 13, width: room, label: prTag(spec.card.number), role: 'flare' })
    + text({ ...HEADLINE, x: CARD_TEXT_X, y: 36, text: fit(headline, room, HEADLINE), ink: 'hi' })
    + text({ ...CARD_SUB, x: CARD_TEXT_X, y: 54, text: fit(spec.title, room, CARD_SUB), ink: 'lo' })
  const source = svgDoc({ width: frame.width, height: CARD_H, mode: frame.mode, body })

  return { source, width: frame.width, height: CARD_H, alt: `${prTag(spec.card.number)}: ${headline}` }
}
