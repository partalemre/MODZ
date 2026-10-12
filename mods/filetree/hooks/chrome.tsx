import type { ElementTable, RenderChildren } from 'claude-code'

import type { Activity, FileTree } from '../types'
import { shortPath } from './listing'
import type { Scene } from './scene'
import { inside } from './tree'
import { words } from './words'

type Ui = ElementTable<'terminal' | 'desktop'>

const relOrShort = (t: FileTree, id: string): string => (id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith('/') ? t.root.length : t.root.length + 1) : shortPath(id))

export function activityChip(ui: Ui, a: Activity, look: { unicode: boolean; colorOf: (tone: string) => string }) {
  const { Box, Text } = ui
  const color = look.colorOf(a.state === 'failed' ? 'red' : a.tone)
  const hash = a.state === 'done' && a.kind === 'git commit' ? (a.detail.split(' ')[0] ?? '') : ''
  return (
    <Box flexDirection="row" marginLeft={2}>
      <Text color={color}>{(look.unicode ? a.plain : a.nerd) + ' '}</Text>
      <Text bold={a.state === 'running'} color={color}>
        {a.state === 'running' ? `${a.label}…` : a.label}
      </Text>
      {hash && <Text dimColor>{` ${hash}`}</Text>}
    </Box>
  )
}

export function footer(ui: Ui, s: Scene, chip: RenderChildren) {
  const { Box, Text } = ui
  if (!s.t.selected && !s.latest) return null
  return (
    <Box flexDirection="row">
      {s.t.selected ? (
        <Box flexShrink={1}>
          <Text dimColor wrap="truncate-start">
            {words().selected}
            {relOrShort(s.t, s.t.selected)}
          </Text>
        </Box>
      ) : null}
      <Box flexGrow={1} />
      {chip}
    </Box>
  )
}
