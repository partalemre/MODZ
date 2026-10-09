// The desktop deck: a control surface, not a progress view (savvy-progress owns that). Header with
// stat tiles, the one agent that needs you, a swimlane of tool kinds over time, rows that open a
// drawer with the last calls, a message field and the actions.
import { attentionTree, rowsTree } from './desk-parts'
import { tilesSvg, titleSvg } from './desk-header'
import { paneWidth } from './desk-layout'
import { dispatchTree } from './dispatch'
import { summaryText } from './insight'
import { footerText } from './lists'
import { teamTree } from './rows'
import type { DeckHandlers, DeckView, Ui } from './rows'
import { swimlaneSvg } from './swimlane'
import type { DeckTab } from '../types'

const TABS_WIDTH = 168

function headTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Svg, Button } = ui
  const width = paneWidth(view.columns)
  const title = titleSvg({ width: width - TABS_WIDTH, theme: view.theme, agents: view.agents, summary: summaryText(view.agents, view.nowMs) })
  const tab = (key: DeckTab, label: string, hotkey: string) => (
    <Button key={`tab-${key}`} plain hotkey={hotkey} label={label} dimColor={view.tab !== key} onPress={() => handlers.onTab(key)} />
  )

  return (
    <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end">
      <Svg key="title" source={title.source} alt={title.alt} width={width - TABS_WIDTH} height={title.height} />
      <Box flexDirection="row" columnGap={1}>
        {tab('crew', 'Genel', '1')}
        {tab('dispatch', 'Gönder', '2')}
      </Box>
    </Box>
  )
}

function emptyTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text dimColor>Henüz ajan yok. Birine görev ver, burada canlı izle.</Text>
      {teamTree(ui, view, handlers)}
    </Box>
  )
}

function crewTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Svg, Text } = ui
  if (view.agents.length === 0) return emptyTree(ui, view, handlers)
  const width = paneWidth(view.columns)
  const summary = summaryText(view.agents, view.nowMs)
  const tiles = tilesSvg({ width, theme: view.theme, agents: view.agents, summary })
  const lanes = swimlaneSvg({ width, agents: view.agents, nowMs: view.nowMs, selected: view.selected, theme: view.theme })
  const footer = footerText(view.agents)

  return (
    <Box flexDirection="column" rowGap={1}>
      <Svg key="tiles" source={tiles.source} alt={tiles.alt} width={width} height={tiles.height} />
      {attentionTree(ui, view, handlers)}
      {lanes !== null && <Svg key="lanes" source={lanes.source} alt={lanes.alt} width={width} height={lanes.height} />}
      {rowsTree(ui, view, handlers)}
      {footer !== null && <Text dimColor wrap="truncate">{footer}</Text>}
    </Box>
  )
}

export function deskTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      {headTree(ui, view, handlers)}
      {view.tab === 'crew' ? crewTree(ui, view, handlers) : dispatchTree(ui, view, handlers)}
    </Box>
  )
}
