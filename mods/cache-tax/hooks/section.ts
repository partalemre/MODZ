// This mod's section of hud-pro's Usage pane: the /cache-tax card's rows, with what its dollars are. Pure.

import { isCold, untilCold, SOON_MS } from './core'
import type { State } from './core'
import { bandWords } from './ui-words'
import { cardText } from './words'
import type { UsageSection } from '../types'

function toneOf(s: State, now: number): UsageSection['tone'] {
  const left = untilCold(s, now)

  return isCold(s, now) || (left !== null && left <= SOON_MS) ? 'warn' : 'neutral'
}

export function cacheSection(s: State, now: number): UsageSection {
  const base = { id: 'cache', title: bandWords().section, at: 0 }
  if (!s.lastRequestAt && !s.deadline) return { ...base, lines: [bandWords().sectionEmpty], tone: 'neutral', isEmpty: true }
  // The card's rows are padded for a fixed-width terminal; in a pane each row stands on its own line.
  const rows = cardText(s, now).split('\n').map(row => row.replace(/ {2,}/, ' · '))

  return { ...base, lines: [...rows, bandWords().listPrice], tone: toneOf(s, now) }
}
