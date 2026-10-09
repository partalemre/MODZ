import { FIVE_HOUR, labelOf, percentText } from './format'
import type { HubCard, HubTone, HudUsage } from '../types'

// The MODZ main panel's view of this mod (DESIGN.md §9): a one-line card under `hub`, and the
// open request it writes to `modz.open` when its row is pressed.

export const HUB_PANE = 'usage'
const SEVEN_DAY = 'seven_day'
const HUB_GAUGES = [FIVE_HOUR, SEVEN_DAY] as const
const WARN_PERCENT = 80
const BAD_PERCENT = 95

export const EMPTY_HUB: HubCard = { pane: HUB_PANE, detail: '', tone: 'idle', at: 0 }

function hubTone(fivePercent: number): HubTone {
  if (fivePercent >= BAD_PERCENT) return 'bad'

  return fivePercent >= WARN_PERCENT ? 'warn' : 'idle'
}

// "5s %44 · 7g %17"; the 5-hour window alone sets the tone, as it is the one that stops work.
export function hubOf(usage: HudUsage | null): Pick<HubCard, 'detail' | 'tone'> {
  const gauges = HUB_GAUGES.flatMap(id => usage?.gauges.filter(gauge => gauge.id === id) ?? [])
  const detail = gauges.map(gauge => `${labelOf(gauge.id)} ${percentText(gauge.percent)}`).join(' · ')
  const five = gauges.find(gauge => gauge.id === FIVE_HOUR)?.percent ?? 0

  return { detail, tone: hubTone(five) }
}

// Whether a `modz.open` write asks for this mod's pane.
export const isOwnOpen = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === HUB_PANE
