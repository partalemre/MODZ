import type { Look } from '../types'
import type { Host } from './host'
import { systemDark } from './platform'
import { mem } from './session'
import { lightByName } from './theme'
import { DEFAULT_THEME, parseTheme } from './tree'

const THEME_FILE = '.local/state/omarchy/current/theme/colors.toml'

// Claude's theme setting first; for `auto` the system's appearance (DESIGN.md §2).
export async function refreshLook(h: Host): Promise<void> {
  let theme: unknown
  try {
    theme = (await h.config()).find(row => row.key === 'theme')?.value
  } catch {
    theme = undefined
  }
  const named = lightByName(theme)
  const dark = named === undefined ? await systemDark(h) : undefined
  const look: Look = named === undefined ? { isLight: dark === false, isAuto: true } : { isLight: named, isAuto: false }
  const cur = await h.look()
  if (cur?.isLight !== look.isLight || cur?.isAuto !== look.isAuto) await h.setLook(look)
}

export async function loadTheme(h: Host): Promise<void> {
  const path = `${(await h.homeEnv()) ?? ''}/${THEME_FILE}`
  try {
    const stat = await h.stat(path)
    if (stat.kind !== 'file') throw new Error('no theme file')
    if (stat.mtimeMs === mem.themeMtime) return
    await h.setTheme(parseTheme(String(await h.read(path))))
    mem.themeMtime = stat.mtimeMs
  } catch {
    if (mem.themeMtime === 0) return
    await h.setTheme(DEFAULT_THEME)
    mem.themeMtime = 0
  }
}
