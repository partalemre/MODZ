import type { ThemeKey } from 'claude-code'

import type { AgentRun } from '../types'
import { filesTree, historyTree, nowTree } from './detail-work'
import { clip } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { chipsOf, metricsLine } from './metrics'
import { chipsSvg } from './metrics-svg'
import type { RowContext, Ui } from './rows'

// The open card answers "what is it doing" from the top: the task it was handed, what it does this
// moment, its latest calls, the files it touched, what it used (time, tokens, ≈$, its 5h share),
// its answer once it ended, then a message to it and its stop while it runs.

const BRIEF_SHOWN = 280
const ANSWER_SHOWN = 900
// The room a card needs to set the message field and the stop button side by side.
const SIDE_BY_SIDE_PX = 480

// The task cut short, with a button to read it whole; a short one needs neither.
function briefTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button, Text } = ui
  if (!a.brief) return null
  const s = t()
  const isLong = a.brief.length > BRIEF_SHOWN
  const isWhole = !isLong || ctx.briefOpen === a.id
  return (
    <Box flexDirection="column">
      <Text bold>{s.brief}</Text>
      <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1}>
        <Text>{isWhole ? a.brief : clip(a.brief, BRIEF_SHOWN)}</Text>
      </Box>
      {isLong && (
        <Box flexDirection="row" justifyContent="flex-end">
          <Button key={`brief-${a.id}`} plain dimColor label={isWhole ? s.showLess : s.showAll} onPress={() => ctx.onBrief(a.id)} />
        </Box>
      )}
    </Box>
  )
}

function resultTree(ui: Ui, a: AgentRun) {
  const { Box, Text } = ui
  if (a.status === 'running') return null
  const s = t()
  const isDone = a.status === 'done'
  const key: ThemeKey = isDone ? 'success' : 'error'
  return (
    <Box flexDirection="column">
      <Text bold>{s.result}</Text>
      <Box flexDirection="column" borderStyle="round" borderColor={key} paddingX={1}>
        <Text bold color={key}>{isDone ? s.cheerDone : s.cheerFailed}</Text>
        {a.answer ? <Text>{clip(a.answer, ANSWER_SHOWN)}</Text> : null}
      </Box>
    </Box>
  )
}

function metricsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Svg, Text } = ui
  const facts = { limit: ctx.limit, at: ctx.at }
  const line = metricsLine(a, facts)
  if (!ctx.isDesktop) return <Text dimColor wrap="truncate-end">{line}</Text>
  const width = ctx.inner
  const chips = chipsSvg(width, chipsOf(a, facts))
  return <Svg key="chips" source={chips.source} alt={line} width={width} height={chips.height} />
}

// Only a running agent can be spoken to or stopped. The desktop sets the field and the stop side by
// side; the terminal stacks them. The field is left out where a surface has none.
function actionsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button, Input } = ui
  if (a.status !== 'running') return null
  const s = t()
  const name = lookOf(a).name
  const field = Input && (
    <Input key={`send-${a.id}`} label={s.message} placeholder={s.messageTo(name)} value="" submitLabel={s.send} onSubmit={(text: string) => ctx.onSend(a.id, text)} />
  )
  const stop = <Button key={`stop-${a.id}`} variant="secondary" label={s.stopWho(name)} onPress={() => ctx.onStop(a.id)} />
  // A narrow card stacks them, so neither the field nor the button has to wrap.
  if (!ctx.isDesktop || ctx.inner < SIDE_BY_SIDE_PX) {
    return (
      <Box key={`actions-${a.id}`} flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
        {field}
        <Box flexDirection="row" justifyContent={ctx.isDesktop ? 'flex-end' : 'flex-start'}>{stop}</Box>
      </Box>
    )
  }
  return (
    <Box key={`actions-${a.id}`} flexDirection="row" alignItems="center" columnGap={1}>
      {field && <Box flexDirection="column" flexGrow={1} flexShrink={1}>{field}</Box>}
      {stop}
    </Box>
  )
}

export function detailTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  return (
    <Box key={`detail-${a.id}`} flexDirection="column" rowGap={1} marginTop={1}>
      {briefTree(ui, a, ctx)}
      {nowTree(ui, a, ctx)}
      {historyTree(ui, a, ctx)}
      {filesTree(ui, a, ctx)}
      {metricsTree(ui, a, ctx)}
      {resultTree(ui, a)}
      {actionsTree(ui, a, ctx)}
    </Box>
  )
}
