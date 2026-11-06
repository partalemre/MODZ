import { words } from './words'
import type { WrappedView } from '../types'

// The pane before a year is ready: one line and, where it helps, why.

type Table = Record<string, any>

export function stateTree(ui: Table, lines: { title: string; hint?: string }) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text bold>{lines.title}</Text>
      {lines.hint !== undefined && <Text dimColor>{lines.hint}</Text>}
    </Box>
  )
}

export function linesOf(view: Exclude<WrappedView, { status: 'ready' }>): { title: string; hint?: string } {
  const t = words()
  if (view.status === 'reading') return { title: t.reading(view.year), hint: t.readingHint }
  if (view.status === 'empty') return { title: t.empty(view.year), hint: t.emptyHint }
  if (view.status === 'failed') return { title: t.failed, hint: view.reason }

  return { title: t.idle }
}
