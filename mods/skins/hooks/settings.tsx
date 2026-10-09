import type { ElementTable, RenderElement } from 'claude-code'

import type { SkinSlot } from '../types'
import type { ToggleWord } from './command'
import { SLOTS } from './custom'
import type { Table } from './markdown'
import type { Look } from './look'
import { footerRow, promptRow } from './rows'
import { tableRows } from './row-table'
import { groupRow, toolRow } from './row-tool'

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

const SAMPLE: Table = {
  kind: 'table',
  header: ['Yol', 'Sınır', 'Pencere'],
  align: ['left', 'right', 'left'],
  rows: [
    ['/chat', '60', '1 dk'],
    ['/upload', '10', '1 dk'],
    ['/search', '120', '1 dk'],
  ],
}

const done = { isRunning: false, isErrored: false, isInterrupted: false }

// A turn as the skin would draw it, built from the same rows the transcript uses.
function preview(look: Look, width: number) {
  const { Box } = look.ui
  const word = look.skin.done[0] ?? 'Done'

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={look.skin.palette.muted} paddingX={1}>
      {promptRow(look, "hub api'ye hız sınırı ekle")}
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
      {tableRows(look, SAMPLE, { maxWidth: Math.max(20, width - 4) })}
      {footerRow(look, { word, durationMs: 41_000, stats: { tools: 6, added: 18, removed: 3 } })}
    </Box>
  )
}

const OFF = 'off'
const HOTKEYS = 9

// Each part of the pane opens with an eyebrow (and a quiet hint beside it), so a narrow side
// panel wraps the buttons under it instead of beside a label.
function section(look: Look, head: { title: string; hint?: string }, body: RenderElement) {
  const { Box, Text } = look.ui

  return (
    <Box key={`section-${head.title}`} flexDirection="column">
      <Box flexDirection="row" columnGap={2}>
        <Text color={look.skin.palette.muted} bold>{head.title.toLocaleUpperCase('tr')}</Text>
        {head.hint === undefined ? null : <Text color={look.skin.palette.muted}>{head.hint}</Text>}
      </Box>
      {body}
    </Box>
  )
}

// What each toggle reads as in the pane; /skin keeps the English words.
const TOGGLE_LABELS: Readonly<Record<ToggleWord, string>> = {
  rail: 'Yanıt çizgisi',
  tables: 'Tablo kartları',
  shimmer: 'Parıltı',
  band: 'Kullanım bandı',
  clip: 'Uzun çıktıyı kırp',
}

type Parts = { look: Look; ui: PaneUi; model: SettingsModel; actions: SettingsActions }

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
      <Button key="skin-off" label={isOff ? 'Kapalı ✓' : 'Kapalı'} hotkey="0" {...(isOff ? { variant: 'secondary' as const } : { plain: true as const, dimColor: true })} onPress={() => parts.actions.pick(OFF)} />
    </Box>
  )
}

// A toggle says on or off by its dot and its strength; the label is one string, as the desktop requires.
function optionButtons({ look, ui, actions }: Parts) {
  const { Box, Button } = ui
  const { prefs } = look
  const toggle = (word: ToggleWord, hotkey: string, on: boolean) => (
    <Button key={`toggle-${word}`} label={`${on ? '●' : '○'} ${TOGGLE_LABELS[word]}`} hotkey={hotkey} plain dimColor={!on} onPress={() => actions.toggle(word)} />
  )

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {toggle('rail', 'r', prefs.rail)}
      {toggle('tables', 't', prefs.tables)}
      {toggle('shimmer', 's', prefs.shimmer)}
      {toggle('band', 'b', prefs.band)}
      {toggle('clip', 'c', prefs.clipOutput)}
      <Button key="icons" label={`İkonlar: ${prefs.icons}`} hotkey="i" plain onPress={() => actions.icons()} />
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
            <Text color={slot === model.editing ? palette.fg : palette.muted} bold={slot === model.editing}>
              {` ${slot}`}
            </Text>
          </Text>
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1} marginTop={1}>
        <Select
          key="slot"
          label="Renk"
          value={model.editing}
          options={SLOTS.map(slot => ({ value: slot, label: slot }))}
          onSelect={(value: string) => actions.edit(value as SkinSlot)}
        />
        <Input
          key="hex"
          label={palette[model.editing]}
          placeholder="#rrggbb"
          value=""
          submitLabel="boya"
          onSubmit={(value: string) => actions.paint(value.trim())}
        />
      </Box>
    </Box>
  )
}

export function settingsPane(parts: Parts) {
  const { look, ui, model, actions } = parts
  const { Box, Button, Text } = ui
  const { palette } = look.skin
  const count = model.names.length

  return (
    <Box flexDirection="column" rowGap={1}>
      {section(look, { title: 'Tema', hint: `${count} skin` }, skinButtons(parts))}
      {preview(look, model.width)}
      {section(look, { title: 'Seçenekler' }, optionButtons(parts))}
      {section(look, { title: 'Renkler', hint: 'bir yuva seç, hex yaz' }, colorControls(parts))}
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} alignItems="center">
        <Text color={palette.muted}>
          Ya da Claude'a sor: <Text color={palette.fg}>“gün batımı gibi hissettiren bir skin yap”</Text>
        </Text>
        <Button key="gallery" label="Galeriyi aç" hotkey="g" plain onPress={() => actions.gallery()} />
      </Box>
    </Box>
  )
}
