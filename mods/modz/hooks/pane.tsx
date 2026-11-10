// The catalog pane: the lines that install what is missing (the core set first), what each installed mod can be
// asked and set (guide.ts), then every mod in the marketplace, grouped, with its version, surfaces, source and health.
import type { Market, ModInfo } from './catalog'
import { headline, healthOf } from './catalog'
import { groupSvg, guideSvg, headSvg, labelSvg, rowSvg } from './draw'
import type { Drawing } from './draw'
import { commandsLine, guideOf, installsOf } from './guide'
import type { Command, Install, ModGuide } from './guide'
import type { Cue } from './kit/motion'
import type { Stable } from './kit/stable'
import { GROUPS } from './meta'
import type { Group } from './meta'
import type { Theme } from './theme'
import { catalogWords, placeLine } from './words'
import { withHome } from './kit/home'

// The resolved element table of the surface that draws the pane.
type Ui = Record<string, any>

// `stable`: the catalog's drawings kept since it was put in the panel (stable.ts). `commands`: the session's slash
// commands as the engine lists them. `onCopy` puts an install line on the clipboard of the surface that was pressed.
export type View = {
  market: Market
  commands: readonly Command[]
  surface: string
  columns: number
  theme: Theme
  onHome: () => void
  onCopy: (text: string, press: unknown) => unknown
  stable: Stable<Drawing>
}

// A desktop pane reports about 9 px a column (a 365 px body reads 40), wider than the reply column.
const PX_PER_COLUMN = 9
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
        {mod.version === null ? null : <Text dimColor>{`v${mod.version}`}</Text>}
        {state.word === '' ? null : <Text color={state.color}>{state.word}</Text>}
        <Box flexGrow={1} />
        <Text dimColor wrap="truncate">{placeLine(mod)}</Text>
      </Box>
      <Box paddingLeft={2}>{mod.isHealthy ? <Text dimColor wrap="truncate">{mod.description}</Text> : <Text color="error" wrap="truncate">{mod.description}</Text>}</Box>
    </Box>
  )
}

// One mod that is not installed: what it is, then a button that copies the exact line to paste and the line itself,
// as text a person can select. The buttons lead so they stand in one column whatever the lines' lengths. Plain
// elements on both surfaces: a drawing's words cannot be selected.
function installRow(ui: Ui, view: View, install: Install) {
  const { Box, Button, Text } = ui

  return (
    <Box key={`install-${install.mod}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold>{install.mod}</Text>
        <Text dimColor wrap="truncate">{install.summary}</Text>
      </Box>
      <Box flexDirection="row" columnGap={1} alignItems="center">
        <Button key={`copy-${install.mod}`} label={catalogWords().copy} variant="secondary" onPress={(press: unknown) => view.onCopy(install.command, press)} />
        <Text>{install.command}</Text>
      </Box>
    </Box>
  )
}

// The desktop keeps about the drawings' inset (draw.ts TEXT_X) around the plain lines.
const DESKTOP_INSET = { paddingX: 2 }

function installSection(ui: Ui, view: View, head: unknown) {
  const { Box, Text } = ui
  const installs = installsOf(view.market)
  if (installs.length === 0) return null

  return (
    <Box key="install" flexDirection="column">
      {head}
      <Box flexDirection="column" rowGap={1} {...(view.surface === 'desktop' ? DESKTOP_INSET : {})}>
        <Text dimColor>{catalogWords().installLine}</Text>
        {installs.map(install => installRow(ui, view, install))}
      </Box>
    </Box>
  )
}

function terminalGuide(ui: Ui, guide: ModGuide) {
  const { Box, Text } = ui

  return (
    <Box key={`guide-${guide.mod}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        <Text bold>{guide.mod}</Text>
        <Text>{commandsLine(guide)}</Text>
      </Box>
      {guide.options.length === 0 ? null : <Box paddingLeft={2}><Text dimColor wrap="truncate">{catalogWords().options(guide.options.join(', '))}</Text></Box>}
    </Box>
  )
}

function terminalTree(ui: Ui, view: View) {
  const { Box, Text } = ui
  const health = healthOf(view.market.mods)
  const words = catalogWords()
  const guides = guideOf(view.market, view.commands)

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" columnGap={2}>
        <Text color="claude" bold>{words.allMods}</Text>
        <Text>{headline(view.market.mods)}</Text>
        <Box flexGrow={1} />
        {health.isBad ? <Text color="error">{health.text}</Text> : <Text dimColor>{health.text}</Text>}
      </Box>
      {installSection(ui, view, <Text bold dimColor>{`${words.install} · ${installsOf(view.market).length}`}</Text>)}
      {guides.length === 0 ? null : (
        <Box key="guide" flexDirection="column">
          <Text bold dimColor>{`${words.guide} · ${guides.length}`}</Text>
          {guides.map(guide => terminalGuide(ui, guide))}
        </Box>
      )}
      {groupsOf(view.market.mods).map(([group, list]) => (
        <Box key={`group-${group}`} flexDirection="column">
          <Text bold dimColor>{`${words.groups[group]} · ${list.length}`}</Text>
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
  let order = 0
  const draw = (key: string, what: unknown, build: (cue: Cue) => Drawing) => {
    const at = order++
    const drawing = view.stable.draw(key, { width, theme: view.theme, what }, phase => build({ phase, order: at }))

    return <Svg key={key} source={drawing.source} alt={drawing.alt} width={width} height={drawing.height} isInteractive />
  }
  const title = headline(view.market.mods)
  const words = catalogWords()
  const guides = guideOf(view.market, view.commands)
  const label = (key: string, text: string, count: number) => draw(`eyebrow-${key}`, [text, count], cue => labelSvg({ width, theme: view.theme, label: text, count, cue }))

  return (
    <Box flexDirection="column" rowGap={1}>
      {draw('head', [title, health], cue => headSvg({ width, theme: view.theme, title, meta: health.text, metaRole: health.isBad ? 'danger' : null, cue }))}
      {installSection(ui, view, label('install', words.install, installsOf(view.market).length))}
      {guides.length === 0 ? null : (
        <Box key="guide" flexDirection="column">
          {label('guide', words.guide, guides.length)}
          {guides.map(guide => <Box key={`guide-${guide.mod}`}>{draw(`guide-row-${guide.mod}`, guide, cue => guideSvg({ width, theme: view.theme, guide, cue }))}</Box>)}
        </Box>
      )}
      {groupsOf(view.market.mods).map(([group, list]) => (
        <Box key={`group-${group}`} flexDirection="column">
          {draw(`eyebrow-${group}`, [group, list.length], cue => groupSvg({ width, theme: view.theme, group, count: list.length, cue }))}
          {list.map(mod => <Box key={`mod-${mod.name}`}>{draw(`row-${mod.name}`, mod, cue => rowSvg({ width, theme: view.theme, mod, cue }))}</Box>)}
        </Box>
      ))}
    </Box>
  )
}

// The catalog with its "← MODZ" button on top, which swaps the panel back to the hub.
export const modzTree = (ui: Ui, view: View) => withHome(ui, catalogTree(ui, view), view.onHome)

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

