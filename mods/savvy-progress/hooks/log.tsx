import type { AgentRun, ToolEvent } from '../types'
import { KIND_GLYPH, kindOf } from './history'
import { t } from './i18n'
import type { RowContext, Ui } from './rows'

// An agent's whole work as a log a person can follow step by step: when each step was made, what it was for in
// the agent's own words, why it was made (the sentence the agent wrote before it), what it is in plain words, the
// tool and the file behind it (pressed open), and how it came back. Opened from the card; the card's short list
// of latest steps stands in its place until then.

const pad = (n: number): string => String(n).padStart(2, '0')

/** "14:03:27", the wall-clock time a step was made. */
export const timeOf = (at: number): string => {
  const date = new Date(at)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const nameOf = (path: string): string => path.split('/').filter(Boolean).at(-1) ?? path

const hrefOf = (path: string): string => `file://${encodeURI(path)}`

const linkOf = (path: string): string => `[${nameOf(path).replace(/([\\`*_[\]<>])/g, '\\$1')}](<${hrefOf(path)}>)`

/** The files as one line of links, each opening its file: "a.ts · b.md". Absolute paths only: a link needs one. */
export const filesMarkdown = (paths: string[]): string => paths.filter(path => path.startsWith('/')).map(linkOf).join(' · ')

/**
 * The file a step is about, as a link that opens it: one line of markdown, since the desktop is sent a link to a
 * file only inside markdown (a `Link` to one is drawn there as plain text). Null when the step names no file.
 */
export function fileLink(ui: Ui, e: ToolEvent, key: string) {
  const { Markdown } = ui
  if (!e.path || !Markdown) return null
  return <Markdown key={key} text={linkOf(e.path)} />
}

const endOf = (e: ToolEvent, isLive: boolean): string => {
  if (e.endAt !== undefined) return e.isError ? `✗ ${t().failedNow}` : '✓'
  return isLive ? '…' : '—'
}

type LogContext = { isLive: boolean; index: number; prev?: ToolEvent }

function stepTree(ui: Ui, e: ToolEvent, ctx: LogContext) {
  const { Box, Text } = ui
  const said = e.why ?? e.plain ?? e.tool
  // A reason the agent gave for several calls at once is said once, above the first of them.
  const because = e.because && e.because !== ctx.prev?.because ? e.because : undefined
  const isFailed = e.endAt !== undefined && e.isError === true
  return (
    <Box key={`log-${ctx.index}`} flexDirection="column">
      {because ? <Text wrap="wrap"><Text bold>{`${t().because}: `}</Text><Text>{because}</Text></Text> : null}
      <Box flexDirection="row" columnGap={1}>
        <Box flexShrink={0}><Text dimColor>{timeOf(e.at)}</Text></Box>
        <Box flexShrink={0}><Text dimColor>{KIND_GLYPH[kindOf(e.tool)]}</Text></Box>
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text wrap="wrap">{said}</Text>
          <Text dimColor wrap="wrap">{[e.why && e.plain ? e.plain : '', `${e.tool}${e.path ? '' : ` ${e.target}`}`.trim()].filter(Boolean).join(' · ')}</Text>
          {fileLink(ui, e, `log-file-${ctx.index}`)}
        </Box>
        <Box flexShrink={0}><Text color={isFailed ? 'error' : 'subtle'}>{endOf(e, ctx.isLive)}</Text></Box>
      </Box>
    </Box>
  )
}

/** Every step the agent made, the oldest first. */
export function logTree(ui: Ui, a: AgentRun) {
  const { Box } = ui
  const list = a.history ?? []
  const isLive = a.status === 'running'
  return (
    <Box flexDirection="column" rowGap={1}>
      {list.map((e, index) => stepTree(ui, e, { isLive, index, prev: list[index - 1] }))}
    </Box>
  )
}

/** The press that opens the whole log, or folds it back to the latest steps. */
export function logButton(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button } = ui
  const s = t()
  const label = ctx.logOpen === a.id ? s.logClose : s.logOpen(a.history?.length ?? 0)
  return (
    <Box flexDirection="row">
      <Button key={`log-${a.id}`} variant="secondary" label={label} onPress={() => ctx.onLog(a.id)} />
    </Box>
  )
}
