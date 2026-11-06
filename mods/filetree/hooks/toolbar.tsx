// The desktop pane's toolbar: the search field, the tree's Collapse, Refresh and More and, on demand, the rest.
// Every action stays one click away, and each has a key the tree takes while it has focus. All of them are
// low-weight upkeep, so none is a filled button (DESIGN.md §0.6).

import type { ElementTable } from 'claude-code'

import type { FileTree } from '../types'
import { words } from './words'

export type ToolKey = 'refresh' | 'collapse' | 'size' | 'up' | 'cwd' | 'hidden' | 'unselect' | 'more'
export type Toolbar = {
  t: FileTree
  act: Record<ToolKey, () => void>
  search: { onInput: (v: string) => void; onSubmit: (v: string) => void }
}

// The tree's single-key shortcuts (rows.tsx posts every key it gets); j k h l and y are its own.
export const TOOL_KEYS: Record<string, ToolKey> = { r: 'refresh', c: 'collapse', s: 'size', u: 'up', p: 'cwd', '.': 'hidden', x: 'unselect' }

const MORE_KEYS: ToolKey[] = ['size', 'hidden', 'up', 'cwd', 'unselect']

export function toolLabels(t: FileTree): Record<ToolKey, string> {
  const { tools } = words()
  return {
    refresh: tools.refresh,
    collapse: tools.collapse,
    size: t.showSize ? tools.showDates : tools.showSizes,
    up: tools.up,
    cwd: tools.cwd,
    hidden: t.showHidden ? tools.hideHidden : tools.showHidden,
    unselect: tools.unselect,
    more: t.showTools ? tools.less : tools.more,
  }
}

// Each hint is one unit, so a narrow pane wraps between hints, never inside one; words() names them in order.
const SHORTCUT_KEYS = ['r', 'c', 's', '.', 'u', 'p', 'x']
const shortcuts = (): [string, string][] => SHORTCUT_KEYS.map((key, i) => [key, words().shortcuts[i] ?? ''])

// The search field has a row to itself: the field and its "Open" hold their own width, and no action beside them
// could be sure of the rest at 365 px.
export function drawFind(ui: ElementTable<'desktop'>, bar: Toolbar) {
  const { Box, Button, Input } = ui
  const { t } = bar
  const w = words()
  return (
    <Box flexDirection="row" gap={1} alignItems="center">
      <Box flexGrow={1} flexShrink={1}>
        <Input key="q" placeholder={w.find} submitLabel={w.findOpen} autoFocus value={t.query} onInput={bar.search.onInput} onSubmit={bar.search.onSubmit} />
      </Box>
      {t.query ? <Button key="clear" plain dimColor label={w.clear} onPress={() => bar.search.onInput('')} /> : null}
    </Box>
  )
}

// The tree's actions, on its header row. They wrap under the folder's name rather than leave the pane.
export function drawActions(ui: ElementTable<'desktop'>, bar: Toolbar) {
  const { Box, Button } = ui
  const { t, act } = bar
  const labels = toolLabels(t)
  return (
    <Box flexDirection="row" flexShrink={0} columnGap={1} alignItems="center">
      <Button key="collapse" plain dimColor label={labels.collapse} onPress={act.collapse} />
      <Button key="refresh" plain dimColor label={labels.refresh} onPress={act.refresh} />
      <Button key="more" plain dimColor={!t.showTools} label={labels.more} onPress={act.more} />
    </Box>
  )
}

// What "More" opens: the rest of the actions and the tree's keys.
export function drawMore(ui: ElementTable<'desktop'>, bar: Toolbar) {
  const { Box, Button, Text } = ui
  const { t, act } = bar
  if (!t.showTools) return null
  const labels = toolLabels(t)
  const w = words()
  const more = MORE_KEYS.filter(k => k !== 'unselect' || t.selected)
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" flexWrap="wrap" gap={1}>
        {more.map(k => (
          <Button key={k} plain dimColor label={labels[k]} onPress={act[k]} />
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        <Text dimColor>{w.whileFocused}</Text>
        {shortcuts().map(([key, what]) => (
          <Text dimColor>
            <Text bold>{key}</Text> {what}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
