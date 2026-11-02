import type { RenderElement } from 'claude-code'

import type { Look } from './look'
import { headersOf } from './messages'
import { usageBand } from './row-usage'
import { askBand } from './rows'
import { pinned } from './pin'
import { sceneNamed } from './scenes'
import { sceneSvg } from './svg-scene'
import { metersOf } from './svg-usage'
import type { Drawing } from './view'
import { say } from './words'

// The living scene, where the surface draws vectors: an interactive frame keeps its loops running across the
// band's redraws, since its source never changes.
function sceneView(look: Look, name: string) {
  const scene = sceneNamed(name)
  if (scene === undefined || look.svg === undefined) return undefined
  const Svg = look.svg

  return <Svg key="scene" {...sceneSvg(scene)} alt={say().sceneAlt(scene.label)} isInteractive />
}

// The band above the prompt: the living scene, then context and plan limits. Another mod's drawing there,
// and a survey, keep their place.
export async function abovePromptView({ view, e, pass }: Drawing<'AbovePrompt'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null || e.props.hasSurvey) {
    return pass(e)
  }

  const look = view.look(active)
  const scene = sceneView(look, active.prefs.scene)
  const meters = active.prefs.band ? metersOf(await view.usage()) : []

  if (scene === undefined && meters.length === 0) {
    return pass(e)
  }

  const { Box } = look.ui
  const theirs = await pass(e)
  // Compacting mid-turn would cut the turn's own context out from under it.
  const isCompacting = await view.isCompacting()

  return pinned(e, (
    <Box flexDirection="column">
      {scene ?? ''}
      {meters.length === 0 ? '' : usageBand(look, { meters, canCompact: !e.props.isWorking && !isCompacting, compact: view.compact })}
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
