// MODZ kit — element helpers. Each takes (ui, surface, isLight, opts): `ui` is
// `$.ui.resolve(e)`, `surface` is `e.surface`, `isLight` comes from resolveLight. On the
// terminal (or any table without Svg) each draws glyphs and theme keys instead of Svg.
import type { ElementTable, RenderChildren, RenderElement, RenderSurface } from 'claude-code'

import { GLYPH } from './icons'
import { headerSvg, statRowSvg } from './svg-compose'
import type { HeaderOpts } from './svg-compose'
import { upperTr } from './svg-core'
import { clampRatio, meter, meterTone, percentText } from './svg-meters'
import type { MeterOpts } from './svg-meters'
import { pill } from './svg-shapes'
import { eyebrow } from './svg-text'
import type { PillOpts, StatTileOpts } from './svg-shapes'
import { LINE_KEY, palette, ROLE_KEY, ROLES } from './tokens'
import type { Role, ThemeKey } from './tokens'
import { planButtons } from './ui-buttons'
import type { ButtonSpec } from './ui-buttons'

export type Ui = ElementTable

// Svg px per layout cell on the desktop; card padding and border in cells (DESIGN.md §4).
export const PX_PER_CELL = 8
const CARD_PAD_X = 2
const CARD_PAD_Y = 1
const CARD_BORDER_CELLS = 2
const MIN_INNER = 160

export const isTextSurface = (ui: Ui, surface: RenderSurface): boolean => surface === 'terminal' || !('Svg' in ui)

// The px a card's content gets inside `columns` (e.props.bodyColumns), with a little slack.
export const cardInnerWidth = (columns: number): number =>
  Math.max(MIN_INNER, (columns - CARD_PAD_X * 2 - CARD_BORDER_CELLS) * PX_PER_CELL)

export const pxWidth = (columns: number): number => Math.max(MIN_INNER, columns * PX_PER_CELL)

const isRole = (paint: string): paint is Role => (ROLES as readonly string[]).includes(paint)

// A Svg paint name (`warn`, `danger`, a role, `mid`) as a terminal theme key; neutral → none.
export const toneKey = (paint: string): ThemeKey | undefined => (isRole(paint) ? ROLE_KEY[paint] : undefined)

function svgOf(ui: Ui, pic: { source: string; width: number; height: number; alt: string }): RenderElement | null {
  if (!('Svg' in ui)) return null
  const { Svg } = ui
  return <Svg source={pic.source} alt={pic.alt} width={pic.width} height={pic.height} />
}

// ---------------------------------------------------------------------------

export type EyebrowOpts = { text: string; role?: Role; meta?: string; width: number; hasRule?: boolean }

export function Eyebrow(ui: Ui, surface: RenderSurface, isLight: boolean, o: EyebrowOpts): RenderElement {
  const { Box, Text } = ui

  if (isTextSurface(ui, surface)) {
    return (
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={o.role ? ROLE_KEY[o.role] : undefined} dimColor={!o.role} bold>{`● ${upperTr(o.text)}`}</Text>
        {o.meta ? <Text dimColor>{o.meta}</Text> : null}
      </Box>
    )
  }

  return svgOf(ui, eyebrow({ ...o, hasDot: true })) ?? <Box />
}

export function HeaderBlock(ui: Ui, surface: RenderSurface, isLight: boolean, o: HeaderOpts): RenderElement {
  const { Box, Text } = ui

  if (!isTextSurface(ui, surface)) return svgOf(ui, headerSvg(o)) ?? <Box />

  const glyph = o.icon ? `${GLYPH[o.icon]} ` : '● '
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={o.role ? ROLE_KEY[o.role] : undefined} dimColor={!o.role} bold>{glyph + upperTr(o.eyebrow)}</Text>
        {o.meta ? <Text dimColor>{o.meta}</Text> : null}
      </Box>
      {o.headline ? <Text bold>{o.headline}</Text> : null}
      {o.sub ? <Text>{o.sub}</Text> : null}
    </Box>
  )
}

export type CardOpts = { header?: HeaderOpts; role?: Role; isDanger?: boolean; children?: RenderChildren }

// Round border informs, single border asks for a consequential decision (Flare line).
export function Card(ui: Ui, surface: RenderSurface, isLight: boolean, o: CardOpts): RenderElement {
  const { Box } = ui
  const isText = isTextSurface(ui, surface)
  const p = palette(isLight)
  const role = o.isDanger ? 'danger' : o.role
  const borderColor = isText ? (role ? ROLE_KEY[role] : LINE_KEY) : role ? p.roles[role].line : p.line
  const header = o.header ? HeaderBlock(ui, surface, isLight, { role, ...o.header }) : null

  return (
    <Box
      flexDirection="column"
      borderStyle={o.isDanger ? 'single' : 'round'}
      borderColor={borderColor}
      backgroundColor={isText ? undefined : p.card}
      paddingX={CARD_PAD_X}
      paddingY={CARD_PAD_Y}
      gap={1}
    >
      {header}
      {o.children}
    </Box>
  )
}

// ---------------------------------------------------------------------------

export type ButtonRowOpts = { buttons: readonly ButtonSpec[]; isDanger?: boolean }

export function ButtonRow(ui: Ui, surface: RenderSurface, isLight: boolean, o: ButtonRowOpts): RenderElement {
  const { Box, Button } = ui
  const planned = planButtons(o.buttons, o.isDanger)

  return (
    <Box flexDirection="row" gap={1} flexWrap="wrap">
      {planned.map(b => (
        <Button
          key={b.key ?? b.label}
          label={b.label}
          onPress={b.onPress}
          variant={b.variant === 'primary' ? 'primary' : b.variant === 'secondary' ? 'secondary' : undefined}
          plain={b.variant === 'plain' ? true : undefined}
          hotkey={b.hotkey}
          autoFocus={b.isFocused ? true : undefined}
        />
      ))}
    </Box>
  )
}

export type HighlightOpts = { text: string; role: Role }

// Tint behind, role colour in front, not bold; one padding space each side on the desktop.
export function Highlight(ui: Ui, surface: RenderSurface, isLight: boolean, o: HighlightOpts): RenderElement {
  const { Text } = ui

  if (isTextSurface(ui, surface)) return <Text color={ROLE_KEY[o.role]}>{o.text}</Text>

  const c = palette(isLight).roles[o.role]
  return <Text backgroundColor={c.tint} color={c.fg}>{` ${o.text} `}</Text>
}

// ---------------------------------------------------------------------------

export type StatRowOpts = { stats: readonly StatTileOpts[]; width: number }

export function StatRow(ui: Ui, surface: RenderSurface, isLight: boolean, o: StatRowOpts): RenderElement {
  const { Box, Text } = ui

  if (!isTextSurface(ui, surface)) return svgOf(ui, statRowSvg(o)) ?? <Box />

  return (
    <Box flexDirection="row" gap={3} flexWrap="wrap">
      {o.stats.map(stat => (
        <Text key={stat.label}>
          <Text dimColor>{`${stat.label} `}</Text>
          <Text bold color={stat.role ? ROLE_KEY[stat.role] : undefined}>{stat.value}</Text>
          {stat.unit ? <Text dimColor>{` ${stat.unit}`}</Text> : null}
        </Text>
      ))}
    </Box>
  )
}

export type MeterGlyphs = { fill: string; rest: string; pace: string; after: string }

const DEFAULT_CELLS = 20

// `━━━━╸┊────`: the fill, the head, the pace mark (only where it is still ahead), the rest.
export function meterGlyphs(ratio: number, cells = DEFAULT_CELLS, pace?: number): MeterGlyphs {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * cells)
  const head = filled > 0 && filled < cells ? '╸' : filled > 0 ? '━' : ''
  const fill = '━'.repeat(Math.max(0, filled - 1)) + head
  const at = pace === undefined ? -1 : Math.round(Math.max(0, Math.min(1, pace)) * cells)
  const empty = cells - filled

  if (at < filled || at >= cells) return { fill, rest: '─'.repeat(empty), pace: '', after: '' }

  return { fill, rest: '─'.repeat(at - filled), pace: '┊', after: '─'.repeat(empty - (at - filled) - 1) }
}

export type MeterElementOpts = MeterOpts & { cells?: number }

export function Meter(ui: Ui, surface: RenderSurface, isLight: boolean, o: MeterElementOpts): RenderElement {
  const { Box, Text } = ui

  if (!isTextSurface(ui, surface)) return svgOf(ui, meter(o)) ?? <Box />

  const ratio = clampRatio(o.value, o.max)
  const g = meterGlyphs(ratio, o.cells, o.pace)
  const key = toneKey(meterTone(ratio, o.pace, o.role))
  return (
    <Text>
      {o.label ? <Text>{`${o.label} `}</Text> : null}
      <Text color={key}>{g.fill}</Text>
      <Text dimColor>{g.rest}</Text>
      <Text dimColor>{g.pace}</Text>
      <Text dimColor>{g.after}</Text>
      <Text bold color={ratio >= 1 ? 'error' : undefined}>{` ${o.valueText ?? percentText(o.value, o.max)}`}</Text>
    </Text>
  )
}

export function Pill(ui: Ui, surface: RenderSurface, isLight: boolean, o: PillOpts): RenderElement {
  const { Box, Text } = ui

  if (!isTextSurface(ui, surface)) return svgOf(ui, pill(o)) ?? <Box />

  const glyph = o.icon ? `${GLYPH[o.icon]} ` : ''
  return <Text color={o.role ? ROLE_KEY[o.role] : undefined} dimColor={!o.role}>{`${glyph}${o.text}`}</Text>
}

export { planButtons } from './ui-buttons'
export type { ButtonSpec, PlannedButton } from './ui-buttons'
