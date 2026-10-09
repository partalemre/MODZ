// Which agents a section lists and in what order, and the footer's totals: shared by both surfaces.
import { compact, costText } from './format'
import { totalsOf } from './cost'
import { priciestOf } from './insight'
import { isLive } from './roster'
import type { DeckAgent } from '../types'

const PERCENT = 100

export function liveAgents(agents: DeckAgent[]): DeckAgent[] {
  return agents.filter(isLive).sort((a, b) => a.startedAt - b.startedAt)
}

export function doneAgents(agents: DeckAgent[]): DeckAgent[] {
  return agents.filter(agent => !isLive(agent)).sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))
}

// Totals and the agent that cost the most, with its share of the whole.
export function footerText(agents: DeckAgent[]): string | null {
  const totals = totalsOf(agents)
  if (totals.tokens === 0) return null
  const top = priciestOf(agents)
  const share = top === null ? '' : ` · en pahalı ${top.description === '' ? top.type : top.description} ${costText(top.costUsd)} (%${Math.round((top.costUsd / totals.costUsd) * PERCENT)})`

  return `Toplam ${compact(totals.tokens)} tok${share}`
}
