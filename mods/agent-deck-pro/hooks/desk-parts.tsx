// Desktop rows and cards: the attention card, the agent rows and the drawer a picked row opens.
import { attentionSvg } from './desk-header'
import { LEAD_WIDTH, META_WIDTH, activitySvg, callsSvg, leadSvg, metaSvg } from './desk-rows'
import { paneWidth } from './desk-layout'
import { elapsedText, shortText } from './format'
import { attentionOf } from './insight'
import { doneAgents, liveAgents } from './lists'
import { isLive, isRunning } from './roster'
import { ROW_MIN_TEXT, activityOf, filesText, lineTree, metaText, statsText, titleOf } from './rows'
import type { DeckHandlers, DeckView, Ui } from './rows'
import { paletteOf, svgDoc } from './theme'
import type { DeckAgent } from '../types'

type Context = { view: DeckView; handlers: DeckHandlers }

// Tool calls and files; tokens already stand on line one.
function workText(agent: DeckAgent): string {
  return statsText({ ...agent, tokens: 0 })
}

const DONE_FOLDED = 3
// Line two and the drawer start under the title: the lead Svg and one gap, in cells.
const INDENT_CELLS = 5
const CELL = 8
// The drawer card's border and padding, in pixels, around its Svg.
const CARD_CHROME = 2 * 2 * CELL + 2
const TITLE_ROOM = 24
const ATTEND_ROOM = 96
const STOP_ICON = '<circle cx="7" cy="7" r="6" fill="none" stroke-width="1.4" class="st-danger"/><rect x="4.75" y="4.75" width="4.5" height="4.5" rx="1" class="fg-danger"/>'

export function attentionTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Svg, Button } = ui
  const attention = attentionOf(view.agents, view.nowMs)
  if (attention === null) return null
  const palette = paletteOf(view.theme)
  const width = paneWidth(view.columns) - CARD_CHROME - ATTEND_ROOM
  const face = attentionSvg({ width, theme: view.theme, face: attention })

  return (
    <Box key="attention" flexDirection="row" alignItems="center" justifyContent="space-between" borderStyle="round" borderColor={palette.roles.warn.line} backgroundColor={palette.card} paddingX={2} paddingY={1}>
      <Svg key="attention-face" source={face.source} alt={face.alt} width={width} height={face.height} />
      {view.selected !== attention.agentId && <Button key="attend" variant="secondary" label="Bak" onPress={() => handlers.onSelect(attention.agentId)} />}
    </Box>
  )
}

function titleTree(ui: Ui, agent: DeckAgent, spec: Context & { isDim: boolean }) {
  const { Box, Text, Button } = ui
  const room = spec.view.columns - (LEAD_WIDTH + META_WIDTH) / CELL - 2
  const hasTag = agent.description !== '' && room - agent.type.length - 1 >= TITLE_ROOM
  const width = Math.max(ROW_MIN_TEXT, hasTag ? room - agent.type.length - 1 : room)

  return (
    <Box flexGrow={1} flexDirection="row" columnGap={1} alignItems="center">
      <Button key={`pick-${agent.id}`} plain dimColor={spec.isDim} label={shortText(titleOf(agent), width)} onPress={() => spec.handlers.onSelect(agent.id)} />
      {hasTag && <Text dimColor>{agent.type}</Text>}
    </Box>
  )
}

function liveRow(ui: Ui, agent: DeckAgent, context: Context) {
  const { Box, Svg } = ui
  const { view } = context
  const spec = { agent, nowMs: view.nowMs, theme: view.theme }
  const lead = leadSvg(spec)
  const meta = metaSvg(spec)
  const width = paneWidth(view.columns) - INDENT_CELLS * CELL
  const activity = activitySvg({ ...spec, width, activity: { words: activityOf(agent), stats: workText(agent) } })

  return (
    <Box key={`row-${agent.id}`} flexDirection="column">
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        <Svg key={`lead-${agent.id}`} source={lead.source} alt={lead.alt} width={LEAD_WIDTH} height={lead.height} />
        {titleTree(ui, agent, { ...context, isDim: false })}
        <Svg key={`meta-${agent.id}`} source={meta.source} alt={meta.alt} width={META_WIDTH} height={meta.height} />
      </Box>
      <Box paddingLeft={INDENT_CELLS}>
        <Svg key={`act-${agent.id}`} source={activity.source} alt={activity.alt} width={width} height={activity.height} />
      </Box>
    </Box>
  )
}

function doneRow(ui: Ui, agent: DeckAgent, context: Context) {
  const { Box, Svg, Text } = ui
  const lead = leadSvg({ agent, nowMs: context.view.nowMs, theme: context.view.theme })
  const span = (agent.endedAt ?? context.view.nowMs) - agent.startedAt
  const tail = [span > 0 ? elapsedText(span) : '', statsText(agent)].filter(part => part !== '').join(' · ')

  return (
    <Box key={`row-${agent.id}`} flexDirection="row" alignItems="center" columnGap={1}>
      <Svg key={`lead-${agent.id}`} source={lead.source} alt={lead.alt} width={LEAD_WIDTH} height={lead.height} />
      {titleTree(ui, agent, { ...context, isDim: agent.id !== context.view.selected })}
      <Text dimColor>{tail}</Text>
    </Box>
  )
}

function actionsTree(ui: Ui, agent: DeckAgent, context: Context) {
  const { Box, Svg, Button } = ui
  const { view, handlers } = context
  const stop = svgDoc({ width: 14, height: 14, theme: view.theme, body: STOP_ICON })

  return (
    <Box flexDirection="row" columnGap={1} alignItems="center" flexWrap="wrap">
      <Button key={`again-${agent.id}`} variant="primary" label="Yeni görev" onPress={() => handlers.onGiveTask(agent.type)} />
      <Button key={`log-${agent.id}`} variant="secondary" label={view.drawer === 'log' ? 'Dökümü kapat' : 'Döküm'} onPress={() => handlers.onDrawer(view.drawer === 'log' ? 'none' : 'log')} />
      {isRunning(agent) && (
        <Box flexDirection="row" alignItems="center">
          <Svg key={`stop-icon-${agent.id}`} source={stop} alt="" width={14} height={14} />
          <Button key={`stop-${agent.id}`} plain label="Durdur" onPress={() => handlers.onStop(agent.id)} />
        </Box>
      )}
    </Box>
  )
}

function logTree(ui: Ui, view: DeckView, width: number) {
  const { Text } = ui
  if (view.drawer !== 'log') return null
  if (view.lines.length === 0) return <Text dimColor>Döküm henüz boş.</Text>

  return view.lines.map(line => lineTree(ui, line, width))
}

function drawerTree(ui: Ui, agent: DeckAgent, context: Context) {
  const { Box, Svg, Text, Input } = ui
  const { view, handlers } = context
  const palette = paletteOf(view.theme)
  const width = paneWidth(view.columns) - INDENT_CELLS * CELL - CARD_CHROME
  const calls = callsSvg({ agent, nowMs: view.nowMs, theme: view.theme, width, meta: metaText(agent) })
  const cells = Math.max(ROW_MIN_TEXT, Math.floor(width / CELL))
  const hasAnswer = !isLive(agent) && agent.answer !== null && agent.answer !== ''

  return (
    <Box key={`card-${agent.id}`} marginLeft={INDENT_CELLS} flexDirection="column" rowGap={1} borderStyle="round" borderColor={palette.strong} backgroundColor={palette.card} paddingX={2} paddingY={1}>
      <Svg key={`calls-${agent.id}`} source={calls.source} alt={calls.alt} width={width} height={calls.height} />
      {agent.files.length > 0 && <Text dimColor wrap="truncate">{filesText(agent)}</Text>}
      {hasAnswer && <Text wrap="truncate">{shortText(agent.answer ?? '', cells)}</Text>}
      {isLive(agent) && <Input key="send" label="Mesaj" placeholder="Bu ajana bir şey söyle, Enter gönderir" value="" submitLabel="gönder" onSubmit={handlers.onSend} />}
      {actionsTree(ui, agent, context)}
      {logTree(ui, view, cells)}
    </Box>
  )
}

function withDrawer(ui: Ui, agent: DeckAgent, context: Context) {
  const row = isLive(agent) ? liveRow(ui, agent, context) : doneRow(ui, agent, context)

  return agent.id === context.view.selected ? [row, drawerTree(ui, agent, context)] : [row]
}

function sectionTree(ui: Ui, label: string, count: number) {
  const { Box, Text } = ui

  return (
    <Box key={`section-${label}`} flexDirection="row" columnGap={1}>
      <Text dimColor>{label}</Text>
      <Text dimColor>{`· ${count}`}</Text>
    </Box>
  )
}

export function rowsTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Button } = ui
  const context = { view, handlers }
  const live = liveAgents(view.agents)
  const done = doneAgents(view.agents)
  const shown = view.isDoneOpen ? done : done.slice(0, DONE_FOLDED)
  const hidden = done.length - DONE_FOLDED

  return (
    <Box flexDirection="column" rowGap={1}>
      {live.length > 0 && <Box flexDirection="column" rowGap={1}>{[sectionTree(ui, 'Canlı', live.length), ...live.flatMap(agent => withDrawer(ui, agent, context))]}</Box>}
      {done.length > 0 && (
        <Box flexDirection="column">
          {sectionTree(ui, 'Bitenler', done.length)}
          {shown.flatMap(agent => withDrawer(ui, agent, context))}
          {hidden > 0 && <Button key="more-done" plain dimColor label={view.isDoneOpen ? 'daha az' : `+${hidden} daha`} onPress={handlers.onToggleDone} />}
        </Box>
      )}
    </Box>
  )
}
