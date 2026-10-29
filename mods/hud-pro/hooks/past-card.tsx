import type { PaneSvg } from './context-card'
import { compact } from './format'
import type { Ui } from './line'
import { RANGES } from './past'
import type { PastView } from './past-hook'
import { motion } from './pane-motion'
import { pastSvg } from './svg-past'
import { TERMINAL_KEY } from './theme'
import { words } from './words'
import type { HudPast } from '../types'

// The Usage pane's history card, under the context card: the last 7 or 30 days from the session transcripts,
// with a two-way switch between them. Svg on the desktop; on the terminal two lines, the figures and a strip of
// one shaded cell per day.

export type PastCard = PastView & { width?: number; svg?: PaneSvg }

// A day's shade on the terminal, none to the busiest.
const LEVEL_GLYPHS = ['·', '░', '▒', '▓', '█'] as const

const lineOf = (past: HudPast): string =>
  words().pastLine({ active: past.activeDays, range: past.range, sessions: past.sessions, tokens: compact(past.tokens), model: past.model })

const stripOf = (past: HudPast): string => past.cells.map(cell => LEVEL_GLYPHS[cell.level] ?? LEVEL_GLYPHS[0]).join('')

// The range switch: the one shown is the primary button, the other dim.
function switchOf(ui: Ui, card: PastCard) {
  const { Box, Button } = ui

  return (
    <Box flexDirection="row" columnGap={1}>
      {RANGES.map(range => {
        const isShown = range === card.past.range
        const look = isShown ? { variant: 'primary' as const } : { dimColor: true }

        return <Button key={`past-${range}`} label={words().rangeLabel(range)} {...look} onPress={() => card.choose(range)} />
      })}
    </Box>
  )
}

function terminalCard(ui: Ui, card: PastCard) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold>{words().pastTitle}</Text>
        <Text dimColor>{lineOf(card.past)}</Text>
      </Box>
      <Box flexDirection="row" columnGap={2} alignItems="center">
        <Text color={TERMINAL_KEY.read}>{stripOf(card.past)}</Text>
        {switchOf(ui, card)}
      </Box>
    </Box>
  )
}

export function pastCard(ui: Ui, card: PastCard) {
  const { Box } = ui
  const Svg = card.svg
  if (Svg === undefined || card.width === undefined) {
    return (
      <Box key="past-card" marginTop={1}>
        {terminalCard(ui, card)}
      </Box>
    )
  }
  const spec = { past: card.past, width: card.width }

  return (
    <Box key="past-card" flexDirection="column" marginTop={1}>
      <Svg key="hud-past" {...motion.pic('hud-past', pastSvg(spec), { shows: spec })} />
      <Box marginTop={1}>{switchOf(ui, card)}</Box>
    </Box>
  )
}
