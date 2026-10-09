import { attentionOf, faceOf, summaryText } from './insight'
import { isLive } from './roster'
import { cardTree, doneRow, liveRow, teamTree } from './rows'
import type { DeckHandlers, DeckView, Ui } from './rows'
import { deskTree } from './desk'
import { dispatchTree } from './dispatch'
import { doneAgents, footerText, liveAgents } from './lists'
import type { DeckAgent, DeckTab } from '../types'

export type { DeckHandlers, DeckView } from './rows'

// Finished agents shown before the list folds; the rest wait behind "+N daha".
export const DONE_FOLDED = 3
// "Ajanlar  1: Genel  2: Gönder" and the gap before the overview line.
const HEADER_LEFT = 31

// Title, tabs and the overview line on one row while they fit, else the overview line drops below.
function headerTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const summary = summaryText(view.agents, view.nowMs)
  const tab = (key: DeckTab, label: string, hotkey: string) => (
    <Button key={`tab-${key}`} plain hotkey={hotkey} label={label} dimColor={view.tab !== key} onPress={() => handlers.onTab(key)} />
  )
  const isOneRow = HEADER_LEFT + summary.length <= view.columns

  return (
    <Box flexDirection={isOneRow ? 'row' : 'column'} justifyContent="space-between" columnGap={2}>
      <Box flexDirection="row" columnGap={2}>
        <Text bold>Ajanlar</Text>
        {tab('crew', 'Genel', '1')}
        {tab('dispatch', 'Gönder', '2')}
      </Box>
      <Text dimColor wrap="truncate">{summary}</Text>
    </Box>
  )
}

function attentionTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const attention = attentionOf(view.agents, view.nowMs)
  if (attention === null) return null

  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color={attention.color}>{attention.glyph}</Text>
      <Box flexGrow={1}><Text wrap="truncate">{attention.text}</Text></Box>
      {view.selected !== attention.agentId && <Button key="attend" plain label="Bak" onPress={() => handlers.onSelect(attention.agentId)} />}
    </Box>
  )
}

function withCard(ui: Ui, agent: DeckAgent, context: { view: DeckView; handlers: DeckHandlers }) {
  const row = isLive(agent) ? liveRow(ui, agent, context) : doneRow(ui, agent, context)

  return agent.id === context.view.selected ? [row, cardTree(ui, agent, context)] : [row]
}

function doneTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const done = doneAgents(view.agents)
  if (done.length === 0) return null
  const shown = view.isDoneOpen ? done : done.slice(0, DONE_FOLDED)
  const hidden = done.length - DONE_FOLDED

  return (
    <Box flexDirection="column">
      <Text dimColor>Bitenler</Text>
      {shown.flatMap(agent => withCard(ui, agent, { view, handlers }))}
      {hidden > 0 && <Button key="more-done" plain dimColor label={view.isDoneOpen ? 'daha az' : `+${hidden} daha`} onPress={handlers.onToggleDone} />}
    </Box>
  )
}

function emptyTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={1}>
        <Text color="claude">{faceOf('general-purpose', 'resting')}</Text>
        <Text dimColor>Henüz ajan yok. Birine görev ver, burada canlı izle.</Text>
      </Box>
      {teamTree(ui, view, handlers)}
    </Box>
  )
}

function overviewTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text } = ui
  if (view.agents.length === 0) return emptyTree(ui, view, handlers)
  const live = liveAgents(view.agents)
  const footer = footerText(view.agents)

  return (
    <Box flexDirection="column" rowGap={1}>
      {attentionTree(ui, view, handlers)}
      {live.length > 0 && <Box flexDirection="column">{live.flatMap(agent => withCard(ui, agent, { view, handlers }))}</Box>}
      {doneTree(ui, view, handlers)}
      {footer !== null && <Text dimColor wrap="truncate">{footer}</Text>}
    </Box>
  )
}

// The terminal draws text rows; the desktop its own Svg deck.
export function deckTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box } = ui
  if (view.surface === 'desktop') return deskTree(ui, view, handlers)

  return (
    <Box flexDirection="column" rowGap={1}>
      {headerTree(ui, view, handlers)}
      {view.tab === 'crew' ? overviewTree(ui, view, handlers) : dispatchTree(ui, view, handlers)}
    </Box>
  )
}
