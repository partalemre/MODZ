// The desktop pane's toolbar: one row (search, Daralt, Yenile, Daha fazla) and, on demand, the rest.
// Every action stays one click away, and each has a key the tree takes while it has focus.

import type { ElementTable } from 'claude-code'

import type { FileTree } from '../types'

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
  return {
    refresh: 'Yenile',
    collapse: 'Daralt',
    size: t.showSize ? 'Tarihleri göster' : 'Boyutları göster',
    up: 'Üst klasör',
    cwd: 'Projeye dön',
    hidden: t.showHidden ? 'Gizlileri gizle' : 'Gizlileri göster',
    unselect: 'Seçimi kaldır',
    more: t.showTools ? 'Daha az' : 'Daha fazla',
  }
}

// Each hint is one unit, so a narrow pane wraps between hints, never inside one.
const SHORTCUTS: [string, string][] = [['r', 'yenile'], ['c', 'daralt'], ['s', 'boyut/tarih'], ['.', 'gizliler'], ['u', 'üst klasör'], ['p', 'proje'], ['x', 'seçimi kaldır']]

export function drawToolbar(ui: ElementTable<'desktop'>, bar: Toolbar) {
  const { Box, Button, Input, Text } = ui
  const { t, act } = bar
  const labels = toolLabels(t)
  const more = MORE_KEYS.filter(k => k !== 'unselect' || t.selected)
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" gap={1} alignItems="center">
        <Box flexGrow={1} flexShrink={1}>
          <Input key="q" placeholder="Dosya bul" submitLabel="Aç" autoFocus value={t.query} onInput={bar.search.onInput} onSubmit={bar.search.onSubmit} />
        </Box>
        {t.query ? <Button key="clear" plain dimColor label="Temizle" onPress={() => bar.search.onInput('')} /> : null}
        <Button key="collapse" variant="secondary" label={labels.collapse} onPress={act.collapse} />
        <Button key="refresh" variant="secondary" label={labels.refresh} onPress={act.refresh} />
        <Button key="more" plain dimColor={!t.showTools} label={labels.more} onPress={act.more} />
      </Box>
      {t.showTools && (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {more.map(k => (
              <Button key={k} variant="secondary" label={labels[k]} onPress={act[k]} />
            ))}
          </Box>
          <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
            <Text dimColor>Ağaç seçiliyken:</Text>
            {SHORTCUTS.map(([key, what]) => (
              <Text dimColor>
                <Text bold>{key}</Text> {what}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
