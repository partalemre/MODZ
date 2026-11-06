import type { RenderElement } from 'claude-code'

import { groupRow, toolRow } from './row-tool'
import { pinned } from './pin'
import { clippedOutput, metaOf, resultCard } from './tool-result'
import { kindOf, summarize } from './tools'
import { DEFAULT_COLUMNS } from './view'
import type { Drawing } from './view'
import type { Look } from './row-tool'

// A skin redraws the engine's row, not another mod's: what a mod beneath it draws (a PR card) stays, under the row.
function withBeneath(look: Look, row: RenderElement, beneath: RenderElement): RenderElement {
  const { Box } = look.ui

  return beneath.type === 'engine' ? row : <Box flexDirection="column" gap={1}>{row}{beneath}</Box>
}

export async function toolUseView({ view, e, pass }: Drawing<'ToolUse'>): Promise<RenderElement> {
  const kind = kindOf(e.props.tool)
  const active = await view.active()

  if (kind === null || active === null) {
    return pass(e)
  }

  const ms = await view.duration()
  const target = summarize(e.props.tool, e.props.input, await view.cwd())

  return toolRow(view.look(active), { call: e.props, kind, target, meta: metaOf(e.props, ms) })
}

export async function toolGroupView({ view, e, pass }: Drawing<'ToolGroup'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null || e.props.isExpanded) {
    return pass(e)
  }

  const look = view.look(active)

  return withBeneath(look, groupRow(look, e.props.calls), await pass(e))
}

export async function toolResultView({ view, e, pass }: Drawing<'ToolResult'>): Promise<RenderElement> {
  const active = await view.active()
  const look = active === null ? undefined : view.look(active, true)

  // The desktop gets cards: a diff for an edit, a terminal for a shell command.
  if (look?.svg !== undefined) {
    const card = await resultCard(look, look.svg, { props: e.props, columns: e.viewport?.columns ?? DEFAULT_COLUMNS, cwd: view.cwd })

    if (card !== null) {
      return withBeneath(look, pinned(e, card), await pass(e))
    }
  }

  const output = clippedOutput(e.props, active?.prefs.clipOutput === true)

  return output === undefined ? pass(e) : pass({ ...e, props: { ...e.props, output } })
}
