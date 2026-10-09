import { FIVE_HOUR, labelOf, longLabelOf, paceOf, toneOf, untilReset } from './format'
import type { Tone } from './theme'
import type { HudUsage } from '../types'

// One gauge as every drawing reads it: labels, value, where its pace is, its tone and reset.
export type GaugeView = {
  id: string
  short: string
  long: string
  percent: number
  pace: number | null
  tone: Tone
  reset: string
}

export function gaugeViews(usage: HudUsage, nowMs: number): GaugeView[] {
  return usage.gauges.map(gauge => {
    const pace = paceOf(gauge, nowMs)

    return {
      id: gauge.id,
      short: labelOf(gauge.id),
      long: longLabelOf(gauge.id),
      percent: gauge.percent,
      pace,
      tone: toneOf({ id: gauge.id, percent: gauge.percent, pace }),
      reset: untilReset(gauge.resetsAt, nowMs),
    }
  })
}

// Which resets a narrowing line keeps: every one, the 5-hour one, or only a critical window's.
export type Resets = 'all' | 'five' | 'critical'

// A window at or past 95 %: it keeps its reset to the last and is the line's one accent.
export const isCritical = (gauge: GaugeView): boolean => gauge.tone === 'danger'

export function hasReset(gauge: GaugeView, resets: Resets): boolean {
  if (gauge.reset === '') return false
  if (resets === 'all' || isCritical(gauge)) return true

  return resets === 'five' && gauge.id === FIVE_HOUR
}
