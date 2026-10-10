import type { HubTone } from '../types'
import { clip } from './format'
import { t } from './i18n'
import type { JobView } from './job'
import { HUB_PANE } from './state'

// The MODZ data path (DESIGN.md §9), its pure half: whether the hub's open request names this
// pane, and what this mod's one-line card says. The hooks live where `$` is: band.tsx opens the
// pane, register.tsx keeps the card.

const DETAIL_MAX = 40

/** Whether a `modz.open` request names this mod's pane. */
export const isOwnOpen = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === HUB_PANE

export const toneOf = (view: JobView | null): HubTone => {
  if (!view) return 'idle'
  if (!view.isFinished) return 'live'
  return view.failed ? 'warn' : 'ok'
}

/** "Görevler 3/4 · 2 ajan" while agents run, the band's label alone otherwise, "" with no job. */
export const hubDetailOf = (view: JobView | null, running: number): string => {
  if (!view) return ''
  const crew = running > 0 ? ` · ${t().crew(running)}` : ''
  return clip(`${view.label}${crew}`, DETAIL_MAX)
}
