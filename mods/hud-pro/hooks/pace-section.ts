import { clockText, PACE_MIN_SAMPLES, PACE_MIN_SPAN_MS } from './forecast'
import { longLabelOf, percentText } from './format'
import { isNotable } from './pace'
import type { Pace } from './pace'
import { usageWords } from './usage-words'
import { units } from './words'
import type { TurnShare, UsageSection } from '../types'

// What the Usage pane's Pace section and the line above the prompt say of the pace. Pure; percent only.

const MINUTE_MS = 60_000
const TENTHS = 10
const BEFORE_SEPARATOR = ' · '

// "1.4%" under ten points an hour, where a whole number would round a weekly rate to nothing; "12%" above.
function rateText(perHour: number): string {
  const rate = Math.max(0, perHour)
  if (rate >= TENTHS) return percentText(rate)

  return units().percent(Math.round(rate * TENTHS) / TENTHS).replace('.', units().decimalMark)
}

function rateLines(pace: Pace, nowMs: number): string[] {
  const says = usageWords()
  if (pace.perHour === null) return [says.tooFew(pace.readings, PACE_MIN_SAMPLES, PACE_MIN_SPAN_MS / MINUTE_MS)]
  const head = says.rate(longLabelOf(pace.gauge.id), percentText(pace.gauge.percent), rateText(pace.perHour))
  const resetMs = pace.gauge.resetsAt === null ? Number.NaN : Date.parse(pace.gauge.resetsAt)
  if (Number.isNaN(resetMs)) return [head]
  const reset = clockText(resetMs, nowMs)

  return [head, pace.fullAt === null ? says.lasts(reset) : says.fills(clockText(pace.fullAt, nowMs), reset)]
}

function shareLines(pace: Pace, shares: readonly TurnShare[]): string[] {
  const says = usageWords()
  const mine = shares.filter(share => share.window === pace.gauge.id)
  const last = mine[mine.length - 1]
  if (last === undefined) return [says.noTurns]
  const before = mine.slice(0, -1).reverse().map(share => percentText(share.share))
  const head = says.lastTurn(percentText(last.share), longLabelOf(last.window))

  return [head, ...(before.length === 0 ? [] : [says.before(before.join(BEFORE_SEPARATOR))]), says.sharesNote]
}

export function paceSection(spec: { pace: Pace | null; shares: readonly TurnShare[]; nowMs: number }): UsageSection {
  const base = { id: 'pace', title: usageWords().paceTitle, at: 0 }
  const pace = spec.pace
  if (pace === null) return { ...base, lines: [usageWords().noWindow], tone: 'neutral', isEmpty: true }
  const isEmpty = pace.perHour === null && !spec.shares.some(share => share.window === pace.gauge.id)

  return { ...base, lines: [...rateLines(pace, spec.nowMs), ...shareLines(pace, spec.shares)], tone: pace.fullAt === null ? 'neutral' : 'warn', isEmpty }
}

// The line a notable turn earns, or null for an ordinary one.
export function shareNotice(share: TurnShare): string | null {
  if (!isNotable(share)) return null

  return usageWords().shareNotice(percentText(share.share), longLabelOf(share.window), percentText(share.percent))
}

// The line a pace that fills the window before its reset earns, once per window (its `key`); null otherwise.
export function fillNotice(pace: Pace | null, nowMs: number): { key: string; text: string } | null {
  if (pace === null || pace.fullAt === null || pace.gauge.resetsAt === null) return null
  const reset = clockText(Date.parse(pace.gauge.resetsAt), nowMs)
  const text = usageWords().fillNotice({ window: longLabelOf(pace.gauge.id), time: clockText(pace.fullAt, nowMs), reset })

  return { key: `${pace.gauge.id}:${pace.gauge.resetsAt}`, text }
}
