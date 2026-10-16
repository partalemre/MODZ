// Keeps each drawing's source fixed per what it shows (motion.ts): the desktop rebuilds an interactive Svg's frame
// whenever its source changes, which would restart its loops and flash it blank. A drawing is built again only when
// what it shows changes; its first build since the pane opened enters, a later one lights up the change.
import type { Drawing } from './draw'
import type { Phase } from './motion'

type Kept = { what: string; drawing: Drawing }

export type Stable = {
  // Forgets every drawing: the pane opened again, so each one enters anew.
  reset: () => void
  // The drawing under `key` for `what` it shows (any plain value): the kept one while that is unchanged.
  draw: (key: string, what: unknown, build: (phase: Phase) => Drawing) => Drawing
}

export function stableDrawings(): Stable {
  const kept = new Map<string, Kept>()

  return {
    reset: () => kept.clear(),
    draw: (key, what, build) => {
      const signature = JSON.stringify(what)
      const before = kept.get(key)
      if (before !== undefined && before.what === signature) return before.drawing
      const drawing = build(before === undefined ? 'enter' : 'change')
      kept.set(key, { what: signature, drawing })

      return drawing
    },
  }
}
