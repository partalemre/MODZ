import type { TouchedFile } from '../types'
import { fitMono, fitStart, fitText, monoWidth, shortPath, textWidth, xml } from './format'
import { upper } from './lang'
import type { NowView } from './now'
import { extOf } from './touched'
import { FONT, MONO, paneSvg } from './theme'

// The open row's drawings on the desktop: the "now" line (a bare icon of the call, the verb as a quiet label in
// its state's ink, the tool and its whole target; its ticking span is native text above it) and the list of files
// it touched, each with a neutral type badge and how often it read or changed it. No box, no tint: the open row
// is one surface, and colour is kept for state (DESIGN.md §0).

// 16 px line icons, stroke 1.5, drawn for this row (DESIGN.md §4: no emoji, no glyph stand-ins).
const ICON = {
  read: '<circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4L14 14"/>',
  edit: '<path d="M3 13l.8-3.2L10.6 3l2.4 2.4-6.8 6.8z"/><path d="M9.2 4.4l2.4 2.4"/>',
  run: '<path d="M3 4.5L6.5 8 3 11.5"/><path d="M8.5 12h5"/>',
  agent: '<path d="M8 2.5L13.5 8 8 13.5 2.5 8z"/>',
  other: '<circle cx="8" cy="8" r="5"/>',
  thinking: '<circle cx="3.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12.5" cy="8" r=".9"/>',
  done: '<path d="M3 8.5l3.2 3.2L13 4.8"/>',
  failed: '<path d="M4 4l8 8M12 4l-8 8"/>',
} as const

type Icon = keyof typeof ICON

const ICON_SIZE = 16
const STROKE = 1.5

const iconAt = (icon: Icon, opts: { x: number; y: number; cls: string; scale?: number }): string =>
  `<g class="${opts.cls}" transform="translate(${opts.x} ${opts.y}) scale(${opts.scale ?? 1})" fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g>`

// Baselines: the verb's at 15 px, the call's at 34 px; the words start past the icon's column.
const NOW = { h: 42, textX: 26, iconY: 3, label: 12, labelY: 15, lineY: 34, line2: 13.5, mono: 12.5 } as const
const BOLD = 1.06
// A line of text sits centred on a row when its baseline is this far below the middle, in em.
const MID_BASELINE = 0.36

// The verb's ink: live work in the accent, a failure red, a finish quiet; the icon stays body ink.
type NowLook = { ink: string; icon: Icon }

const lookOfNow = (now: NowView): NowLook => {
  if (now.state === 'done') return { ink: 'm', icon: 'done' }
  if (now.state === 'failed') return { ink: 'f-danger', icon: 'failed' }
  if (now.state === 'call') return { ink: 'f-edit', icon: now.kind }
  return { ink: 'f-edit', icon: 'thinking' }
}

// Sentence case in either language: the kit's upper keeps Turkish İ.
const capital = (s: string): string => upper(s.charAt(0)) + s.slice(1)

// The tool bright, its target in mono after it; the target gives way first, from its end.
const callLine = (now: NowView, x: number, room: number): string => {
  const tool = now.tool ? `${now.tool} ` : ''
  const used = textWidth(tool, NOW.line2) * BOLD
  const shown = fitMono(now.target, { size: NOW.mono, maxW: Math.max(0, room - used), isFromStart: now.isPath })
  return `<text x="${x}" y="${NOW.lineY}" font-family="${FONT}" font-size="${NOW.line2}" font-weight="620"><tspan class="t">${xml(tool)}</tspan><tspan class="s" font-family="${MONO}" font-size="${NOW.mono}" font-weight="450">${xml(shown)}</tspan></text>`
}

/** The "now" line: what the agent does this moment, or where it stopped. */
export const nowSvg = (W: number, now: NowView): string => {
  const look = lookOfNow(now)
  const x = NOW.textX
  const verb = fitText(capital(now.verb), NOW.label * BOLD, W - x)
  const body = [
    iconAt(look.icon, { x: 0, y: NOW.iconY, cls: 'i-s' }),
    `<text class="${look.ink}" x="${x}" y="${NOW.labelY}" font-family="${FONT}" font-size="${NOW.label}" font-weight="600">${xml(verb)}</text>`,
    now.tool ? callLine(now, x, W - x) : '',
  ]
  return paneSvg(W, NOW.h, body.join(''))
}

export const NOW_H = NOW.h

const ROW = { h: 26, badgeW: 34, badgeH: 17, badgeRx: 4, badge: 9, gap: 10, path: 12.5, count: 11.5, icon: 0.72, iconGap: 3, countGap: 10 } as const

const BADGE_MAX = 4

// Every type wears the same neutral badge: the track behind the extension in quiet mono.
const badgeOf = (path: string, y: number): string => {
  const ext = extOf(path).slice(0, BADGE_MAX)
  const mid = y + ROW.h / 2
  return `<rect class="k" x="0" y="${mid - ROW.badgeH / 2}" width="${ROW.badgeW}" height="${ROW.badgeH}" rx="${ROW.badgeRx}"/>` +
    `<text class="m" x="${ROW.badgeW / 2}" y="${mid + ROW.badge * MID_BASELINE}" text-anchor="middle" font-family="${MONO}" font-size="${ROW.badge}" font-weight="600">${xml(ext || '·')}</text>`
}

// Edits in body ink, reads quieter: what it changed reads first, without a colour per kind.
type Count = { n: number; icon: Icon; ink: 's' | 'm' }

const countsOf = (f: TouchedFile): Count[] =>
  [{ n: f.edits, icon: 'edit' as const, ink: 's' as const }, { n: f.reads, icon: 'read' as const, ink: 'm' as const }].filter(c => c.n > 0)

const countW = (c: Count): number => ICON_SIZE * ROW.icon + ROW.iconGap + monoWidth(String(c.n), ROW.count)

// The counts at the row's right edge, laid out from the right so they line up across rows.
const countsSvg = (counts: Count[], opts: { right: number; y: number }): { body: string; width: number } => {
  let x = opts.right
  const mid = opts.y + ROW.h / 2
  const parts = [...counts].reverse().map(c => {
    x -= countW(c)
    const part = iconAt(c.icon, { x, y: mid - (ICON_SIZE * ROW.icon) / 2, cls: `i-${c.ink}`, scale: ROW.icon }) +
      `<text class="${c.ink}" x="${x + ICON_SIZE * ROW.icon + ROW.iconGap}" y="${mid + ROW.count * MID_BASELINE}" font-family="${MONO}" font-size="${ROW.count}" font-weight="600">${c.n}</text>`
    x -= ROW.countGap
    return part
  })
  return { body: parts.join(''), width: opts.right - x }
}

// The folder quiet, the name bright; a long path loses folders from its start, never its name.
const pathSvg = (path: string, opts: { y: number; room: number }): string => {
  const short = shortPath(path)
  const cut = short.lastIndexOf('/') + 1
  const name = fitText(short.slice(cut), ROW.path * BOLD, opts.room)
  const dir = fitStart(short.slice(0, cut), ROW.path, opts.room - textWidth(name, ROW.path) * BOLD)
  const y = opts.y + ROW.h / 2 + ROW.path * MID_BASELINE
  return `<text x="${ROW.badgeW + ROW.gap}" y="${y}" font-family="${FONT}" font-size="${ROW.path}"><tspan class="m">${xml(dir)}</tspan><tspan class="t" font-weight="560">${xml(name)}</tspan></text>`
}

/** The files it touched, one row each: a type badge, the path, its edits and reads. */
export const filesSvg = (W: number, files: TouchedFile[]): { source: string; height: number } => {
  const rows = files.map((f, i) => {
    const y = i * ROW.h
    const counts = countsSvg(countsOf(f), { right: W, y })
    const room = W - ROW.badgeW - ROW.gap - counts.width - ROW.gap
    return badgeOf(f.path, y) + pathSvg(f.path, { y, room }) + counts.body
  })
  const height = Math.max(ROW.h, files.length * ROW.h)
  return { source: paneSvg(W, height, rows.join('')), height }
}
