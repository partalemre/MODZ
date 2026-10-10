import type { HubCard, HubTone } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects,
// and its "open" requests, which name a pane by key. Pure: register.tsx does the writing.

export const HUB_PANE = 'files'

export type HubShown = { detail: string; tone: HubTone }
// `edited` counts the files Claude wrote or committed in the latest turn; `sha` is that turn's commit.
export type HubInput = { isRunning: boolean; touched: number; hasRepo: boolean; changed: number; edited?: number; sha?: string }

const SHA_SHOWN = 7

// Live work first, then what git says is left to commit, then what the last turn did.
export function hubOf(s: HubInput): HubShown {
  const edited = s.edited ?? 0
  if (s.isRunning && s.touched > 0) return { detail: `${s.touched} dosya bu tur`, tone: 'live' }
  if (!s.hasRepo) return edited > 0 ? { detail: `son tur ${edited} dosya düzenlendi`, tone: 'idle' } : { detail: 'git deposu yok', tone: 'idle' }
  if (s.changed > 0) return { detail: `${s.changed} değişiklik commit edilmedi`, tone: 'warn' }
  if (s.sha) return { detail: `commit ${s.sha.slice(0, SHA_SHOWN)} · temiz`, tone: 'ok' }

  return { detail: 'temiz', tone: 'ok' }
}

// Written only when what the card shows changes, so the main panel does not redraw for nothing.
export function isSameCard(card: HubCard | undefined, shown: HubShown): boolean {
  return card !== undefined && card.detail === shown.detail && card.tone === shown.tone
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
