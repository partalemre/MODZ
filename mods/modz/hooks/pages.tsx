// SPIKE: a mod's page drawn by the hub itself, inside its own pane, from the state the mod keeps (DESIGN.md §9).
import type { EngineInterface, RenderElement } from 'claude-code'

import { resolvePlan } from '../../plan-steps/hooks/match'
import { planPane } from '../../plan-steps/hooks/pane'
import { HomeButton } from './kit/home'

export const HUB_DRAWN: readonly string[] = ['plan']

const PLAN_TASKS = { plugin: 'plan-steps', key: 'tasks' } as const
const PLAN_DOC = { plugin: 'plan-steps', key: 'doc' } as const
const PLAN_TRACKS = { plugin: 'plan-steps', key: 'tracks' } as const

type Site = { columns: number; rows: number; surface: string }

export async function pageTree($: EngineInterface, e: any, o: { page: string; site: Site; onHome: () => void }): Promise<RenderElement> {
  const ui = $.ui.resolve(e) as Record<string, any>
  const { Box } = ui
  const tasks = (await $.state.get(PLAN_TASKS as any)).value ?? []
  const doc = (await $.state.get(PLAN_DOC as any)).value ?? null
  const tracks = (await $.state.get(PLAN_TRACKS as any)).value ?? {}
  const view = { plan: resolvePlan(tasks as any, doc as any), tracks: tracks as any, now: await $.clock.now(), theme: 'auto' as const, touchedAt: 0 }

  return (
    <Box flexDirection="column">
      {HomeButton(ui, o.onHome)}
      {planPane(ui as any, view, { ...o.site, rows: o.site.rows - 1 })}
    </Box>
  )
}
