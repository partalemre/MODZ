import { compact, countsOf, elapsedText, isFailed, isRunning, shortText, spinnerAt } from './roster'
import { timelineSvg } from './timeline'
import type { DeckAgent, DeckLine, DeckTab, DeckType } from '../types'

export type DeckView = {
  agents: DeckAgent[]
  types: DeckType[]
  selected: string | null
  tab: DeckTab
  lines: DeckLine[]
  notice: string | null
  draftType: string
  nowMs: number
  columns: number
  theme: 'light' | 'dark' | 'auto'
  surface: string
}

export type DeckHandlers = {
  onTab: (tab: DeckTab) => void
  onSelect: (id: string) => void
  onType: (value: string) => void
  onSend: (text: string) => void
  onDispatch: (text: string) => void
  onGiveTask: (name: string) => void
}

// The resolved element table of the surface that draws the pane.
export type Ui = Record<string, any>

const GREEN = '#34d399'
const SKY = '#38bdf8'
const RED = '#f87171'
const AMBER = '#fbbf24'
const MUTED = '#94a3b8'
const TYPE_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15', '#22d3ee', '#f87171']
const BUILTIN_SOURCE = 'built-in'
const ROWS_MAX = 8
const CELL_PIXELS = 7.6
const SVG_MAX_WIDTH = 760
const ROW_CHROME = 22
const ROW_MIN_TEXT = 14
const HASH_MULTIPLIER = 31
const ACTIVITY_INDENT = '    '

function colorOfType(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * HASH_MULTIPLIER + char.charCodeAt(0)) % TYPE_COLORS.length

  return TYPE_COLORS[hash]
}

function statusOf(agent: DeckAgent, nowMs: number): { glyph: string; color: string } {
  if (isRunning(agent)) return { glyph: spinnerAt(nowMs), color: GREEN }
  if (isFailed(agent)) return { glyph: '✕', color: RED }

  return { glyph: '✓', color: SKY }
}

function activityOf(agent: DeckAgent, width: number): string {
  if (isRunning(agent)) {
    const doing = agent.tool === null ? 'starting…' : `${agent.tool} ${agent.detail ?? ''}`.trim()

    return shortText(`${ACTIVITY_INDENT}↳ ${doing} · ${compact(agent.tokens)} tok`, width)
  }
  const result = agent.answer === null || agent.answer === '' ? agent.status : agent.answer

  return shortText(`${ACTIVITY_INDENT}${result}`, width)
}

function orderedAgents(agents: DeckAgent[]): DeckAgent[] {
  return [...agents].sort((a, b) => Number(isRunning(b)) - Number(isRunning(a)) || b.startedAt - a.startedAt)
}

function orderedTypes(types: DeckType[]): DeckType[] {
  const rank = (type: DeckType) => Number(type.source === BUILTIN_SOURCE)

  return [...types].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

function headerTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const counts = countsOf(view.agents)
  const idle = counts.running + counts.done + counts.failed === 0
  const tab = (key: DeckTab, label: string, hotkey: string) => (
    <Button key={`tab-${key}`} plain hotkey={hotkey} label={label} dimColor={view.tab !== key} onPress={() => handlers.onTab(key)} />
  )

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" columnGap={2}>
        {counts.running > 0 && <Text bold color={GREEN}>{`${spinnerAt(view.nowMs)} ${counts.running} running`}</Text>}
        {counts.done > 0 && <Text color={SKY}>{`✓ ${counts.done} done`}</Text>}
        {counts.failed > 0 && <Text color={RED}>{`✕ ${counts.failed} failed`}</Text>}
        {idle && <Text dimColor>All quiet. No agent has run in this session yet.</Text>}
      </Box>
      <Box flexDirection="row" columnGap={3}>
        {tab('crew', 'Overview', '1')}
        {tab('dispatch', 'Dispatch', '2')}
      </Box>
    </Box>
  )
}

function timelineTree(ui: Ui, view: DeckView) {
  const { Svg } = ui
  if (view.surface !== 'desktop') return null
  const width = Math.min(SVG_MAX_WIDTH, Math.floor(view.columns * CELL_PIXELS))
  const drawing = timelineSvg({ width, agents: view.agents, nowMs: view.nowMs, selected: view.selected, theme: view.theme })
  if (drawing === null) return null

  return <Svg source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} />
}

function agentRow(ui: Ui, agent: DeckAgent, context: { view: DeckView; handlers: DeckHandlers }) {
  const { Box, Text, Button } = ui
  const { view, handlers } = context
  const { glyph, color } = statusOf(agent, view.nowMs)
  const width = Math.max(ROW_MIN_TEXT, view.columns - ROW_CHROME)
  const title = agent.description === '' ? agent.type : `${agent.type} · ${agent.description}`
  const end = agent.endedAt ?? view.nowMs

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text color={color}>{glyph}</Text>
        <Button key={`pick-${agent.id}`} plain label={shortText(title, width)} dimColor={agent.id !== view.selected} onPress={() => handlers.onSelect(agent.id)} />
        <Text dimColor>{elapsedText(end - agent.startedAt)}</Text>
      </Box>
      <Text dimColor wrap="truncate">{activityOf(agent, view.columns - 2)}</Text>
    </Box>
  )
}

function lineTree(ui: Ui, line: DeckLine, width: number) {
  const { Text } = ui
  if (line.kind === 'task') return <Text color={AMBER} wrap="truncate">{shortText(`▸ ${line.text}`, width)}</Text>
  if (line.kind === 'tool') return <Text dimColor wrap="truncate">{shortText(`⚙ ${line.text}`, width)}</Text>

  return <Text wrap="truncate">{shortText(line.text, width)}</Text>
}

function detailTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Input } = ui
  const agent = view.agents.find(entry => entry.id === view.selected)
  if (agent === undefined) return null
  const width = Math.max(ROW_MIN_TEXT, view.columns - 6)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={MUTED} paddingX={1}>
      <Text bold>{`${agent.type}  ·  ${agent.status}`}</Text>
      {view.lines.length === 0 && <Text dimColor>No transcript yet.</Text>}
      {view.lines.map(line => lineTree(ui, line, width))}
      {isRunning(agent) && (
        <Input key="send" label="Message" placeholder="Tell this agent something" value="" submitLabel="send" onSubmit={handlers.onSend} />
      )}
    </Box>
  )
}

function teamTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const types = orderedTypes(view.types)
  const width = Math.max(ROW_MIN_TEXT, view.columns - 4)

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text dimColor>{`TEAM · ${types.length} agents you can hand work to`}</Text>
      {types.map(type => (
        <Box flexDirection="column">
          <Box flexDirection="row" columnGap={1}>
            <Text color={colorOfType(type.name)}>●</Text>
            <Text bold>{type.name}</Text>
            <Text dimColor>{type.source}</Text>
            <Button key={`give-${type.name}`} label="Give task" variant="secondary" onPress={() => handlers.onGiveTask(type.name)} />
          </Box>
          <Text dimColor wrap="truncate">{`  ${shortText(type.description === '' ? 'No description.' : type.description, width)}`}</Text>
        </Box>
      ))}
    </Box>
  )
}

function overviewTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text } = ui
  const rows = orderedAgents(view.agents)
  const hidden = rows.length - ROWS_MAX

  return (
    <Box flexDirection="column" rowGap={1}>
      {timelineTree(ui, view)}
      {rows.length > 0 && (
        <Box flexDirection="column">
          {rows.slice(0, ROWS_MAX).map(agent => agentRow(ui, agent, { view, handlers }))}
          {hidden > 0 && <Text dimColor>{`+${hidden} older`}</Text>}
        </Box>
      )}
      {detailTree(ui, view, handlers)}
      {teamTree(ui, view, handlers)}
    </Box>
  )
}

function dispatchTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Select, Input } = ui
  const chosen = view.types.find(type => type.name === view.draftType) ?? view.types[0]
  const options = view.types.map(type => ({ value: type.name, label: type.name }))

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={1}>
        <Text color={colorOfType(chosen.name)}>●</Text>
        <Text bold>{chosen.name}</Text>
        <Text dimColor>{chosen.source}</Text>
      </Box>
      <Text dimColor wrap="truncate">{shortText(chosen.description === '' ? 'No description.' : chosen.description, view.columns - 4)}</Text>
      <Select key="type" label="Agent" options={options} value={chosen.name} onSelect={handlers.onType} />
      <Input key="task" label="Task" placeholder="Describe the work, Enter to dispatch" value="" submitLabel="dispatch" autoFocus onSubmit={handlers.onDispatch} />
      {view.notice !== null && <Text color={AMBER}>{view.notice}</Text>}
    </Box>
  )
}

export function deckTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      {headerTree(ui, view, handlers)}
      {view.tab === 'crew' ? overviewTree(ui, view, handlers) : dispatchTree(ui, view, handlers)}
    </Box>
  )
}
