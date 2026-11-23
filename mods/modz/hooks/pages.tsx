// The mods' pages the hub draws in its own pane (DESIGN.md §9). A pane's drawing is asked only of the plugin that
// opened it (measured on engine 2.1.330), so a mod cannot draw into the hub's pane: the hub draws the page itself,
// from the state the mod keeps, with the mod's own pure drawing code. One pane means no second tab, no stand-in and
// no swap: the stage names the page, and the drawing redraws by itself when what it reads changes.
import type { EngineInterface, RenderElement } from 'claude-code'

import { resolvePlan } from '../../plan-steps/hooks/match'
import { planPane } from '../../plan-steps/hooks/pane'
import { HomeButton } from './kit/home'

// The pages the hub draws; any other row still asks its mod for a pane of its own.
export const HUB_DRAWN: readonly string[] = ['plan']

// State refs live in each file that reads them: the engine follows literals, not imports.
const PLAN_TASKS = { plugin: 'plan-steps', key: 'tasks' } as const
const PLAN_DOC = { plugin: 'plan-steps', key: 'doc' } as const
const PLAN_TRACKS = { plugin: 'plan-steps', key: 'tracks' } as const
const BEAT = { plugin: 'modz', key: 'beat' } as const

// The "← modz" row above the page.
const HOME_ROWS = 1
const DEFAULT_ROWS = 24

export type PageSite = { columns: number; rows: number; surface: string }

type Ui = Record<string, any>

async function planPage($: EngineInterface, ui: Ui, site: PageSite): Promise<RenderElement> {
  // plan-steps' own shapes, taken from its functions: its types file would bring its view of every mod's state.
  const tasks = ((await $.state.get(PLAN_TASKS)).value ?? []) as Parameters<typeof resolvePlan>[0]
  const doc = ((await $.state.get(PLAN_DOC)).value ?? null) as Parameters<typeof resolvePlan>[1]
  const tracks = ((await $.state.get(PLAN_TRACKS)).value ?? {}) as Parameters<typeof planPane>[1]['tracks']
  const view = { plan: resolvePlan(tasks, doc), tracks, now: await $.clock.now(), theme: 'auto' as const, touchedAt: 0 }

  return planPane(ui, view, { ...site, rows: Math.max(site.rows - HOME_ROWS, 1) })
}

/** The page the stage names, under the way back to the hub. */
export async function pageTree($: EngineInterface, e: { props: any; viewport?: { rows?: number } }, o: { page: string; ui: Ui; columns: number; surface: string; onHome: () => void }): Promise<RenderElement> {
  // Read so the hub's beat (cards.ts) moves the page's running times too.
  await $.state.get(BEAT)
  const site = { columns: o.columns, rows: e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS, surface: o.surface }
  const { Box } = o.ui

  return (
    <Box flexDirection="column">
      {HomeButton(o.ui, o.onHome)}
      {await planPage($, o.ui, site)}
    </Box>
  )
}
