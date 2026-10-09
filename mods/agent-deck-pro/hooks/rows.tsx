import { compact, costText, elapsedText, shortModel, shortText, spinnerAt } from './format'
import { phaseDots, phaseName, stepOf } from './work'
import { colorOf, faceOf, flagOf, identityOf, moodOf } from './insight'
import type { Mood } from './insight'
import { isLive, isRunning } from './roster'
import type { DeckAgent, DeckDrawer, DeckLine, DeckTab, DeckType, DeckUi } from '../types'

export type DeckView = DeckUi & {
  agents: DeckAgent[]
  types: DeckType[]
  nowMs: number
  columns: number
  theme: 'light' | 'dark' | 'auto'
  surface: string
}

export type DeckHandlers = {
  onTab: (tab: DeckTab) => void
  onSelect: (id: string) => void
  onStop: (id: string) => void
  onType: (value: string) => void
  onSend: (text: string) => void
  onDispatch: (text: string) => void
  onGiveTask: (name: string) => void
  onDrawer: (drawer: DeckDrawer) => void
  onToggleDone: () => void
}

// The resolved element table of the surface that draws the pane.
export type Ui = Record<string, any>

type RowContext = { view: DeckView; handlers: DeckHandlers }

export const ROW_MIN_TEXT = 14
const PROGRESS_WIDTH = 14
const ELAPSED_WIDTH = 9
// Status glyph, face, the gaps and the right-hand columns of a live row.
const LIVE_CHROME = 1 + 5 + PROGRESS_WIDTH + ELAPSED_WIDTH + 5
// The type tag stands beside the title only while the title keeps this much room.
const TITLE_ROOM = 24
const FILES_SHOWN = 3
// Where a row's second line and its card start: under the title, past the glyph and the face.
export const INDENT = 8
const SOURCE_NAMES: Record<string, string> = { 'built-in': 'yerleşik', project: 'proje', user: 'kişisel' }
const STATUS_WORDS: Record<string, string> = { pending: 'sırada', waiting: 'bekliyor', idle: 'boşta, mesaj bekliyor' }

export function sourceName(source: string): string {
  return SOURCE_NAMES[source] ?? source
}

function statusGlyph(mood: Mood, nowMs: number): { glyph: string; color: string } {
  if (mood === 'stuck') return { glyph: '!', color: 'warning' }
  if (mood === 'resting') return { glyph: '○', color: 'suggestion' }
  if (mood === 'hurt') return { glyph: '✕', color: 'error' }
  if (mood === 'happy') return { glyph: '✓', color: 'success' }

  return { glyph: spinnerAt(nowMs), color: 'suggestion' }
}

// The agent is named by its task; its type is only a tag.
export function titleOf(agent: DeckAgent): string {
  return agent.description === '' ? agent.type : agent.description
}

function lastTool(agent: DeckAgent): string {
  return agent.tool === null ? '' : `${agent.tool} ${agent.detail ?? ''}`.trim()
}

// The step it is on by its own list and what it does right now, or what its status says.
export function activityOf(agent: DeckAgent): string {
  const word = STATUS_WORDS[agent.status]
  if (word !== undefined) return word
  const parts = [stepOf(agent)?.current ?? '', lastTool(agent)].filter(part => part !== '')

  return parts.length === 0 ? 'başlıyor' : parts.join(' · ')
}

// Its own task list's step when it keeps one, else the coarse phase its tools show; never a percent.
function progressOf(agent: DeckAgent): { text: string; isStep: boolean } | null {
  const step = stepOf(agent)
  if (step !== null) return { text: `adım ${step.position}/${step.total}`, isStep: true }
  if (agent.phase === null) return null

  return { text: `${phaseDots(agent.phase)} ${phaseName(agent.phase)}`, isStep: false }
}

// Tool calls, files edited and tokens, each only once there is one; cost waits for the card.
export function statsText(agent: DeckAgent): string {
  const parts = [
    agent.steps > 0 ? `${agent.steps} araç` : '',
    agent.files.length > 0 ? `${agent.files.length} dosya` : '',
    agent.tokens > 0 ? `${compact(agent.tokens)} tok` : '',
  ]

  return parts.filter(part => part !== '').join(' · ')
}

function titleTree(ui: Ui, agent: DeckAgent, spec: { view: DeckView; handlers: DeckHandlers; room: number; isDim: boolean }) {
  const { Box, Text, Button } = ui
  const { view, handlers, room, isDim } = spec
  const hasTag = agent.description !== '' && room - agent.type.length - 1 >= TITLE_ROOM
  const width = Math.max(ROW_MIN_TEXT, hasTag ? room - agent.type.length - 1 : room)

  return (
    <Box flexGrow={1} flexDirection="row" columnGap={1}>
      <Button key={`pick-${agent.id}`} plain dimColor={isDim} label={shortText(titleOf(agent), width)} onPress={() => handlers.onSelect(agent.id)} />
      {hasTag && <Text dimColor>{agent.type}</Text>}
    </Box>
  )
}

function progressTree(ui: Ui, agent: DeckAgent) {
  const { Box, Text } = ui
  const progress = progressOf(agent)

  return (
    <Box width={PROGRESS_WIDTH} justifyContent="flex-end">
      {progress !== null && (progress.isStep ? <Text bold>{progress.text}</Text> : <Text>{progress.text}</Text>)}
    </Box>
  )
}

export function liveRow(ui: Ui, agent: DeckAgent, context: RowContext) {
  const { Box, Text } = ui
  const { view, handlers } = context
  const mood = moodOf(agent, view.nowMs)
  const status = statusGlyph(mood, view.nowMs)
  const flag = flagOf(agent, view.nowMs)
  const stats = statsText(agent)
  const room = view.columns - LIVE_CHROME

  return (
    <Box key={`row-${agent.id}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text color={status.color}>{status.glyph}</Text>
        <Text color={colorOf(identityOf(agent))}>{faceOf(identityOf(agent), mood)}</Text>
        {titleTree(ui, agent, { view, handlers, room, isDim: false })}
        {progressTree(ui, agent)}
        <Box width={ELAPSED_WIDTH} justifyContent="flex-end"><Text dimColor>{elapsedText((agent.endedAt ?? view.nowMs) - agent.startedAt)}</Text></Box>
      </Box>
      <Box flexDirection="row" columnGap={1} paddingLeft={INDENT}>
        <Box flexGrow={1}><Text dimColor wrap="truncate">{`› ${activityOf(agent)}`}</Text></Box>
        {flag !== null && <Text color={flag.color}>{flag.text}</Text>}
        {stats !== '' && <Text dimColor>{stats}</Text>}
      </Box>
    </Box>
  )
}

export function doneRow(ui: Ui, agent: DeckAgent, context: RowContext) {
  const { Box, Text } = ui
  const { view, handlers } = context
  const mood = moodOf(agent, view.nowMs)
  const status = statusGlyph(mood, view.nowMs)
  const span = (agent.endedAt ?? view.nowMs) - agent.startedAt
  const tail = [span > 0 ? elapsedText(span) : '', statsText(agent)].filter(part => part !== '').join(' · ')
  const room = view.columns - INDENT - tail.length - 1

  return (
    <Box key={`row-${agent.id}`} flexDirection="row" columnGap={1}>
      <Text color={status.color}>{status.glyph}</Text>
      <Text color={colorOf(identityOf(agent))} dimColor>{faceOf(identityOf(agent), mood)}</Text>
      {titleTree(ui, agent, { view, handlers, room, isDim: agent.id !== view.selected })}
      <Text dimColor>{tail}</Text>
    </Box>
  )
}

export function lineTree(ui: Ui, line: DeckLine, width: number) {
  const { Text } = ui
  if (line.kind === 'task') return <Text bold wrap="truncate">{shortText(`› ${line.text}`, width)}</Text>
  if (line.kind === 'tool') return <Text dimColor wrap="truncate">{shortText(`  ${line.text}`, width)}</Text>

  return <Text wrap="truncate">{shortText(line.text, width)}</Text>
}

function drawerTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Text, Input } = ui
  const width = Math.max(ROW_MIN_TEXT, view.columns - INDENT)
  if (view.drawer === 'message') {
    return <Input key="send" label="Mesaj" placeholder="Bu ajana bir şey söyle, Enter gönderir" value="" submitLabel="gönder" autoFocus onSubmit={handlers.onSend} />
  }
  if (view.drawer !== 'log') return null
  if (view.lines.length === 0) return <Text dimColor>Döküm henüz boş.</Text>

  return view.lines.map(line => lineTree(ui, line, width))
}

export function metaText(agent: DeckAgent): string {
  const parts = [agent.type, shortModel(agent.model), agent.effort ?? '', agent.costUsd > 0 ? costText(agent.costUsd) : '']

  return parts.filter(part => part !== '').join(' · ')
}

export function filesText(agent: DeckAgent): string {
  const names = agent.files.slice(-FILES_SHOWN).map(path => path.split('/').pop() ?? path)
  const more = agent.files.length - names.length

  return `dosyalar: ${names.join(', ')}${more > 0 ? ` +${more}` : ''}`
}

// The selected agent's card, under its row: what it ran on, its answer, and the actions behind buttons.
export function cardTree(ui: Ui, agent: DeckAgent, context: RowContext) {
  const { Box, Text, Button } = ui
  const { view, handlers } = context
  const width = Math.max(ROW_MIN_TEXT, view.columns - INDENT)
  const meta = metaText(agent)
  const toggle = (drawer: DeckDrawer) => handlers.onDrawer(view.drawer === drawer ? 'none' : drawer)

  return (
    <Box key={`card-${agent.id}`} flexDirection="column" paddingLeft={INDENT}>
      {meta !== '' && <Text dimColor wrap="truncate">{meta}</Text>}
      {agent.files.length > 0 && <Text dimColor wrap="truncate">{filesText(agent)}</Text>}
      {!isLive(agent) && agent.answer !== null && agent.answer !== '' && <Text wrap="truncate">{shortText(agent.answer, width)}</Text>}
      <Box flexDirection="row" columnGap={1} flexWrap="wrap">
        <Button key={`log-${agent.id}`} variant="secondary" label={view.drawer === 'log' ? 'Dökümü kapat' : 'Döküm'} onPress={() => toggle('log')} />
        {isLive(agent) && <Button key={`msg-${agent.id}`} variant="secondary" label="Mesaj" onPress={() => toggle('message')} />}
        {isRunning(agent) && <Button key={`stop-${agent.id}`} variant="secondary" label="Durdur" onPress={() => handlers.onStop(agent.id)} />}
        <Button key={`again-${agent.id}`} variant="secondary" label="Yeni görev" onPress={() => handlers.onGiveTask(agent.type)} />
      </Box>
      {drawerTree(ui, view, handlers)}
    </Box>
  )
}

export function teamTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Button } = ui
  const rank = (type: DeckType) => Number(type.source === 'built-in')
  const types = [...view.types].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
  const width = Math.max(ROW_MIN_TEXT, view.columns - INDENT - ROW_MIN_TEXT)

  return (
    <Box flexDirection="column">
      <Text dimColor>{`Ekip · görev verebileceğin ${types.length} ajan`}</Text>
      {types.map(type => (
        <Box key={`team-${type.name}`} flexDirection="row" columnGap={1}>
          <Text color={colorOf(type.name)}>{faceOf(type.name)}</Text>
          <Text bold>{type.name}</Text>
          <Box flexGrow={1}>
            <Text dimColor wrap="truncate">{shortText(type.description === '' ? sourceName(type.source) : type.description, Math.max(ROW_MIN_TEXT, width - type.name.length))}</Text>
          </Box>
          <Button key={`give-${type.name}`} plain label="Görev ver" onPress={() => handlers.onGiveTask(type.name)} />
        </Box>
      ))}
    </Box>
  )
}
