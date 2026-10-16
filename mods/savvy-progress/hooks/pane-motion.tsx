import { paneMotion } from './kit/moving'
import type { MoveOpts, Pic } from './kit/moving'
import type { Ui } from './rows'

// The Agents pane's drawings on the desktop (kit/moving.ts): reset right before the pane opens, so they cascade in
// each time it does.
export const motion = paneMotion()

// `key` is the drawing's React key among its siblings; `at` names its one place in the whole pane, by the agent or
// the part it draws, so a card that moves up the list keeps its frame rather than sweep every card under it.
export type Placed = { key: string; at: string; pic: Pic; opts?: MoveOpts }

export function picture(ui: Ui, placed: Placed) {
  const { Svg } = ui
  return <Svg key={placed.key} {...motion.pic(placed.at, placed.pic, placed.opts)} />
}
