import type { ElementTable, RenderElement } from 'claude-code'

import type { SkinSlot } from '../types'
import type { ToggleWord } from './command'
import { SLOTS } from './custom'
import type { Table } from './markdown'
import type { Look } from './look'
import { HomeButton } from './home'
import { footerRow, promptRow } from './rows'
import { tableRows } from './row-table'
import { groupRow, toolRow } from './row-tool'
import { say } from './words'

export type PaneUi = Pick<ElementTable<'terminal' | 'desktop'>, 'Box' | 'Text' | 'Markdown' | 'Button' | 'Input' | 'Select'>

export type SettingsModel = {
  names: readonly string[]
  editing: SkinSlot
  width: number
  // Each skin's own accent, success and failure colours, for the dots on its button.
  swatches: Readonly<Record<string, readonly string[]>>
}

export type SettingsActions = {
  pick: (name: string) => void
  toggle: (word: ToggleWord) => void
  icons: () => void
  edit: (slot: SkinSlot) => void
  paint: (hex: string) => void
  gallery: () => void
}

const SWATCH_SLOTS: readonly SkinSlot[] = ['user', 'ok', 'err']

// The dots a skin's button carries: its accent, then its success and failure colours.
export function swatchesOf(skins: readonly { name: string; palette: Readonly<Record<SkinSlot, string>> }[]): Record<string, string[]> {
  return Object.fromEntries(skins.map(skin => [skin.name, SWATCH_SLOTS.map(slot => skin.palette[slot])]))
}

// Built when drawn, so the table speaks the language set at session.start.
const sample = (): Table => ({
  kind: 'table',
  header: say().sampleHeader,
  align: ['left', 'right', 'left'],
  rows: [
    ['/chat', '60', say().minute],
    ['/upload', '10', say().minute],
    ['/search', '120', say().minute],
  ],
})

const done = { isRunning: false, isErrored: false, isInterrupted: false }

// A turn as the skin would draw it, built from the same rows the transcript uses.
function preview(look: Look, width: number) {
  const { Box } = look.ui
  const word = look.skin.done[0] ?? 'Done'

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={look.skin.palette.muted} paddingX={1}>
      {promptRow(look, say().samplePrompt)}
      {toolRow(look, { call: { tool: 'Bash', input: {}, ...done }, kind: 'run', target: 'pnpm test', meta: { ms: 2140 } })}
      {toolRow(look, {
        call: { tool: 'Edit', input: {}, ...done },
        kind: 'write',
        target: 'src/server.ts',
        meta: { ms: 380, added: 18, removed: 3 },
      })}
      {groupRow(look, [
        { tool: 'Read', input: {}, ...done },
        { tool: 'Read', input: {}, ...done },
        { tool: 'Grep', input: {}, ...done },
      ])}
      {tableRows(look, sample(), { maxWidth: Math.max(20, width - 4) })}
      {footerRow(look, { word, durationMs: 41_000, stats: { tools: 6, added: 18, removed: 3 } })}
    </Box>
  )
}

const OFF = 'off'
const HOTKEYS = 9

// Each part of the pane opens with a label in sentence case (and a quiet hint beside it), so a narrow side
// panel wraps the buttons under it instead of beside a label. The labels are the pane's own ink, not the skin's:
// only the previews and swatches show a skin's palette.
function section(look: Look, head: { title: string; hint?: string }, body: RenderElement) {
  const { Box, Text } = look.ui

  return (
    <Box key={`section-${head.title}`} flexDirection="column">
      <Box flexDirection="row" columnGap={2}>
        <Text dimColor bold>{head.title}</Text>
        {head.hint === undefined ? null : <Text dimColor>{head.hint}</Text>}
      </Box>
      {body}
    </Box>
  )
}

// `home` is given only while the MODZ hub runs: the pane then opens with the way back to it.
type Parts = { look: Look; ui: PaneUi; model: SettingsModel; actions: SettingsActions; home?: () => void }

// The skin in use is the one bordered button with a check; the rest are quiet until pointed at. Its colour
// dots sit beside the button, not in it: the desktop engine takes a Button's label as its one string and
// refuses a Text inside, which left the whole pane undrawn there.
function skinButton(parts: Parts, name: string, i: number) {
  const { Box, Button, Text } = parts.ui
  const isOn = name === parts.look.prefs.skin
  const dots = (parts.model.swatches[name] ?? []).map((hex, k) => <Text key={`dot-${k}`} color={hex}>●</Text>)
  const look = isOn ? { variant: 'secondary' as const } : { plain: true as const, dimColor: true }
  const hotkey = i < HOTKEYS ? { hotkey: String(i + 1) } : {}

  return (
    <Box key={`skin-swatch-${name}`} flexDirection="row" columnGap={1} alignItems="center">
      <Box flexDirection="row">{dots}</Box>
      <Button key={`skin-${name}`} label={`${name}${isOn ? ' ✓' : ''}`} {...look} {...hotkey} onPress={() => parts.actions.pick(name)} />
    </Box>
  )
}

function skinButtons(parts: Parts) {
  const { Box, Button } = parts.ui
  const isOff = parts.look.prefs.skin === OFF

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1}>
      {parts.model.names.map((name, i) => skinButton(parts, name, i))}
      <Button key="skin-off" label={isOff ? `${say().off} ✓` : say().off} hotkey="0" {...(isOff ? { variant: 'secondary' as const } : { plain: true as const, dimColor: true })} onPress={() => parts.actions.pick(OFF)} />
    </Box>
  )
}

// A toggle says on or off by its dot and its strength; the label is one string, as the desktop requires.
function optionButtons({ look, ui, actions }: Parts) {
  const { Box, Button } = ui
  const { prefs } = look
  // What each toggle reads as in the pane; /skin keeps the English words.
  const labels: Readonly<Record<ToggleWord, string>> = say().toggles
  const toggle = (word: ToggleWord, hotkey: string, on: boolean) => (
    <Button key={`toggle-${word}`} label={`${on ? '●' : '○'} ${labels[word]}`} hotkey={hotkey} plain dimColor={!on} onPress={() => actions.toggle(word)} />
  )

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {toggle('rail', 'r', prefs.rail)}
      {toggle('tables', 't', prefs.tables)}
      {toggle('shimmer', 's', prefs.shimmer)}
      {toggle('band', 'b', prefs.band)}
      {toggle('clip', 'c', prefs.clipOutput)}
      <Button key="icons" label={say().icons(prefs.icons)} hotkey="i" plain onPress={() => actions.icons()} />
    </Box>
  )
}

// The swatches wrap as whole "■ name" pairs; the slot picker and the hex field wrap under
// each other when the panel is too narrow for both.
function colorControls({ look, ui, model, actions }: Parts) {
  const { Box, Text, Input, Select } = ui
  const { palette } = look.skin

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {SLOTS.map(slot => (
          <Text key={`swatch-${slot}`}>
            <Text backgroundColor={palette[slot]}>{'  '}</Text>
            <Text dimColor={slot !== model.editing} bold={slot === model.editing}>
              {` ${slot}`}
            </Text>
          </Text>
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1} marginTop={1}>
        <Select
          key="slot"
          label={say().color}
          value={model.editing}
          options={SLOTS.map(slot => ({ value: slot, label: slot }))}
          onSelect={(value: string) => actions.edit(value as SkinSlot)}
        />
        <Input
          key="hex"
          label={palette[model.editing]}
          placeholder="#rrggbb"
          value=""
          submitLabel={say().paint}
          onSubmit={(value: string) => actions.paint(value.trim())}
        />
      </Box>
    </Box>
  )
}

export function settingsPane(parts: Parts) {
  const { look, ui, model, actions, home } = parts
  const { Box, Button, Text } = ui
  const count = model.names.length

  return (
    <Box flexDirection="column" rowGap={1}>
      {home === undefined ? null : HomeButton(ui, home)}
      {section(look, { title: say().theme, hint: say().skins(count) }, skinButtons(parts))}
      {preview(look, model.width)}
      {section(look, { title: say().options }, optionButtons(parts))}
      {section(look, { title: say().colors, hint: say().colorsHint }, colorControls(parts))}
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} alignItems="center">
        <Text dimColor>
          {say().askClaude}
          <Text>{say().askExample}</Text>
        </Text>
        <Button key="gallery" label={say().openGallery} hotkey="g" plain onPress={() => actions.gallery()} />
      </Box>
    </Box>
  )
}
