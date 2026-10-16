import type { Elements, Frozen, RenderElement, RenderInput, RenderSurface } from 'claude-code'

import type { SkinSlot } from '../types'
import { DEFAULT_PREFS } from './command'
import { resolveSkin, skinNames } from './custom'
import { galleryPane } from './gallery'
import { paneMotion } from './kit/moving'
import { forTheme } from './light'
import { lookOf } from './look'
import { movingLook } from './moving-look'
import type { PrefsHost } from './prefs-store'
import { settingsPane, swatchesOf } from './settings'
import { settingsActions } from './settings-actions'
import type { SettingsPorts } from './settings-actions'
import { pinned } from './pin'
import type { Drawing } from './view'
import { say } from './words'

// One motion per pane (kit/moving.ts), reset as it opens, so its drawings cascade in each time.
export const settingsMotion = paneMotion()
export const galleryMotion = paneMotion()

// The settings pane's tab title, wherever it is opened from.
export const settingsTitle = (): string => say().settingsTitle

// Every element the skin draws, numbered, to point at when asking for a change.
export async function galleryView({ view, e }: Omit<Drawing<'Pane'>, 'pass'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null) {
    const { Text } = view.ui()

    return <Text>{say().galleryEmpty}</Text>
  }

  const look = movingLook(view.look(active), galleryMotion)

  return pinned(e, galleryPane(look, e.props.bodyColumns))
}

// The settings pane's reach, bound in register.tsx.
export type SettingsHost = PrefsHost & {
  ui(): Elements[RenderSurface]
  editing(): Promise<SkinSlot>
  isHubOn(): Promise<boolean>
  ports: SettingsPorts
}

export async function settingsView(host: SettingsHost, e: Frozen<RenderInput<'Pane'>>): Promise<RenderElement> {
  const prefs = await host.prefs()
  const custom = await host.custom()
  const editing = await host.editing()
  // Drawn for the background the transcript is drawn for, as every other row is.
  const base = resolveSkin(prefs.skin, custom) ?? resolveSkin(DEFAULT_PREFS.skin, custom)
  const skin = base === undefined ? undefined : forTheme(base, await host.isLight())
  const ui = host.ui()

  if (skin === undefined || e.surface === 'mobile' || !('Input' in ui)) {
    return <ui.Text>{say().settingsElsewhere}</ui.Text>
  }

  const look = movingLook(lookOf({ ui, active: { prefs, custom, skin }, surface: e.surface }), settingsMotion)
  const isLight = await host.isLight()
  const names = skinNames(custom)
  const skins = names.flatMap(name => resolveSkin(name, custom) ?? []).map(one => forTheme(one, isLight))
  const model = { names, editing, width: e.props.bodyColumns, swatches: swatchesOf(skins) }

  const home = (await host.isHubOn()) ? host.ports.home : undefined

  return pinned(e, settingsPane({ look, ui, model, home, actions: settingsActions({ prefs, custom, editing }, host.ports) }))
}
