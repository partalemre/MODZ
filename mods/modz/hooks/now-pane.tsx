// The hub's "Now" area as each surface draws it (now.ts): a mod's own row, moved up from its section (the same keys,
// so it is the same row to a press), then its live lines on the title's column. On the desktop every line is pressed
// as the row is, and opens the mod's pane for the detail; the terminal reads the lines as text under the row, which
// keeps its "Open" button and digit.
import type { HubTone } from '../types'
import type { HubRow } from './hub'
import type { Drawing } from './draw'
import { hubLineSvg, hubRowSvg, sectionSvg } from './hub-draw'
import { GLYPH } from './kit/icons'
import type { Cue } from './kit/motion'
import type { NowLine, NowRow } from './now'
import type { Theme } from './theme'
import { hubWords } from './words'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

// What the hub's tree hands in: how it keeps a drawing (stable.ts), draws one in its frame and lays a press over one.
export type NowTools = {
  width: number
  theme: Theme
  keep: (key: string, what: unknown, build: (cue: Cue) => Drawing) => Drawing
  label: (drawing: Drawing, key: string) => unknown
  press: (opts: { box: string; key: string; drawing: Drawing; pane: string }) => unknown
}

// A mod's lines, the last saying how many more it has than the lines show.
const linesOf = (item: NowRow): NowLine[] => (item.more > 0 ? [...item.lines, { label: hubWords().more(item.more), value: '' }] : item.lines)

function desktopGroup(item: NowRow, tools: NowTools) {
  const { width, theme, keep, press } = tools
  const { row } = item
  const pane = row.entry.pane
  const shows = { width, theme, entry: row.entry, detail: row.card?.detail, tone: row.card?.tone }
  const head = keep(`row-${pane}`, shows, cue => hubRowSvg({ width, theme, row, buttonRoom: 0, cue }))
  const lines = linesOf(item).map((line, i) => {
    const drawing = keep(`now-line-${pane}-${i}`, { width, theme, line }, cue => hubLineSvg({ width, theme, line, cue }))

    return press({ box: `now-${pane}-${i}`, key: `now-open-${pane}-${i}`, drawing, pane })
  })

  return [press({ box: `row-${pane}`, key: `open-${pane}`, drawing: head, pane }), ...lines]
}

export function nowDesktop(ui: Ui, now: NowRow[], tools: NowTools) {
  if (now.length === 0) return null
  const { Box } = ui
  const { width, theme } = tools
  const label = hubWords().now
  const eyebrow = tools.keep('eyebrow-now', { width, theme, label }, cue => sectionSvg({ width, theme, label, cue }))

  return (
    <Box key="now" flexDirection="column">
      {tools.label(eyebrow, 'eyebrow-now')}
      {now.flatMap(item => desktopGroup(item, tools))}
    </Box>
  )
}

// As the desktop draws it (hub-draw.ts): the words plain unless failing; the glyph lit only for live, warn or bad.
export const GLYPH_COLOR: Partial<Record<HubTone, string>> = { live: 'claude', warn: 'warning', bad: 'error' }

export function detailText(ui: Ui, tone: HubTone, detail: string) {
  const { Text } = ui

  return tone === 'bad' ? <Text color="error" wrap="truncate">{detail}</Text> : <Text dimColor wrap="truncate">{detail}</Text>
}

function terminalGroup(ui: Ui, item: NowRow, button: (row: HubRow) => unknown) {
  const { Box, Text } = ui
  const { entry, card } = item.row
  const tone = card?.tone ?? 'idle'
  const color = GLYPH_COLOR[tone]

  return (
    <Box key={`row-${entry.pane}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        {color === undefined ? <Text dimColor>{GLYPH[entry.icon]}</Text> : <Text color={color}>{GLYPH[entry.icon]}</Text>}
        <Text bold>{entry.title}</Text>
        {detailText(ui, tone, card?.detail ?? '')}
        <Box flexGrow={1} />
        {button(item.row)}
      </Box>
      {linesOf(item).map((line, i) => (
        <Box key={`now-${entry.pane}-${i}`} flexDirection="row" columnGap={1} paddingLeft={2}>
          <Text wrap="truncate">{line.label}</Text>
          <Box flexGrow={1} />
          <Text dimColor>{line.value}</Text>
        </Box>
      ))}
    </Box>
  )
}

// `button`: the row's own "Open" with its digit, as the hub's rows have it.
export function nowTerminal(ui: Ui, now: NowRow[], button: (row: HubRow) => unknown) {
  if (now.length === 0) return null
  const { Box, Text } = ui

  return (
    <Box key="now" flexDirection="column">
      <Text bold dimColor>{hubWords().now}</Text>
      {now.map(item => terminalGroup(ui, item, button))}
    </Box>
  )
}
