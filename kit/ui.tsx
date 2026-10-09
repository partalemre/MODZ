// MODZ kit — element helpers. Each takes (draw, opts), where `draw` is { ui, surface, isLight }:
// `ui` is `$.ui.resolve(e)`, `surface` is `e.surface`, `isLight` comes from resolveLight. On the
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
import type { Palette, Role, ThemeKey } from './tokens'
import { planButtons } from './ui-buttons'
import type { ButtonSpec, ButtonVariant } from './ui-buttons'

export type Ui = ElementTable

// Where an element draws; a caller's own context with more fields passes as it is.
export type DrawCtx = { ui: Ui; surface: RenderSurface; isLight: boolean }

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

export function Eyebrow(draw: DrawCtx, o: EyebrowOpts): RenderElement {
  const { ui, surface } = draw
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

export function HeaderBlock(draw: DrawCtx, o: HeaderOpts): RenderElement {
  const { ui, surface } = draw
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

function borderOf(isText: boolean, p: Palette, role?: Role): string {
  if (isText) return role ? ROLE_KEY[role] : LINE_KEY

  return role ? p.roles[role].line : p.line
}

// Round border informs, single border asks for a consequential decision (Flare line).
export function Card(draw: DrawCtx, o: CardOpts): RenderElement {
  const { ui, surface, isLight } = draw
  const { Box } = ui
  const isText = isTextSurface(ui, surface)
  const p = palette(isLight)
  const role = o.isDanger ? 'danger' : o.role
  const borderColor = borderOf(isText, p, role)
  const header = o.header ? HeaderBlock(draw, { role, ...o.header }) : null

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

// A plain button is drawn with the `plain` flag, not a variant.
const BUTTON_VARIANT: Record<ButtonVariant, 'primary' | 'secondary' | undefined> = { primary: 'primary', secondary: 'secondary', plain: undefined }

export type ButtonRowOpts = { buttons: readonly ButtonSpec[]; isDanger?: boolean }

export function ButtonRow(draw: DrawCtx, o: ButtonRowOpts): RenderElement {
  const { Box, Button } = draw.ui
  const planned = planButtons(o.buttons, o.isDanger)

  return (
    <Box flexDirection="row" gap={1} flexWrap="wrap">
      {planned.map(b => (
        <Button
          key={b.key ?? b.label}
          label={b.label}
          onPress={b.onPress}
          variant={BUTTON_VARIANT[b.variant]}
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
export function Highlight(draw: DrawCtx, o: HighlightOpts): RenderElement {
  const { ui, surface, isLight } = draw
  const { Text } = ui

  if (isTextSurface(ui, surface)) return <Text color={ROLE_KEY[o.role]}>{o.text}</Text>

  const c = palette(isLight).roles[o.role]
  return <Text backgroundColor={c.tint} color={c.fg}>{` ${o.text} `}</Text>
}

// ---------------------------------------------------------------------------

export type StatRowOpts = { stats: readonly StatTileOpts[]; width: number }

export function StatRow(draw: DrawCtx, o: StatRowOpts): RenderElement {
  const { ui, surface } = draw
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

// The fill's last cell: a half head while the meter runs, a whole one when it is full.
function headOf(filled: number, cells: number): string {
  if (filled <= 0) return ''

  return filled < cells ? '╸' : '━'
}

// `━━━━╸┊────`: the fill, the head, the pace mark (only where it is still ahead), the rest.
export function meterGlyphs(ratio: number, cells = DEFAULT_CELLS, pace?: number): MeterGlyphs {
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * cells)
  const fill = '━'.repeat(Math.max(0, filled - 1)) + headOf(filled, cells)
  const at = pace === undefined ? -1 : Math.round(Math.max(0, Math.min(1, pace)) * cells)
  const empty = cells - filled

  if (at < filled || at >= cells) return { fill, rest: '─'.repeat(empty), pace: '', after: '' }

  return { fill, rest: '─'.repeat(at - filled), pace: '┊', after: '─'.repeat(empty - (at - filled) - 1) }
}

export type MeterElementOpts = MeterOpts & { cells?: number }

export function Meter(draw: DrawCtx, o: MeterElementOpts): RenderElement {
  const { ui, surface } = draw
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

export function Pill(draw: DrawCtx, o: PillOpts): RenderElement {
  const { ui, surface } = draw
  const { Box, Text } = ui

  if (!isTextSurface(ui, surface)) return svgOf(ui, pill(o)) ?? <Box />

  const glyph = o.icon ? `${GLYPH[o.icon]} ` : ''
  return <Text color={o.role ? ROLE_KEY[o.role] : undefined} dimColor={!o.role}>{`${glyph}${o.text}`}</Text>
}

export { planButtons } from './ui-buttons'
export type { ButtonSpec, PlannedButton } from './ui-buttons'
