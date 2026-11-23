// The mods' pages the hub draws in its own pane (DESIGN.md §9). A pane's drawing is asked only of the plugin that
// opened it (measured on engine 2.1.330), so a mod cannot draw into the hub's pane: the hub draws the page itself,
// from the state the mod keeps, with the mod's own pure drawing code. One pane means no second tab, no stand-in and
// no swap: the stage names the page, and the drawing redraws by itself when what it reads changes. A press on a
// page is handed to its mod through `modz.act` (site.ts). One file a page; HUB_DRAWN lists them.
import type { EngineInterface, RenderElement } from 'claude-code'

import { HomeButton } from '../kit/home'
import { checkpointsPage } from './checkpoints'
import { planPage } from './plan'
import type { PageAct, PageSite } from './site'

type Ui = Record<string, any>

// The pages the hub draws; any other row still asks its mod for a pane of its own.
export const HUB_DRAWN: readonly string[] = ['plan', 'checkpoints']

// The engine follows `$` only into functions it can name, so each page is called by name here, one case a page.
async function pageOf($: EngineInterface, o: { page: string; ui: Ui; site: PageSite; act: PageAct }): Promise<RenderElement | null> {
  switch (o.page) {
    case 'plan':
      return planPage($, o.ui, o.site)
    case 'checkpoints':
      return checkpointsPage($, o.ui, o.site, o.act)
    default:
      return null
  }
}

const BEAT = { plugin: 'modz', key: 'beat' } as const
const ACT = { plugin: 'modz', key: 'act' } as const

// The "← modz" row above the page.
const HOME_ROWS = 1
const DEFAULT_ROWS = 24

/** The page the stage names, under the way back to the hub. */
export async function pageTree($: EngineInterface, e: { props: any; viewport?: { rows?: number } }, o: { page: string; ui: Ui; columns: number; surface: string; onHome: () => void }): Promise<RenderElement> {
  // Read so the hub's beat (cards.ts) moves the page's running times too.
  await $.state.get(BEAT)
  const rows = e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS
  const site = { columns: o.columns, rows: Math.max(rows - HOME_ROWS, 1), surface: o.surface }
  const act: PageAct = (action, arg) =>
    void $.state.set(ACT, { page: o.page, action, ...(arg === undefined ? {} : { arg }), at: Date.now() })
      .catch(cause => $.ui.log(`modz: the ${o.page} page's ${action} could not be handed on: ${String(cause)}`, { to: 'debug' }))
  const page = await pageOf($, { page: o.page, ui: o.ui, site, act })
  const { Box } = o.ui

  return (
    <Box flexDirection="column">
      {HomeButton(o.ui, o.onHome)}
      {page}
    </Box>
  )
}
