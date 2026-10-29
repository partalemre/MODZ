// The hub's Svg on the desktop: the MODZ head, a section's label and one row per pane. The identity is the film's
// pixel grid (kit/pixels.ts): the head spells MODZ in its letters, and each row's mark is a glyph on the same grid.
// A row is one line, as the host app's sidebar: the glyph, the title, and on the right the mod's own value, its
// digits tabular. The head's count is set in the site's mono. Colour is state alone, and it lives in the glyph: clay while work runs, amber while it waits,
// red when it fails (then its words too). No subtitle when a mod has nothing to say, no chevron. The whole row is
// pressed (kit/press.tsx), so a row is a still image; the native button over it lights on hover.
import type { HubCard } from '../types'
import type { Drawing } from './draw'
import { esc, fit, measure } from './draw'
import type { HubRow } from './hub'
import { ROLE_OF_TONE } from './hub'
import { pixelGlyph, pixelWord } from './kit/pixels'
import { delayOf, entering, isEntering, motionCss } from './kit/motion'
import type { Cue } from './kit/motion'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'

// The hub grows with its pane: from a narrow pane (NARROW px) to a wide one (WIDE px) every size eases from its
// narrow value to its wide one, so a wide panel is not a small list in a big space. A row stays about one native
// button tall (kit/press.tsx): one button covers it, its light the only hover, centred in the taller rows.
const NARROW = 280
const WIDE = 520
const between = (k: number, from: number, to: number): number => Math.round((from + (to - from) * k) * 10) / 10

export type Sizes = {
  row: number; section: number; head: number; inset: number; icon: number; textX: number; baseline: number
  glyph: { cell: number; pitch: number }; mark: { cell: number; pitch: number; gap: number }
  title: { size: number; weight: number }; value: { size: number; weight: number }; label: number; meta: number
}

export function sizesOf(width: number): Sizes {
  const k = Math.max(0, Math.min(1, (width - NARROW) / (WIDE - NARROW)))
  // A drawing's box is whole pixels: a desktop draws nothing of a pane whose Svg is a fraction of a pixel tall.
  const row = Math.round(between(k, 30, 38))
  const inset = between(k, 16, 22)
  const icon = between(k, 16, 20)
  const title = between(k, 13, 15)

  return {
    row, section: Math.round(between(k, 30, 38)), head: Math.round(between(k, 46, 58)), inset, icon, textX: inset + icon + between(k, 12, 14),
    baseline: row / 2 + title * 0.35,
    glyph: { cell: between(k, 2, 2.5), pitch: between(k, 2.5, 3.1) },
    mark: { cell: between(k, 2.6, 3.3), pitch: between(k, 3.1, 3.9), gap: between(k, 5, 6.2) },
    title: { size: title, weight: 500 }, value: { size: between(k, 12, 13.5), weight: 400 },
    label: between(k, 11, 12), meta: between(k, 11, 12.5),
  }
}

// The mark's drop-in: a letter after the one before it, a row after the row above, a column after the one beside.
const LETTER_MS = 70
const ROW_MS = 32
const COLUMN_MS = 8
const VALUE_GAP = 16
const BADGE_GAP = 6

const HUB_CSS = [
  '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}',
].join('')

const doc = (spec: { width: number; height: number; theme: Theme; body: string }) => svgDoc({ ...spec, css: HUB_CSS })

type Value = { text: string; ink: string }

// What the right edge says: the card's words, plain unless failing. "ok" and "idle" are just information.
function valueOf(card: HubCard | null): Value | null {
  if (card === null || card.detail === '') return null

  return { text: card.detail, ink: card.tone === 'bad' ? 'fg-danger' : 'lo' }
}

// The glyph's paint: the state worth a glance, else the quiet ink.
function glyphInk(card: HubCard | null): string {
  if (card === null || card.detail === '') return 'f-mid'
  const role: RoleName | null = card.tone === 'live' ? 'edit' : card.tone === 'warn' || card.tone === 'bad' ? ROLE_OF_TONE[card.tone] : null

  return role === null ? 'f-mid' : `fg-${role}`
}

// The head: MODZ in the film's letters, in clay, and how many mods are on at the right. It is the panel's name,
// so nothing else says "MODZ" above it; it drops in once as the panel opens.
export function hubHeadSvg(spec: { width: number; theme: Theme; meta: string; cue: Cue }): Drawing {
  const isDropping = isEntering(spec.cue)
  // As the film's title does: each letter's pixels drop in row by row, a letter after the one before it.
  const cellAttrs = isDropping ? (at: { row: number; col: number; index: number }) => ` class="m-px" style="${delayOf(spec.cue, at.index * LETTER_MS + at.row * ROW_MS + at.col * COLUMN_MS)}"` : undefined
  const z = sizesOf(spec.width)
  const mark = pixelWord('MODZ', { x: z.inset, y: (z.head - 7 * z.mark.pitch) / 2, ...z.mark, className: 'fg-edit', cellAttrs })
  const meta = `<text x="${spec.width - z.inset}" y="${z.head / 2 + 4}" text-anchor="end" style="font-size:${z.meta}px" class="num lo">${esc(spec.meta)}</text>`
  const body = mark.svg + entering(meta, { ...spec.cue, order: spec.cue.order + 4 }, 'fade')
  const css = HUB_CSS + motionCss(body)

  return { source: svgDoc({ width: spec.width, height: z.head, theme: spec.theme, body, css }), alt: `MODZ · ${spec.meta}`, height: z.head }
}

// A group's label: the section's name in sentence case, quiet, on the icon column, more air above than below.
export function sectionSvg(spec: { width: number; theme: Theme; label: string; cue: Cue }): Drawing {
  const z = sizesOf(spec.width)
  const body = `<text x="${z.inset}" y="${z.section - 8}" style="font-size:${z.label}px;font-weight:600" class="lo">${esc(spec.label)}</text>`

  return { source: doc({ width: spec.width, height: z.section, theme: spec.theme, body: entering(body, spec.cue, 'fade') }), alt: spec.label, height: z.section }
}

function rowIcon(row: HubRow, z: Sizes): string {
  return pixelGlyph(row.entry.icon, { x: z.inset, y: (z.row - z.icon) / 2, box: z.icon, ...z.glyph, className: glyphInk(row.card) })
}

// The title and, after it, a lowercase word such as "beta" in the quiet ink: a tag, not a pill.
function titleOf(row: HubRow, z: Sizes): { svg: string; end: number } {
  const title = row.entry.title
  const titleEnd = z.textX + measure(title, z.title.size, z.title.weight)
  const text = `<text x="${z.textX}" y="${z.baseline}" style="font-size:${z.title.size}px;font-weight:500" class="hi">${esc(title)}</text>`
  const badge = row.entry.badge
  if (badge === null) return { svg: text, end: titleEnd }
  const word = badge.toLocaleLowerCase()
  const tag = `<text x="${titleEnd + BADGE_GAP}" y="${z.baseline}" style="font-size:${z.label}px;font-weight:500" class="lo">${esc(word)}</text>`

  return { svg: text + tag, end: titleEnd + BADGE_GAP + measure(word, z.label, 500) }
}

const NARROW_VALUE = { size: 12, weight: 400 }

// A value that does not fit is shortened at a word, never mid-word: its first " · " part, then fewer words from the
// end ("257 değişiklik commit edilmedi" → "257 değişiklik"). A bare number says nothing, so fewer than two words
// that fit leave the row without a value; only a lone long word is cut to "…".
export function shortValue(text: string, width: number, font: { size: number; weight: number } = NARROW_VALUE): string {
  const fits = (candidate: string): boolean => measure(candidate, font.size, font.weight) <= width
  if (fits(text)) return text
  const first = text.split(' · ')[0] ?? text
  const words = first.split(' ')
  if (words.length === 1) return fit(first, width, font)
  for (let n = words.length; n >= 2; n--) {
    const kept = words.slice(0, n).join(' ')
    if (fits(kept)) return kept
  }

  return ''
}

// The value right-aligned, shortened to the room the title leaves.
function valueSvg(value: Value | null, room: { from: number; to: number; z: Sizes }): string {
  if (value === null) return ''
  const text = shortValue(value.text, room.to - room.from, room.z.value)
  if (text === '') return ''

  return `<text x="${room.to}" y="${room.z.baseline}" text-anchor="end" style="font-size:${room.z.value.size}px;font-variant-numeric:tabular-nums" class="${value.ink}">${esc(text)}</text>`
}

// `buttonRoom`: the width native buttons take over the row's right edge while customizing, the value then left out.
export function hubRowSvg(spec: { width: number; theme: Theme; row: HubRow; buttonRoom: number; cue: Cue }): Drawing {
  const { width, row } = spec
  const z = sizesOf(width)
  const title = titleOf(row, z)
  const value = spec.buttonRoom > 0 ? null : valueOf(row.card)
  const body = [
    rowIcon(row, z),
    title.svg,
    valueSvg(value, { from: title.end + VALUE_GAP, to: width - z.inset, z }),
  ].join('')
  const alt = `${row.entry.title}${row.entry.badge === null ? '' : ` (${row.entry.badge})`}${value === null ? '' : `: ${value.text}`}`

  return { source: doc({ width, height: z.row, theme: spec.theme, body: entering(body, spec.cue) }), alt, height: z.row }
}
