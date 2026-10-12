import { fitText, textWidth, xml } from './format'
import { upper } from './lang'
import { FONT, paneSvg } from './theme'

// The agent card's drawn parts on the desktop: its head (who it is in an eyebrow, the task as the
// headline, the status as a pill) and the eyebrow that opens each section of the panel. Still
// drawings: a card's head keeps one source while its agent's state holds.

export type PillRole = 'run' | 'ok' | 'warn' | 'danger'

export type Pill = { text: string; role: PillRole }

const PILL = { h: 20, padX: 9, size: 11, dot: 3, dotGap: 6 } as const
const BOLD = 1.06
const EYEBROW = { size: 10.5, tracking: 0.9, weight: 700 } as const
const HEAD = { h: 44, eyebrowY: 15, titleY: 37, titleSize: 15, gap: 10 } as const
// The who line keeps each word's own case: names and models are not labels ("Nori · light · Opus 5.5").
const WHO = { size: 12, weight: 500, nameWeight: 650 } as const
const RULE_GAP = 10
const SECTION_H = 18
const DOT_R = 3

export const HEAD_H = HEAD.h

export type PillPart = { body: string; width: number }

/** A status pill: tint fill, line edge, a dot and the word, in its role's colour. */
export const pillPart = (pill: Pill, x: number, y: number): PillPart => {
  const width = Math.ceil(textWidth(pill.text, PILL.size) * BOLD + PILL.padX * 2 + PILL.dot * 2 + PILL.dotGap)
  const mid = y + PILL.h / 2
  const body = [
    `<rect class="b-${pill.role} l-${pill.role}" x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${PILL.h - 1}" rx="${(PILL.h - 1) / 2}" stroke-width="1"/>`,
    `<circle class="f-${pill.role}" cx="${x + PILL.padX + PILL.dot}" cy="${mid}" r="${PILL.dot}"/>`,
    `<text class="f-${pill.role}" x="${x + PILL.padX + PILL.dot * 2 + PILL.dotGap}" y="${mid + PILL.size * 0.35}" font-family="${FONT}" font-size="${PILL.size}" font-weight="600">${xml(pill.text)}</text>`,
  ]
  return { body: body.join(''), width }
}

export type CardHead = {
  name: string
  /** The tier's class suffix (`w-light`), and the word drawn in it. */
  tier: string
  tierWord: string
  model: string
  title: string
  pill: Pill
}

const caps = upper

const eyebrowWidth = (s: string): number => textWidth(s, EYEBROW.size + EYEBROW.tracking)

// "Nori · light · Opus 5.5 · low": the name bright, the tier in its colour, the model quiet; the model gives way first.
const whoSvg = (head: CardHead, room: number): string => {
  const tier = ` · ${head.tierWord}`
  const used = textWidth(head.name, WHO.size) * BOLD + textWidth(tier, WHO.size)
  const model = fitText(` · ${head.model}`, WHO.size, Math.max(0, room - used))
  const span = (cls: string, text: string) => `<tspan class="${cls}">${xml(text)}</tspan>`
  const name = `<tspan class="t" font-weight="${WHO.nameWeight}">${xml(head.name)}</tspan>`
  const words = name + span(`w-${head.tier}`, tier) + (model === '…' ? '' : span('m', model))
  return `<text x="0" y="${HEAD.eyebrowY}" font-family="${FONT}" font-size="${WHO.size}" font-weight="${WHO.weight}">${words}</text>`
}

export const cardHeadSvg = (W: number, head: CardHead): string => {
  const probe = pillPart(head.pill, 0, 0)
  const pill = pillPart(head.pill, W - probe.width, 2)
  const title = fitText(head.title, HEAD.titleSize * BOLD, W)
  const body = [
    whoSvg(head, W - probe.width - HEAD.gap),
    pill.body,
    `<text class="t" x="0" y="${HEAD.titleY}" font-family="${FONT}" font-size="${HEAD.titleSize}" font-weight="620">${xml(title)}</text>`,
  ]
  return paneSvg(W, HEAD.h, body.join(''))
}

export type SectionHead = { label: string; dot?: PillRole | 'idle' }

/** A section's eyebrow: a dot in its role, the label in capitals, a hairline to the edge. */
export const sectionSvg = (W: number, section: SectionHead): string => {
  const text = caps(section.label)
  const hasDot = section.dot !== undefined
  const x = hasDot ? DOT_R * 2 + 6 : 0
  const textEnd = x + eyebrowWidth(text)
  const dot = hasDot ? `<circle class="${section.dot === 'idle' ? 'm' : `f-${section.dot}`}" cx="${DOT_R}" cy="${SECTION_H / 2}" r="${DOT_R}"/>` : ''
  const rule = textEnd + RULE_GAP < W ? `<line class="ln" x1="${textEnd + RULE_GAP}" x2="${W}" y1="${SECTION_H / 2}" y2="${SECTION_H / 2}" stroke-width="1"/>` : ''
  const label = `<text class="m" x="${x}" y="${SECTION_H / 2 + EYEBROW.size * 0.36}" font-family="${FONT}" font-size="${EYEBROW.size}" font-weight="${EYEBROW.weight}" letter-spacing="${EYEBROW.tracking}">${xml(fitText(text, EYEBROW.size + EYEBROW.tracking, W - x))}</text>`
  return paneSvg(W, SECTION_H, dot + label + rule)
}

export const SECTION_SVG_H = SECTION_H

// The mark is a filled circle with a '!' in the card's own fill; the words start a gap after it.
const NOTICE = { h: 32, rx: 10, padX: 12, mark: 8, markSize: 11, markBaseline: 4, gap: 8, size: 12.5 } as const

export type Notice = { name: string; reason: string; title: string; role: 'warn' | 'danger' }

/** The attention line: one agent that needs a look, in Amber (gone quiet) or Flare (just failed). */
export const noticeSvg = (W: number, notice: Notice): string => {
  const mid = NOTICE.h / 2
  const x = NOTICE.padX + NOTICE.mark * 2 + NOTICE.gap
  const lead = `${notice.name} `
  const reason = notice.reason
  const used = textWidth(lead, NOTICE.size) * BOLD + textWidth(reason, NOTICE.size) * BOLD
  const title = fitText(` · ${notice.title}`, NOTICE.size, Math.max(0, W - x - NOTICE.padX - used))
  const body = [
    `<rect class="b-${notice.role} l-${notice.role}" x="0.5" y="0.5" width="${W - 1}" height="${NOTICE.h - 1}" rx="${NOTICE.rx}" stroke-width="1"/>`,
    `<circle class="f-${notice.role}" cx="${NOTICE.padX + NOTICE.mark}" cy="${mid}" r="${NOTICE.mark}"/>`,
    `<text class="tile" x="${NOTICE.padX + NOTICE.mark}" y="${mid + NOTICE.markBaseline}" text-anchor="middle" font-family="${FONT}" font-size="${NOTICE.markSize}" font-weight="800">!</text>`,
    `<text x="${x}" y="${mid + NOTICE.size * 0.35}" font-family="${FONT}" font-size="${NOTICE.size}" font-weight="600"><tspan class="t">${xml(lead)}</tspan><tspan class="f-${notice.role}">${xml(reason)}</tspan><tspan class="s" font-weight="400">${xml(title === '…' ? '' : title)}</tspan></text>`,
  ]
  return paneSvg(W, NOTICE.h, body.join(''))
}

export const NOTICE_H = NOTICE.h
