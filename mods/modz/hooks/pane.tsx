// The /modz pane: every mod in the marketplace, grouped, with its version, surfaces, source and health.
import type { Market, ModInfo } from './catalog'
import { headline } from './catalog'
import { groupSvg, headSvg, rowSvg } from './draw'
import { GROUPS } from './meta'
import type { Theme } from './theme'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

export type View = { market: Market; surface: string; columns: number; theme: Theme }

const PX_PER_COLUMN = 8
const WIDTH_MIN = 320
const WIDTH_MAX = 900

function groupsOf(mods: ModInfo[]): [string, ModInfo[]][] {
  return GROUPS.map(group => [group, mods.filter(mod => mod.group === group)] as [string, ModInfo[]]).filter(([, list]) => list.length > 0)
}

function sourceText(mod: ModInfo): string {
  return mod.upstream === null ? 'MODZ' : `asıl: ${mod.upstream}`
}

function stateOf(mod: ModInfo): { glyph: string; color: string } {
  if (!mod.isHealthy) return { glyph: '✕', color: 'error' }

  if (mod.isEnabled === null) return { glyph: '◌', color: 'subtle' }

  return mod.isEnabled ? { glyph: '●', color: 'success' } : { glyph: '○', color: 'subtle' }
}

function terminalRow(ui: Ui, mod: ModInfo) {
  const { Box, Text } = ui
  const state = stateOf(mod)

  return (
    <Box key={`mod-${mod.name}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text color={state.color}>{state.glyph}</Text>
        <Text color="claude" bold>{mod.name}</Text>
        <Text dimColor>{`v${mod.version}`}</Text>
        <Box flexGrow={1} />
        <Text dimColor>{`${mod.surfaces.join(' · ')} · ${sourceText(mod)}`}</Text>
      </Box>
      <Box paddingLeft={2}><Text dimColor wrap="truncate">{mod.description}</Text></Box>
    </Box>
  )
}

function terminalTree(ui: Ui, view: View) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>MODZ</Text>
        <Text dimColor>{headline(view.market.mods)}</Text>
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
  const head = headSvg({ width, theme: view.theme, title: headline(view.market.mods), meta: `pazar: ${view.market.name}` })
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
        <Text color="claude" bold>MODZ</Text>
        <Text dimColor>Marketplace'te mod yok.</Text>
      </Box>
    )
  }

  return view.surface === 'desktop' ? desktopTree(ui, view) : terminalTree(ui, view)
}

