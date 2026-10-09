import type { CustomSkin, Prefs, SkinSlot } from '../types'
import { DEFAULT_PREFS, TOGGLES } from './command'
import { withSlot } from './custom'
import type { DesignState } from './designer'
import type { SettingsActions } from './settings'

export type SettingsState = { prefs: Prefs; custom: Record<string, CustomSkin>; editing: SkinSlot }

// The engine's reach the pane's presses need, bound in register.tsx.
export type SettingsPorts = {
  commit: (state: DesignState) => void
  edit: (slot: SkinSlot) => void
  toast: (text: string) => void
  gallery: () => void
}

export function settingsActions({ prefs, custom, editing }: SettingsState, ports: SettingsPorts): SettingsActions {
  const state = { prefs, custom }

  return {
    gallery: ports.gallery,
    pick: name => ports.commit({ ...state, prefs: { ...prefs, skin: name } }),
    toggle: word => ports.commit({ ...state, prefs: { ...prefs, [TOGGLES[word]]: !prefs[TOGGLES[word]] } }),
    icons: () => ports.commit({ ...state, prefs: { ...prefs, icons: prefs.icons === 'unicode' ? 'ascii' : 'unicode' } }),
    edit: ports.edit,
    paint: hex => {
      const made = withSlot(prefs.skin === 'off' ? DEFAULT_PREFS.skin : prefs.skin, custom, { slot: editing, hex })

      if (typeof made === 'string') {
        ports.toast(made)

        return
      }

      ports.commit({ prefs: { ...prefs, skin: made.name }, custom: { ...custom, [made.name]: made.skin } })
    },
  }
}
