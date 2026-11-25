// The Restore points page, drawn by the hub from what checkpoint keeps, with checkpoint's own pure drawing (pages/index.tsx).
import type { EngineInterface, RenderElement } from 'claude-code'

import { setLang } from '../../../checkpoint/hooks/lang'
import { paneTree } from '../../../checkpoint/hooks/pane'
import { AUTO } from '../../../checkpoint/hooks/tidemark'
import { lang } from '../kit/lang'
import type { PageAct, PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const CP_VIEW = { plugin: 'checkpoint', key: 'view' } as const
const CP_META = { plugin: 'checkpoint', key: 'meta' } as const
const CP_THEME = { plugin: 'checkpoint', key: 'theme' } as const

type Ui = Record<string, any>
// checkpoint's own shapes, taken from its functions: its types file would bring its view of every mod's state.
type View = Parameters<typeof paneTree>[1]
type Opts = Parameters<typeof paneTree>[2]

const EMPTY_VIEW: View = { entries: [], status: null, isBusy: false, pending: null }

export async function checkpointsPage($: EngineInterface, ui: Ui, site: PageSite, act: PageAct): Promise<RenderElement> {
  // checkpoint's words read its own language value, which only its own session.start sets: the hub's is the same setting.
  setLang(lang())
  const view = ((await $.state.get(CP_VIEW)).value ?? EMPTY_VIEW) as View
  const meta = ((await $.state.get(CP_META)).value ?? {}) as Opts['meta']
  const theme = ((await $.state.get(CP_THEME)).value ?? AUTO) as Opts['look']['theme']
  // A press names its checkpoint by ref; checkpoint finds it in what it keeps (hooks/register.tsx).
  const actions: Opts['actions'] = {
    onUndo: entry => act('undo', entry.ref),
    onConfirm: () => act('confirm'),
    onCancel: () => act('cancel'),
  }
  const look = { theme, columns: site.columns, isRich: site.surface !== 'terminal' }

  return paneTree(ui, view, { now: await $.clock.now(), meta, look, actions }) as RenderElement
}
