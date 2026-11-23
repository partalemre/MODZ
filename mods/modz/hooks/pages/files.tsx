// The Files page, drawn by the hub from what filetree keeps, with filetree's own pure drawing (pages/index.tsx).
// Its tree rows are filetree's `Client` (a copy at hooks/rows.tsx: a module path names a file of this plugin), so
// their posts, the pane's wheel and its focus reach the hub; they are handed on to filetree like any press.
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import { drawDesktop } from '../../../filetree/hooks/desktop'
import { setLang as setFilesLang } from '../../../filetree/hooks/lang'
import { sceneFrom } from '../../../filetree/hooks/scene'
import { mem as filesMem } from '../../../filetree/hooks/session'
import { drawTerminal } from '../../../filetree/hooks/terminal'
import { toolLabels, type FilesActs, type ToolKey } from '../../../filetree/hooks/toolbar'
import { emptyTree } from '../../../filetree/hooks/tree'
import { NO_TURN } from '../../../filetree/hooks/turn'
import { lang } from '../kit/lang'
import { HUB_PANE, paneOf } from '../kit/stage'
import type { PageAct, PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const TREE = { plugin: 'filetree', key: 'tree' } as const
const THEME = { plugin: 'filetree', key: 'theme' } as const
const ACTIVITY = { plugin: 'filetree', key: 'activity' } as const
const TURN = { plugin: 'filetree', key: 'turn' } as const
const READS = { plugin: 'filetree', key: 'reads' } as const
const LOOK = { plugin: 'filetree', key: 'look' } as const
const FEEL = { plugin: 'filetree', key: 'feel' } as const
const STAGE = { plugin: 'modz', key: 'stage' } as const
const ACT = { plugin: 'modz', key: 'act' } as const

const PAGE = 'files'
// filetree's own pane keeps the tree at least this wide.
const MIN_WIDTH = 24
const FEEL_DEFAULT = { glyphs: 'auto', noNerd: false, pointer: true, followClaude: true, follow: true }

type Ui = Record<string, any>
// filetree's own shapes, taken from its functions: its types file would bring its view of every mod's state.
type Parts = Parameters<typeof sceneFrom>[0]

export async function filesPage($: EngineInterface, ui: Ui, site: PageSite, act: PageAct): Promise<RenderElement> {
  // filetree's words read their own copy of the language, which only this hub's setting reaches here.
  setFilesLang(lang())
  const t = { ...emptyTree(''), ...((await $.state.get(TREE)).value as Partial<Parts['t']> | undefined) }
  const parts = {
    theme: (await $.state.get(THEME)).value as Parts['theme'],
    activities: ((await $.state.get(ACTIVITY)).value ?? []) as Parts['activities'],
    turn: { ...NO_TURN, ...((await $.state.get(TURN)).value as Partial<Parts['turn']> | undefined) },
    readTotal: (await $.state.get(READS)).value as Parts['readTotal'],
    look: (await $.state.get(LOOK)).value as Parts['look'],
    feel: { ...FEEL_DEFAULT, ...((await $.state.get(FEEL)).value as Partial<Parts['feel']> | undefined) },
  }
  const s = sceneFrom({ ...parts, t, now: await $.clock.now() })
  const tool = Object.fromEntries(Object.keys(toolLabels(t)).map(key => [key, () => act(key)])) as Record<ToolKey, () => void>
  // Sizes are asked for by filetree after each press (filetree/hooks/hubact.ts): a drawing writes nothing.
  const acts: FilesActs = { tool, find: v => act('find', v), jump: v => act('jump', v), sizes: () => undefined }
  const frame = { s, room: { width: Math.max(MIN_WIDTH, site.columns), bodyRows: site.rows }, home: null }

  return site.surface === 'desktop' ? drawDesktop(ui as Parameters<typeof drawDesktop>[0], frame, acts) : drawTerminal(ui as Parameters<typeof drawTerminal>[0], frame, acts)
}

async function isFilesUp($: EngineInterface): Promise<boolean> {
  return paneOf((await $.state.get(STAGE)).value) === PAGE
}

// What the page's rows, wheel and focus did, handed to filetree with the window this hub drew (filetree's `view`).
async function handOn($: EngineInterface, action: string, sent: Record<string, unknown>): Promise<void> {
  await $.state.set(ACT, { page: PAGE, action, arg: JSON.stringify({ ...sent, view: filesMem.view }), at: Date.now() })
}

export function wireFilesPage(on: Parameters<Register>[0]): void {
  on('ui.message', async ($, e, next) => {
    if (e.requestId !== HUB_PANE || e.element !== 'rows' || !(await isFilesUp($))) return next(e)
    await handOn($, 'rows', { data: e.data, surface: e.surface })

    return {}
  })
  on('ui.scroll', { component: 'Pane', requestId: HUB_PANE }, async ($, e, next) => {
    if (!(await isFilesUp($))) return next(e)
    await handOn($, 'scroll', { by: e.by })

    return {}
  })
  on('ui.focus', { component: 'Pane', requestId: HUB_PANE }, async ($, e, next) => {
    const done = await next(e)
    if (await isFilesUp($)) await handOn($, 'focus', {})

    return done
  })
}
