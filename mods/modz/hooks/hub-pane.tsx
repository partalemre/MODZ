// The MODZ hub pane: each section's rows; pressing a row asks the owning mod to open its pane. A drawing cannot
// be pressed, so on the desktop each row is a still drawing with plain buttons laid over all of it (kit/press.tsx):
// the row is the control, its hover and its press one surface. "Customize" turns the rows into Up and Hide buttons
// at their right edge, and lists the hidden rows with Show. The catalog ("Mods") is a pane of its own (register.tsx).
import type { Drawing } from './draw'
import type { Focus, HubRow, Section } from './hub'
import { SECTIONS } from './hub'
import { firstRun, firstRunRow } from './first-run'
import { hubHeadSvg, hubRowSvg, sectionSvg } from './hub-draw'
import { GLYPH } from './kit/icons'
import { PressRow } from './kit/press'
import type { NowRow } from './now'
import { detailText, GLYPH_COLOR, nowDesktop, nowTerminal } from './now-pane'
import type { NowTools } from './now-pane'
import type { Theme } from './theme'
import type { Stable } from './kit/stable'
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
  // What fails, waits or runs now, drawn above the sections (now.ts); empty while nothing does.
  now: NowRow[]
  meta: string
  surface: string
  columns: number
  theme: Theme
  isEditing: boolean
  actions: HubActions
  // The drawings kept since the hub was put in the panel (stable.ts), so an unchanged one keeps its frame.
  stable: Stable<Drawing>
}

// A desktop pane reports about 9 px a column (a 365 px body reads 40). A narrow pane in its own window can hold a
// little less; the drawing is then drawn a touch smaller, and the row's buttons, never cut (kit/press.tsx), still
// cover it.
const PX_PER_COLUMN = 9
const WIDTH_MIN = 240
const WIDTH_MAX = 640
// Room the "Up" and "Hide" buttons take over a row's right edge while customizing; otherwise the row is the press.
const EDIT_BUTTON_ROOM = 136
// Where the customizing buttons sit, in layout cells from the drawing's right edge.
const INSET = 1

export const hubWidth = (columns: number): number => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, columns * PX_PER_COLUMN - PX_PER_COLUMN))

const inSection = (rows: HubRow[], section: Section) => rows.filter(row => row.entry.section === section)

// While customizing, a row's "Up" (not on a section's first row) and "Hide" at its right edge; a hidden row offers
// "Show". Otherwise the whole row is the press (pressRow).
function rowControls(ui: Ui, view: HubView, opts: { row: HubRow; panes: string[] | null }) {
  const { Box, Button } = ui
  const { row, panes } = opts
  const pane = row.entry.pane
  const words = hubWords()
  const edge = (controls: unknown) => <Box position="absolute" top={0} bottom={0} right={INSET} alignItems="center" flexDirection="row" columnGap={1}>{controls}</Box>
  if (panes === null) return edge(<Button key={`show-${pane}`} label={words.show} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: false })} />)
  const up = panes.indexOf(pane) > 0 ? [<Button key={`up-${pane}`} label={words.up} variant="secondary" onPress={() => view.actions.onMove({ pane, panes })} />] : []

  return edge([...up, <Button key={`hide-${pane}`} label={words.hide} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: true })} />])
}

// Under the rows: how many mods are on and "Customize", both quiet; while customizing, "Done" and "Reset"
// with a line saying what the buttons do.
// On the desktop the footer keeps about the rows' inset (hub-draw.ts sizesOf, two cells) with air above it; the count
// of mods on is in the head.
const DESKTOP_FOOT = { paddingX: 2, marginTop: 1 }

function editBar(ui: Ui, view: HubView) {
  const { Box, Button, Text } = ui
  const words = hubWords()
  if (!view.isEditing) {
    return (
      <Box key="edit" flexDirection="row" alignItems="center" columnGap={2} {...(view.surface === 'desktop' ? DESKTOP_FOOT : {})}>
        <Box flexGrow={1} />
        <Button key="customize" label={words.customize} plain dimColor onPress={() => view.actions.onEdit(true)} />
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

// The area is left out while customizing. A row lifted into it is that row, moved: it is not drawn in its section too.
const nowRows = (view: HubView): NowRow[] => (view.isEditing ? [] : view.now)

function sectionRows(view: HubView): HubRow[] {
  const lifted = new Set(nowRows(view).map(item => item.row.entry.pane))

  return view.rows.filter(row => !lifted.has(row.entry.pane))
}

type Group = { key: string; label: string; rows: HubRow[]; isHiddenGroup: boolean }

// The sections that still have rows (one whose rows all stand in "Now" has no heading either), and while
// customizing the hidden rows as one more group at the end.
function groupsOf(view: HubView): Group[] {
  const words = hubWords()
  const rows = sectionRows(view)
  const sections = SECTIONS.map(section => ({ key: section, label: words.sections[section], rows: inSection(rows, section), isHiddenGroup: false }))
  const hidden = view.isEditing && view.hidden.length > 0 ? [{ key: 'hidden', label: words.hidden, rows: view.hidden, isHiddenGroup: true }] : []

  return [...sections, ...hidden].filter(group => group.rows.length > 0)
}

// What a row's drawing shows: its words and tone, not when its card was written.
function rowShows(row: HubRow, look: { width: number; theme: Theme; buttonRoom: number }) {
  const card = row.card === null ? null : { detail: row.card.detail, tone: row.card.tone }

  return { ...look, entry: row.entry, card }
}

// A drawing with its controls laid over it; the box hugs the drawing so its edges are the drawing's own.
function overlaid(ui: Ui, opts: { key: string; drawing: unknown; controls: unknown }) {
  const { Box } = ui

  return (
    <Box key={opts.key} alignSelf="flex-start">
      {opts.drawing}
      {opts.controls}
    </Box>
  )
}

// A drawing the person presses as a whole: held still under its buttons, washed by its box on hover (kit/press.tsx).
function pressRow(ui: Ui, view: HubView, opts: { box: string; key: string; drawing: Drawing; width: number; pane: string }) {
  const { Svg } = ui
  const { drawing, width, pane } = opts
  const svg = <Svg source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} />

  return PressRow(ui, { box: opts.box, key: opts.key, drawing: svg, onPress: () => view.actions.onOpen(pane) })
}

// One section: its label, then its rows, each pressed whole or, while customizing, under its buttons.
function desktopGroup(ui: Ui, view: HubView, opts: { group: Group; pen: NowTools }) {
  const { Box } = ui
  const { group, pen } = opts
  const { width, theme } = pen
  const buttonRoom = view.isEditing ? EDIT_BUTTON_ROOM : 0
  const panes = group.isHiddenGroup ? null : group.rows.map(row => row.entry.pane)
  const eyebrow = pen.keep(`eyebrow-${group.key}`, { width, theme, label: group.label }, cue => sectionSvg({ width, theme, label: group.label, cue }))

  return (
    <Box key={`section-${group.key}`} flexDirection="column">
      {pen.label(eyebrow, `eyebrow-${group.key}`)}
      {group.rows.map(row => {
        const pane = row.entry.pane
        const built = pen.keep(`row-${pane}`, rowShows(row, { width, theme, buttonRoom }), cue => hubRowSvg({ width, theme, row, buttonRoom, cue }))
        if (!view.isEditing && panes !== null) return pen.press({ box: `row-${pane}`, key: `open-${pane}`, drawing: built, pane })

        return overlaid(ui, { key: `row-${pane}`, drawing: pen.label(built, `svg-${pane}`), controls: rowControls(ui, view, { row, panes }) })
      })}
    </Box>
  )
}

function desktopTree(ui: Ui, view: HubView) {
  const { Box, Svg } = ui
  const width = hubWidth(view.columns)
  const { theme } = view
  // Each drawing's place in the opening cascade, top to bottom.
  let order = 0
  const pen: NowTools = {
    width,
    theme,
    keep: (key, what, build) => {
      const at = order++

      return view.stable.draw(key, what, phase => build({ phase, order: at }))
    },
    label: (drawing, key) => <Svg key={key} source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} isInteractive />,
    press: opts => pressRow(ui, view, { ...opts, width }),
  }
  const head = pen.keep('head', { width, theme, meta: view.meta }, cue => hubHeadSvg({ width, theme, meta: view.meta, cue }))

  return (
    <Box flexDirection="column">
      {pen.label(head, 'head')}
      {nowDesktop(ui, nowRows(view), pen)}
      {groupsOf(view).map(group => desktopGroup(ui, view, { group, pen }))}
      {firstRunRow(ui, view, pen)}
      {editBar(ui, view)}
    </Box>
  )
}

// The terminal keeps a button per row: "Open" with its digit, or the customizing buttons.
function terminalButtons(ui: Ui, view: HubView, opts: { row: HubRow; panes: string[] | null }) {
  const { Button } = ui
  const { row, panes } = opts
  const pane = row.entry.pane
  const words = hubWords()
  if (panes === null) return <Button key={`show-${pane}`} label={words.show} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: false })} />
  if (!view.isEditing) {
    const hotkey = row.hotkey === null ? {} : { hotkey: row.hotkey }

    return <Button key={`open-${pane}`} label={words.open} variant="secondary" {...hotkey} onPress={() => view.actions.onOpen(pane)} />
  }
  const up = panes.indexOf(pane) > 0 ? [<Button key={`up-${pane}`} label={words.up} variant="secondary" onPress={() => view.actions.onMove({ pane, panes })} />] : []

  return [...up, <Button key={`hide-${pane}`} label={words.hide} variant="secondary" onPress={() => view.actions.onHide({ pane, isHidden: true })} />]
}

function terminalRow(ui: Ui, view: HubView, opts: { row: HubRow; panes: string[] | null }) {
  const { Box, Text } = ui
  const { row } = opts
  const card = row.card
  const hasDetail = card !== null && card.detail !== ''
  const glyphColor = hasDetail ? GLYPH_COLOR[card.tone] : undefined

  return (
    <Box key={`row-${row.entry.pane}`} flexDirection="row" columnGap={1}>
      {glyphColor === undefined ? <Text dimColor>{GLYPH[row.entry.icon]}</Text> : <Text color={glyphColor}>{GLYPH[row.entry.icon]}</Text>}
      <Text bold>{row.entry.title}</Text>
      {row.entry.badge === null ? null : <Text color="permission">{row.entry.badge}</Text>}
      {hasDetail ? detailText(ui, card.tone, card.detail) : <Text dimColor wrap="truncate">{row.entry.hint}</Text>}
      <Box flexGrow={1} />
      {terminalButtons(ui, view, opts)}
    </Box>
  )
}

function terminalTree(ui: Ui, view: HubView) {
  const { Box, Button, Text } = ui
  // The area below the head says what leads; the head says it only while there is no area, and keeps its button.
  const now = nowRows(view)
  const focus = view.focus
  const said = now.length > 0 ? null : focus
  const words = hubWords()

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>MODZ</Text>
        {focus === null ? <Text dimColor>{words.idleTitle}</Text> : null}
        {said === null ? null : <Text dimColor>{`${words.now} · ${said.row.entry.title}`}</Text>}
        {said === null ? null : detailText(ui, said.tone, said.row.card?.detail ?? '')}
        <Box flexGrow={1} />
        <Text dimColor>{view.meta}</Text>
      </Box>
      {focus === null || view.isEditing ? null : <Button key="open-focus" label={words.openPane(focus.row.entry.title)} variant="primary" onPress={() => view.actions.onOpen(focus.row.entry.pane)} />}
      {nowTerminal(ui, now, row => terminalButtons(ui, view, { row, panes: [] }))}
      {groupsOf(view).map(group => {
        const panes = group.isHiddenGroup ? null : group.rows.map(row => row.entry.pane)

        return (
          <Box key={`section-${group.key}`} flexDirection="column">
            <Text bold dimColor>{group.label}</Text>
            {group.rows.map(row => terminalRow(ui, view, { row, panes }))}
          </Box>
        )
      })}
      {firstRun(ui, view)}
      {editBar(ui, view)}
    </Box>
  )
}

export function hubTree(ui: Ui, view: HubView) {
  return view.surface === 'desktop' && 'Svg' in ui ? desktopTree(ui, view) : terminalTree(ui, view)
}
