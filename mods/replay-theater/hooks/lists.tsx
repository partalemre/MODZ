import { dateText } from './age'
import { headSvg, noteSvg, sessionFacts, sessionRowSvg, turnMeta, turnRowSvg, turnTitle } from './lists-svg'
import type { Drawing, ListHead } from './lists-svg'
import type { MoveOpts } from './kit/moving'
import { PressRow } from './kit/press'
import type { Ui } from './offer'
import { motion } from './pane'
import type { Theme } from './ui/theme'
import { words } from './words'
import type { ReplaySession, ReplaySessions, ReplayTurnRow, ReplayTurns } from '../types'

// The pane's two lists: a session's turns that edited files, and this project's sessions. A row that opens
// something is pressed as a whole on the desktop (a button laid over its drawing) and has a button with 1–9 as
// keys in the terminal; under them the way to the other list, "More" and Close.

export type ListHandlers = {
  onTurn: (n: number) => void
  onSession: (id: string) => void
  onSessions: () => void
  onThisSession: () => void
  onMore: () => void
  onClose: () => void
}
export type ListSite = { surface: string; width: number; theme: Theme; isCompact: boolean; maxRows: number; on: ListHandlers }
// `shows`: what the row's drawing shows leaving out an age that reads on ("2h ago").
type Row = { key: string; drawing: () => Drawing; shows?: unknown; text: { title: string; meta: string }; button: { label: string; onPress: () => void } | null }
type ListBody = { head: ListHead; note: { lead: string; rest: string } | null; rows: Row[]; more: number; other: { key: string; label: string; hotkey: string; onPress: () => void } }

const HOTKEYS = 9
// What a compact (band) list keeps for its head and buttons.
const COMPACT_CHROME_ROWS = 4

const isDesktop = (ui: Ui, site: ListSite): boolean => site.surface !== 'terminal' && !site.isCompact && 'Svg' in ui

type Notes = { loading: string; empty: { lead: string; rest: string }; isEmpty: boolean }

function noteOf(status: string, notes: Notes): ListBody['note'] {
  const w = words()
  if (status === 'loading') return { lead: notes.loading, rest: '' }
  if (status === 'unavailable') return { lead: w.unavailableLead, rest: w.unavailableRest }

  return notes.isEmpty ? notes.empty : null
}

function turnsBody(turns: ReplayTurns, view: { shown: number; now: number; site: ListSite }): ListBody {
  const w = words()
  const look = { width: view.site.width, theme: view.site.theme, now: view.now }
  const rows = turns.rows.slice(0, view.shown).map((row: ReplayTurnRow): Row => {
    const drawing = () => turnRowSvg(row, look)
    const text = { title: turnTitle(row), meta: turnMeta(row, view.now) }

    const { now, ...still } = look

    return { key: `rt-turn-${row.n}`, drawing, shows: { row, look: still }, text, button: { label: w.watchTurn, onPress: () => view.site.on.onTurn(row.n) } }
  })
  const edits = turns.rows.reduce((sum, row) => sum + row.edits, 0)
  const facts = [turns.status === 'ready' ? w.turnsAndEdits(turns.prompts, edits) : '', turns.isCut ? w.cut : ''].filter(Boolean)
  const head = { width: view.site.width, theme: view.site.theme, title: w.turnsTitle, meta: turns.isCurrent ? w.thisSession : '', quote: turns.title, lines: facts }
  const note = noteOf(turns.status, { loading: w.reading, empty: { lead: w.noTurnsLead, rest: w.noTurnsRest }, isEmpty: turns.rows.length === 0 })
  const other = { key: 'rt-sessions', label: w.pastSessions, hotkey: 's', onPress: view.site.on.onSessions }

  return { head, note, rows, more: Math.max(0, turns.rows.length - view.shown), other }
}

function sessionsBody(sessions: ReplaySessions, view: { shown: number; site: ListSite }): ListBody {
  const w = words()
  const look = { width: view.site.width, theme: view.site.theme }
  const rows = sessions.rows.slice(0, view.shown).map((row: ReplaySession): Row => {
    const hasEdits = row.edits === null || row.edits > 0
    const drawing = () => sessionRowSvg(row, { ...look, isPressable: hasEdits })
    const button = hasEdits ? { label: w.openSession, onPress: () => view.site.on.onSession(row.id) } : null
    const meta = [row.isCurrent ? w.thisSession : '', dateText(row.at), sessionFacts(row)].filter(Boolean).join(' · ')

    return { key: `rt-session-${row.id}`, drawing, text: { title: row.title === '' ? w.untitled : row.title, meta }, button }
  })
  const lines = [w.sessionsSub(sessions.rows.length + sessions.older), sessions.older > 0 ? w.older(sessions.older) : ''].filter(Boolean)
  const head = { width: view.site.width, theme: view.site.theme, title: w.sessionsTitle, meta: '', lines }
  const note = noteOf(sessions.status, { loading: w.readingSessions, empty: { lead: w.unavailableLead, rest: '' }, isEmpty: sessions.rows.length === 0 })
  const other = { key: 'rt-this-session', label: w.thisSession, hotkey: 't', onPress: view.site.on.onThisSession }

  return { head, note, rows, more: Math.max(0, sessions.rows.length - view.shown), other }
}

function bottomRow(ui: Ui, body: ListBody, on: ListHandlers) {
  const { Box, Button } = ui
  const w = words()

  return (
    <Box key="rt-list-buttons" flexDirection="row" columnGap={2} alignItems="center">
      <Button key={body.other.key} variant="secondary" hotkey={body.other.hotkey} label={body.other.label} onPress={body.other.onPress} />
      {body.more > 0 && <Button key="rt-more" plain dimColor hotkey="m" label={`${w.more} (${body.more})`} onPress={on.onMore} />}
      <Box flexGrow={1} />
      <Button key="rt-close" plain dimColor hotkey="c" label={w.close} onPress={on.onClose} />
    </Box>
  )
}

const hotkeyOf = (k: number) => (k < HOTKEYS ? { hotkey: String(k + 1) } : {})

// A row that opens something is one press over its drawing; one that does not is the drawing alone.
// No digit on the desktop (as the hub's rows): a cover's hint would float in the middle of the row.
function desktopRow(ui: Ui, row: Row, at: { draw: (drawing: Drawing, key: string, opts: MoveOpts) => unknown }) {
  const { Box } = ui
  const isPressable = row.button !== null
  const drawing = at.draw(row.drawing(), `${row.key}-svg`, { isRow: isPressable, shows: row.shows })
  if (row.button === null) return <Box key={row.key} alignSelf="flex-start">{drawing}</Box>
  return PressRow(ui, { box: row.key, key: `${row.key}-open`, onPress: row.button.onPress, drawing })
}

function desktopList(ui: Ui, body: ListBody, site: ListSite) {
  const { Box, Svg } = ui
  const draw = (drawing: Drawing, key: string, opts: MoveOpts & { width?: number } = {}) => {
    const { width = site.width, ...moves } = opts

    return <Svg key={key} {...motion.pic(key, { source: drawing.source, alt: drawing.alt, width, height: drawing.height }, moves)} />
  }
  const head = headSvg(body.head)
  const note = body.note === null ? null : noteSvg({ width: site.width, theme: site.theme, ...body.note })

  return (
    <Box key="rt-list" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      {draw(head, 'rt-list-head')}
      {note !== null && draw(note, 'rt-list-note')}
      {body.rows.length > 0 && <Box key="rt-list-rows" flexDirection="column">{body.rows.map(row => desktopRow(ui, row, { draw }))}</Box>}
      {bottomRow(ui, body, site.on)}
    </Box>
  )
}

function terminalRow(ui: Ui, row: Row, k: number) {
  const { Box, Text, Button } = ui

  return (
    <Box key={row.key} flexDirection="row" columnGap={1}>
      <Box flexShrink={1}>
        <Text bold wrap="truncate-end">{row.text.title}</Text>
      </Box>
      <Text dimColor wrap="truncate-end">{row.text.meta}</Text>
      <Box flexGrow={1} />
      {row.button !== null && <Button key={`${row.key}-open`} variant="secondary" label={row.button.label} onPress={row.button.onPress} {...hotkeyOf(k)} />}
    </Box>
  )
}

function terminalList(ui: Ui, body: ListBody, site: ListSite) {
  const { Box, Text } = ui
  const rows = site.isCompact ? body.rows.slice(0, Math.max(1, site.maxRows - COMPACT_CHROME_ROWS)) : body.rows
  const facts = [body.head.quote === undefined || body.head.quote === '' ? '' : `“${body.head.quote}”`, ...body.head.lines].filter(Boolean).join(' · ')

  return (
    <Box key="rt-list" flexDirection="column" paddingX={1}>
      <Box key="rt-list-title" flexDirection="row" columnGap={1}>
        <Text bold dimColor>{body.head.title}</Text>
        {body.head.meta !== '' && <Text dimColor>{`· ${body.head.meta}`}</Text>}
      </Box>
      {facts !== '' && <Text key="rt-list-facts" dimColor wrap="truncate-end">{facts}</Text>}
      {body.note !== null && <Text key="rt-list-lead" bold>{body.note.lead}</Text>}
      {body.note !== null && body.note.rest !== '' && <Text key="rt-list-rest" dimColor>{body.note.rest}</Text>}
      {rows.map((row, k) => terminalRow(ui, row, k))}
      {bottomRow(ui, body, site.on)}
    </Box>
  )
}

function listView(ui: Ui, body: ListBody, site: ListSite) {
  return isDesktop(ui, site) ? desktopList(ui, body, site) : terminalList(ui, body, site)
}

export function turnsView(ui: Ui, turns: ReplayTurns, view: { shown: number; now: number; site: ListSite }) {
  return listView(ui, turnsBody(turns, view), view.site)
}

export function sessionsView(ui: Ui, sessions: ReplaySessions, view: { shown: number; site: ListSite }) {
  return listView(ui, sessionsBody(sessions, view), view.site)
}
