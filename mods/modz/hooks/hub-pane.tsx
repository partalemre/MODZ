// The MODZ hub pane: the head card, then each section's rows with an "Aç" button that asks the
// owning mod to open its pane. The catalog ("Modlar") is a pane of its own (register.tsx).
import type { Drawing } from './draw'
import type { Focus, HubRow, Section } from './hub'
import { ROLE_OF_TONE, SECTIONS } from './hub'
import { hubHeadSvg, hubRowSvg, sectionSvg } from './hub-draw'
import { GLYPH } from './kit/icons'
import { upper } from './kit/lang'
import type { Theme } from './theme'
import { hubWords } from './words'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

export type HubView = {
  rows: HubRow[]
  focus: Focus | null
  meta: string
  surface: string
  columns: number
  theme: Theme
  onOpen: (pane: string) => void
}

const PX_PER_COLUMN = 8
const WIDTH_MIN = 280
const WIDTH_MAX = 640
// Room the native "Aç" button takes beside a row's drawing.
const BUTTON_ROOM = 64

export const hubWidth = (columns: number): number => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, columns * PX_PER_COLUMN - PX_PER_COLUMN))

const inSection = (rows: HubRow[], section: Section) => rows.filter(row => row.entry.section === section)

// The one primary button: straight to whatever leads the head ("Open Tests").
function focusButton(ui: Ui, view: HubView) {
  const { Box, Button } = ui
  const focus = view.focus
  if (focus === null) return null
  const pane = focus.row.entry.pane

  return (
    <Box key="focus" flexDirection="row">
      <Button key="open-focus" label={hubWords().openPane(focus.row.entry.title)} variant="primary" onPress={() => view.onOpen(pane)} />
    </Box>
  )
}

// The terminal shows each row's digit; the desktop's buttons stay one width, so the column lines up.
function openButton(ui: Ui, view: HubView, row: HubRow) {
  const { Button } = ui
  const hotkey = view.surface === 'desktop' || row.hotkey === null ? {} : { hotkey: row.hotkey }

  return <Button key={`open-${row.entry.pane}`} label={hubWords().open} variant="secondary" {...hotkey} onPress={() => view.onOpen(row.entry.pane)} />
}

function desktopTree(ui: Ui, view: HubView) {
  const { Box, Svg } = ui
  const width = hubWidth(view.columns)
  const draw = (drawing: Drawing, key: string, drawnWidth: number) => (
    <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawnWidth} height={drawing.height} />
  )
  const rowWidth = width - BUTTON_ROOM

  return (
    <Box flexDirection="column" rowGap={1}>
      {draw(hubHeadSvg({ width, theme: view.theme, focus: view.focus, meta: view.meta }), 'head', width)}
      {focusButton(ui, view)}
      {SECTIONS.map(section => {
        const rows = inSection(view.rows, section)
        if (rows.length === 0) return null

        return (
          <Box key={`section-${section}`} flexDirection="column">
            {draw(sectionSvg({ width, theme: view.theme, section }), `eyebrow-${section}`, width)}
            {rows.map(row => (
              <Box key={`row-${row.entry.pane}`} flexDirection="row" alignItems="center" columnGap={1}>
                {draw(hubRowSvg({ width: rowWidth, theme: view.theme, row }), `svg-${row.entry.pane}`, rowWidth)}
                {openButton(ui, view, row)}
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}

const TONE_COLOR: Record<string, string> = { run: 'permission', ok: 'success', warn: 'warning', danger: 'error' }

function terminalRow(ui: Ui, view: HubView, row: HubRow) {
  const { Box, Text } = ui
  const card = row.card
  const role = card === null ? null : ROLE_OF_TONE[card.tone]
  const hasDetail = card !== null && card.detail !== ''

  return (
    <Box key={`row-${row.entry.pane}`} flexDirection="row" columnGap={1}>
      <Text color="claude">{GLYPH[row.entry.icon]}</Text>
      <Text bold>{row.entry.title}</Text>
      {hasDetail ? <Text color={role === null ? undefined : TONE_COLOR[role]} wrap="truncate">{card.detail}</Text> : <Text dimColor wrap="truncate">{row.entry.hint}</Text>}
      <Box flexGrow={1} />
      {openButton(ui, view, row)}
    </Box>
  )
}

function terminalTree(ui: Ui, view: HubView) {
  const { Box, Text } = ui
  const focus = view.focus
  const words = hubWords()

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>MODZ</Text>
        {focus === null ? <Text dimColor>{words.idleTitle}</Text> : <Text dimColor>{`${words.now} · ${focus.row.entry.title}`}</Text>}
        {focus === null ? null : <Text color={TONE_COLOR[ROLE_OF_TONE[focus.tone] ?? '']} wrap="truncate">{focus.row.card?.detail ?? ''}</Text>}
        <Box flexGrow={1} />
        <Text dimColor>{view.meta}</Text>
      </Box>
      {focusButton(ui, view)}
      {SECTIONS.map(section => {
        const rows = inSection(view.rows, section)

        return rows.length === 0 ? null : (
          <Box key={`section-${section}`} flexDirection="column">
            <Text bold dimColor>{upper(words.sections[section])}</Text>
            {rows.map(row => terminalRow(ui, view, row))}
          </Box>
        )
      })}
    </Box>
  )
}

export function hubTree(ui: Ui, view: HubView) {
  return view.surface === 'desktop' && 'Svg' in ui ? desktopTree(ui, view) : terminalTree(ui, view)
}
