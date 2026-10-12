import type { HubCard } from '../types'
import { say } from './words'

// The MODZ main panel's view of this mod (DESIGN.md §9): a one-line card under `hub` naming
// the skin in use, and the open request the panel writes to `modz.open` when its row is pressed.

export const HUB_PANE = 'skins'
const DETAIL_MAX = 40
const OFF = 'off'

export const EMPTY_HUB: HubCard = { pane: HUB_PANE, detail: '', tone: 'idle', at: 0 }

// "tidemark · dark": the skin and the background it is drawn for.
export function hubDetail(skin: string, isLight: boolean): string {
  const detail = skin === OFF ? say().skinOff : `${skin} · ${isLight ? say().light : say().dark}`

  return detail.length > DETAIL_MAX ? `${detail.slice(0, DETAIL_MAX - 1)}…` : detail
}

// Whether a `modz.open` write asks for this mod's pane.
export const isOwnOpen = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === HUB_PANE
