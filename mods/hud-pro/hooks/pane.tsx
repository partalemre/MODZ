import type { RenderElement } from 'claude-code'

import { AHEAD_POINTS, cachePercent, compact, CONTEXT, costText, percentText, resetText, valueText } from './format'
import { costSeries, seriesOf } from './history'
import { barTree, toneText } from './line'
import type { Ui } from './line'
import { gaugeViews } from './model'
import type { GaugeView } from './model'
import { tilesSvg } from './svg-tiles'
import type { Tile } from './svg-tiles'
import { words } from './words'
import type { HudContext, HudSample, HudTurn, HudUsage } from '../types'

// `/hud full`: stat tiles with rings and sparklines on the desktop, rows with text sparklines
// on the terminal; the turn's tokens under both.

export type PaneView = {
  usage: HudUsage | null
  history: HudSample[]
  turn: HudTurn | null
  columns: number
  nowMs: number
  svg?: (props: { source: string; alt: string; width: number; height: number }) => RenderElement
}

const PX_PER_COLUMN = 6.4
const BAR_MAX = 24
const BAR_MIN = 8
const ROW_CHROME = 48
const LABEL_WIDTH = 7
const SPARK_CELLS = 16
const SPARK = '▁▂▃▄▅▆▇█'
const COST_HEADROOM = 1.15

function rangeText(series: readonly number[]): string {
  if (series.length < 2) return ''

  return words().range(percentText(Math.min(...series)), percentText(Math.max(...series)))
}

function freeText(context: HudContext): string {
  const count = Math.max(0, context.window - context.tokens)

  return words().free({ tokens: compact(count), count })
}

function noteOf(gauge: GaugeView, context: HudContext | null): { note: string; noteTone: Tile['noteTone'] } {
  if (gauge.pace !== null) {
    const ahead = Math.round(gauge.percent - gauge.pace)
    if (ahead >= AHEAD_POINTS) return { note: words().ahead(ahead), noteTone: gauge.tone }

    return { note: words().pace(percentText(gauge.pace)), noteTone: 'neutral' }
  }
  if (gauge.id === CONTEXT && gauge.tone !== 'neutral') return { note: words().timeToCompact, noteTone: gauge.tone }
  if (gauge.id === CONTEXT && context !== null) return { note: freeText(context), noteTone: 'neutral' }

  return { note: '', noteTone: 'neutral' }
}

function gaugeTile(gauge: GaugeView, view: PaneView): Tile {
  const series = seriesOf(view.history, gauge.id)
  const context = view.usage?.context ?? null
  const reset = gauge.reset === '' ? '' : resetText(gauge.reset)
  const meta = gauge.id === CONTEXT && context !== null ? `${compact(context.tokens)} / ${compact(context.window)}` : reset

  return {
    eyebrow: gauge.long,
    meta,
    value: valueText(gauge.percent),
    ...noteOf(gauge, context),
    tone: gauge.tone,
    arc: { percent: gauge.percent, pace: gauge.pace },
    series,
    seriesMax: 100,
    caption: rangeText(series) || words().oneReading,
  }
}

function costTile(usd: number, view: PaneView): Tile {
  const series = costSeries(view.history)
  const turn = view.turn
  const turnTokens = turn === null ? 0 : turn.input + turn.output

  return {
    eyebrow: words().sessionCost,
    meta: '',
    value: costText(usd),
    note: turn === null ? '' : words().lastTurnTokens({ tokens: compact(turnTokens), count: turnTokens }),
    noteTone: 'neutral',
    tone: 'neutral',
    arc: null,
    series,
    seriesMax: Math.max(...series, usd) * COST_HEADROOM,
    caption: series.length < 2 ? words().thisSession : `${words().thisSession} · ${words().readings(series.length)}`,
  }
}

function summaryText(view: PaneView): string {
  const cost = view.usage?.costUsd ?? null

  return [words().readings(view.history.length), cost === null ? '' : words().sessionAt(costText(cost))].filter(part => part !== '').join(' · ')
}

function turnText(turn: HudTurn): string {
  return words().turn({ input: compact(turn.input), output: compact(turn.output), cache: percentText(cachePercent(turn)), requests: turn.requests })
}

export function sparkText(series: readonly number[], max: number): string {
  if (series.length < 2 || max <= 0) return ''

  return series
    .slice(-SPARK_CELLS)
    .map(value => SPARK[Math.max(0, Math.min(SPARK.length - 1, Math.round((value / max) * (SPARK.length - 1))))])
    .join('')
}

function terminalRow(ui: Ui, gauge: GaugeView, view: PaneView) {
  const { Box, Text } = ui
  const width = Math.max(BAR_MIN, Math.min(BAR_MAX, view.columns - ROW_CHROME))
  const series = seriesOf(view.history, gauge.id)
  const extras = [gauge.reset === '' ? '' : words().resetsIn(gauge.reset), rangeText(series)].filter(part => part !== '')

  return (
    <Box key={`gauge-${gauge.id}`} flexDirection="row" columnGap={1}>
      <Text dimColor>{gauge.short.padEnd(LABEL_WIDTH)}</Text>
      {barTree(ui, { gauge, width })}
      {toneText(ui, { text: valueText(gauge.percent), tone: gauge.tone })}
      {extras.length > 0 && <Text dimColor>{`· ${extras.join(' · ')}`}</Text>}
      {series.length > 1 && <Text dimColor>{sparkText(series, 100)}</Text>}
    </Box>
  )
}

function body(ui: Ui, view: PaneView, usage: HudUsage) {
  const { Box, Text } = ui
  const gauges = gaugeViews(usage, view.nowMs)
  if (view.svg === undefined) {
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          <Text bold>{words().limits}</Text>
          <Text dimColor>{summaryText(view)}</Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {gauges.map(gauge => terminalRow(ui, gauge, view))}
        </Box>
      </Box>
    )
  }
  const tiles = [...gauges.map(gauge => gaugeTile(gauge, view)), ...(usage.costUsd === null ? [] : [costTile(usage.costUsd, view)])]
  const drawn = tilesSvg({ title: words().limits, meta: summaryText(view), tiles, maxWidth: view.columns * PX_PER_COLUMN })
  const Svg = view.svg

  return <Svg source={drawn.source} alt={drawn.alt} width={drawn.width} height={drawn.height} />
}

export function paneTree(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const usage = view.usage
  if (usage === null || (usage.gauges.length === 0 && usage.costUsd === null)) {
    return <Text dimColor>{words().noReadings}</Text>
  }

  return (
    <Box flexDirection="column">
      {body(ui, view, usage)}
      {view.turn !== null && view.turn.requests > 0 && (
        <Box marginTop={1}>
          <Text dimColor>{turnText(view.turn)}</Text>
        </Box>
      )}
    </Box>
  )
}
