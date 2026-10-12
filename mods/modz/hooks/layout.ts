// The person's arrangement of the hub: which rows they moved up and which they hid. Pure: the register file
// keeps it in `$.store` across sessions and in state for the drawing.
import type { HubLayout } from '../types'

export type { HubLayout }

export const EMPTY_LAYOUT: HubLayout = { hidden: [], order: [] }

// A pane id as the hub keys a row by: what `$.ui.open` admits.
const PANE_ID = /^[\w-]{1,64}$/
const MAX_PANES = 64

const panesOf = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((pane): pane is string => typeof pane === 'string' && PANE_ID.test(pane)))].slice(0, MAX_PANES) : []

// What the store held, read back: anything malformed counts as no arrangement.
export function layoutOf(value: unknown): HubLayout {
  if (typeof value !== 'object' || value === null) return EMPTY_LAYOUT
  const raw = value as Partial<Record<keyof HubLayout, unknown>>

  return { hidden: panesOf(raw.hidden), order: panesOf(raw.order) }
}

type Placed = { pane: string }

// The items in the person's order: a pane they placed sits at its place, the rest keep theirs after it.
export function arrange<T extends Placed>(items: readonly T[], layout: HubLayout): T[] {
  const rank = (item: T) => {
    const at = layout.order.indexOf(item.pane)

    return at === -1 ? layout.order.length : at
  }

  return items.map((item, i) => ({ item, i })).sort((a, b) => rank(a.item) - rank(b.item) || a.i - b.i).map(({ item }) => item)
}

// Moves `pane` one place up among `panes` (one section's rows as drawn); the order then names every row there.
export function moveUp(layout: HubLayout, opts: { panes: readonly string[]; pane: string }): HubLayout {
  const panes = [...opts.panes]
  const at = panes.indexOf(opts.pane)
  if (at <= 0) return layout
  const above = panes[at - 1] as string
  panes[at - 1] = opts.pane
  panes[at] = above
  const rest = layout.order.filter(pane => !panes.includes(pane))

  return { ...layout, order: [...panes, ...rest] }
}

export function setHidden(layout: HubLayout, opts: { pane: string; isHidden: boolean }): HubLayout {
  const others = layout.hidden.filter(pane => pane !== opts.pane)

  return { ...layout, hidden: opts.isHidden ? [...others, opts.pane] : others }
}

export const isHidden = (layout: HubLayout, pane: string): boolean => layout.hidden.includes(pane)
