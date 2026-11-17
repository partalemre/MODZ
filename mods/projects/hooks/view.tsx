import type { PaneMotion } from './kit/moving'
import { eyebrow } from './kit/svg-text'
import { words } from './words'
import type { Busy, Snapshot } from '../types'

// What the list and the project page share.

export type PaneActions = {
  select: (root: string) => void
  togglePlan: (path: string) => void
  toggleFold: (name: string) => void
  openBoard: () => void
  estimate: () => void
  estimateOne: (root: string) => void
  hide: (root: string) => void
  showHidden: () => void
}

export type PaneView = { isText: boolean; snapshot: Snapshot | null; selected: string; openPlan: string; unfolded: readonly string[]; busy: Busy | null; error: string; nowMs: number; columns: number; motion: PaneMotion; acts: PaneActions; missing: number; home: unknown; homeDir: string }

export type Ui = Record<string, any>

// A desktop pane reports about 9 px a column, its last one held back as slack (as the hub's rows do).
const PX_PER_COLUMN = 9
const WIDTH_MIN = 240
const WIDTH_MAX = 640

export const rowWidth = (columns: number): number => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, (columns - 1) * PX_PER_COLUMN))

export const busyText = (busy: Busy): string => {
  const say = words()

  return busy.label === 'estimate' ? say.estimating(busy.done, busy.total) : say.scanning
}

// A plain button in its own row, its box on the column edge (the box is what lights under the pointer).
export const flush = (ui: Ui, key: string, button: unknown) => {
  const { Box } = ui

  return <Box key={key} flexDirection="row">{button as never}</Box>
}

// A group's label: 12/600 text.lo on the desktop (DESIGN.md §0.2), which a Text cannot be; bold on a terminal.
export const groupLabel = (ui: Ui, view: PaneView, text: string) => {
  const { Svg, Text } = ui
  if (view.isText) return <Text key="label" bold>{text}</Text>

  return <Svg key="label" {...view.motion.pic(`label:${text}`, eyebrow({ text, width: rowWidth(view.columns) }))} />
}
