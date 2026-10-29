import { fitText, textWidth, xml } from './format'
import { FONT, paneSvg } from './theme'

// The agent row's drawn parts on the desktop: its head (who it is, the task as the headline, the status as a
// pill and a chevron, since the whole row opens it) and the label that opens each section of the panel. Colour
// is kept for state (DESIGN.md §0): live work takes Claude's clay, a warning amber, a failure red; the rest is
// ink. Still drawings: a row's head keeps one source while its agent's state holds.

export type PillRole = 'run' | 'ok' | 'warn' | 'danger'

export type Pill = { text: string; role: PillRole }

const PILL = { h: 20, padX: 9, size: 11, dot: 3, dotGap: 6 } as const
const BOLD = 1.06
const LABEL = { size: 12, weight: 600 } as const
const HEAD = { h: 44, eyebrowY: 15, titleY: 37, titleSize: 15, gap: 10 } as const
// The chevron's room at a row's right edge, and its half-height.
export const CHEVRON_ROOM = 22
const CHEVRON = 4.5
const STROKE = 1.5
// The who line keeps each word's own case: names and models are not labels ("Nori · light · Opus 5.5").
const WHO = { size: 12, weight: 500, nameWeight: 650 } as const
const SECTION_H = 18

export const HEAD_H = HEAD.h

export type PillPart = { body: string; width: number }

// A pill's ink by its state: running breathes in the accent, a calm finish reads as body text.
const PILL_INK: Record<PillRole, { dot: string; text: string }> = {
  run: { dot: 'f-edit live', text: 'f-edit' },
  ok: { dot: 'm', text: 's' },
  warn: { dot: 'f-warn', text: 'f-warn' },
  danger: { dot: 'f-danger', text: 'f-danger' },
}

/** A status pill: the neutral track, no edge, a dot and the word in its state's ink; a running one's dot breathes. */
export const pillPart = (pill: Pill, x: number, y: number): PillPart => {
  const width = Math.ceil(textWidth(pill.text, PILL.size) * BOLD + PILL.padX * 2 + PILL.dot * 2 + PILL.dotGap)
  const mid = y + PILL.h / 2
  const ink = PILL_INK[pill.role]
  const body = [
    `<rect class="k" x="${x}" y="${y}" width="${width}" height="${PILL.h}" rx="${PILL.h / 2}"/>`,
    `<circle class="${ink.dot}" cx="${x + PILL.padX + PILL.dot}" cy="${mid}" r="${PILL.dot}"/>`,
    `<text class="${ink.text}" x="${x + PILL.padX + PILL.dot * 2 + PILL.dotGap}" y="${mid + PILL.size * 0.35}" font-family="${FONT}" font-size="${PILL.size}" font-weight="600">${xml(pill.text)}</text>`,
  ]
  return { body: body.join(''), width }
}

/** The `›` that says a row opens. It holds still when the row opens, so the head keeps its frame. */
export const chevronSvg = (x: number, y: number): string =>
  `<g class="chev"><path d=""M${x} ${y - CHEVRON}l${CHEVRON} ${CHEVRON}-${CHEVRON} ${CHEVRON}" fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round" class="i-m"/></g>`

export type CardHead = {
  name: string
  tierWord: string
  model: string
  title: string
  pill: Pill
}

// "Nori · light · Opus 5.5 · low": the name bright, the tier and the model quiet (the crab wears the tier); the
// model gives way first.
const whoSvg = (head: CardHead, room: number): string => {
  const tier = ` · ${head.tierWord}`
  const used = textWidth(head.name, WHO.size) * BOLD + textWidth(tier, WHO.size)
  // A model the engine has not named yet is left out until its first request names it.
  const model = head.model ? fitText(` · ${head.model}`, WHO.size, Math.max(0, room - used)) : ''
  const span = (cls: string, text: string) => `<tspan class="${cls}">${xml(text)}</tspan>`
  const name = `<tspan class="t" font-weight="${WHO.nameWeight}">${xml(head.name)}</tspan>`
  const words = name + span('m', tier) + (model === '…' ? '' : span('m', model))
  return `<text x="0" y="${HEAD.eyebrowY}" font-family="${FONT}" font-size="${WHO.size}" font-weight="${WHO.weight}">${words}</text>`
}

export const cardHeadSvg = (W: number, head: CardHead): string => {
  const right = W - CHEVRON_ROOM
  const probe = pillPart(head.pill, 0, 0)
  const pill = pillPart(head.pill, right - probe.width, 2)
  const title = fitText(head.title, HEAD.titleSize * BOLD, right)
  const body = [
    whoSvg(head, right - probe.width - HEAD.gap),
    pill.body,
    `<text class="t" x="0" y="${HEAD.titleY}" font-family="${FONT}" font-size="${HEAD.titleSize}" font-weight="620">${xml(title)}</text>`,
    chevronSvg(W - CHEVRON_ROOM / 2 - CHEVRON / 2, HEAD.h / 2),
  ]
  return paneSvg(W, HEAD.h, body.join(''))
}

export type SectionHead = { label: string }

/** A section's label: sentence case, quiet, nothing beside it; the rows under it say the rest. */
export const sectionSvg = (W: number, section: SectionHead): string => {
  const label = `<text class="m" x="0" y="${SECTION_H / 2 + LABEL.size * 0.36}" font-family="${FONT}" font-size="${LABEL.size}" font-weight="${LABEL.weight}">${xml(fitText(section.label, LABEL.size * BOLD, W))}</text>`
  return paneSvg(W, SECTION_H, label)
}

export const SECTION_SVG_H = SECTION_H

// A plain row: a dot in the notice's state, the words a gap after it, the chevron at the right edge.
const NOTICE = { h: 32, padX: 8, dot: 3, gap: 9, size: 13 } as const

export type Notice = { name: string; reason: string; title: string; role: 'warn' | 'danger' }

/** The attention row: one agent that needs a look, its reason in Amber (gone quiet) or Flare (just failed). */
export const noticeSvg = (W: number, notice: Notice): string => {
  const mid = NOTICE.h / 2
  const x = NOTICE.padX + NOTICE.dot * 2 + NOTICE.gap
  const lead = `${notice.name} `
  const reason = notice.reason
  const used = textWidth(lead, NOTICE.size) * BOLD + textWidth(reason, NOTICE.size) * BOLD
  const title = fitText(` · ${notice.title}`, NOTICE.size, Math.max(0, W - x - CHEVRON_ROOM - used))
  const body = [
    `<circle class="f-${notice.role}" cx="${NOTICE.padX + NOTICE.dot}" cy="${mid}" r="${NOTICE.dot}"/>`,
    `<text x="${x}" y="${mid + NOTICE.size * 0.35}" font-family="${FONT}" font-size="${NOTICE.size}" font-weight="560"><tspan class="t">${xml(lead)}</tspan><tspan class="f-${notice.role}">${xml(reason)}</tspan><tspan class="s" font-weight="400">${xml(title === '…' ? '' : title)}</tspan></text>`,
    chevronSvg(W - CHEVRON_ROOM / 2 - CHEVRON / 2, mid),
  ]
  return paneSvg(W, NOTICE.h, body.join(''))
}

export const NOTICE_H = NOTICE.h
