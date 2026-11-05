// MODZ kit — one panel (DESIGN.md §9). The hub and every mod's pane take turns in one place instead of
// piling up as tabs: a mod that opens its pane writes its own `{ plugin: '<mod>', key: 'shown' }` (`{ pane, at }`);
// the hub then steps aside and writes `{ plugin: 'modz', key: 'stage' }` naming that pane, and every other mod
// whose pane is open closes it. The hub coming back (its row, "← MODZ", /modz) writes the stage as `modz`.

export const HUB_PANE = 'modz'

export type Stage = { pane: string; at: number }

// The pane a `modz.open`, `modz.stage` or `shown` value names; null for anything malformed.
export const paneOf = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) return null
  const pane = (value as { pane?: unknown }).pane

  return typeof pane === 'string' && pane !== '' ? pane : null
}

// Whether a `modz.open` write asks for this pane.
export const isAskedFor = (value: unknown, pane: string): boolean => paneOf(value) === pane

// Whether a `modz.stage` write puts another pane in the panel, so this one closes.
export function isOffStage(value: unknown, pane: string): boolean {
  const staged = paneOf(value)

  return staged !== null && staged !== pane
}

// What a mod writes under its own `shown` key once its pane is open.
export const shownOf = (pane: string, at: number): Stage => ({ pane, at })
