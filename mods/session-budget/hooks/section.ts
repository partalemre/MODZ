import { WARN_RATIO, describe, etaMinutes, etaText, ratioOf } from './budget'
import { words } from './words'
import type { Budget, UsageSection } from '../types'

// This mod's section of hud-pro's Usage pane: what the budget has spent with its pace, and the spawn brake. Pure.

export type SectionSpec = { budget: Budget | null; brakeAt: number | null; isEnabled: boolean; nowMs: number }

function toneOf(budget: Budget | null): UsageSection['tone'] {
  if (budget === null) return 'neutral'
  const ratio = ratioOf(budget)
  if (ratio >= 1) return 'danger'

  return ratio >= WARN_RATIO ? 'warn' : 'neutral'
}

export function budgetSection(spec: SectionSpec): UsageSection {
  const says = words()
  const base = { id: 'budget', title: says.eyebrow, at: 0 }
  if (!spec.isEnabled) return { ...base, lines: [says.sectionOff], tone: 'neutral', isEmpty: true }
  const brake = says.brakeState(spec.brakeAt)
  if (spec.budget === null) return { ...base, lines: [says.sectionEmpty, brake], tone: 'neutral', isEmpty: true }
  const eta = etaText(etaMinutes(spec.budget, spec.nowMs))
  const head = says.status(describe(spec.budget))

  return { ...base, lines: [eta === '' ? head : `${head} · ${eta}`, brake], tone: toneOf(spec.budget) }
}
