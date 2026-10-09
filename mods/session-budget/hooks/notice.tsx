import { etaMinutes, etaText, percentOf, ratioOf, spendText, stepText } from './budget'
import { fullCardSvg, stoppedRowSvg, warnRowSvg } from './svg-rows'
import type { SvgDoc } from './svg'
import type { Budget } from '../types'

// The notices of this mod in the shared MODZ family: a band row above `theirs` (never swallowed)
// with a ✕, and the full-budget card above the question. Svg on the desktop, text on the terminal.
type Ui = Record<string, any>

const PX_PER_COLUMN = 6.4
const CARD_MAX_PX = 560
const CARD_MIN_PX = 320
const TERMINAL_CELLS = 10
const TERMINAL_MARK = 8

export const isDesktop = (ui: Ui, surface: string): boolean => surface !== 'terminal' && 'Svg' in ui

const svgOf = (ui: Ui, drawn: SvgDoc) => {
  const { Svg } = ui

  return <Svg source={drawn.source} alt={drawn.alt} width={drawn.width} height={drawn.height} />
}

export function noticeAbove(ui: Ui, row: unknown, spec: { theirs: unknown; dismiss: () => void }) {
  const { Box, Button } = ui

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        {row}
        <Button key="sb-dismiss" plain dimColor role="dismiss" onPress={spec.dismiss}>{'✕'}</Button>
      </Box>
      {spec.theirs}
    </Box>
  )
}

// The terminal's meter: spent in warning, the budget as a ┃ tidemark, room past it dim.
function terminalMeter(ui: Ui, ratio: number) {
  const { Text } = ui
  const filled = Math.min(TERMINAL_CELLS, Math.max(1, Math.round(ratio * TERMINAL_MARK)))
  const cells = Array.from({ length: TERMINAL_CELLS }, (_, index) => (index === TERMINAL_MARK ? '┃' : index < filled ? '━' : '─'))

  return (
    <Text>
      <Text color="warning">{cells.slice(0, filled).join('')}</Text>
      <Text dimColor>{cells.slice(filled).join('')}</Text>
    </Text>
  )
}

export function warnRow(ui: Ui, spec: { budget: Budget; nowMs: number; surface: string }) {
  const { Box, Text } = ui
  const { budget } = spec
  const eta = etaText(etaMinutes(budget, spec.nowMs))
  if (isDesktop(ui, spec.surface)) return svgOf(ui, warnRowSvg({ percent: percentOf(budget), spend: spendText(budget), eta, ratio: ratioOf(budget) }))
  const text = [`Bütçe ${percentOf(budget)}`, spendText(budget), eta].filter(part => part !== '').join(' · ')

  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color="warning">!</Text>
      {terminalMeter(ui, ratioOf(budget))}
      <Text color="warning" wrap="truncate">{text}</Text>
    </Box>
  )
}

export function stoppedRow(ui: Ui, spec: { text: string; spend: string; surface: string }) {
  const { Box, Text } = ui
  if (isDesktop(ui, spec.surface)) return svgOf(ui, stoppedRowSvg(spec.spend))

  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color="error">✕</Text>
      <Text color="error" wrap="truncate">{spec.text}</Text>
    </Box>
  )
}

// Above the question's own options ("Dur", "Devam et (+$1)"): what is full, and what going on costs.
export function fullCard(ui: Ui, spec: { budget: Budget; columns: number; surface: string; theirs: unknown }) {
  const { Box, Text } = ui
  const { budget } = spec
  const width = Math.round(Math.max(CARD_MIN_PX, Math.min(CARD_MAX_PX, spec.columns * PX_PER_COLUMN)))
  const card = isDesktop(ui, spec.surface) ? (
    svgOf(ui, fullCardSvg({ spend: spendText(budget), percent: percentOf(budget), step: stepText(budget), width }))
  ) : (
    <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={2}>
      <Text color="warning" bold>{'● OTURUM BÜTÇESİ'}</Text>
      <Text bold>{`Bütçe doldu · ${spendText(budget)} (${percentOf(budget)})`}</Text>
      <Text dimColor>{`Mesajın bekletiliyor. Devam edersen bütçe ${stepText(budget)} artar.`}</Text>
    </Box>
  )

  return (
    <Box flexDirection="column" rowGap={1}>
      {card}
      {spec.theirs}
    </Box>
  )
}

// A notice whose timer was lost (a hot reload drops timers) must not hold the line forever.
export function isLive(notice: unknown, nowMs: number): boolean {
  if (notice === undefined || notice === null) return false
  const expiresAt = (notice as { expiresAt?: unknown }).expiresAt

  return typeof expiresAt !== 'number' || expiresAt <= 0 || expiresAt > nowMs
}
