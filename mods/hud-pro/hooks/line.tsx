import { costText, filledCells, resetText, valueText } from './format'
import { hasReset, isCritical } from './model'
import type { GaugeView, Resets } from './model'
import { terminalColor } from './theme'
import type { Tone } from './theme'

// The terminal's HUD: the same line as text. Thin meters with a pace tick (┊) on a wide band,
// then the bars go, then the resets and the cost; a critical window keeps its reset to the end.

// The resolved element table of the surface that draws the line; Box and Text exist on both.
export type Ui = Record<string, any>

export type LineInput = { gauges: readonly GaugeView[]; costUsd: number | null; columns: number }

type Layout = { barWidth: number; resets: Resets; hasCost: boolean }

const BAR = '━'
const TRACK = '─'
const TICK = '┊'
const GROUP_GAP = 3
const WIDE_COLUMNS = 96
const MEDIUM_COLUMNS = 52
const WIDE: Layout = { barWidth: 6, resets: 'all', hasCost: true }
const MEDIUM: Layout = { barWidth: 0, resets: 'five', hasCost: true }
const NARROW: Layout = { barWidth: 0, resets: 'critical', hasCost: false }

function layoutFor(columns: number): Layout {
  if (columns >= WIDE_COLUMNS) return WIDE

  return columns >= MEDIUM_COLUMNS ? MEDIUM : NARROW
}

// A neutral value stays dim; ahead of pace it turns warning, near the limit error.
export function toneText(ui: Ui, spec: { text: string; tone: Tone }) {
  const { Text } = ui
  const color = terminalColor(spec.tone)

  return color === undefined ? <Text dimColor>{spec.text}</Text> : <Text color={color}>{spec.text}</Text>
}

// A thin bar: the filled part in the value's tone, the dim track with the pace tick in it.
export function barTree(ui: Ui, spec: { gauge: GaugeView; width: number }) {
  const { Box, Text } = ui
  const filled = filledCells(spec.gauge.percent, spec.width)
  const paceCell = spec.gauge.pace === null ? -1 : Math.min(spec.width - 1, Math.floor((spec.gauge.pace / 100) * spec.width))
  const track = Array.from({ length: spec.width - filled }, (_, index) => (filled + index === paceCell ? TICK : TRACK)).join('')

  return (
    <Box flexDirection="row">
      {filled > 0 && <Text color={terminalColor(spec.gauge.tone)}>{BAR.repeat(filled)}</Text>}
      {track !== '' && <Text dimColor>{track}</Text>}
    </Box>
  )
}

function gaugeTree(ui: Ui, gauge: GaugeView, layout: Layout) {
  const { Box, Text } = ui
  const showsReset = hasReset(gauge, layout.resets)
  const resetTone = isCritical(gauge) ? gauge.tone : 'neutral'

  return (
    <Box key={`gauge-${gauge.id}`} flexDirection="row" columnGap={1}>
      <Text dimColor>{gauge.short}</Text>
      {layout.barWidth > 0 && barTree(ui, { gauge, width: layout.barWidth })}
      {toneText(ui, { text: valueText(gauge.percent), tone: gauge.tone })}
      {showsReset && toneText(ui, { text: resetText(gauge.reset), tone: resetTone })}
    </Box>
  )
}

// One quiet line: every plan window, context fill and session cost. Null when there is nothing to show.
export function lineTree(ui: Ui, input: LineInput) {
  const { Box, Text } = ui
  const layout = layoutFor(input.columns)
  const hasCost = layout.hasCost && input.costUsd !== null
  if (input.gauges.length === 0 && !hasCost) return null

  return (
    <Box key="hud-pro" flexDirection="row" columnGap={GROUP_GAP}>
      {input.gauges.map(gauge => gaugeTree(ui, gauge, layout))}
      {hasCost && input.costUsd !== null && <Text dimColor>{costText(input.costUsd)}</Text>}
    </Box>
  )
}
