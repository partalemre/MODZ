import type { TouchedFile } from '../types'
import { fitMono, fitStart, fitText, monoWidth, shortPath, textWidth, xml } from './format'
import type { Kind } from './history'
import type { NowView } from './now'
import { extOf } from './touched'
import { FONT, MONO, paneSvg } from './theme'

// The open card's drawings on the desktop: the "now" card (an icon box in the call's colour, the
// verb as its eyebrow, the tool and its whole target) and the list of files it touched, each with
// a type badge and how often it read or changed it.

type Role = 'read' | 'edit' | 'run' | 'ok' | 'warn' | 'danger' | 'plan'

// A role's classes from theme.ts; `null` is the quiet neutral of a call of no known kind.
const cls = (role: Role | null) =>
  role ? { fg: `f-${role}`, tint: `b-${role}`, icon: `i-${role}` } : { fg: 'm', tint: 'k', icon: 'i-m' }

const KIND_ROLE: Record<Kind, Role | null> = { read: 'read', edit: 'edit', run: 'run', agent: 'ok', other: null }

// 16 px line icons, stroke 1.75, drawn for this card (DESIGN.md §4: no emoji, no glyph stand-ins).
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
const STROKE = 1.75

const iconAt = (icon: Icon, opts: { x: number; y: number; cls: string; scale?: number }): string =>
  `<g class="${opts.cls}" transform="translate(${opts.x} ${opts.y}) scale(${opts.scale ?? 1})" fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g>`

// Baselines: the eyebrow's at 24 px, the call's at 40 px, a 56 px card with 12 px of padding.
const NOW = { h: 56, pad: 12, box: 32, rx: 12, boxRx: 9, eyebrow: 10.5, eyebrowY: 24, lineY: 40, tracking: 0.9, line2: 13.5, mono: 12.5, span: 11.5 } as const
const BOLD = 1.06
// A line of text sits centred on a row when its baseline is this far below the middle, in em.
const MID_BASELINE = 0.36

type NowLook = { role: Role | null; icon: Icon }

const lookOfNow = (now: NowView): NowLook => {
  if (now.state === 'done') return { role: 'ok', icon: 'done' }
  if (now.state === 'failed') return { role: 'danger', icon: 'failed' }
  if (now.state === 'call') return { role: KIND_ROLE[now.kind], icon: now.kind }
  return { role: 'run', icon: 'thinking' }
}

const strokeOf = (role: Role | null): string => (role ? `l-${role}` : 'ln')

// The tool bright, its target in mono after it; the target gives way first, from its end.
const callLine = (now: NowView, x: number, room: number): string => {
  const tool = now.tool ? `${now.tool} ` : ''
  const used = textWidth(tool, NOW.line2) * BOLD
  const shown = fitMono(now.target, { size: NOW.mono, maxW: Math.max(0, room - used), isFromStart: now.isPath })
  return `<text x="${x}" y="${NOW.lineY}" font-family="${FONT}" font-size="${NOW.line2}" font-weight="620"><tspan class="t">${xml(tool)}</tspan><tspan class="s" font-family="${MONO}" font-size="${NOW.mono}" font-weight="450">${xml(shown)}</tspan></text>`
}

/** The "now" card: what the agent does this moment, or where it stopped. */
export const nowSvg = (W: number, now: NowView): string => {
  const look = lookOfNow(now)
  const c = cls(look.role)
  const boxY = (NOW.h - NOW.box) / 2
  const x = NOW.pad + NOW.box + NOW.pad
  const spanW = now.span ? textWidth(now.span, NOW.span) + NOW.pad : 0
  const verb = fitText(now.verb.toLocaleUpperCase('tr'), NOW.eyebrow + NOW.tracking, W - x - NOW.pad - spanW)
  const iconOffset = (NOW.box - ICON_SIZE) / 2
  const body = [
    `<rect class="tile ${strokeOf(look.role)}" x=".5" y=".5" width="${W - 1}" height="${NOW.h - 1}" rx="${NOW.rx}" stroke-width="1"/>`,
    `<rect class="${c.tint}" x="${NOW.pad}" y="${boxY}" width="${NOW.box}" height="${NOW.box}" rx="${NOW.boxRx}"/>`,
    iconAt(look.icon, { x: NOW.pad + iconOffset, y: boxY + iconOffset, cls: c.icon }),
    `<text class="${c.fg}" x="${x}" y="${NOW.eyebrowY}" font-family="${FONT}" font-size="${NOW.eyebrow}" font-weight="700" letter-spacing="${NOW.tracking}">${xml(verb)}</text>`,
    now.span ? `<text class="m" x="${W - NOW.pad}" y="${NOW.eyebrowY}" text-anchor="end" font-family="${FONT}" font-size="${NOW.span}" font-variant-numeric="tabular-nums">${xml(now.span)}</text>` : '',
    now.tool ? callLine(now, x, W - x - NOW.pad) : '',
  ]
  return paneSvg(W, NOW.h, body.join(''))
}

export const NOW_H = NOW.h

const ROW = { h: 26, badgeW: 34, badgeH: 17, badgeRx: 4, badge: 9, gap: 10, path: 12.5, count: 11.5, icon: 0.72, iconGap: 3, countGap: 10 } as const

const EXT_ROLE: Record<string, Role> = {
  TS: 'warn', TSX: 'warn', JS: 'warn', JSX: 'warn', MJS: 'warn', CJS: 'warn',
  PY: 'read', MD: 'run', TXT: 'run', JSON: 'ok', CSV: 'ok', YAML: 'ok', YML: 'ok', TOML: 'ok',
  PDF: 'danger', PNG: 'plan', JPG: 'plan', JPEG: 'plan', GIF: 'plan', SVG: 'plan', WEBP: 'plan',
}

const BADGE_MAX = 4

const badgeOf = (path: string, y: number): string => {
  const ext = extOf(path).slice(0, BADGE_MAX)
  const c = cls(EXT_ROLE[ext] ?? null)
  const mid = y + ROW.h / 2
  return `<rect class="${c.tint}" x="0" y="${mid - ROW.badgeH / 2}" width="${ROW.badgeW}" height="${ROW.badgeH}" rx="${ROW.badgeRx}"/>` +
    `<text class="${c.fg}" x="${ROW.badgeW / 2}" y="${mid + ROW.badge * MID_BASELINE}" text-anchor="middle" font-family="${MONO}" font-size="${ROW.badge}" font-weight="700">${xml(ext || '·')}</text>`
}

type Count = { n: number; icon: Icon; role: Role }

const countsOf = (f: TouchedFile): Count[] =>
  [{ n: f.edits, icon: 'edit' as const, role: 'edit' as const }, { n: f.reads, icon: 'read' as const, role: 'read' as const }].filter(c => c.n > 0)

const countW = (c: Count): number => ICON_SIZE * ROW.icon + ROW.iconGap + monoWidth(String(c.n), ROW.count)

// The counts at the row's right edge, laid out from the right so they line up across rows.
const countsSvg = (counts: Count[], opts: { right: number; y: number }): { body: string; width: number } => {
  let x = opts.right
  const mid = opts.y + ROW.h / 2
  const parts = [...counts].reverse().map(c => {
    x -= countW(c)
    const part = iconAt(c.icon, { x, y: mid - (ICON_SIZE * ROW.icon) / 2, cls: `i-${c.role}`, scale: ROW.icon }) +
      `<text class="f-${c.role}" x="${x + ICON_SIZE * ROW.icon + ROW.iconGap}" y="${mid + ROW.count * MID_BASELINE}" font-family="${MONO}" font-size="${ROW.count}" font-weight="600">${c.n}</text>`
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
