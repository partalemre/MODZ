import { AUTO_LEAD_POINTS, LOUDER_WAIT_MS, SNOOZE_POINTS } from './limits'
import type { HandoffStage } from '../types'

// When the band asks, and what "Not now" waits for. Pure, so the rules are tested alone.

export type AskFacts = {
  percent: number | null
  threshold: number
  snoozeUntil: number | null
  stage: HandoffStage
  // Where auto-compaction fires, in percent; 'off' or null (not read yet): the setting alone.
  autoAt?: number | 'off' | null
}

const PERCENT = 100

// Auto-compaction's point in percent of the window the fill is measured against; null when it is off.
export function autoPercentOf(auto: { tokens: number | null; window: number }): number | null {
  if (auto.tokens === null || auto.window <= 0) return null

  return Math.round((auto.tokens / auto.window) * PERCENT)
}

// The question comes at the setting, or a little before auto-compaction when that fires sooner.
export function askPointOf(facts: Pick<AskFacts, 'threshold' | 'autoAt'>): number {
  const autoAt = typeof facts.autoAt === 'number' ? facts.autoAt : null

  return autoAt === null ? facts.threshold : Math.max(1, Math.min(facts.threshold, autoAt - AUTO_LEAD_POINTS))
}

// The fill has reached the ask point, no snooze holds it back, and nothing else is on the card.
export function isAskDue(facts: AskFacts): boolean {
  if (facts.percent === null || facts.stage !== 'idle') return false
  if (facts.percent < askPointOf(facts)) return false

  return facts.snoozeUntil === null || facts.percent >= facts.snoozeUntil
}

// "Not now" at 82 % waits for 92 %.
export const snoozeFrom = (percent: number): number => percent + SNOOZE_POINTS

export type Rearm = { snoozeUntil: number | null; stage: HandoffStage }

// Once the fill falls back under the ask point (a compaction), the snooze and a seen handoff are let go,
// so the next climb asks again.
export function rearmed(facts: AskFacts): Rearm {
  const isBelow = facts.percent !== null && facts.percent < askPointOf(facts)
  if (!isBelow) return { snoozeUntil: facts.snoozeUntil, stage: facts.stage }

  return { snoozeUntil: null, stage: facts.stage === 'done' ? 'idle' : facts.stage }
}

export type BandFacts = { isWorking: boolean; hasSurvey: boolean }

// The band shows nothing of this mod while a turn runs or a survey is open (DESIGN.md §6).
export const isBandQuiet = (facts: BandFacts): boolean => facts.isWorking || facts.hasSurvey

// What the card draws now: the ask, a stage of its own, or nothing.
export type CardKind = 'ask' | 'compacted' | 'offer' | 'writing' | 'saved' | 'failed' | null

export function cardOf(facts: AskFacts & { hasCompacted?: boolean }): CardKind {
  if (facts.stage === 'writing' || facts.stage === 'saved' || facts.stage === 'failed') return facts.stage
  if (isAskDue(facts)) return 'ask'

  return facts.hasCompacted === true ? 'compacted' : null
}

// Whether a louder notice, known by `key`, still holds the slot: for a while from when it was first seen, then not.
export function isLouderNow(since: Map<string, number>, seen: { key: string; now: number }): boolean {
  const first = since.get(seen.key) ?? seen.now
  since.set(seen.key, first)

  return seen.now - first < LOUDER_WAIT_MS
}
