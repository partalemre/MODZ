import { gnomeDark, macDark, resolveLight } from './light'
import type { Probe, ThemeHints } from './light'

// The engine's reach for the theme, bound in register.tsx: the engine follows `$` only into
// functions of the hooks module's own file.
export type ThemeHost = {
  hints(): Promise<ThemeHints>
  probe(argv: readonly string[]): Promise<Probe>
  setLight(isLight: boolean): Promise<unknown>
}

// The system's appearance, for an `auto` theme: macOS's AppleInterfaceStyle, else GNOME's
// color-scheme. Undefined when neither answers.
async function systemDark(host: ThemeHost): Promise<boolean | undefined> {
  try {
    return macDark(await host.probe(['defaults', 'read', '-g', 'AppleInterfaceStyle']))
  } catch {
    // No `defaults`: not macOS, so GNOME may answer.
  }

  try {
    return gnomeDark(await host.probe(['gsettings', 'get', 'org.gnome.desktop.interface', 'color-scheme']))
  } catch {
    return undefined
  }
}

// Claude Code's own theme decides whether skins draw for a light or a dark background:
// `SKINS_THEME` first, then the theme setting, and for `auto` the terminal and the system.
export async function refreshTheme(host: ThemeHost): Promise<void> {
  const hints = await host.hints()
  // Asks the system only when nothing before it decided.
  const needsSystem = resolveLight(hints) !== resolveLight({ ...hints, systemDark: false })
  const isLight = resolveLight({ ...hints, systemDark: needsSystem ? await systemDark(host) : undefined })

  await host.setLight(isLight)
}
