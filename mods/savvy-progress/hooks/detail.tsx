import type { AgentRun } from '../types'
import { conversationTree } from './conversation'
import { filesTree, historyTree, nowTree } from './detail-work'
import { t } from './i18n'
import { lookOf } from './identity'
import { chipsOf, metricsLine } from './metrics'
import { chipsSvg } from './metrics-svg'
import type { RowContext, Ui } from './rows'

// The open card reads from the top as a conversation (the task, its answers, the follow-ups), the
// field to ask it more and its stop while it runs, then its work: what it does this moment, its
// latest calls, the files it touched, and what it used (time, tokens, ≈$, its 5h share).

// The room a card needs to set the message field and the stop button side by side.
const SIDE_BY_SIDE_PX = 480

function metricsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Svg, Text } = ui
  const facts = { limit: ctx.limit, at: ctx.at }
  const line = metricsLine(a, facts)
  if (!ctx.isDesktop) return <Text dimColor wrap="truncate-end">{line}</Text>
  const width = ctx.inner
  const chips = chipsSvg(width, chipsOf(a, facts))
  return <Svg key="chips" source={chips.source} alt={line} width={width} height={chips.height} />
}

// Any agent can be asked more: a finished one picks the conversation up again. Only a running one
// can be stopped. The desktop sets the field and the stop side by side; the terminal stacks them.
// The field is left out where a surface has none.
function actionsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button, Input } = ui
  const s = t()
  const name = lookOf(a).name
  const isRunning = a.status === 'running'
  const field = Input && (
    <Input key={`send-${a.id}`} label={s.message} placeholder={isRunning ? s.messageTo(name) : s.followUp(name)} value="" submitLabel={s.send} onSubmit={(text: string) => ctx.onSend(a.id, text)} />
  )
  if (!isRunning) return field ? <Box key={`actions-${a.id}`} flexDirection="column">{field}</Box> : null
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
  // An agent that only answered has no work to show: no empty "now" box, no empty history.
  const hasWork = (a.history?.length ?? 0) > 0
  return (
    <Box key={`detail-${a.id}`} flexDirection="column" rowGap={1} marginTop={1}>
      {conversationTree(ui, a, ctx)}
      {actionsTree(ui, a, ctx)}
      {hasWork && nowTree(ui, a, ctx)}
      {hasWork && historyTree(ui, a, ctx)}
      {filesTree(ui, a, ctx)}
      {metricsTree(ui, a, ctx)}
    </Box>
  )
}
