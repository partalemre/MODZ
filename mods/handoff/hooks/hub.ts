import { isReady } from './inject'
import { HUB_DETAIL_MAX, PANE } from './limits'
import { words } from './words'
import type { HandoffNote, HandoffStage, HubCard, HubTone } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): its one line ("Context 42% · note ready") and its own
// row's title, hint, icon and section, since the hub's catalog does not know this mod yet.

export const HUB_ICON = 'flag'
export const HUB_SECTION = 'meter'

export type HubFacts = { percent: number | null; threshold: number; note: HandoffNote | null; stage: HandoffStage; now: number }

export type HubShown = { detail: string; tone: HubTone }

function toneOf(facts: HubFacts): HubTone {
  if (facts.stage === 'writing') return 'live'
  if (facts.stage === 'failed') return 'bad'
  if (facts.percent !== null && facts.percent >= facts.threshold) return 'warn'

  return isReady(facts.note, facts.now) ? 'ok' : 'idle'
}

export function hubOf(facts: HubFacts): HubShown {
  const says = words()
  const parts = [facts.percent === null ? '' : says.hubContext(facts.percent), isReady(facts.note, facts.now) ? says.hubReady : '']
  const detail = parts.filter(part => part !== '').join(' · ').slice(0, HUB_DETAIL_MAX)

  return { detail, tone: toneOf(facts) }
}

export const hubCard = (shown: HubShown, at: number): HubCard => ({
  pane: PANE, ...shown, at, title: words().title, hint: words().hint, icon: HUB_ICON, section: HUB_SECTION,
})

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
