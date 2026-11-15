import { deepen, toLight } from './light'
import { makeColors } from './make-colors.js'
import type { Palette, Skin } from './skin'

// The app's own colours, made from a skin: with `app` on, the desktop and mobile apps paint their page, cards and
// words to match the transcript (`$.theme.set`). A skin names a band, not a page, so the page is the band deepened.

// How far the page and the menus sit under the skin's band, and how far muted words sit under body text.
const DARK = { page: 0.5, menu: 0.45, muted: 0.3 }
const LIGHT = { page: 0.06, muted: 0.2 }
const UNPAINTED = "Desktop won't paint"

const roles = (palette: Palette) => ({ accent: palette.user, danger: palette.err, success: palette.ok, warning: palette.warn, pro: palette.search })

const dark = (palette: Palette) => ({
  roles: roles(palette),
  gray: {
    anchors: {
      'surface-0': deepen(palette.surface, DARK.page),
      'surface-3': deepen(palette.surface, DARK.menu),
      'text-primary': palette.fg,
      'text-muted': deepen(palette.fg, DARK.muted),
    },
  },
})

const light = (palette: Palette) => ({
  roles: roles(palette),
  gray: { anchors: { 'surface-0': deepen(palette.surface, LIGHT.page), 'text-primary': palette.fg, 'text-muted': deepen(palette.muted, LIGHT.muted) } },
})

// The colours for both modes, or undefined for a skin the desktop would refuse to paint (a made skin's colours
// may be too close to read) or the design system cannot use.
export function appColors(skin: Skin): unknown {
  try {
    const { theme, problems } = makeColors({ label: skin.label, dark: dark(skin.palette), light: light(skin.light ?? toLight(skin.palette)) })

    return problems.some(line => line.startsWith(UNPAINTED)) ? undefined : theme
  } catch {
    // makeColors throws on a colour it cannot use: the same answer as one it will not paint.
    return undefined
  }
}

// `$.theme`, where the engine has one (Claude Code 2.1.319 and later).
export type AppTheme = { set(look: { colors: unknown }): Promise<unknown>; clear(): Promise<unknown> }

export type AppPainter = {
  // Paints `skin`, or with none gives back the app's own colours if this painted them. False: the skin does not fit.
  paint(theme: AppTheme, skin: Skin | undefined): Promise<boolean>
}

export function appPainter(): AppPainter {
  // `$.theme.clear` clears every mod's theme, so only a theme this painted is cleared.
  let isPainted = false

  return {
    paint: async (theme, skin) => {
      const colors = skin === undefined ? undefined : appColors(skin)

      if (colors !== undefined) {
        await theme.set({ colors })
        isPainted = true
      } else if (isPainted) {
        await theme.clear()
        isPainted = false
      }

      return skin === undefined || colors !== undefined
    },
  }
}
