import { ago, changedText, confirmOf, emptyText, headerMeta, questionOf, statusRow, titleOf } from './pane'
import type { PaneOpts, Ui } from './pane'
import { words } from './words'
import type { CheckpointMeta, CheckpointView, PendingUndo } from '../types'

// The pane in text (terminal): the same timeline with ●/○ step glyphs and the confirm card.

export const summaryText = (pending: PendingUndo): string => words().summary(pending.restore, pending.remove)

function confirmText(ui: Ui, pending: PendingUndo, opts: PaneOpts) {
  const { Box, Text, Button } = ui
  const more = pending.restore + pending.remove - pending.files.length
  const said = words()
  const confirm = confirmOf(pending)

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="warning" paddingX={1}>
      <Text color="warning" bold wrap="truncate">{`${questionOf(pending)} ${changedText(pending)}`}</Text>
      <Box flexDirection="row" columnGap={1}>
        <Text color="success">{`+${pending.added}`}</Text>
        <Text color="error">{`−${pending.removed}`}</Text>
        <Text>{summaryText(pending)}</Text>
      </Box>
      {pending.files.map((file, index) => (
        <Text key={`cp-path-${index}`} dimColor wrap="truncate-start">{`› ${file.path}${file.isRemoved ? ` (${said.willDelete})` : ''}`}</Text>
      ))}
      {more > 0 && <Text dimColor>{said.more(more)}</Text>}
      <Box flexDirection="row" columnGap={1} marginTop={1}>
        <Button key="cp-confirm" variant="secondary" hotkey={confirm.hotkey} label={confirm.label} onPress={opts.actions.onConfirm} />
        <Button key="cp-cancel" variant="secondary" hotkey={said.cancel.hotkey} label={said.cancel.label} autoFocus onPress={opts.actions.onCancel} />
      </Box>
    </Box>
  )
}

function glyphOf(meta: CheckpointMeta): string {
  if (meta.isSafety === true) return '◆'

  return meta.isUndone === true ? '○' : '●'
}

function rowText(ui: Ui, view: CheckpointView, spec: { index: number; opts: PaneOpts }) {
  const { Box, Text, Button } = ui
  const entry = view.entries[spec.index]
  if (entry === undefined) return null
  const meta = spec.opts.meta[entry.ref] ?? {}
  const named = titleOf(entry, spec.opts.meta)
  const isUndone = meta.isUndone === true
  const glyph = glyphOf(meta)
  const facts = [ago(spec.opts.now - entry.at), meta.files ? words().files(meta.files) : '', (meta.tools ?? []).join(' ')].filter(part => part !== '')

  return (
    <Box key={`cp-row-${spec.index}`} flexDirection="row" columnGap={1}>
      <Text {...(spec.index === 0 && !isUndone ? { color: 'claude' } : { dimColor: true })}>{glyph}</Text>
      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="row" columnGap={1}>
          <Text bold={!isUndone} dimColor={isUndone} strikethrough={isUndone}>{named.title}</Text>
          <Text dimColor>{facts.join(' · ')}</Text>
        </Box>
        <Text wrap="truncate" dimColor={isUndone} strikethrough={isUndone}>{named.label}</Text>
      </Box>
      <Button key={`cp-undo-${spec.index}`} variant="secondary" dimColor={view.isBusy} label={words().undo} onPress={() => spec.opts.actions.onUndo(entry)} />
    </Box>
  )
}

export function textPane(ui: Ui, view: CheckpointView, opts: PaneOpts) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text bold dimColor>{words().title}</Text>
        <Text dimColor>{headerMeta(view, opts.now)}</Text>
      </Box>
      <Text> </Text>
      {statusRow(ui, view, opts.actions)}
      {view.pending !== null && confirmText(ui, view.pending, opts)}
      {view.pending === null && view.entries.length === 0 && <Text dimColor>{emptyText()}</Text>}
      {view.pending === null && view.entries.map((_, index) => rowText(ui, view, { index, opts }))}
    </Box>
  )
}
