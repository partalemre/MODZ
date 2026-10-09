// MODZ kit — the render stamp. The engine hands out new press handles on every redraw, but the
// desktop surface keeps a tree that looks the same as the one it holds, with that tree's old
// handles: the first press on it is refused ("ui_press not handled") and only the second lands.
// An invisible element whose text changes on every render makes each redraw a new tree, so the
// surface always holds the live handles. It draws nothing, takes no room and no focus.
// The one module counter in the kit: a stamp only has to differ from the last one drawn.
import type { ElementTable, RenderElement } from 'claude-code'

export const STAMP_KEY = 'render-stamp'

// All a stamp needs of a surface's table, so a mod's narrower element type passes as it is.
export type StampUi = Pick<ElementTable, 'Box' | 'Text'>

let renders = 0

export function renderStamp(ui: StampUi): RenderElement {
  renders += 1
  const { Box, Text } = ui

  return (
    <Box key={STAMP_KEY} display="none">
      <Text>{String(renders)}</Text>
    </Box>
  )
}

// The tree with a stamp as the root's last child; a root that is not a plain Box (a Text, a
// Button, a Box with hover styles) is wrapped in a column instead, so its own props stay whole.
export function stamped(ui: StampUi, tree: RenderElement): RenderElement {
  const stamp = renderStamp(ui)
  const { Box } = ui
  if (tree.type !== 'Box' || tree.hover !== undefined) {
    return (
      <Box flexDirection="column">
        {tree}
        {stamp}
      </Box>
    )
  }

  return Box({ ...(tree.props ?? {}), children: [...(tree.children ?? []), stamp] })
}
