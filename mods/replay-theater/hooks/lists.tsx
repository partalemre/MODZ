import { dateText } from './age'
import { upper } from './lang'
import { headSvg, noteSvg, sessionFacts, sessionRowSvg, turnMeta, turnRowSvg, turnTitle } from './lists-svg'
import type { Drawing, ListHead } from './lists-svg'
import type { Ui } from './offer'
import type { Theme } from './ui/theme'
import { words } from './words'
import type { ReplaySession, ReplaySessions, ReplayTurnRow, ReplayTurns } from '../types'

// The pane's two lists: a session's turns that edited files, and this project's sessions. Each row has its
// own button (1–9 as keys); under them "More", the way to the other list, and Close.

export type ListHandlers = {
  onTurn: (n: number) => void
  onSession: (id: string) => void
  onSessions: () => void
  onThisSession: () => void
  onMore: () => void
  onClose: () => void
}
export type ListSite = { surface: string; width: number; theme: Theme; isCompact: boolean; maxRows: number; on: ListHandlers }
type Row = { key: string; drawing: () => Drawing; text: { title: string; meta: string }; button: { label: string; onPress: () => void } | null }
type ListBody = { head: ListHead; note: { lead: string; rest: string } | null; rows: Row[]; more: number; other: { key: string; label: string; hotkey: string; onPress: () => void } }

// A drawn row leaves this much room for its button.
const BUTTON_ROOM = 72
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
  const look = { width: view.site.width - BUTTON_ROOM, theme: view.site.theme, now: view.now }
  const rows = turns.rows.slice(0, view.shown).map((row: ReplayTurnRow): Row => {
    const drawing = () => turnRowSvg(row, look)
    const text = { title: turnTitle(row), meta: turnMeta(row, view.now) }

    return { key: `rt-turn-${row.n}`, drawing, text, button: { label: w.watchTurn, onPress: () => view.site.on.onTurn(row.n) } }
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
  const look = { width: view.site.width - BUTTON_ROOM, theme: view.site.theme }
  const rows = sessions.rows.slice(0, view.shown).map((row: ReplaySession): Row => {
    const drawing = () => sessionRowSvg(row, look)
    const hasEdits = row.edits === null || row.edits > 0
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
      {body.more > 0 && <Button key="rt-more" variant="secondary" hotkey="m" label={`${w.more} (${body.more})`} onPress={on.onMore} />}
      <Box flexGrow={1} />
      <Button key="rt-close" plain hotkey="c" label={w.close} onPress={on.onClose} />
    </Box>
  )
}

const hotkeyOf = (k: number) => (k < HOTKEYS ? { hotkey: String(k + 1) } : {})

function desktopList(ui: Ui, body: ListBody, site: ListSite) {
  const { Box, Svg, Button } = ui
  const draw = (drawing: Drawing, key: string, width: number) => <Svg key={key} source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} />
  const head = headSvg(body.head)
  const note = body.note === null ? null : noteSvg({ width: site.width, theme: site.theme, ...body.note })

  return (
    <Box key="rt-list" flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      {draw(head, 'rt-list-head', site.width)}
      {note !== null && draw(note, 'rt-list-note', site.width)}
      {body.rows.map((row, k) => (
        <Box key={row.key} flexDirection="row" alignItems="center" columnGap={1}>
          {draw(row.drawing(), `${row.key}-svg`, site.width - BUTTON_ROOM)}
          {row.button !== null && <Button key={`${row.key}-open`} variant="secondary" label={row.button.label} onPress={row.button.onPress} {...hotkeyOf(k)} />}
        </Box>
      ))}
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
        <Text color="merged" bold>{`● ${upper(body.head.title)}`}</Text>
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
