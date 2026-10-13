import { clockText, FULL_WARN_MS, fullAtOf, pointsOf, TURNS_WARN } from './forecast'
import { CONTEXT, FIVE_HOUR, labelOf, longLabelOf, paceOf, toneOf, untilReset } from './format'
import type { Tone } from './theme'
import { words } from './words'
import type { HudGauge, HudSample, HudUsage } from '../types'

// One gauge as every drawing reads it: labels, value, where its pace is, its tone and reset.
export type GaugeView = {
  id: string
  short: string
  long: string
  percent: number
  pace: number | null
  tone: Tone
  reset: string
  // The estimate the pane reads ("~full at 15:40", "~12 turns left"), and the shorter one the HUD
  // line reads only once it is near; '' without a basis.
  forecast: string
  alert: string
}

// What the estimates are read from: the readings so far and the context's turns left.
export type Forecasts = { history: readonly HudSample[]; turnsLeft: number | null }

type Estimate = Pick<GaugeView, 'forecast' | 'alert'>

const NO_ESTIMATE: Estimate = { forecast: '', alert: '' }

function estimateOf(gauge: HudGauge, nowMs: number, forecasts: Forecasts): Estimate {
  if (gauge.id === CONTEXT) {
    const turns = forecasts.turnsLeft
    if (turns === null) return NO_ESTIMATE

    return { forecast: words().turnsLeft(turns), alert: turns <= TURNS_WARN ? words().turnsShort(turns) : '' }
  }
  const fullAt = fullAtOf({ points: pointsOf(forecasts.history, gauge.id), percent: gauge.percent, resetsAt: gauge.resetsAt, nowMs })
  if (fullAt === null) return NO_ESTIMATE
  const time = clockText(fullAt, nowMs)

  return { forecast: words().fullAt(time), alert: fullAt - nowMs <= FULL_WARN_MS ? words().fullAtShort(time) : '' }
}

export function gaugeViews(usage: HudUsage, nowMs: number, forecasts?: Forecasts): GaugeView[] {
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
      ...(forecasts === undefined ? NO_ESTIMATE : estimateOf(gauge, nowMs, forecasts)),
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
