// The /modz pane: every mod in the marketplace, grouped, with its version, surfaces, source and health.
import type { Market, ModInfo } from './catalog'
import { headline, healthOf } from './catalog'
import { groupSvg, headSvg, rowSvg } from './draw'
import { GROUPS } from './meta'
import type { Group } from './meta'
import type { Theme } from './theme'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

export type View = { market: Market; surface: string; columns: number; theme: Theme }

const PX_PER_COLUMN = 8
const WIDTH_MIN = 320
const WIDTH_MAX = 900

function groupsOf(mods: ModInfo[]): [Group, ModInfo[]][] {
  return GROUPS.map(group => [group, mods.filter(mod => mod.group === group)] as [Group, ModInfo[]]).filter(([, list]) => list.length > 0)
}

function sourceText(mod: ModInfo): string {
  return mod.upstream === null ? 'MODZ' : `asıl: ${mod.upstream}`
}

// The glyph says on/off/unknown; a problem or an off mod also gets its word, as on the desktop.
function stateOf(mod: ModInfo): { glyph: string; color: string; word: string } {
  if (!mod.isHealthy) return { glyph: '✕', color: 'error', word: 'sorunlu' }
  if (mod.isEnabled === null) return { glyph: '◌', color: 'subtle', word: '' }

  return mod.isEnabled ? { glyph: '●', color: 'success', word: '' } : { glyph: '○', color: 'subtle', word: 'kapalı' }
}

function terminalRow(ui: Ui, mod: ModInfo) {
  const { Box, Text } = ui
  const state = stateOf(mod)

  return (
    <Box key={`mod-${mod.name}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text color={state.color}>{state.glyph}</Text>
        <Text bold dimColor={mod.isEnabled === false}>{mod.name}</Text>
        <Text dimColor>{`v${mod.version}`}</Text>
        {state.word === '' ? null : <Text color={state.color}>{state.word}</Text>}
        <Box flexGrow={1} />
        <Text dimColor wrap="truncate">{`${mod.surfaces.join(' · ')} · ${sourceText(mod)}`}</Text>
      </Box>
      <Box paddingLeft={2}>{mod.isHealthy ? <Text dimColor wrap="truncate">{mod.description}</Text> : <Text color="error" wrap="truncate">{mod.description}</Text>}</Box>
    </Box>
  )
}

function terminalTree(ui: Ui, view: View) {
  const { Box, Text } = ui
  const health = healthOf(view.market.mods)

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>Tüm modlar</Text>
        <Text>{headline(view.market.mods)}</Text>
        <Box flexGrow={1} />
        {health.isBad ? <Text color="error">{health.text}</Text> : <Text dimColor>{health.text}</Text>}
      </Box>
      {groupsOf(view.market.mods).map(([group, list]) => (
        <Box key={`group-${group}`} flexDirection="column">
          <Text bold dimColor>{`${group.toLocaleUpperCase('tr')} · ${list.length}`}</Text>
          {list.map(mod => terminalRow(ui, mod))}
        </Box>
      ))}
    </Box>
  )
}

function desktopTree(ui: Ui, view: View) {
  const { Box, Svg } = ui
  const width = Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, view.columns * PX_PER_COLUMN - PX_PER_COLUMN))
  const health = healthOf(view.market.mods)
  const head = headSvg({ width, theme: view.theme, title: headline(view.market.mods), meta: health.text, metaRole: health.isBad ? 'danger' : null })
  const draw = (drawing: { source: string; alt: string; height: number }, key: string) => (
    <Svg key={key} source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} />
  )

  return (
    <Box flexDirection="column" rowGap={1}>
      {draw(head, 'head')}
      {groupsOf(view.market.mods).map(([group, list]) => (
        <Box key={`group-${group}`} flexDirection="column">
          {draw(groupSvg({ width, theme: view.theme, label: group, count: list.length }), `eyebrow-${group}`)}
          {list.map(mod => <Box key={`mod-${mod.name}`}>{draw(rowSvg({ width, theme: view.theme, mod }), `row-${mod.name}`)}</Box>)}
        </Box>
      ))}
    </Box>
  )
}

export function modzTree(ui: Ui, view: View) {
  const { Box, Text } = ui
  if (view.market.mods.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="claude" bold>Tüm modlar</Text>
        <Text>Katalog okunamadı</Text>
        <Text dimColor>marketplace.json bulunamadı ya da içinde mod yok.</Text>
      </Box>
    )
  }

  return view.surface === 'desktop' ? desktopTree(ui, view) : terminalTree(ui, view)
}

