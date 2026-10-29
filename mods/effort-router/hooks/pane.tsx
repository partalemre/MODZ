// The "Effort" pane: the latest effort and model with the mode in force, the mode picker, and the newest turns.
// One surface, no card: the pane is the surface. The desktop draws the head and the group label in Svg; the
// terminal draws them in text. Pure: no `$`.
import type { RenderElement, RenderSurface } from 'claude-code'

import type { EffortMode, TurnRow } from '../types'
import { paneMotion } from './kit/moving'
import { isTextSurface, PANE_PX_PER_CELL } from './kit/ui'
import type { DrawCtx, Ui } from './kit/ui'
import { place, toPic } from './kit/svg-core'
import type { SvgPic } from './kit/svg-core'
import { eyebrow, linesPart } from './kit/svg-text'
import { palette } from './kit/tokens'
import { MODES } from './route'
import { effortText, isLowered, shortModel, TURNS_KEPT } from './turns'
import { words } from './words'

export type PaneView = { mode: EffortMode; turns: readonly TurnRow[]; now: number }
export type PaneLook = { ui: Ui; surface: RenderSurface; isLight: boolean; columns: number }

export const MODE_KEY = 'er-mode'

// Text colours: theme keys on the terminal, the kit's hex on the desktop.
type Tones = { lo: { color?: string; dimColor?: boolean }; mid: { color?: string }; hi: { color?: string } }

function tonesOf(draw: DrawCtx): Tones {
  if (isTextSurface(draw.ui, draw.surface)) return { lo: { dimColor: true }, mid: {}, hi: {} }
  const p = palette(draw.isLight)

  return { lo: { color: p.lo }, mid: { color: p.mid }, hi: { color: p.hi } }
}

function headlineOf(turns: readonly TurnRow[]): string {
  const latest = turns.find(turn => turn.model !== '')

  return latest === undefined ? words().noTurns : words().latest(effortText(latest.sent), shortModel(latest.model))
}

// A panel this wide lists each turn on one line in columns; a narrower one gives it two lines.
const WIDE_COLUMNS = 72
// Column widths in cells: "26 min", "normal", "low xhigh yerine", "sonnet-4-5".
const CELLS = { ago: 7, cls: 7, effort: 17, model: 10 }

type RowCtx = { draw: DrawCtx; now: number; isWide: boolean; hasClass: boolean }

function rowFacts(ctx: RowCtx, row: TurnRow) {
  const said = words()

  return {
    ago: said.ago(Math.max(0, ctx.now - row.at)),
    snippet: row.snippet === '' ? said.continuation : row.snippet,
    cls: row.cls === null ? said.unjudged : said.className[row.cls],
    from: isLowered(row) ? ` ${said.lowered(effortText(row.asked))}` : '',
    model: row.model === '' ? '—' : shortModel(row.model),
  }
}

function effortCell(ctx: RowCtx, o: { row: TurnRow; from: string }) {
  const { Text } = ctx.draw.ui
  const tones = tonesOf(ctx.draw)

  return (
    <Text wrap="truncate">
      <Text {...tones.hi} bold>{effortText(o.row.sent)}</Text>
      <Text {...tones.lo}>{o.from}</Text>
    </Text>
  )
}

function wideRow(ctx: RowCtx, o: { row: TurnRow; index: number }) {
  const { Box, Text } = ctx.draw.ui
  const tones = tonesOf(ctx.draw)
  const facts = rowFacts(ctx, o.row)

  return (
    <Box key={`er-row-${o.index}`} flexDirection="row" columnGap={2}>
      <Box width={CELLS.ago} flexShrink={0}><Text {...tones.lo}>{facts.ago}</Text></Box>
      <Box flexGrow={1} flexShrink={1}><Text {...tones.mid} wrap="truncate">{facts.snippet}</Text></Box>
      {ctx.hasClass ? <Box width={CELLS.cls} flexShrink={0}><Text {...tones.lo}>{facts.cls}</Text></Box> : null}
      <Box width={CELLS.effort} flexShrink={0}>{effortCell(ctx, { row: o.row, from: facts.from })}</Box>
      <Box width={CELLS.model} flexShrink={0}><Text {...tones.lo} wrap="truncate">{facts.model}</Text></Box>
    </Box>
  )
}

function stackedRow(ctx: RowCtx, o: { row: TurnRow; index: number }) {
  const { Box, Text } = ctx.draw.ui
  const tones = tonesOf(ctx.draw)
  const facts = rowFacts(ctx, o.row)
  const rest = [ctx.hasClass ? facts.cls : '', facts.model].filter(part => part !== '').join(' · ')

  return (
    <Box key={`er-row-${o.index}`} flexDirection="column">
      <Box flexDirection="row" columnGap={2}>
        <Box flexGrow={1} flexShrink={1}><Text {...tones.mid} wrap="truncate">{facts.snippet}</Text></Box>
        <Text {...tones.lo}>{facts.ago}</Text>
      </Box>
      <Text wrap="truncate">
        <Text {...tones.hi} bold>{effortText(o.row.sent)}</Text>
        <Text {...tones.lo}>{`${facts.from} · ${rest}`}</Text>
      </Text>
    </Box>
  )
}

// The pane's drawings on the desktop (kit/moving.ts): reset as the pane opens, so they cascade in each time.
export const motion = paneMotion()

const HEAD = { title: 16, titleWeight: 600, titleLine: 22, sub: 12, subLine: 16, gap: 4 }
// The pane fills its column; the hub's pane uses the same reckoning (one column of slack).
const MIN_WIDTH = 240
export const paneWidth = (columns: number): number => Math.max(MIN_WIDTH, (columns - 1) * PANE_PX_PER_CELL)

// Headline 16/600 over the mode's line in text.mid; the pane's title already names it, so no label above.
function headSvg(o: { headline: string; sub: string; width: number }): SvgPic {
  const title = linesPart({ text: o.headline, width: o.width, size: HEAD.title, weight: HEAD.titleWeight, lineHeight: HEAD.titleLine, maxLines: 1 })
  const sub = linesPart({ text: o.sub, width: o.width, size: HEAD.sub, weight: 400, lineHeight: HEAD.subLine, paint: 'mid' })
  const top = title.height + HEAD.gap
  const alt = `${o.headline}. ${o.sub}`

  return toPic({ body: title.body + place(sub.body, 0, top), width: o.width, height: top + sub.height, alt })
}

// The kit's change cue is a sheen; a constant `shows` redraws a change quietly, keeping only the entrance.
const QUIET = { shows: 'quiet' }

function svgOf(ui: Ui, key: string, pic: SvgPic): RenderElement {
  const { Svg } = ui as Ui & { Svg: any }

  return <Svg key={key} {...motion.pic(key, pic, QUIET)} />
}

function head(draw: DrawCtx, o: { headline: string; sub: string; width: number }): RenderElement {
  const { Box, Text } = draw.ui
  if (!isTextSurface(draw.ui, draw.surface)) return svgOf(draw.ui, 'er-head', headSvg(o))

  return (
    <Box flexDirection="column">
      <Text bold>{o.headline}</Text>
      <Text dimColor>{o.sub}</Text>
    </Box>
  )
}

// A group's label: sentence case, 12/600 text.lo, no dot; on the terminal a bold dim line.
function groupLabel(draw: DrawCtx, o: { text: string; width: number }): RenderElement {
  const { Text } = draw.ui
  if (!isTextSurface(draw.ui, draw.surface)) return svgOf(draw.ui, 'er-group', eyebrow(o))

  return <Text dimColor bold>{o.text}</Text>
}

function turnsBlock(draw: DrawCtx, o: { view: PaneView; width: number; columns: number }) {
  const { Box, Text } = draw.ui
  const { turns, now } = o.view
  const head = groupLabel(draw, { text: words().lastTurns(TURNS_KEPT), width: o.width })
  if (turns.length === 0) {
    return (
      <Box flexDirection="column" rowGap={1}>
        {head}
        <Text {...tonesOf(draw).mid}>{words().waiting}</Text>
      </Box>
    )
  }
  const ctx: RowCtx = { draw, now, isWide: o.columns >= WIDE_COLUMNS, hasClass: turns.some(turn => turn.cls !== null) }
  const rowOf = ctx.isWide ? wideRow : stackedRow

  return (
    <Box flexDirection="column" rowGap={1}>
      {head}
      <Box flexDirection="column" rowGap={ctx.isWide ? 0 : 1}>{turns.map((row, index) => rowOf(ctx, { row, index }))}</Box>
    </Box>
  )
}

// A Select where the surface draws one (the mobile app's table carries none yet); otherwise a button per mode,
// the one in force marked.
function modePicker(draw: DrawCtx, o: { mode: EffortMode; onMode: (mode: EffortMode) => void }) {
  const { ui } = draw
  const { Box, Button } = ui
  const said = words()
  const options = MODES.map(mode => ({ value: mode, label: said.modeName[mode] }))
  if (draw.surface !== 'mobile' && 'Select' in ui) {
    const { Select } = ui

    return <Select key={MODE_KEY} label={said.modeLabel} value={o.mode} options={options} onSelect={(value: string) => o.onMode(value as EffortMode)} />
  }

  return (
    <Box flexDirection="row" columnGap={1} flexWrap="wrap">
      {options.map(option => (
        <Button
          key={`${MODE_KEY}-${option.value}`}
          label={option.label}
          variant={option.value === o.mode ? 'primary' : 'secondary'}
          onPress={() => o.onMode(option.value)}
        />
      ))}
    </Box>
  )
}

export function paneTree(look: PaneLook, o: { view: PaneView; onMode: (mode: EffortMode) => void }): RenderElement {
  const draw: DrawCtx = { ui: look.ui, surface: look.surface, isLight: look.isLight, motion }
  const { Box } = look.ui
  const width = paneWidth(look.columns)
  const { mode } = o.view

  return (
    <Box flexDirection="column" rowGap={1}>
      {head(draw, { headline: headlineOf(o.view.turns), sub: words().modeLine[mode], width })}
      {modePicker(draw, { mode, onMode: o.onMode })}
      {turnsBlock(draw, { view: o.view, width, columns: look.columns })}
    </Box>
  )
}
