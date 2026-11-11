// The plain-words line in the conversation: under each tool call's row, one sentence that says what the call does
// in words anyone follows ("↳ Modun testlerini çalıştırıyor" under `Bash cd … && claude plugin test …`). The
// sentence is worked out by rules from the call's own input (kit/plain.ts): no model call, no tokens, and the
// engine's row stays as it is, with the line beneath it.
import type { Register, RenderElement } from 'claude-code'

import { lang, pick } from './kit/lang'
import { plainCall } from './kit/plain'

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]
type Ui = Record<string, any>

/** One call as a row or a group hands it over. */
export type ToldCall = { tool: string; input: unknown; isErrored?: boolean; isInterrupted?: boolean }

// How many sentences a folded run of calls shows before it counts the rest.
const GROUP_LINES = 4
const MARK = '↳'

// Calls that only keep the app's own displays current (the task list, a progress bar): nothing to tell a person.
const HOUSEKEEPING = /^mcp__(ccd_|savvy-progress__)/

const WORDS = {
  en: { failed: 'did not work', interrupted: 'stopped halfway', more: (n: number) => `+${n} more ${n === 1 ? 'step' : 'steps'}` },
  tr: { failed: 'başarısız oldu', interrupted: 'yarıda kesildi', more: (n: number) => `+${n} adım daha` },
}

export const isTold = (tool: string): boolean => !HOUSEKEEPING.test(tool)

/** The call's sentence, with how it ended when it ended badly: "Testleri çalıştırıyor · başarısız oldu". */
export function lineOf(call: ToldCall): string {
  const words = pick(WORDS)
  const said = plainCall(call.tool, call.input, lang())
  if (call.isInterrupted === true) return `${said} · ${words.interrupted}`

  return call.isErrored === true ? `${said} · ${words.failed}` : said
}

/** A folded run's sentences in the order the calls were made, each said once; then how many more there are. */
export function groupLines(calls: readonly ToldCall[]): string[] {
  const said = calls.filter(call => isTold(call.tool)).map(lineOf)
  const unique = said.filter((line, i) => said.indexOf(line) === i)
  const more = unique.length - GROUP_LINES

  return more > 0 ? [...unique.slice(0, GROUP_LINES), pick(WORDS).more(more)] : unique
}

// The row (or whatever a mod beneath drew) with the sentences under it, quiet so the row still leads.
function withLines(ui: Ui, row: RenderElement, lines: string[]): RenderElement {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column">
      {row}
      {lines.map((line, i) => <Text key={`plain-${i}`} dimColor wrap="truncate-end">{`${MARK} ${line}`}</Text>)}
    </Box>
  )
}

export function wirePlainRows(on: On, options: Options): void {
  if (options.plainWords === false) return

  // A hook that fails costs its line, never the row: the engine's own drawing stands.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const row = await next(e)

    return isTold(e.props.tool) ? withLines($.ui.resolve(e) as Ui, row, [lineOf(e.props)]) : row
  }).catch(($, e, next) => next(e))

  // A run folded into one line tells its steps under it; unfolded, each row tells its own.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const row = await next(e)
    const lines = e.props.isExpanded ? [] : groupLines(e.props.calls)

    return lines.length === 0 ? row : withLines($.ui.resolve(e) as Ui, row, lines)
  }).catch(($, e, next) => next(e))
}
