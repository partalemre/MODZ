import type { RenderElement } from 'claude-code'

import type { ContextView, Segment } from './breakdown'
import { compact, sparkText } from './format'
import type { Ui } from './line'
import { contextSvg } from './svg-context'
import { TERMINAL_KEY } from './theme'
import { words } from './words'
import type { HudCompacted, HudContext } from '../types'

// The Usage pane's context card: the window by category, the last turns' fill with the turns it has
// left, and a "Compact now" button with what the last press came to. Svg on the desktop, text on
// the terminal: the bar's parts as shades of one accent, the free space as the dim track.

export type CardView = {
  view: ContextView | null
  turns: readonly number[]
  forecast: string
  context: HudContext | null
  lastCompact: HudCompacted | null
  isCompacting: boolean
  compact: () => void
  columns: number
  // The desktop's width for the card in px, and its Svg element; absent on the terminal.
  width?: number
  svg?: (props: { source: string; alt: string; width: number; height: number }) => RenderElement
}

const BAR_MIN = 16
const BAR_MAX = 48
const BAR_CHROME = 4
// Used rows by rank, then the fold, the free space and the reserve.
const USED_GLYPHS = ['█', '▓', '▒', '░'] as const
const OTHER_GLYPH = '░'
const FREE_GLYPH = '─'
const RESERVE_GLYPH = '┄'

function glyphOf(segment: Segment, rank: number): string {
  if (segment.kind === 'free') return FREE_GLYPH
  if (segment.kind === 'reserve') return RESERVE_GLYPH

  return segment.kind === 'other' ? OTHER_GLYPH : (USED_GLYPHS[rank] ?? OTHER_GLYPH)
}

// Cells per segment, each non-empty one at least one, the largest taking up what rounding left over.
export function cellsOf(view: ContextView, width: number): number[] {
  const cells = view.segments.map(segment => Math.max(1, Math.round((segment.tokens / view.total) * width)))
  const largest = cells.indexOf(Math.max(...cells))
  const drift = width - cells.reduce((sum, count) => sum + count, 0)
  if (largest >= 0) cells[largest] = Math.max(1, (cells[largest] ?? 0) + drift)

  return cells
}

const isAccent = (segment: Segment): boolean => segment.kind === 'used'

function terminalBar(ui: Ui, view: ContextView, columns: number) {
  const { Box, Text } = ui
  const width = Math.max(BAR_MIN, Math.min(BAR_MAX, columns - BAR_CHROME))
  const cells = cellsOf(view, width)

  return (
    <Box flexDirection="row">
      {view.segments.map((segment, rank) => {
        const glyphs = glyphOf(segment, rank).repeat(cells[rank] ?? 0)

        return isAccent(segment) ? <Text key={`bar-${rank}`} color={TERMINAL_KEY.read}>{glyphs}</Text> : <Text key={`bar-${rank}`} dimColor>{glyphs}</Text>
      })}
    </Box>
  )
}

// Two legend lines: what fills the window, then what is left of it.
function legendLines(view: ContextView): string[] {
  const entries = view.segments.map((segment, rank) => ({ segment, text: `${glyphOf(segment, rank)} ${segment.label} ${compact(segment.tokens)}` }))
  const isFilled = (segment: Segment): boolean => segment.kind === 'used' || segment.kind === 'other'

  return [entries.filter(entry => isFilled(entry.segment)), entries.filter(entry => !isFilled(entry.segment))]
    .map(group => group.map(entry => entry.text).join(' · '))
    .filter(line => line !== '')
}

function metaOf(card: CardView): string {
  if (card.view !== null) return words().estimate(compact(card.view.usedTokens), compact(card.view.total))
  if (card.context !== null) return `${compact(card.context.tokens)} / ${compact(card.context.window)}`

  return ''
}

function compactedText(last: HudCompacted | null): string {
  if (last === null) return ''
  if (last.before === null || last.after === null) return words().compacted

  return words().compactedFrom({ before: compact(last.before), after: compact(last.after) })
}

function actions(ui: Ui, card: CardView) {
  const { Box, Button, Text } = ui
  const result = compactedText(card.lastCompact)
  if (card.context === null && result === '') return null

  return (
    <Box flexDirection="row" alignItems="center" columnGap={2} marginTop={1}>
      {card.context !== null && !card.isCompacting && <Button key="compact-now" label={words().compactNow} onPress={card.compact} />}
      {card.isCompacting && <Text dimColor>{words().compacting}</Text>}
      {result !== '' && <Text dimColor>{result}</Text>}
    </Box>
  )
}

function terminalCard(ui: Ui, card: CardView) {
  const { Box, Text } = ui
  const spark = sparkText(card.turns, Math.max(...card.turns, 1))

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold>{words().contextTitle}</Text>
        <Text dimColor>{metaOf(card)}</Text>
      </Box>
      {card.view === null ? <Text dimColor>{words().noBreakdown}</Text> : terminalBar(ui, card.view, card.columns)}
      {card.view !== null && legendLines(card.view).map((line, index) => <Text key={`legend-${index}`} dimColor>{line}</Text>)}
      {(spark !== '' || card.forecast !== '') && (
        <Box flexDirection="row" columnGap={1}>
          {spark !== '' && <Text dimColor>{`${words().lastTurns(card.turns.length)} ${spark}`}</Text>}
          {card.forecast !== '' && <Text>{card.forecast}</Text>}
        </Box>
      )}
    </Box>
  )
}

function bodyOf(ui: Ui, card: CardView) {
  const Svg = card.svg
  if (Svg === undefined || card.width === undefined) return terminalCard(ui, card)
  const drawn = contextSvg({ view: card.view, turns: card.turns, forecast: card.forecast, meta: metaOf(card), width: card.width })

  return <Svg source={drawn.source} alt={drawn.alt} width={drawn.width} height={drawn.height} />
}

export function contextCard(ui: Ui, card: CardView) {
  const { Box } = ui

  return (
    <Box key="context-card" flexDirection="column" marginTop={1}>
      {bodyOf(ui, card)}
      {actions(ui, card)}
    </Box>
  )
}
