import type { AgentRun, ThreadTurn } from '../types'
import { clip } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import type { RowContext, Ui } from './rows'

// The open card reads as a conversation: the task or question it was handed, each answer under
// it and each follow-up sent from the card, then a line saying it is on it while it works.

const BRIEF_SHOWN = 280
const ANSWER_SHOWN = 900

type Said = { key: string; who: string; text: string }

// Every turn in one quiet frame: who said it is the name above, not a colour.
function saidTree(ui: Ui, said: Said) {
  const { Box, Text } = ui
  return (
    <Box key={said.key} flexDirection="column">
      <Text bold>{said.who}</Text>
      <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
        <Text>{said.text}</Text>
      </Box>
    </Box>
  )
}

// The task cut short, with a button to read it whole; a short one needs neither.
function briefTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button } = ui
  if (!a.brief) return null
  const s = t()
  const isLong = a.brief.length > BRIEF_SHOWN
  const isWhole = !isLong || ctx.briefOpen === a.id
  const text = isWhole ? a.brief : clip(a.brief, BRIEF_SHOWN)
  return (
    <Box key={`brief-box-${a.id}`} flexDirection="column">
      {saidTree(ui, { key: 'asked', who: a.isAsked ? s.you : s.brief, text })}
      {isLong && (
        <Box flexDirection="row" justifyContent="flex-end">
          <Button key={`brief-${a.id}`} plain dimColor label={isWhole ? s.showLess : s.showAll} onPress={() => ctx.onBrief(a.id)} />
        </Box>
      )}
    </Box>
  )
}

// A run kept from before the card held a conversation still shows its answer.
const turnsOf = (a: AgentRun): ThreadTurn[] =>
  a.thread ?? (a.answer && a.status === 'done' ? [{ from: 'agent', text: a.answer, at: a.endedAt ?? a.startedAt }] : [])

const turnTree = (ui: Ui, a: AgentRun, turn: ThreadTurn, i: number) =>
  turn.from === 'you'
    ? saidTree(ui, { key: `turn-${i}`, who: t().you, text: turn.text })
    : saidTree(ui, { key: `turn-${i}`, who: lookOf(a).name, text: clip(turn.text, ANSWER_SHOWN) })

// It is on it while it runs, and after a follow-up the engine has not picked up yet.
const isAwaited = (a: AgentRun, turns: ThreadTurn[]): boolean =>
  a.status === 'running' || (a.status === 'done' && turns.at(-1)?.from === 'you')

function tailTree(ui: Ui, a: AgentRun, turns: ThreadTurn[]) {
  const { Text } = ui
  const s = t()
  if (isAwaited(a, turns)) return <Text color="claude">{`● ${s.answering(lookOf(a).name)}`}</Text>
  if (a.status !== 'failed') return null
  return <Text color="error">{`${s.cheerFailed} · ${a.endReason === 'aborted' ? s.aborted : s.failedNow}`}</Text>
}

export function conversationTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  const turns = turnsOf(a)
  return (
    <Box key={`talk-${a.id}`} flexDirection="column" rowGap={1}>
      {briefTree(ui, a, ctx)}
      {turns.map((turn, i) => turnTree(ui, a, turn, i))}
      {tailTree(ui, a, turns)}
    </Box>
  )
}
