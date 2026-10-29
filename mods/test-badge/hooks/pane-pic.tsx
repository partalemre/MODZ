import { paneMotion } from './kit/moving'
import type { MoveOpts, Pic } from './kit/moving'

// The Tests pane's drawings on the desktop (kit/moving.ts), its CI section's too: one motion for the one pane,
// reset right before each open (register.tsx, band-hook.tsx) so the drawings cascade in each time.
type Ui = Record<string, any>

export const motion = paneMotion()

export function picture(ui: Ui, drawing: Pic, key: string, opts?: MoveOpts) {
  const { Svg } = ui
  return <Svg key={key} {...motion.pic(key, drawing, opts)} />
}
