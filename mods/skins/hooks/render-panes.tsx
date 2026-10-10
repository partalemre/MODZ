import type { Elements, Frozen, RenderElement, RenderInput, RenderSurface } from 'claude-code'

import type { SkinSlot } from '../types'
import { DEFAULT_PREFS } from './command'
import { resolveSkin, skinNames } from './custom'
import { galleryPane } from './gallery'
import { forTheme } from './light'
import { lookOf } from './look'
import type { PrefsHost } from './prefs-store'
import { settingsPane, swatchesOf } from './settings'
import { settingsActions } from './settings-actions'
import type { SettingsPorts } from './settings-actions'
import { pinned } from './pin'
import type { Drawing } from './view'

// The settings pane's tab title, wherever it is opened from.
export const SETTINGS_TITLE = 'Görünüm'

// Every element the skin draws, numbered, to point at when asking for a change.
export async function galleryView({ view, e }: Omit<Drawing<'Pane'>, 'pass'>): Promise<RenderElement> {
  const active = await view.active()

  if (active === null) {
    const { Text } = view.ui()

    return <Text>Galeri bir skin gösterir. Önce /skin ile birini seç.</Text>
  }

  const look = view.look(active)

  return pinned(e, galleryPane(look, e.props.bodyColumns))
}

// The settings pane's reach, bound in register.tsx.
export type SettingsHost = PrefsHost & {
  ui(): Elements[RenderSurface]
  editing(): Promise<SkinSlot>
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
    return <ui.Text>Skin ayarlarını terminalde ya da masaüstü uygulamasında aç.</ui.Text>
  }

  const look = lookOf({ ui, active: { prefs, custom, skin }, surface: e.surface })
  const isLight = await host.isLight()
  const names = skinNames(custom)
  const skins = names.flatMap(name => resolveSkin(name, custom) ?? []).map(one => forTheme(one, isLight))
  const model = { names, editing, width: e.props.bodyColumns, swatches: swatchesOf(skins) }

  return pinned(e, settingsPane({ look, ui, model, actions: settingsActions({ prefs, custom, editing }, host.ports) }))
}
