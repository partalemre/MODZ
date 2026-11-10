import type { RenderElement } from 'claude-code'

import type { Look } from './look'

// A skin redraws the engine's row, not another mod's: what a mod beneath it draws (a PR card) stays, under the row.
export function withBeneath(look: Look, row: RenderElement, beneath: RenderElement): RenderElement {
  const { Box } = look.ui

  return beneath.type === 'engine' ? row : <Box flexDirection="column" gap={1}>{row}{beneath}</Box>
}
