import { CONTEXT, CONTEXT_WARN } from './format'
import { lineTree } from './line'
import type { Ui } from './line'
import { gaugeViews } from './model'
import type { Forecasts, GaugeView } from './model'
import { lineSvg } from './svg-line'
import { words } from './words'
import type { HudUsage } from '../types'

// The HUD's row of the band: the line (Svg on the desktop, text on the terminal) and, once the
// context is full enough for it to pay, a small "Compact" button beside it.

export type BandInput = {
  usage: HudUsage
  columns: number
  nowMs: number
  forecasts: Forecasts
  isDesktop: boolean
  // False while a turn runs or a compaction is under way: the button hides then.
  canCompact: boolean
  compact: () => void
  // The `band: alerts` option: only a window or the context that needs a look; no cost, no button.
  isAlertsOnly?: boolean
}

const needsLook = (gauge: GaugeView): boolean => gauge.tone !== 'neutral' || gauge.alert !== ''

function shownGauges(input: BandInput): GaugeView[] {
  const gauges = gaugeViews(input.usage, input.nowMs, input.forecasts)

  return input.isAlertsOnly === true ? gauges.filter(needsLook) : gauges
}

const shownCost = (input: BandInput): number | null => (input.isAlertsOnly === true ? null : input.usage.costUsd)

const PX_PER_COLUMN = 6.4
// The room the button and its gap take beside the desktop line.
const BUTTON_PX = 104
export const COMPACT_HOTKEY = 's'

function desktopLine(ui: Ui, input: BandInput, reserve: number) {
  const { Svg } = ui
  const drawn = lineSvg({
    gauges: shownGauges(input),
    costUsd: shownCost(input),
    maxWidth: input.columns * PX_PER_COLUMN - reserve,
  })

  return drawn === null ? null : <Svg source={drawn.source} alt={drawn.alt} width={drawn.width} height={drawn.height} />
}

export function bandRow(ui: Ui, input: BandInput) {
  const { Box, Button } = ui
  const context = input.usage.gauges.find(gauge => gauge.id === CONTEXT)
  const showsCompact = input.canCompact && input.isAlertsOnly !== true && context !== undefined && context.percent >= CONTEXT_WARN
  const line = input.isDesktop
    ? desktopLine(ui, input, showsCompact ? BUTTON_PX : 0)
    : lineTree(ui, { gauges: shownGauges(input), costUsd: shownCost(input), columns: input.columns })
  if (line === null && !showsCompact) return null

  return (
    <Box key="hud-pro-row" flexDirection="row" alignItems="center" columnGap={2}>
      {line}
      {showsCompact && (
        <Button key="compact" label={words().compact} hotkey={COMPACT_HOTKEY} onPress={input.compact} {...(input.isDesktop ? {} : { plain: true as const })} />
      )}
    </Box>
  )
}
