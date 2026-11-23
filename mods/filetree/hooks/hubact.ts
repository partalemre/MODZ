// A press on the Files page the MODZ hub draws in its own pane (mods/modz/hooks/pages/files.tsx). The hub writes
// `modz.act` = `{ page: 'files', action, arg?, at }`; this does what the same control does in this mod's own pane.
// `rows` and `scroll` carry the window the hub drew (JSON), since only the drawer knows it.
import { toolWork } from './actions'
import type { Host } from './host'
import { HUB_PANE } from './hub'
import { onRows, type RowsMessage, scrollBy } from './keys'
import { refreshLook } from './look'
import { saveFeel, sync } from './pane'
import { jump, search } from './search'
import { mem } from './session'
import { wantSizes } from './sizes'
import type { ToolKey } from './toolbar'
import { unsized, visibleRows } from './tree'

type Act = { action: string; arg: string }
type Sent = { data?: unknown; by?: unknown; view?: unknown; surface?: unknown }

// The folders a size is asked for after a press: the rows from the window's top, as many as a tall pane shows.
const SIZE_ROWS = 60

export function actOf(value: unknown): Act | null {
  if (typeof value !== 'object' || value === null) return null
  const { page, action, arg } = value as { page?: unknown; action?: unknown; arg?: unknown }
  if (page !== HUB_PANE || typeof action !== 'string') return null

  return { action, arg: typeof arg === 'string' ? arg : '' }
}

function sentOf(arg: string): Sent {
  try {
    const sent: unknown = JSON.parse(arg)
    return typeof sent === 'object' && sent !== null ? (sent as Sent) : {}
  } catch {
    return {}
  }
}

// The hub's window becomes this mod's, so a drag or a press lands where the person saw it.
function takeView(view: unknown): void {
  const { from, max } = (view ?? {}) as { from?: unknown; max?: unknown }
  if (typeof from === 'number' && typeof max === 'number' && from >= 0 && max >= 0) mem.view = { from, max }
}

async function runAct(h: Host, act: Act): Promise<void> {
  const { action, arg } = act
  const tools = toolWork(h, await h.tree())
  if (Object.hasOwn(tools, action)) return tools[action as ToolKey]()
  if (action === 'find') {
    await search(h, arg)
    return
  }
  if (action === 'jump') return jump(h, arg)
  if (action === 'focus') {
    await sync(h)
    if (await h.look()) await refreshLook(h)
    return
  }
  const sent = sentOf(arg)
  takeView(sent.view)
  if (action === 'rows' && typeof sent.data === 'object' && sent.data !== null) await onRows(h, sent.data as RowsMessage, typeof sent.surface === 'string' ? sent.surface : undefined)
  else if (action === 'scroll' && typeof sent.by === 'number') await scrollBy(h, sent.by)
}

// The hub's page draws without this mod's host, so the sizes its window wants are asked for here.
export async function onHubAct(h: Host, act: Act): Promise<void> {
  await runAct(h, act)
  await saveFeel(h)
  const t = await h.tree()
  if (t.showSize) wantSizes(h, unsized(t, visibleRows(t).slice(mem.view.from, mem.view.from + SIZE_ROWS)))
}
