// What the hub draws, put together from what register.tsx read. Pure: no `$`, so both draws and the tests share it.
import type { HubCard } from '../types'
import type { Market } from './catalog'
import { focusOf, hiddenRowsOf, presenceOf, rowsOf, withUnanswered } from './hub'
import type { HubView } from './hub-pane'
import type { HubLayout } from './layout'
import { nowOf } from './now'
import { hubWords } from './words'

// `unanswered`: the pane of a row whose mod did not put it up; `now`: the time the running lines are told against.
export type Parts = { market: Market; cards: Record<string, HubCard>; layout: HubLayout; isEditing: boolean; unanswered: string | null; now: number }

// Where and how it is drawn, and what its presses do.
export type Frame = Pick<HubView, 'surface' | 'columns' | 'theme' | 'actions' | 'stable'>

// An empty catalog is one that could not be read: the hub says so rather than "0 mods on".
function metaOf(market: Market): string {
  if (market.mods.length === 0) return hubWords().unreadable

  return hubWords().modsOn(market.mods.filter(mod => mod.isEnabled === true).length)
}

// The rows the catalog and the mods' cards give, in the person's arrangement, with what leads lifted to "Now".
export function viewOf(parts: Parts, frame: Frame): HubView {
  const presence = presenceOf(parts.market)
  const rows = withUnanswered(rowsOf(parts.cards, presence, parts.layout), parts.unanswered, hubWords().noAnswer)
  const hidden = hiddenRowsOf(parts.cards, presence, parts.layout)

  return { rows, hidden, focus: focusOf(rows), now: nowOf(rows, parts.now), meta: metaOf(parts.market), isEditing: parts.isEditing, ...frame }
}

// The hub when its drawing threw: the same rows under the same keys, in the catalog's own order and as plain
// elements, so every row stays pressable (its press handle goes by its key) and the way to each pane is kept.
export function plainViewOf(parts: Pick<Parts, 'market' | 'cards'>, frame: Frame): HubView {
  const rows = rowsOf(parts.cards, presenceOf(parts.market))

  return { rows, hidden: [], focus: null, now: [], meta: hubWords().plain, isEditing: false, ...frame, surface: 'plain', theme: 'auto' }
}
