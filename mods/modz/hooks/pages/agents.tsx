// The Agents page, drawn by the hub from what savvy-progress keeps, with savvy-progress' own pure drawing
// (pages/index.tsx). Its presses are handed to savvy-progress through `modz.act` (savvy-progress/hooks/page-act.ts).
import type { EngineInterface, RenderElement } from 'claude-code'

import { BUILTIN_TYPES } from '../../../savvy-progress/hooks/agent-types'
import { langOf, setLang } from '../../../savvy-progress/hooks/i18n'
import { restingCrab } from '../../../savvy-progress/hooks/mood'
import { pageHandlers } from '../../../savvy-progress/hooks/page-act'
import { paneDataOf } from '../../../savvy-progress/hooks/pane-data'
import { agentsTree, layoutOf } from '../../../savvy-progress/hooks/pane-tree'
import type { PageAct, PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const AGENTS = { plugin: 'savvy-progress', key: 'agents' } as const
const FLOW = { plugin: 'savvy-progress', key: 'flow' } as const
const JOB = { plugin: 'savvy-progress', key: 'job' } as const
const TASKS = { plugin: 'savvy-progress', key: 'tasks' } as const
const PANEL = { plugin: 'savvy-progress', key: 'panel' } as const
const LIMIT = { plugin: 'savvy-progress', key: 'limit' } as const
const TYPES = { plugin: 'savvy-progress', key: 'types' } as const
const CRAB = { plugin: 'savvy-progress', key: 'crab' } as const
const CHATS = { plugin: 'savvy-progress', key: 'chats' } as const

type Ui = Record<string, any>
// savvy-progress' own shapes, taken from its functions: its types file would bring its view of every mod's state.
type Kept = Parameters<typeof paneDataOf>[0]

// savvy-progress' words in the hub's copy of its code speak the hub's language (MODZ_LANG), as the hub's own do.
async function speakHubLang($: EngineInterface): Promise<void> {
  setLang(langOf(await $.env.get('MODZ_LANG').catch(() => undefined)) ?? 'en')
}

export async function agentsPage($: EngineInterface, ui: Ui, site: PageSite, act: PageAct): Promise<RenderElement> {
  await speakHubLang($)
  const kept: Kept = {
    list: ((await $.state.get(AGENTS)).value ?? []) as Kept['list'],
    flow: ((await $.state.get(FLOW)).value ?? null) as Kept['flow'],
    job: ((await $.state.get(JOB)).value ?? null) as Kept['job'],
    tasks: ((await $.state.get(TASKS)).value ?? []) as Kept['tasks'],
    // The hub's own clock: savvy-progress moves its `now` only while agents run.
    now: await $.clock.now(),
    panel: ((await $.state.get(PANEL)).value ?? { isCompact: false }) as Kept['panel'],
    limit: ((await $.state.get(LIMIT)).value ?? null) as Kept['limit'],
    types: ((await $.state.get(TYPES)).value ?? BUILTIN_TYPES) as Kept['types'],
    crab: ((await $.state.get(CRAB)).value ?? restingCrab(0)) as Kept['crab'],
    chats: ((await $.state.get(CHATS)).value ?? []) as Kept['chats'],
  }
  const isDesktop = site.surface === 'desktop' && 'Svg' in ui

  return agentsTree(ui, { d: paneDataOf(kept), layout: layoutOf(isDesktop, site.columns), on: pageHandlers(act) })
}
