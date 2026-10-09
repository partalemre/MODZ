import type { Register } from 'claude-code'

import { STEP_TOOL, TOOL } from './state'

// The `progress` and `step` calls only feed the band and the panel, which already show what they
// said; their rows ("savvy-progress:progress 2ms") were noise in the transcript. A call that went
// well draws nothing; one that failed or was cut keeps the engine's row, so trouble stays visible.

type On = Parameters<Register>[0]
type Ui = Record<string, any>

const OWN = new Set<string>([TOOL, STEP_TOOL])

export const isOwnTool = (tool: string): boolean => OWN.has(tool)

type Call = { tool: string; isErrored: boolean; isInterrupted?: boolean }

export const isQuietCall = (call: Call): boolean => isOwnTool(call.tool) && !call.isErrored && call.isInterrupted !== true

const nothing = (ui: Ui) => {
  const { Box } = ui
  return <Box />
}

export function onTranscript(on: On): void {
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (!isQuietCall(e.props)) return next(e)
    return nothing($.ui.resolve(e) as Ui)
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (!isQuietCall(e.props)) return next(e)
    return nothing($.ui.resolve(e) as Ui)
  })

  // A run made of these calls alone folds to nothing too; a run that mixes in other tools keeps
  // the engine's count line, which is not this mod's to redraw.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const calls = e.props.calls
    if (calls.length === 0 || !calls.every(isQuietCall)) return next(e)
    return nothing($.ui.resolve(e) as Ui)
  })
}
