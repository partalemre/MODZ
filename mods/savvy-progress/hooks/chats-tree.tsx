import type { OtherAgent, OtherChat } from '../types'
import { crewedOf, quietOf, waitingOf } from './chats'
import { chatLinesSvg, chatsCardSvg } from './chats-svg'
import type { ChatLine, WaitRow } from './chats-svg'
import { fmtCost } from './format'
import { t } from './i18n'
import { picture } from './pane-motion'
import type { Ui } from './rows'
import { sectionHead } from './sections'
import type { Layout } from './sections'

// The other chats on this machine, in the Agents pane. Those waiting on the person get a card at
// the very top, and only while one waits; the rest wait folded under one row at the foot, there
// only when there are any, so the pane stays calm.

/** The card names this many waiting chats; the rest are "+2 more". */
export const MAX_WAITING_ROWS = 3
const MINUTES_PER_HOUR = 60

/** "3 min", "1 h"; nothing under a minute, so a fresh wait reads "waiting". */
export const spanOf = (minutes: number): string => {
  const s = t()
  if (minutes >= MINUTES_PER_HOUR) return s.hours(Math.floor(minutes / MINUTES_PER_HOUR))
  return minutes >= 1 ? s.minutes(minutes) : ''
}

const rowOf = (chat: OtherChat): WaitRow => ({
  project: chat.project,
  title: chat.title || t().chats.untitled,
  wait: t().chats.waiting(spanOf(chat.minutes)),
})

/** The waiting card, or nothing while no other chat waits. */
export function waitingTree(ui: Ui, chats: OtherChat[], layout: Layout) {
  const { Box, Text } = ui
  const s = t().chats
  const waiting = waitingOf(chats)
  if (!waiting.length) return null
  const rows = waiting.slice(0, MAX_WAITING_ROWS).map(rowOf)
  const rest = waiting.length - rows.length
  const more = rest > 0 ? s.more(rest) : ''
  if (layout.isDesktop) {
    const card = chatsCardSvg(layout.W, { title: s.waitingTitle, rows, more })
    return picture(ui, { key: 'chats-waiting', at: 'chats-waiting', pic: { ...card, width: layout.W } })
  }
  return (
    <Box key="chats-waiting" flexDirection="column">
      <Text bold dimColor>{s.waitingTitle}</Text>
      {rows.map((row, i) => (
        <Text key={`wait-${i}`} wrap="truncate-end"><Text bold>{row.project}</Text><Text dimColor>{` · ${row.title}  `}</Text><Text color="warning">{row.wait}</Text></Text>
      ))}
      {more !== '' && <Text dimColor>{more}</Text>}
    </Box>
  )
}

const linesPicture = (ui: Ui, at: string, lines: ChatLine[], W: number) => {
  const drawn = chatLinesSvg(W, lines)
  return picture(ui, { key: at, at, pic: { source: drawn.source, alt: drawn.alt, width: W, height: drawn.height } })
}

const chatLine = (chat: OtherChat): ChatLine => ({
  kind: 'chat',
  lead: chat.project,
  text: chat.title || t().chats.untitled,
  end: chat.state === 'working' ? spanOf(chat.minutes) : t().chats.states.idle,
  isLive: chat.state === 'working',
})

const agentChatLine = (agent: OtherAgent): ChatLine => ({
  kind: 'agent',
  lead: agent.name,
  text: agent.title,
  end: [spanOf(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ''].filter(Boolean).join(' · '),
  isLive: true,
})

const agentLine = (agent: OtherAgent): string =>
  [agent.name, agent.title, spanOf(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ''].filter(Boolean).join(' · ')

/** The agents running in the other chats, under their chat; nothing when none. Read-only: each answers to its own session. */
export function crewTree(ui: Ui, chats: OtherChat[], layout: Layout) {
  const { Box, Text } = ui
  const s = t().chats
  const crewed = crewedOf(chats)
  if (!crewed.length) return null
  const count = crewed.reduce((sum, chat) => sum + (chat.agents?.length ?? 0), 0)
  return (
    <Box key="chats-crew" flexDirection="column" rowGap={0}>
      {sectionHead(ui, layout, { id: 'chats-crew', label: `${s.agentsTitle} · ${count}` })}
      {layout.isDesktop && linesPicture(ui, 'chats-crew-lines', crewed.flatMap(chat => [chatLine(chat), ...(chat.agents ?? []).map(agentChatLine)]), layout.W)}
      {!layout.isDesktop && crewed.map(chat => (
        <Box key={`crew-${chat.id}`} flexDirection="column">
          <Text wrap="truncate-end"><Text bold>{chat.project}</Text><Text dimColor>{` · ${chat.title || s.untitled}`}</Text></Text>
          {chat.agents?.map(agent => <Text key={`crew-${chat.id}-${agent.id}`} dimColor wrap="truncate-end">{`  ${agentLine(agent)}`}</Text>)}
        </Box>
      ))}
    </Box>
  )
}

export type QuietView = { chats: OtherChat[]; layout: Layout; isOpen: boolean; onToggle: () => void }

/**
 * The working and idle chats under "Other chats · 2"; nothing when none. The working ones always show, as the desktop
 * hands work to side sessions rather than agents; the idle ones stay folded until the person opens the row.
 */
export function quietTree(ui: Ui, view: QuietView) {
  const { Box, Text } = ui
  const s = t().chats
  // A chat with agents already stands above, with them.
  const quiet = quietOf(view.chats).filter(chat => !chat.agents?.length)
  if (!quiet.length) return null
  const shown = view.isOpen ? quiet : quiet.filter(chat => chat.state === 'working')
  const head = sectionHead(ui, view.layout, { id: 'chats', label: `${s.title} · ${quiet.length}`, toggle: { key: 'chats', isOpen: view.isOpen, onPress: view.onToggle } })
  return (
    <Box key="chats-quiet" flexDirection="column" rowGap={0}>
      {head}
      {view.layout.isDesktop && shown.length > 0 && linesPicture(ui, 'chats-quiet-lines', shown.map(chatLine), view.layout.W)}
      {!view.layout.isDesktop && shown.map(chat => (
        <Text key={`chat-${chat.id}`} wrap="truncate-end"><Text bold>{chat.project}</Text><Text dimColor>{` · ${chat.title || s.untitled} · ${s.states[chat.state === 'working' ? 'working' : 'idle']}`}</Text></Text>
      ))}
    </Box>
  )
}
