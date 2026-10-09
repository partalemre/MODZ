import { dative } from './meta'
import type { MetaMap } from './meta'
import { diffstatSvg, headSvg, rowSvg } from './pane-svg'
import type { Drawing, Frame } from './pane-svg'
import { svgWidth } from './svg'
import { boxColor } from './tidemark'
import type { Theme } from './tidemark'
import { textPane } from './pane-text'
import type { CheckpointEntry, CheckpointView, PendingUndo } from '../types'

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
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const SAFETY_PREFIX = 'geri almadan önce: '
const WIDTH = { min: 300, max: 860 }
// Columns the row's "Geri al" button takes; the card's padding and border.
const ROW_RESERVE = 12
const CARD_RESERVE = 6

export function ago(ms: number): string {
  if (ms < MINUTE) return `${Math.max(0, Math.round(ms / SECOND))} sn önce`
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} dk önce`
  if (ms < DAY) return `${Math.round(ms / HOUR)} sa önce`

  return `${Math.round(ms / DAY)} g önce`
}

export function clip(text: string, max = LABEL_MAX): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export const changedText = (pending: PendingUndo): string => `${pending.restore + pending.remove} dosya değişecek`

// "Tur 12'ye dönülsün mü?" when the turn is known, else the prompt's opening words.
export const questionOf = (pending: PendingUndo): string =>
  pending.turn === null ? `"${clip(pending.entry.label, 40)}" öncesine dönülsün mü?` : `Tur ${dative(pending.turn)} dönülsün mü?`

export function titleOf(entry: CheckpointEntry, meta: MetaMap): { title: string; label: string } {
  const own = meta[entry.ref] ?? {}
  if (own.isSafety === true || entry.label.startsWith(SAFETY_PREFIX)) return { title: 'Geri almadan önce', label: entry.label.slice(SAFETY_PREFIX.length) }

  return { title: own.turn === undefined ? 'Kayıt' : `Tur ${own.turn}`, label: entry.label }
}

export const headerMeta = (view: CheckpointView, now: number): string =>
  view.entries[0] === undefined ? '' : `${view.entries.length} kayıt · en yenisi ${ago(now - view.entries[0].at)}`

function picture(ui: Ui, drawing: Drawing, key: string) {
  const { Svg } = ui

  return <Svg key={key} source={drawing.source} alt={drawing.alt} width={drawing.width} height={drawing.height} />
}

function confirmCard(ui: Ui, pending: PendingUndo, opts: PaneOpts) {
  const { Box, Button } = ui
  const frame: Frame = { width: svgWidth(opts.look.columns, { ...WIDTH, reserve: CARD_RESERVE }), mode: opts.look.theme.mode }
  const head = headSvg(frame, { role: 'amber', label: 'Geri al', meta: 'şimdiki hal önce kaydedilir', lead: questionOf(pending), rest: ` ${changedText(pending)}` })

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={boxColor(opts.look.theme, 'amber', 'line')} paddingX={2} paddingY={1} rowGap={1}>
      {picture(ui, head, 'cp-card-head')}
      {picture(ui, diffstatSvg(frame, pending), 'cp-card-stat')}
      <Box flexDirection="row" columnGap={1}>
        <Button key="cp-confirm" variant="primary" hotkey="g" label="Geri al" onPress={opts.actions.onConfirm} />
        <Button key="cp-cancel" variant="secondary" hotkey="v" label="Vazgeç" onPress={opts.actions.onCancel} />
      </Box>
    </Box>
  )
}

function timeline(ui: Ui, view: CheckpointView, opts: PaneOpts) {
  const { Box, Button } = ui
  const frame: Frame = { width: svgWidth(opts.look.columns, { ...WIDTH, reserve: ROW_RESERVE }), mode: opts.look.theme.mode }
  const last = view.entries.length - 1

  return (
    <Box flexDirection="column">
      {view.entries.map((entry, index) => {
        const named = titleOf(entry, opts.meta)
        const spec = { ...named, when: ago(opts.now - entry.at), meta: opts.meta[entry.ref] ?? {}, isNewest: index === 0, isFirst: index === 0, isLast: index === last }

        return (
          <Box key={`cp-row-${index}`} flexDirection="row" alignItems="center" columnGap={1}>
            {picture(ui, rowSvg(frame, spec), `cp-svg-${index}`)}
            <Button key={`cp-undo-${index}`} plain dimColor label="Geri al" onPress={() => opts.actions.onUndo(entry)} />
          </Box>
        )
      })}
    </Box>
  )
}

export function statusRow(ui: Ui, view: CheckpointView, actions: PaneActions) {
  const { Box, Text, Button } = ui
  const status = view.status
  if (status === null) return null
  const look = status.tone === 'success' ? { color: 'success' } : status.tone === 'error' ? { color: 'error' } : { dimColor: true }
  const glyph = { busy: '◐', success: '✓', error: '✕', info: '›' }[status.tone]
  const redo = status.redo

  return (
    <Box flexDirection="row" columnGap={1} alignItems="center">
      <Text {...look}>{glyph}</Text>
      <Text wrap="truncate">{status.text}</Text>
      {redo !== undefined && <Button key="cp-redo" plain hotkey="y" label="Yinele" onPress={() => actions.onUndo(redo)} />}
    </Box>
  )
}

export function paneTree(ui: Ui, view: CheckpointView, opts: PaneOpts) {
  const { Box, Text } = ui
  if (!opts.look.isRich) return textPane(ui, view, opts)
  const frame: Frame = { width: svgWidth(opts.look.columns, WIDTH), mode: opts.look.theme.mode }
  const count = view.entries.length
  const turns = view.entries.filter(entry => titleOf(entry, opts.meta).title !== 'Geri almadan önce').length
  const head = headSvg(frame, { role: 'kiln', label: 'Kontrol noktaları', meta: headerMeta(view, opts.now), lead: count === 0 ? 'Henüz kayıt yok' : `${turns} tur kayıtlı`, rest: '' })

  return (
    <Box flexDirection="column" rowGap={1}>
      {picture(ui, head, 'cp-head')}
      {statusRow(ui, view, opts.actions)}
      {view.pending !== null && confirmCard(ui, view.pending, opts)}
      {view.pending === null && count === 0 && <Text dimColor>Henüz kontrol noktası yok. Her turun ilk dosya yazımından önce bir tane alınır.</Text>}
      {view.pending === null && count > 0 && timeline(ui, view, opts)}
    </Box>
  )
}
