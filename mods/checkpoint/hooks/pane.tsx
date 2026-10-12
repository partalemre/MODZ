import type { MetaMap } from './meta'
import { diffstatSvg, headSvg, rowFits, rowSvg } from './pane-svg'
import type { Drawing, Frame, RowSpec } from './pane-svg'
import { svgWidth } from './svg'
import { boxColor } from './tidemark'
import type { Theme } from './tidemark'
import { textPane } from './pane-text'
import type { CheckpointEntry, CheckpointStatus, CheckpointView, PendingUndo } from '../types'
import { SAFETY_PREFIXES, words } from './words'

// The resolved element table of the surface that draws the pane.
export type Ui = Record<string, any>

export type PaneActions = {
  onUndo: (entry: CheckpointEntry) => void
  onConfirm: () => void
  onCancel: () => void
}

export type PaneLook = { theme: Theme; columns: number; isRich: boolean }
export type PaneOpts = { now: number; meta: MetaMap; look: PaneLook; actions: PaneActions }

const LABEL_MAX = 60
const WIDTH = { min: 240, max: 860 }
// Columns the row's Undo button takes; the card's padding and border.
const ROW_RESERVE = 12
const CARD_RESERVE = 6

export const ago = (ms: number): string => words().ago(ms)

export function clip(text: string, max = LABEL_MAX): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export const changedText = (pending: PendingUndo): string => words().changed(pending.restore + pending.remove)

// The confirm button says what it does (verb and object); Cancel holds the focus, so Enter changes nothing.
export const confirmOf = (pending: PendingUndo): { label: string; hotkey: string } => words().confirm(pending.restore + pending.remove)

export const emptyText = (): string => `${words().emptyLead} · ${words().emptyRest}`

/** What the undo goes back to: the turn when it is known, else the prompt's opening words. */
export const targetOf = (turn: number | null | undefined, label: string, max = LABEL_MAX): string =>
  turn === null || turn === undefined ? `"${clip(label, max)}"` : words().turn(turn)

const QUESTION_LABEL_MAX = 40

// A turn's checkpoint is the tree before that turn wrote: "Go back to before Turn 12?". Going there undoes
// that turn and every later one.
export const questionOf = (pending: PendingUndo): string => words().question(targetOf(pending.turn, pending.entry.label, QUESTION_LABEL_MAX))

export function titleOf(entry: CheckpointEntry, meta: MetaMap): { title: string; label: string } {
  const own = meta[entry.ref] ?? {}
  const prefix = SAFETY_PREFIXES.find(start => entry.label.startsWith(start))
  if (own.isSafety === true || prefix !== undefined) return { title: words().beforeUndo, label: entry.label.slice((prefix ?? words().safetyPrefix).length) }

  return { title: own.turn === undefined ? words().saved : words().turn(own.turn), label: entry.label }
}

export const headerMeta = (view: CheckpointView, now: number): string =>
  view.entries[0] === undefined ? '' : words().headerMeta(view.entries.length, ago(now - view.entries[0].at))

function picture(ui: Ui, drawing: Drawing, key: string) {
  const { Svg } = ui

  return <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawing.width} height={drawing.height} />
}

function confirmCard(ui: Ui, pending: PendingUndo, opts: PaneOpts) {
  const { Box, Button } = ui
  const frame: Frame = { width: svgWidth(opts.look.columns, { ...WIDTH, reserve: CARD_RESERVE }), mode: opts.look.theme.mode }
  const said = words()
  const head = headSvg(frame, { role: 'amber', label: said.undo, meta: said.undoMeta, lead: questionOf(pending), rest: changedText(pending) })
  const confirm = confirmOf(pending)

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={boxColor(opts.look.theme, 'amber', 'line')} paddingX={2} paddingY={1} rowGap={1}>
      {picture(ui, head, 'cp-card-head')}
      {picture(ui, diffstatSvg(frame, pending), 'cp-card-stat')}
      <Box flexDirection="row" columnGap={1}>
        <Button key="cp-confirm" variant="secondary" hotkey={confirm.hotkey} label={confirm.label} onPress={opts.actions.onConfirm} />
        <Button key="cp-cancel" variant="secondary" hotkey={said.cancel.hotkey} label={said.cancel.label} autoFocus onPress={opts.actions.onCancel} />
      </Box>
    </Box>
  )
}

function rowSpecs(view: CheckpointView, opts: PaneOpts): RowSpec[] {
  const last = view.entries.length - 1

  return view.entries.map((entry, index) => ({
    ...titleOf(entry, opts.meta), when: ago(opts.now - entry.at), meta: opts.meta[entry.ref] ?? {}, isNewest: index === 0, isFirst: index === 0, isLast: index === last,
  }))
}

// Every row stacks its facts under the label once one row has no room beside its title, so the rows stay alike.
function timeline(ui: Ui, view: CheckpointView, opts: PaneOpts) {
  const { Box, Button } = ui
  const frame: Frame = { width: svgWidth(opts.look.columns, { ...WIDTH, reserve: ROW_RESERVE }), mode: opts.look.theme.mode }
  const specs = rowSpecs(view, opts)
  const isStacked = specs.some(spec => !rowFits(frame, spec))

  return (
    <Box flexDirection="column">
      {view.entries.map((entry, index) => (
        <Box key={`cp-row-${index}`} flexDirection="row" alignItems="flex-start" columnGap={1}>
          {picture(ui, rowSvg(frame, { ...(specs[index] as RowSpec), isStacked }), `cp-svg-${index}`)}
          <Button key={`cp-undo-${index}`} plain dimColor label={words().undo} onPress={() => opts.actions.onUndo(entry)} />
        </Box>
      ))}
    </Box>
  )
}

const STATUS_LOOK: Record<CheckpointStatus['tone'], { color: string } | { dimColor: boolean }> = {
  busy: { dimColor: true },
  success: { color: 'success' },
  error: { color: 'error' },
  info: { dimColor: true },
}

export function statusRow(ui: Ui, view: CheckpointView, actions: PaneActions) {
  const { Box, Text, Button } = ui
  const status = view.status
  if (status === null) return null
  const look = STATUS_LOOK[status.tone]
  const glyph = { busy: '◐', success: '✓', error: '✕', info: '›' }[status.tone]
  const redo = status.redo

  return (
    <Box flexDirection="row" columnGap={1} alignItems="center">
      <Text {...look}>{glyph}</Text>
      <Text>{status.text}</Text>
      {redo !== undefined && <Button key="cp-redo" plain hotkey="y" label={words().redo} onPress={() => actions.onUndo(redo)} />}
    </Box>
  )
}

export function paneTree(ui: Ui, view: CheckpointView, opts: PaneOpts) {
  const { Box } = ui
  if (!opts.look.isRich) return textPane(ui, view, opts)
  const frame: Frame = { width: svgWidth(opts.look.columns, WIDTH), mode: opts.look.theme.mode }
  const count = view.entries.length
  const said = words()
  const turns = view.entries.filter(entry => titleOf(entry, opts.meta).title !== said.beforeUndo).length
  const lead = count === 0 ? { lead: said.emptyLead, rest: said.emptyRest, joiner: ' · ' } : { lead: said.turnsSaved(turns), rest: '' }
  const head = headSvg(frame, { role: 'kiln', label: said.title, meta: headerMeta(view, opts.now), ...lead })

  return (
    <Box flexDirection="column" rowGap={1}>
      {picture(ui, head, 'cp-head')}
      {statusRow(ui, view, opts.actions)}
      {view.pending !== null && confirmCard(ui, view.pending, opts)}
      {view.pending === null && count > 0 && timeline(ui, view, opts)}
    </Box>
  )
}
