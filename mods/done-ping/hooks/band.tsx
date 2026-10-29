import { icon, measure, runs, svgDoc, svgWidth } from './svg'
import type { Ink } from './svg'
import type { Theme } from './tidemark'
import type { PingNotice } from '../types'

// The in-app fallback, one row in the notice family: a bare bell (quiet when done, Flare with failing tests,
// Amber waiting: colour says only the state), the outcome in text.hi, its facts in text.lo, then ✕. It clears
// on its own, on ✕, or on the next prompt.
type Ui = Record<string, any>

export type PingBand = { notice: PingNotice; columns: number; theme: Theme; isRich: boolean; onDismiss: () => void }

const ROW_H = 28
const BELL = 16
const TEXT_X = 26
const TITLE = { size: 13, weight: 560 }
const DETAIL = { size: 12 }
// Columns the ✕ button takes beside the row.
const DISMISS_RESERVE = 6

const SEP = ' · '
const BELL_INK: Record<PingNotice['kind'], Ink> = { done: 'mid', fail: 'flare', wait: 'amber' }
const MARK = { done: { glyph: '✓', color: 'success' }, fail: { glyph: '✕', color: 'error' }, wait: { glyph: '!', color: 'warning' } } as const

// Facts drop from the end until the rest fits: each one is shown whole or not at all.
function factsThatFit(detail: string, room: number): string {
  const facts = detail === '' ? [] : detail.split(SEP)
  while (facts.length > 0 && measure(SEP + facts.join(SEP), DETAIL) > room) facts.pop()

  return facts.length === 0 ? '' : SEP + facts.join(SEP)
}

function rowSvg(band: PingBand): { source: string; width: number } {
  const { notice } = band
  const room = svgWidth(band.columns, { reserve: DISMISS_RESERVE, min: 200, max: 1200 })
  const rest = factsThatFit(notice.detail, room - TEXT_X - measure(notice.title, TITLE))
  const width = Math.min(room, Math.ceil(TEXT_X + measure(notice.title, TITLE) + measure(rest, DETAIL) + 4))
  const body = icon('bell', { x: 0, y: (ROW_H - BELL) / 2, size: BELL, ink: BELL_INK[notice.kind], stroke: 1.5 })
    + runs({ x: TEXT_X, y: 18.5, size: DETAIL.size, parts: [{ text: notice.title, ink: 'hi', weight: TITLE.weight, size: TITLE.size }, { text: rest, ink: 'lo' }] })

  return { source: svgDoc({ width, height: ROW_H, mode: band.theme.mode, body }), width }
}

export function pingRow(ui: Ui, band: PingBand, theirs: unknown) {
  const { Box, Text, Button, Svg } = ui
  const { notice } = band
  const mark = MARK[notice.kind]
  const text = notice.detail === '' ? notice.title : `${notice.title} · ${notice.detail}`
  const drawn = band.isRich ? rowSvg(band) : null

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        {drawn === null && <Text color={mark.color}>{mark.glyph}</Text>}
        {drawn === null ? <Text wrap="truncate">{text}</Text> : <Svg source={drawn.source} alt={text} width={drawn.width} height={ROW_H} />}
        <Button key="done-ping-dismiss" plain dimColor role="dismiss" label="✕" onPress={band.onDismiss} />
      </Box>
      {theirs}
    </Box>
  )
}
