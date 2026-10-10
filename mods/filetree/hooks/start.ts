import { unlit } from './flash'
import { type Host, patch } from './host'
import { loadTheme } from './look'
import { cwdOf, inApp, reset, showPane } from './pane'
import { finePointerOk, fontState } from './platform'
import { mem } from './session'
import { shortPath } from './listing'
import { resolve } from './shell'
import { syncHub } from './turn'

const THEME_POLL_MS = 2000
// The terminal docks a pane beside the transcript only this wide.
const MIN_COLUMNS = 110
// A Nerd Font glyph the font check looks for.
const NERD_CHARSET = 'f04eb'

// After a restart: nothing is lit any more, and git work that was running then never finished.
async function settleTree(h: Host): Promise<void> {
  const t = await h.tree()
  if (t.flashOn) await patch(h, unlit)
  await h.setActivities(cur => cur.map(a => (a.state === 'running' ? { ...a, state: 'failed', label: `${a.kind} yarıda kaldı` } : a)))
  const cwd = await cwdOf(h)
  if (!t.root || t.nodes.length === 0 || (mem.follow && t.root !== cwd)) await reset(h, cwd)
  else await showPane(h, false)
  await syncHub(h)
}

export async function startPane(h: Host, env: { isWindows: boolean; isRemote: () => Promise<boolean> }): Promise<void> {
  mem.pointer = await finePointerOk(h)
  try {
    const remote = await env.isRemote()
    mem.noNerd = !remote && (env.isWindows || (await fontState(h, NERD_CHARSET)) !== 'ok')
  } catch {
    mem.noNerd = true
  }
  await loadTheme(h)
  mem.themePoll?.cancel()
  mem.themePoll = mem.themeMtime ? h.every(THEME_POLL_MS, () => void loadTheme(h)) : null
  await settleTree(h)
}

// A cleared, resumed or forked session: the tree comes back where it was, or to the working folder it follows.
export async function resumePane(h: Host): Promise<void> {
  await loadTheme(h)
  const root = mem.follow || !mem.lastRoot ? await cwdOf(h) : mem.lastRoot
  const t = await h.tree()
  if (t.root !== root || t.nodes.length === 0) await reset(h, root)
}

export async function openByCommand(h: Host, e: { args?: string; presentation: { isFullscreen?: boolean; columns: number } }): Promise<string> {
  const isApp = await inApp(h)
  if (!isApp && !e.presentation.isFullscreen) return 'Dosya ağacı yan panelde açılır; bunun için tam ekran düzen gerekir. Önce /tui fullscreen, sonra /filetree çalıştır.'
  if (!isApp && e.presentation.columns < MIN_COLUMNS) return 'Dosya ağacı yan panelde açılır; terminal en az 110 sütun genişliğinde olmalı. Pencereyi genişletip /filetree çalıştır.'
  mem.noDock = false
  const arg = (e.args ?? '').trim()
  const cwd = await cwdOf(h)
  mem.follow = !arg
  const root = arg ? resolve(cwd, arg, mem.home) : cwd
  await reset(h, root, true)
  return `Dosya ağacı: ${shortPath(root)}${mem.follow ? ' (çalışma klasörünü izliyor)' : ''}.`
}
