// The status row under the band: only while it means something (DESIGN.md §6): keepwarm on or
// stopped, the cache cold, or warm with ten minutes or less left. Cube, state word, then detail.

import type { Elements, RenderElement } from 'claude-code'

import { BIG_TOKENS, SOON_MS, coldUsd, isCold, isHoldShown, untilCold } from './core'
import type { State } from './core'
import { cube } from './cube'
import { fmtDuration, fmtUsd } from './fmt'
import { statusIcons } from './status-icons'
import { doc } from './svg'
import { TERMINAL, palette } from './theme'
import { bandWords } from './ui-words'
import { coldFor, statusText } from './words'

export type RowState = 'warm' | 'cold' | 'unknown' | 'stopped'
export type Row = { state: RowState; detail: string[] }

function temperature(s: State, now: number): RowState {
  if (!s.lastRequestAt || s.compacted) return 'unknown'
  return isCold(s, now) ? 'cold' : 'warm'
}

function keepwarmRow(s: State, now: number): Row | null {
  const line = statusText(s, now)
  if (line === undefined || (s.deadline && now >= s.deadline)) return null
  if (s.stopped) return { state: 'stopped', detail: [line] }
  return { state: temperature(s, now), detail: line.split(' · ') }
}

/** What the row says now, or null when it has nothing worth a line. */
export function rowOf(s: State, now: number): Row | null {
  if (isHoldShown(s, now)) return null
  if (s.deadline || s.stopped) return keepwarmRow(s, now)
  if (s.ctx < BIG_TOKENS) return null
  if (isCold(s, now)) {
    return { state: 'cold', detail: [bandWords().coldAgo(fmtDuration(coldFor(s, now))), bandWords().nextUpTo(fmtUsd(coldUsd(s)))] }
  }
  const left = untilCold(s, now)
  if (left === null || left > SOON_MS) return null
  return { state: 'warm', detail: [bandWords().goesCold(fmtDuration(left)), bandWords().keepWarm] }
}

/** A key that changes whenever the drawn card or row would: the band is redrawn only then. */
export function bandKey(s: State, now: number): string {
  const hold = isHoldShown(s, now) ? `${s.held?.switch?.to ?? ''}:${fmtDuration(coldFor(s, now))}` : ''
  return `${hold}|${JSON.stringify(rowOf(s, now))}`
}

const SEP = ' · '
const ROW_CHROME = 18

/** Detail segments kept from the left while they fit, so a narrow band drops the least important. */
export function fitDetail(row: Row, columns: number): string {
  const room = columns - ROW_CHROME - bandWords().states[row.state].length
  const kept: string[] = []
  for (const part of row.detail) {
    if ([...kept, part].join(SEP).length > room && kept.length > 0) break
    kept.push(part)
  }
  return kept.join(SEP)
}

const CUBE_PX = 16

function lidOf(state: RowState, isLight: boolean): string {
  const p = palette(isLight)
  if (state === 'warm') return p.role.ok.fg
  return state === 'cold' ? p.role.edit.fg : p.lo
}

export type RowOptions = { row: Row; isLight: boolean; noColor: boolean; columns: number }

export function rowDesktop(ui: Elements['desktop'], o: RowOptions): RenderElement {
  const { Box, Svg, Text } = ui
  const p = palette(o.isLight)
  const color = o.noColor || o.row.state === 'unknown' || o.row.state === 'stopped' ? undefined : lidOf(o.row.state, o.isLight)
  const icon = o.noColor ? Text({ bold: true, children: ['[>]'] })
    : Svg({ source: doc({ width: CUBE_PX, height: CUBE_PX }, cube({ x: 0, y: 0, size: CUBE_PX }, { lid: lidOf(o.row.state, o.isLight), outline: p.hi })), alt: 'Cache Tax', width: CUBE_PX, height: CUBE_PX })
  return Box({ key: 'cache-tax:row', flexDirection: 'row', alignItems: 'center', gap: 1, children: [
    Box({ flexShrink: 0, children: [icon] }),
    Text({ color: o.noColor ? undefined : p.mid, wrap: 'truncate-end', children: [
      bandWords().cache, Text({ color, bold: true, children: [bandWords().states[o.row.state]] }), `${SEP}${fitDetail(o.row, o.columns)}`,
    ] }),
  ] })
}

const IMAGE_CELLS = 3

function terminalColor(state: RowState, noColor: boolean): string | undefined {
  if (noColor) return undefined
  if (state === 'warm') return TERMINAL.ok
  return state === 'cold' ? TERMINAL.edit : undefined
}

export function rowTerminal(ui: Elements['terminal'], o: RowOptions): RenderElement {
  const { Box, Image, Text } = ui
  const variant = statusIcons[o.isLight ? 'light' : 'dark']
  const asset = o.row.state === 'warm' || o.row.state === 'cold' ? variant[o.row.state] : variant.neutral
  const icon = o.noColor ? Text({ bold: true, children: ['[>]'] })
    : Image({ source: { png: asset.png }, columns: IMAGE_CELLS, rows: 1, alt: '[>]' })
  return Box({ key: 'cache-tax:row', flexDirection: 'row', alignItems: 'center', children: [
    Box({ flexShrink: 0, children: [icon] }),
    Text({ wrap: 'truncate-end', children: [
      ` ${bandWords().cache}`, Text({ color: terminalColor(o.row.state, o.noColor), bold: true, children: [bandWords().states[o.row.state]] }),
      `${SEP}${fitDetail(o.row, o.columns)}`,
    ] }),
  ] })
}
