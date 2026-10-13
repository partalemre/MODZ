import { SNOOZE_POINTS } from './limits'
import type { HandoffStage } from '../types'

// When the band asks, and what "Not now" waits for. Pure, so the rules are tested alone.

export type AskFacts = {
  percent: number | null
  threshold: number
  snoozeUntil: number | null
  stage: HandoffStage
}

// The fill has reached the threshold, no snooze holds it back, and nothing else is on the card.
export function isAskDue(facts: AskFacts): boolean {
  if (facts.percent === null || facts.stage !== 'idle') return false
  if (facts.percent < facts.threshold) return false

  return facts.snoozeUntil === null || facts.percent >= facts.snoozeUntil
}

// "Not now" at 82 % waits for 92 %.
export const snoozeFrom = (percent: number): number => percent + SNOOZE_POINTS

export type Rearm = { snoozeUntil: number | null; stage: HandoffStage }

// Once the fill falls back under the threshold (a compaction), the snooze and a seen handoff are let go,
// so the next climb asks again.
export function rearmed(facts: AskFacts): Rearm {
  const isBelow = facts.percent !== null && facts.percent < facts.threshold
  if (!isBelow) return { snoozeUntil: facts.snoozeUntil, stage: facts.stage }

  return { snoozeUntil: null, stage: facts.stage === 'done' ? 'idle' : facts.stage }
}

export type BandFacts = { isWorking: boolean; hasSurvey: boolean }

// The band shows nothing of this mod while a turn runs or a survey is open (DESIGN.md §6).
export const isBandQuiet = (facts: BandFacts): boolean => facts.isWorking || facts.hasSurvey

// What the card draws now: the ask, a stage of its own, or nothing.
export type CardKind = 'ask' | 'writing' | 'saved' | 'failed' | null

export function cardOf(facts: AskFacts): CardKind {
  if (facts.stage === 'writing' || facts.stage === 'saved' || facts.stage === 'failed') return facts.stage

  return isAskDue(facts) ? 'ask' : null
}
