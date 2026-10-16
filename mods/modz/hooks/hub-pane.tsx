// The MODZ hub pane: the head card, then each section's rows with an "Open" button that asks the
// owning mod to open its pane. "Customize" turns the buttons into Up and Hide, and lists the hidden rows
// with Show. The catalog ("Mods") is a pane of its own (register.tsx).
import type { Drawing } from './draw'
import type { Cue } from './motion'
import type { Focus, HubRow, Section } from './hub'
import { ROLE_OF_TONE, SECTIONS } from './hub'
import { hubHeadSvg, hubRowSvg, sectionSvg } from './hub-draw'
import { GLYPH } from './kit/icons'
import { upper } from './kit/lang'
import type { Theme } from './theme'
import type { Stable } from './stable'
import { hubWords } from './words'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

// What a press asks of the hub; register.tsx writes each one where it is kept.
export type HubActions = {
  onOpen: (pane: string) => unknown
  onEdit: (isEditing: boolean) => unknown
  onMove: (opts: { pane: string; panes: string[] }) => unknown
  onHide: (opts: { pane: string; isHidden: boolean }) => unknown
  onReset: () => unknown
}

export type HubView = {
  rows: HubRow[]
  hidden: HubRow[]
  focus: Focus | null
  meta: string
  surface: string
  columns: number
  theme: Theme
  isEditing: boolean
  actions: HubActions
  // The drawings kept since the hub was put in the panel (stable.ts), so an unchanged one keeps its frame.
  stable: Stable
}

const PX_PER_COLUMN = 8
const WIDTH_MIN = 280
const WIDTH_MAX = 640
// Room the native buttons take beside a row's drawing: one "Open", or "Up" and "Hide" while customizing.
const BUTTON_ROOM = 64
// The head's pixel mark and its text enter first; the sections and rows follow.
const HEAD_STEPS = 4
const EDIT_BUTTON_ROOM = 136

export const hubWidth = (columns: number): number => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, columns * PX_PER_COLUMN - PX_PER_COLUMN))

const inSection = (rows: HubRow[], section: Section) => rows.filter(row => row.entry.section === section)

// The one primary button: straight to whatever leads the head ("Open Tests"). Not while customizing.
function focusButton(ui: Ui, view: HubView) {
  const { Box, Button } = ui
  const focus = view.focus
  if (focus === null || view.isEditing) return null
  const pane = focus.row.entry.pane

  return (
    <Box key="focus" flexDirection="row">
      <Button key="open-focus" label={hubWords().openPane(focus.row.entry.title)} variant="primary" onPress={() => view.actions.onOpen(pane)} />
    </Box>
  )
}

// A row's buttons: "Open" (the terminal shows its digit), or while customizing "Up" (not on a section's
// first row) and "Hide"; a hidden row offers "Show".
function rowButtons(ui: Ui, view: HubView, opts: { row: HubRow; panes: string[] | null }) {
  const { Button } = ui
  const { row, panes } = opts
  const pane = row.entry.pane
  const words = hubWords()
  if (panes === null) return [<Button key={`show-${pane}`} label={words.show} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: false })} />]
  if (!view.isEditing) {
    const hotkey = view.surface === 'desktop' || row.hotkey === null ? {} : { hotkey: row.hotkey }

    return [<Button key={`open-${pane}`} label={words.open} variant="secondary" {...hotkey} onPress={() => view.actions.onOpen(pane)} />]
  }
  const up = panes.indexOf(pane) > 0 ? [<Button key={`up-${pane}`} label={words.up} variant="secondary" onPress={() => view.actions.onMove({ pane, panes })} />] : []

  return [...up, <Button key={`hide-${pane}`} label={words.hide} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: true })} />]
}

// "Customize" under the rows; while customizing, "Done" and "Reset" with a line saying what the buttons do.
function editBar(ui: Ui, view: HubView) {
  const { Box, Button, Text } = ui
  const words = hubWords()
  if (!view.isEditing) {
    return (
      <Box key="edit" flexDirection="row">
        <Button key="customize" label={words.customize} variant="secondary" onPress={() => view.actions.onEdit(true)} />
      </Box>
    )
  }

  return (
    <Box key="edit" flexDirection="column" rowGap={1}>
      <Text key="edit-line" dimColor>{words.editLine}</Text>
      <Box key="edit-buttons" flexDirection="row" columnGap={1}>
        <Button key="customize-done" label={words.done} variant="primary" onPress={() => view.actions.onEdit(false)} />
        <Button key="customize-reset" label={words.reset} variant="secondary" onPress={() => view.actions.onReset()} />
      </Box>
    </Box>
  )
}

type Group = { key: string; label: string; rows: HubRow[]; isHiddenGroup: boolean }

// The sections that have rows, and while customizing the hidden rows as one more group at the end.
function groupsOf(view: HubView): Group[] {
  const words = hubWords()
  const sections = SECTIONS.map(section => ({ key: section, label: words.sections[section], rows: inSection(view.rows, section), isHiddenGroup: false }))
  const hidden = view.isEditing && view.hidden.length > 0 ? [{ key: 'hidden', label: words.hidden, rows: view.hidden, isHiddenGroup: true }] : []

  return [...sections, ...hidden].filter(group => group.rows.length > 0)
}

// What a row's drawing shows: its words and tone, not when its card was written.
function rowShows(row: HubRow, look: { width: number; theme: Theme }) {
  const card = row.card === null ? null : { detail: row.card.detail, tone: row.card.tone }

  return { ...look, entry: row.entry, card }
}

function desktopTree(ui: Ui, view: HubView) {
  const { Box, Svg } = ui
  const width = hubWidth(view.columns)
  const draw = (drawing: Drawing, key: string, drawnWidth: number) => (
    <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawnWidth} height={drawing.height} isInteractive />
  )
  const rowWidth = width - (view.isEditing ? EDIT_BUTTON_ROOM : BUTTON_ROOM)
  // Each drawing's place in the opening cascade, top to bottom: the head's own pieces take the first few.
  let order = HEAD_STEPS
  const kept = (key: string, what: unknown, build: (cue: Cue) => Drawing) => {
    const at = order++

    return view.stable.draw(key, what, phase => build({ phase, order: at }))
  }
  const focus = view.focus === null ? null : { pane: view.focus.row.entry.pane, tone: view.focus.tone, detail: view.focus.row.card?.detail }
  const head = view.stable.draw('head', { width, theme: view.theme, focus, meta: view.meta }, phase =>
    hubHeadSvg({ width, theme: view.theme, focus: view.focus, meta: view.meta, cue: { phase, order: 0 } }))

  return (
    <Box flexDirection="column" rowGap={1}>
      {draw(head, 'head', width)}
      {focusButton(ui, view)}
      {groupsOf(view).map(group => {
        const panes = group.isHiddenGroup ? null : group.rows.map(row => row.entry.pane)

        return (
          <Box key={`section-${group.key}`} flexDirection="column">
            {draw(kept(`eyebrow-${group.key}`, { width, theme: view.theme, label: group.label }, cue => sectionSvg({ width, theme: view.theme, label: group.label, cue })), `eyebrow-${group.key}`, width)}
            {group.rows.map(row => (
              <Box key={`row-${row.entry.pane}`} flexDirection="row" alignItems="center" columnGap={1}>
                {draw(kept(`row-${row.entry.pane}`, rowShows(row, { width: rowWidth, theme: view.theme }), cue => hubRowSvg({ width: rowWidth, theme: view.theme, row, cue })), `svg-${row.entry.pane}`, rowWidth)}
                {rowButtons(ui, view, { row, panes })}
              </Box>
            ))}
          </Box>
        )
      })}
      {editBar(ui, view)}
    </Box>
  )
}

const TONE_COLOR: Record<string, string> = { run: 'permission', ok: 'success', warn: 'warning', danger: 'error' }

function terminalRow(ui: Ui, view: HubView, opts: { row: HubRow; panes: string[] | null }) {
  const { Box, Text } = ui
  const { row } = opts
  const card = row.card
  const role = card === null ? null : ROLE_OF_TONE[card.tone]
  const hasDetail = card !== null && card.detail !== ''

  return (
    <Box key={`row-${row.entry.pane}`} flexDirection="row" columnGap={1}>
      <Text color="claude">{GLYPH[row.entry.icon]}</Text>
      <Text bold>{row.entry.title}</Text>
      {row.entry.badge === null ? null : <Text color="permission">{row.entry.badge}</Text>}
      {hasDetail ? <Text color={role === null ? undefined : TONE_COLOR[role]} wrap="truncate">{card.detail}</Text> : <Text dimColor wrap="truncate">{row.entry.hint}</Text>}
      <Box flexGrow={1} />
      {rowButtons(ui, view, opts)}
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
      {groupsOf(view).map(group => {
        const panes = group.isHiddenGroup ? null : group.rows.map(row => row.entry.pane)

        return (
          <Box key={`section-${group.key}`} flexDirection="column">
            <Text bold dimColor>{upper(group.label)}</Text>
            {group.rows.map(row => terminalRow(ui, view, { row, panes }))}
          </Box>
        )
      })}
      {editBar(ui, view)}
    </Box>
  )
}

export function hubTree(ui: Ui, view: HubView) {
  return view.surface === 'desktop' && 'Svg' in ui ? desktopTree(ui, view) : terminalTree(ui, view)
}
