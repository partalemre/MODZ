import type { HubCard, HubTone } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects,
// and its "open" requests, which name a pane by key. Pure: register.tsx does the writing.

export const HUB_PANE = 'files'

export type HubShown = { detail: string; tone: HubTone }
export type HubInput = { isRunning: boolean; touched: number; hasRepo: boolean; changed: number }

// Live work first, then what git says is left to commit, then a clean tree.
export function hubOf(s: HubInput): HubShown {
  if (s.isRunning && s.touched > 0) return { detail: `${s.touched} dosya bu tur`, tone: 'live' }
  if (!s.hasRepo) return { detail: 'git deposu yok', tone: 'idle' }
  if (s.changed > 0) return { detail: `${s.changed} değişiklik commit edilmedi`, tone: 'warn' }

  return { detail: 'temiz', tone: 'ok' }
}

// Written only when what the card shows changes, so the main panel does not redraw for nothing.
export function isSameCard(card: HubCard | undefined, shown: HubShown): boolean {
  return card !== undefined && card.detail === shown.detail && card.tone === shown.tone
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
