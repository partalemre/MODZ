// The hub with no mod but itself installed (hub-pane.tsx draws it under the one row): a sentence says so, and one
// press leads to the catalog's install lines.
import type { HubRow } from './hub'
import { MODS_PANE } from './hub'
import { hubRowSvg } from './hub-draw'
import type { HubView } from './hub-pane'
import type { NowTools } from './now-pane'
import { hubWords } from './words'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

// The sentence keeps about the rows' inset (hub-draw.ts sizesOf, two cells) with air above it, as the hub's footer.
const DESKTOP_FOOT = { paddingX: 2, marginTop: 1 }

const isFirstRun = (view: HubView): boolean => !view.isEditing && view.hidden.length === 0 && view.rows.every(row => row.entry.pane === MODS_PANE)

// The terminal's own button; the desktop draws the press as a row like every other (firstRunRow).
export function firstRun(ui: Ui, view: HubView) {
  const { Box, Button, Text } = ui
  if (!isFirstRun(view)) return null
  const words = hubWords()

  return (
    <Box key="first-run" flexDirection="column" rowGap={1}>
      <Text dimColor>{words.firstRun}</Text>
      <Box flexDirection="row">
        <Button key="add-mods" label={words.addMods} variant="primary" onPress={() => view.actions.onOpen(MODS_PANE)} />
      </Box>
    </Box>
  )
}

// On the desktop a native button is a pill of its own chrome, unlike anything else on the hub: the way to the
// install lines is a row, drawn and pressed as the rows above it.
export function firstRunRow(ui: Ui, view: HubView, pen: NowTools) {
  const { Box, Text } = ui
  if (!isFirstRun(view)) return null
  const words = hubWords()
  const { width, theme } = pen
  const row: HubRow = { entry: { pane: MODS_PANE, mod: 'modz', title: words.addMods, icon: 'layers', role: 'edit', section: 'meter', hint: '', badge: null, isGuest: false }, card: null, hotkey: null }
  const built = pen.keep('row-add-mods', { width, theme, title: words.addMods }, cue => hubRowSvg({ width, theme, row, buttonRoom: 0, cue }))

  return (
    <Box key="first-run" flexDirection="column">
      <Box {...DESKTOP_FOOT} marginBottom={1}><Text dimColor>{words.firstRun}</Text></Box>
      {pen.press({ box: 'row-add-mods', key: 'add-mods', drawing: built, pane: MODS_PANE })}
    </Box>
  )
}
