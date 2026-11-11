import type { RenderElement } from 'claude-code'

import type { Look } from './look'

type Node = { type?: unknown; children?: readonly unknown[] }

const isEngine = (node: unknown): boolean => typeof node === 'object' && node !== null && (node as Node).type === 'engine'

// A mod beneath that kept the engine's row beside its own drawing (a plain-words line under the row) hands up a
// Box holding both. The engine's row is the one the skin redraws, so it is taken out and the mod's part stays.
function ownOf(beneath: RenderElement): RenderElement | null {
  if (isEngine(beneath)) return null
  const node = beneath as Node
  if (node.type !== 'Box' || !Array.isArray(node.children) || !node.children.some(isEngine)) return beneath
  const kept = node.children.filter(child => !isEngine(child))

  return kept.length === 0 ? null : ({ ...beneath, children: kept } as RenderElement)
}

// A skin redraws the engine's row, not another mod's: what a mod beneath it draws (a PR card) stays, under the row.
export function withBeneath(look: Look, row: RenderElement, beneath: RenderElement): RenderElement {
  const { Box } = look.ui
  const own = ownOf(beneath)

  return own === null ? row : <Box flexDirection="column" gap={1}>{row}{own}</Box>
}
