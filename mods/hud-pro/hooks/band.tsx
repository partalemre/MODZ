import { CONTEXT, CONTEXT_WARN } from './format'
import { lineTree } from './line'
import type { Ui } from './line'
import { gaugeViews } from './model'
import type { Forecasts } from './model'
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
}

const PX_PER_COLUMN = 6.4
// The room the button and its gap take beside the desktop line.
const BUTTON_PX = 104
export const COMPACT_HOTKEY = 's'

function desktopLine(ui: Ui, input: BandInput, reserve: number) {
  const { Svg } = ui
  const drawn = lineSvg({
    gauges: gaugeViews(input.usage, input.nowMs, input.forecasts),
    costUsd: input.usage.costUsd,
    maxWidth: input.columns * PX_PER_COLUMN - reserve,
  })

  return drawn === null ? null : <Svg source={drawn.source} alt={drawn.alt} width={drawn.width} height={drawn.height} />
}

export function bandRow(ui: Ui, input: BandInput) {
  const { Box, Button } = ui
  const context = input.usage.gauges.find(gauge => gauge.id === CONTEXT)
  const showsCompact = input.canCompact && context !== undefined && context.percent >= CONTEXT_WARN
  const line = input.isDesktop
    ? desktopLine(ui, input, showsCompact ? BUTTON_PX : 0)
    : lineTree(ui, { gauges: gaugeViews(input.usage, input.nowMs, input.forecasts), costUsd: input.usage.costUsd, columns: input.columns })
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
