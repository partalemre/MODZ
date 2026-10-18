import type { OtherChat } from '../types'
import { quietOf, waitingOf } from './chats'
import { chatsCardSvg } from './chats-svg'
import type { WaitRow } from './chats-svg'
import { t } from './i18n'
import { upper } from './lang'
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
      <Text bold color="warning">{`● ${upper(s.waitingTitle)}`}</Text>
      {rows.map((row, i) => (
        <Text key={`wait-${i}`} wrap="truncate-end"><Text bold>{row.project}</Text><Text dimColor>{` · ${row.title}  `}</Text><Text color="warning">{row.wait}</Text></Text>
      ))}
      {more !== '' && <Text dimColor>{more}</Text>}
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
  const quiet = quietOf(view.chats)
  if (!quiet.length) return null
  const shown = view.isOpen ? quiet : quiet.filter(chat => chat.state === 'working')
  const head = sectionHead(ui, view.layout, { id: 'chats', label: `${s.title} · ${quiet.length}`, dot: 'idle', toggle: { key: 'chats', isOpen: view.isOpen, onPress: view.onToggle } })
  return (
    <Box key="chats-quiet" flexDirection="column" rowGap={0}>
      {head}
      {shown.map(chat => (
        <Text key={`chat-${chat.id}`} wrap="truncate-end"><Text bold>{chat.project}</Text><Text dimColor>{` · ${chat.title || s.untitled} · ${s.states[chat.state === 'working' ? 'working' : 'idle']}`}</Text></Text>
      ))}
    </Box>
  )
}
