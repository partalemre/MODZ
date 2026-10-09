import type { RenderElement } from 'claude-code'

import { headersOf } from './messages'
import { usageBand } from './row-usage'
import { askBand } from './rows'
import { stamped } from './stamp'
import { metersOf } from './svg-usage'
import type { Drawing } from './view'

// The band above the prompt: context and plan limits. Another mod's drawing there,
// and a survey, keep their place.
export async function abovePromptView({ view, e, pass }: Drawing<'AbovePrompt'>): Promise<RenderElement> {
  const active = await view.active()
  const meters = metersOf(await view.usage())

  if (active === null || !active.prefs.band || e.props.hasSurvey || meters.length === 0) {
    return pass(e)
  }

  const look = view.look(active)
  const { Box } = look.ui
  const theirs = await pass(e)
  // Compacting mid-turn would cut the turn's own context out from under it.
  const isCompacting = await view.isCompacting()

  return stamped(look.ui, (
    <Box flexDirection="column">
      {usageBand(look, { meters, canCompact: !e.props.isWorking && !isCompacting, compact: view.compact })}
      {theirs}
    </Box>
  ))
}

// Claude Code's own dialog stays whole: the skin only adds a band above it.
export async function askView({ view, e, pass }: Drawing<'AskUserQuestion'>): Promise<RenderElement> {
  const active = await view.active()
  const theirs = await pass(e)

  if (active === null) {
    return theirs
  }

  const headers = headersOf(e.props.questions)
  const look = view.look(active)
  const { Box } = look.ui

  return headers.length === 0 ? (
    theirs
  ) : (
    <Box flexDirection="column">
      {askBand(look, headers)}
      {theirs}
    </Box>
  )
}
