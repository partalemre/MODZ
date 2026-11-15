import { atom, read } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentRun } from '../types'
import { isNewestWords, isRunning, textKey } from './agents'
import { benchCard, rowCrab } from './row-crab'
import type { RowCrab } from './row-crab'
import { STEP_TOOL, TOOL } from './state'

// The `progress` and `step` calls only feed the band and the panel, which already show what they
// said; their rows ("savvy-progress:progress 2ms") were noise in the transcript. A call that went
// well draws nothing; one that failed or was cut keeps the engine's row, so trouble stays visible.

type On = Parameters<Register>[0]
type Ui = Record<string, any>

const OWN = new Set<string>([TOOL, STEP_TOOL])

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])

const crewRow = atom({ plugin: 'savvy-progress', key: 'crewRow' } as const, '')

/**
 * The agents that stand at some rows of the conversation. One at work follows the conversation: it stands at its
 * newest row (`newest`: a call's id, or the key of the main loop's latest words), so it stays beside what is
 * happening as the conversation grows; with none known, at the
 * row that set it to work (the call that started it, or a message that woke it). One that ended stays where it
 * was set to work.
 */
export function crewAt(list: readonly AgentRun[], rows: readonly string[], newest: string): AgentRun[] {
  const helpers = list.filter(run => run.isMain !== true)
  const isHere = (run: AgentRun): boolean => run.toolUseId !== undefined && rows.includes(run.toolUseId)
  const atWork = helpers.filter(isRunning)
  const following = newest === '' ? atWork.filter(isHere) : rows.includes(newest) ? atWork : []

  return [...following, ...helpers.filter(run => !isRunning(run) && isHere(run))]
}

export const isOwnTool = (tool: string): boolean => OWN.has(tool)

type Call = { tool: string; isErrored: boolean; isInterrupted?: boolean }

export const isQuietCall = (call: Call): boolean => isOwnTool(call.tool) && !call.isErrored && call.isInterrupted !== true

// A drawing of agents (row-crab.ts). A frame, not an image: its crabs answer the pointer.
const framed = (ui: Ui, key: string, pic: RowCrab) => {
  const { Svg } = ui

  return <Svg key={key} source={pic.source} alt={pic.alt} width={pic.width} height={pic.height} isInteractive />
}

// The agents of a row or of a folded run: each one at work gets its card, and those that ended share one short row.
const crewOf = (ui: Ui, workers: readonly AgentRun[]) => {
  const ended = workers.filter(worker => !isRunning(worker))

  return [...workers.filter(isRunning).map(worker => framed(ui, `crab-${worker.id}`, rowCrab(worker))), ...(ended.length === 0 ? [] : [framed(ui, 'crabs-ended', benchCard(ended))])]
}

const nothing = (ui: Ui) => {
  const { Box } = ui
  return <Box />
}

export function onTranscript(on: On): void {
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (isQuietCall(e.props)) return nothing($.ui.resolve(e) as Ui)
    // Only the desktop draws pictures in a row; the engine's row stays, with the agents that stand there beneath it.
    const crew = e.surface === 'desktop' ? crewAt(await read($, agents), [e.props.tool_use_id], await read($, crewRow)) : []
    if (crew.length === 0) return next(e)
    const ui = $.ui.resolve(e) as Ui
    const { Box } = ui

    return (
      <Box flexDirection="column">
        {await next(e)}
        {crewOf(ui, crew)}
      </Box>
    )
  })

  // The main loop's newest words, when they are the newest thing in the conversation: the helpers at work stand under them.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const newest = await read($, crewRow)
    const row = textKey(e.props.text)
    const crew = e.surface === 'desktop' ? crewAt(await read($, agents), [isNewestWords(row, newest) ? newest : row], newest) : []
    if (crew.length === 0) return next(e)
    const ui = $.ui.resolve(e) as Ui
    const { Box } = ui

    return (
      <Box flexDirection="column">
        {await next(e)}
        {crewOf(ui, crew)}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (!isQuietCall(e.props)) return next(e)
    return nothing($.ui.resolve(e) as Ui)
  })

  // A run made of these calls alone folds to nothing too; a run that mixes in other tools keeps
  // the engine's count line, which is not this mod's to redraw.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const calls = e.props.calls
    if (calls.length > 0 && calls.every(isQuietCall)) return nothing($.ui.resolve(e) as Ui)
    // A folded run hides its rows, so the agents it started stand under its fold line instead.
    const rows = calls.flatMap(call => call.tool_use_id ?? [])
    const workers = e.surface === 'desktop' ? crewAt(await read($, agents), rows, await read($, crewRow)) : []
    if (workers.length === 0) return next(e)
    const ui = $.ui.resolve(e) as Ui
    const { Box } = ui

    return (
      <Box flexDirection="column">
        {await next(e)}
        {crewOf(ui, workers)}
      </Box>
    )
  })
}
