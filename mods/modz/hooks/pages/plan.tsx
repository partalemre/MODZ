// The Plan page, drawn by the hub from what plan-steps keeps, with plan-steps' own pure drawing (pages/index.tsx).
import type { EngineInterface, RenderElement } from 'claude-code'

import { resolvePlan } from '../../../plan-steps/hooks/match'
import { planPane } from '../../../plan-steps/hooks/pane'
import type { PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const PLAN_TASKS = { plugin: 'plan-steps', key: 'tasks' } as const
const PLAN_DOC = { plugin: 'plan-steps', key: 'doc' } as const
const PLAN_TRACKS = { plugin: 'plan-steps', key: 'tracks' } as const

type Ui = Record<string, any>

export async function planPage($: EngineInterface, ui: Ui, site: PageSite): Promise<RenderElement> {
  // plan-steps' own shapes, taken from its functions: its types file would bring its view of every mod's state.
  const tasks = ((await $.state.get(PLAN_TASKS)).value ?? []) as Parameters<typeof resolvePlan>[0]
  const doc = ((await $.state.get(PLAN_DOC)).value ?? null) as Parameters<typeof resolvePlan>[1]
  const tracks = ((await $.state.get(PLAN_TRACKS)).value ?? {}) as Parameters<typeof planPane>[1]['tracks']
  const view = { plan: resolvePlan(tasks, doc), tracks, now: await $.clock.now(), theme: 'auto' as const, touchedAt: 0 }

  return planPane(ui, view, site)
}
