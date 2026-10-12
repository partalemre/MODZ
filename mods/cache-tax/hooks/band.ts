// The band above the prompt: the hold card above the other plugins' rows (a decision), the
// status row below them (state, next to the prompt). A survey has the band to itself.

import type { Elements, RenderElement } from 'claude-code'

import { coldUsd, isCold, warmUsd } from './core'
import type { State } from './core'
import { fmtDuration, fmtInt } from './fmt'
import { holdDesktop, holdTerminal } from './hold'
import type { HoldActions } from './hold'
import type { HoldView } from './hold-svg'
import { rowDesktop, rowOf, rowTerminal } from './row'
import { autoWarm, coldFor, rateText } from './words'

export type Prefs = { isLight: boolean; noColor: boolean }

export function holdView(s: State, now: number): HoldView {
  return {
    held: s.held?.text ?? '',
    coldFor: fmtDuration(coldFor(s, now)),
    tokens: fmtInt(s.ctx),
    coldUsd: coldUsd(s),
    warmUsd: warmUsd(s),
    rate: rateText(s),
    autoWarm: autoWarm(),
  }
}

/** The element table of a surface that has the band, tagged so its own builders are picked. */
export type Drawing = { surface: 'desktop'; ui: Elements['desktop'] } | { surface: 'terminal'; ui: Elements['terminal'] }
export type Band = { s: State; prefs: Prefs; actions: HoldActions; columns: number; now: number }

function holdCard(d: Drawing, b: Band): RenderElement | null {
  if (!b.s.held || !isCold(b.s, b.now)) return null
  const options = { view: holdView(b.s, b.now), actions: b.actions, ...b.prefs, columns: b.columns }
  return d.surface === 'desktop' ? holdDesktop(d.ui, options) : holdTerminal(d.ui, options)
}

function statusRow(d: Drawing, b: Band): RenderElement | null {
  const row = rowOf(b.s, b.now)
  if (row === null) return null
  const options = { row, ...b.prefs, columns: b.columns }
  return d.surface === 'desktop' ? rowDesktop(d.ui, options) : rowTerminal(d.ui, options)
}

/** Mine around theirs: a hold card above, the status row below; theirs alone when there is neither. */
export function composeBand(d: Drawing, theirs: RenderElement, b: Band): RenderElement {
  const above = holdCard(d, b)
  const below = statusRow(d, b)
  if (above === null && below === null) return theirs
  return d.ui.Box({ flexDirection: 'column', gap: above === null ? 0 : 1, children: [above, theirs, below] })
}
