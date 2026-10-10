import type { ElementTable, RenderSurface } from 'claude-code'

import type { CustomSkin, Prefs } from '../types'
import { ICONS } from './skin'
import type { Icons, Skin } from './skin'

export type Ui = Pick<ElementTable, 'Box' | 'Text' | 'Markdown' | 'Button'>

// The vector element, on the surfaces that have one (the desktop app).
export type SvgElement = ElementTable<'desktop'>['Svg']

export type Look = {
  ui: Ui
  skin: Skin
  icons: Icons
  prefs: Prefs
  surface: RenderSurface
  // The vector element where the surface draws one: icons replace glyphs there.
  svg?: SvgElement
  // Puts text on the clipboard of the surface drawing; absent where nothing can copy.
  copy?: (text: string) => void
}

export type Call = {
  tool: string
  input: unknown
  isRunning: boolean
  isErrored: boolean
  isInterrupted: boolean
}

// What a tool row shows at its right edge.
export type Meta = { ms?: number; added?: number; removed?: number }

export type Active = { prefs: Prefs; skin: Skin; custom: Record<string, CustomSkin> }

export type LookSource = {
  ui: Ui & { Svg?: SvgElement }
  active: Active
  surface: RenderSurface
  copy?: (text: string) => void
}

// Every surface's element table names Svg, but the terminal draws it as nothing, so
// vector icons are for the other surfaces only.
export const lookOf = ({ ui, active, surface, copy }: LookSource): Look => ({
  ui,
  skin: active.skin,
  icons: ICONS[active.prefs.icons],
  prefs: active.prefs,
  surface,
  ...(surface !== 'terminal' && ui.Svg !== undefined ? { svg: ui.Svg } : {}),
  ...(copy === undefined ? {} : { copy }),
})
