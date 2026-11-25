import type { AgentRun } from '../types'
import { t } from './i18n'
import type { RowContext, Ui } from './rows'

// The open card's plain answer to three questions a person asks of a helper: what is it for, where is
// its record kept, and does it learn. Said the same for every helper, with this one's own facts.

// The main conversation's own transcript, `<project>/<session>.jsonl`; set by the classic start hook.
let mainTranscript = ''

export const setMainTranscript = (path: string): void => {
  mainTranscript = path
}

/** Where Claude Code keeps a helper's whole record: `<project>/<session>/subagents/agent-<id>.jsonl`. */
export const agentLogPath = (transcript: string, agentId: string | undefined): string =>
  transcript.endsWith('.jsonl') && agentId ? `${transcript.slice(0, -'.jsonl'.length)}/subagents/agent-${agentId}.jsonl` : ''

const linkOf = (path: string): string => `[${path.split('/').at(-1) ?? path}](<file://${encodeURI(path)}>)`

/** How many files the helper wrote or changed: what outlives it. */
const writtenOf = (a: AgentRun): number => (a.files ?? []).filter(file => file.edits > 0).length

export function aboutTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text, Markdown } = ui
  if (a.isMain === true) return null
  const s = t()
  const step = a.planStep
  const why = step === undefined ? s.aboutForRequest : s.rowPlan(step.at, step.of, step.subject)
  const path = agentLogPath(mainTranscript, a.agentId)
  const line = (label: string, text: string) => (
    <Text wrap="wrap"><Text bold>{`${label}: `}</Text><Text>{text}</Text></Text>
  )
  return (
    <Box key={`about-${a.id}`} flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
      {line(s.aboutWhy, why)}
      <Box flexDirection="column">
        {line(s.aboutLog, s.aboutLogText)}
        {path !== '' && Markdown ? <Markdown key={`about-log-${a.id}`} text={linkOf(path)} /> : null}
      </Box>
      {line(s.aboutLearns, s.aboutLearnsText(writtenOf(a)))}
    </Box>
  )
}
