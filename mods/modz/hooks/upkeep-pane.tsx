// The hub's two side panes as plain lines on both surfaces, so a name or a line can be selected and copied:
// Connections (links.ts) and Dead weight (weight.ts), each under the way back to the hub.
import type { Links, Weight, Weights } from '../types'
import { withHome } from './kit/home'
import { linkName } from './links'
import { idleDays, IDLE_DAYS } from './weight'
import { linkWords, weightWords } from './upkeep-words'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

// `links` is null until the first look.
export type LinksView = { links: Links | null; onHome: () => void; onCheck: () => void }

// One state's servers under its word and count; the word says the state, the color only repeats it.
function group(ui: Ui, look: { key: string; title: string; color?: string; note?: string }, lines: string[]) {
  const { Box, Text } = ui
  if (lines.length === 0) return null

  return (
    <Box key={look.key} flexDirection="column">
      <Text bold color={look.color}>{`${look.title} · ${lines.length}`}</Text>
      {look.note === undefined ? null : <Text dimColor>{look.note}</Text>}
      {lines.map(line => <Text key={`${look.key}-${line}`} wrap="truncate">{line}</Text>)}
    </Box>
  )
}

function linksBody(ui: Ui, links: Links) {
  const { Text } = ui
  const say = linkWords()
  const failed = links.failed.map(one => (one.error === '' ? linkName(one.name) : `${linkName(one.name)}: ${one.error}`))
  const groups = [
    group(ui, { key: 'failed', title: say.failed, color: 'error', note: say.failedNote }, failed),
    group(ui, { key: 'pending', title: say.pending }, links.pending.map(linkName)),
    group(ui, { key: 'waiting', title: say.waiting, color: 'warning', note: say.waitingNote }, links.waiting.map(linkName)),
    group(ui, { key: 'connected', title: say.connected, color: 'success' }, links.connected.map(linkName)),
  ].filter(one => one !== null)

  return groups.length === 0 ? [<Text key="none">{say.none}</Text>] : groups
}

export function linksTree(ui: Ui, view: LinksView) {
  const { Box, Button, Text } = ui
  const say = linkWords()

  return withHome(ui, (
    <Box flexDirection="column" rowGap={1}>
      <Text dimColor>{say.lead}</Text>
      {(view.links === null ? [<Text key="unread">{say.unread}</Text>] : linksBody(ui, view.links))}
      <Box flexDirection="row" marginLeft={-1}>
        <Button key="links-check" label={say.check} plain onPress={view.onCheck} />
      </Box>
    </Box>
  ), view.onHome)
}

// `weights` is null until the first measure.
export type WeightView = { weights: Weights | null; now: number; onHome: () => void; onCopy: (text: string, press: unknown) => unknown }

const MAX_ITEMS = 30

function weightRow(ui: Ui, view: WeightView, item: Weight) {
  const { Box, Button, Text } = ui
  const say = weightWords()
  const key = `weight-${item.kind}-${item.name}`
  const kind = item.kind === 'plugin' ? `${say.kinds.plugin} · ${say.skills(item.skills)}` : say.kinds.skill
  const idle = item.lastUsedAt === null ? say.never : say.idle(idleDays(item.lastUsedAt, view.now))
  const { disable } = item

  return (
    <Box key={key} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold>{item.name}</Text>
        <Text dimColor>{kind}</Text>
        <Box flexGrow={1} />
        <Text>{say.tokens(item.tokens)}</Text>
      </Box>
      <Text dimColor>{idle}</Text>
      {disable === null ? null : (
        <Box flexDirection="row" columnGap={1} alignItems="center">
          <Button key={`${key}-copy`} label={say.copy} variant="secondary" onPress={(press: unknown) => view.onCopy(disable, press)} />
          <Text>{disable}</Text>
        </Box>
      )}
    </Box>
  )
}

function weightBody(ui: Ui, view: WeightView) {
  const { Text } = ui
  const say = weightWords()
  const { weights } = view
  if (weights === null) return [<Text key="unread">{say.unread}</Text>]
  if (weights.items.length === 0) return [<Text key="none">{say.none}</Text>]
  const more = weights.items.length - MAX_ITEMS

  return [
    <Text key="total">{say.total(weights.tokens)}</Text>,
    ...weights.items.slice(0, MAX_ITEMS).map(item => weightRow(ui, view, item)),
    ...(more > 0 ? [<Text key="more" dimColor>{say.more(more)}</Text>] : []),
    <Text key="how" dimColor>{say.how}</Text>,
  ]
}

export function weightTree(ui: Ui, view: WeightView) {
  const { Box, Text } = ui

  return withHome(ui, (
    <Box flexDirection="column" rowGap={1}>
      <Text dimColor>{weightWords().lead(IDLE_DAYS)}</Text>
      {weightBody(ui, view)}
    </Box>
  ), view.onHome)
}
