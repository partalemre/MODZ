// The /modz pane: every mod in the marketplace, grouped, with its version, surfaces, source and health.
import type { Market, ModInfo } from './catalog'
import { headline, healthOf } from './catalog'
import { groupSvg, headSvg, rowSvg } from './draw'
import { upper } from './kit/lang'
import { GROUPS } from './meta'
import type { Group } from './meta'
import type { Theme } from './theme'
import { catalogWords, placeLine } from './words'
import { HomeButton } from './kit/home'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

export type View = { market: Market; surface: string; columns: number; theme: Theme; onHome: () => void }

const PX_PER_COLUMN = 8
const WIDTH_MIN = 320
const WIDTH_MAX = 900

function groupsOf(mods: ModInfo[]): [Group, ModInfo[]][] {
  return GROUPS.map(group => [group, mods.filter(mod => mod.group === group)] as [Group, ModInfo[]]).filter(([, list]) => list.length > 0)
}

// The glyph says on/off/unknown; a problem or an off mod also gets its word, as on the desktop.
function stateOf(mod: ModInfo): { glyph: string; color: string; word: string } {
  const words = catalogWords()
  if (!mod.isHealthy) return { glyph: '✕', color: 'error', word: words.brokenWord }
  if (mod.isEnabled === null) return { glyph: '◌', color: 'subtle', word: '' }

  return mod.isEnabled ? { glyph: '●', color: 'success', word: '' } : { glyph: '○', color: 'subtle', word: words.offWord }
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
        <Text dimColor wrap="truncate">{placeLine(mod)}</Text>
      </Box>
      <Box paddingLeft={2}>{mod.isHealthy ? <Text dimColor wrap="truncate">{mod.description}</Text> : <Text color="error" wrap="truncate">{mod.description}</Text>}</Box>
    </Box>
  )
}

function terminalTree(ui: Ui, view: View) {
  const { Box, Text } = ui
  const health = healthOf(view.market.mods)
  const words = catalogWords()

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>{words.allMods}</Text>
        <Text>{headline(view.market.mods)}</Text>
        <Box flexGrow={1} />
        {health.isBad ? <Text color="error">{health.text}</Text> : <Text dimColor>{health.text}</Text>}
      </Box>
      {groupsOf(view.market.mods).map(([group, list]) => (
        <Box key={`group-${group}`} flexDirection="column">
          <Text bold dimColor>{`${upper(words.groups[group])} · ${list.length}`}</Text>
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
          {draw(groupSvg({ width, theme: view.theme, group, count: list.length }), `eyebrow-${group}`)}
          {list.map(mod => <Box key={`mod-${mod.name}`}>{draw(rowSvg({ width, theme: view.theme, mod }), `row-${mod.name}`)}</Box>)}
        </Box>
      ))}
    </Box>
  )
}

// The catalog with its "← MODZ" button on top: the hub is a tab beside it, and the button brings it back if closed.
export function modzTree(ui: Ui, view: View) {
  const { Box } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      {HomeButton(ui, view.onHome)}
      {catalogTree(ui, view)}
    </Box>
  )
}

function catalogTree(ui: Ui, view: View) {
  const { Box, Text } = ui
  if (view.market.mods.length === 0) {
    const words = catalogWords()

    return (
      <Box flexDirection="column">
        <Text color="claude" bold>{words.allMods}</Text>
        <Text>{words.emptyTitle}</Text>
        <Text dimColor>{words.emptyLine}</Text>
      </Box>
    )
  }

  return view.surface === 'desktop' ? desktopTree(ui, view) : terminalTree(ui, view)
}

