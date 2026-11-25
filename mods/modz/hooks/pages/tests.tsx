// The Tests page, drawn by the hub from what test-badge keeps, with test-badge's own pure drawing (pages/index.tsx).
// Its presses are handed to test-badge through `modz.act` (test-badge/hooks/page-act.ts).
import type { EngineInterface, RenderElement } from 'claude-code'

import { setLang } from '../../../test-badge/hooks/lang'
import { EMPTY } from '../../../test-badge/hooks/limits'
import { failuresOf } from '../../../test-badge/hooks/parse'
import { AUTO } from '../../../test-badge/hooks/tidemark'
import { paneTree } from '../../../test-badge/hooks/view'
import { lang } from '../kit/lang'
import type { PageAct, PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const BADGE = { plugin: 'test-badge', key: 'badge' } as const
const FILTER = { plugin: 'test-badge', key: 'filter' } as const
const THEME = { plugin: 'test-badge', key: 'theme' } as const
const CI = { plugin: 'test-badge', key: 'ci' } as const
const COMMANDS = { plugin: 'test-badge', key: 'commands' } as const

type Ui = Record<string, any>
// test-badge's own shapes, taken from its functions: its types file would bring its view of every mod's state.
type View = Parameters<typeof paneTree>[1]

export async function testsPage($: EngineInterface, ui: Ui, site: PageSite, act: PageAct): Promise<RenderElement> {
  // test-badge's words read its own language value, which only its own session.start sets: the hub's is the same setting.
  setLang(lang())
  const badge = ((await $.state.get(BADGE)).value ?? EMPTY) as View['badge']
  // A failure is named by its place in the list test-badge keeps, with the surface its copy fallback needs.
  const view: View = {
    badge,
    now: await $.clock.now(),
    columns: site.columns,
    filter: ((await $.state.get(FILTER)).value ?? 'all') as View['filter'],
    theme: ((await $.state.get(THEME)).value ?? AUTO) as View['theme'],
    isRich: site.surface !== 'terminal',
    onOpen: failure => act('open', JSON.stringify([failuresOf(badge).indexOf(failure), site.surface])),
    onRerun: () => act('rerun'),
    onFilter: filter => act('filter', filter),
    ci: ((await $.state.get(CI)).value ?? null) as View['ci'],
    commands: ((await $.state.get(COMMANDS)).value ?? null) as View['commands'],
  }

  return paneTree(ui, view) as RenderElement
}
